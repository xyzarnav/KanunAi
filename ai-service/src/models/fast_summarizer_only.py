"""
FAST Legal Document Summarizer
Uses batch processing to reduce API calls from 50 to ~5-10

Speed: 2-3 minutes for 50-page doc (vs 5-8 minutes)
"""

import os
import time
import pickle
from typing import List, Dict
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(Path(__file__).parent.parent.parent / '.env')

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from langchain_community.embeddings import HuggingFaceEmbeddings


class FastLegalSummarizer:
    """
    OPTIMIZED for speed:
    - Batch processing (5-10 chunks per API call)
    - Parallel-friendly design
    - Aggressive caching
    """
    
    def __init__(self, api_key: str, cache_dir: str = "./cache"):
        self.api_key = api_key
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
        # Gemini LLM - Optimized settings
        self.llm = GoogleGenerativeAI(
            model="gemini-2.5-pro",  # Use standard model for better reliability
            google_api_key=api_key,
            temperature=0.1,  # More consistent output
            max_retries=3,    # More resilient
            max_output_tokens=2048,  # Limit output size
            request_timeout=45  # Longer timeout for batches
        )
        
        # Local embeddings
        print("🔧 Loading local embeddings...")
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        
        self.documents = []
        self.chunks = []
        self.vectorstore = None
        self.summaries = {}
        
        print("✓ Initialized (FAST MODE)")
    
    
    def load_document(self, pdf_path: str) -> List[Document]:
        """Load PDF with caching"""
        print(f"\n📄 Loading: {pdf_path}")
        
        cache_file = self.cache_dir / f"{Path(pdf_path).stem}_docs.pkl"
        if cache_file.exists():
            with open(cache_file, 'rb') as f:
                self.documents = pickle.load(f)
            print(f"   ✓ {len(self.documents)} pages (cached)")
            return self.documents
        
        loader = PyPDFLoader(pdf_path)
        self.documents = loader.load()
        
        with open(cache_file, 'wb') as f:
            pickle.dump(self.documents, f)
        
        print(f"   ✓ {len(self.documents)} pages loaded")
        return self.documents
    
    
    def chunk_document(self, chunk_size: int = 8000, overlap: int = 800):
        """
        Larger chunks = fewer API calls
        8000 chars ~= 2000 words per chunk
        Increased chunk size to reduce total chunks
        """
        print(f"\n📦 Chunking (size={chunk_size})...")
        
        cache_file = self.cache_dir / "chunks_fast.pkl"
        if cache_file.exists():
            with open(cache_file, 'rb') as f:
                self.chunks = pickle.load(f)
            print(f"   ✓ {len(self.chunks)} chunks (cached)")
            return self.chunks
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        self.chunks = text_splitter.split_documents(self.documents)
        
        with open(cache_file, 'wb') as f:
            pickle.dump(self.chunks, f)
        
        print(f"   ✓ {len(self.chunks)} chunks created")
        return self.chunks
    
    
    def create_vector_store(self):
        """Local embeddings - no API"""
        print("\n🔍 Creating vectors (local)...")
        
        cache_file = self.cache_dir / "vectorstore_fast"
        if cache_file.exists():
            self.vectorstore = FAISS.load_local(
                str(cache_file), 
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            print("   ✓ Loaded (cached)")
            return self.vectorstore
        
        print(f"   Processing {len(self.chunks)} chunks...")
        self.vectorstore = FAISS.from_documents(self.chunks, self.embeddings)
        self.vectorstore.save_local(str(cache_file))
        
        print("   ✓ Done (no API used)")
        return self.vectorstore
    
    
    def batch_summarize(self, batch_size: int = 10):
        """
        KEY OPTIMIZATION: Batch multiple chunks into one API call
        
        50 chunks with batch_size=10 → only 5 API calls!
        """
        print("\n📝 BATCH SUMMARIZATION (FAST MODE)...")
        
        cache_file = self.cache_dir / "summaries_batch.pkl"
        if cache_file.exists():
            # Temporarily disable cache to regenerate summaries
            cache_file.unlink()
            print("   🔄 Regenerating summaries...")
        
        print(f"   Strategy: {len(self.chunks)} chunks → {(len(self.chunks)-1)//batch_size + 1} batches")
        
        batch_summaries = []
        api_call_count = 0
        
        for i in range(0, len(self.chunks), batch_size):
            batch = self.chunks[i:i+batch_size]
            batch_num = i//batch_size + 1
            total_batches = (len(self.chunks)-1)//batch_size + 1
            
            print(f"\n   📦 Batch {batch_num}/{total_batches} ({len(batch)} chunks)...")
            
            # Combine chunks - more efficient processing
            combined_text = "\n\n--- SECTION BREAK ---\n\n".join([
                f"[Section {i+j+1}]\n{chunk.page_content[:4000]}"  # Increased limit for better context
                for j, chunk in enumerate(batch)
            ])
            
            # Single API call for entire batch
            prompt = f"""You are an expert legal analyst. Analyze these {len(batch)} document sections efficiently.

TASK: Create a focused, information-dense detailed summary of ALL sections below.

Provide a CONCISE summary structured as:
1. Core points and key provisions (most important)
2. Essential parties and critical terms
3. Notable exceptions or special conditions

SECTIONS:
{combined_text}

COMPREHENSIVE SUMMARY (400-600 words covering all sections above):"""
            
            try:
                api_call_count += 1
                print(f"   🤖 API Call #{api_call_count}...")
                
                response = self.llm.invoke(prompt)
                if not response:
                    raise ValueError("Empty response from API")
                    
                summary = str(response)
                print(f"   📝 Got summary of length: {len(summary)}")
                if len(summary) < 10:  # Sanity check
                    raise ValueError(f"Summary too short: {summary}")
                    
                batch_summaries.append({
                    'batch_index': batch_num,
                    'chunk_range': f"{i+1}-{i+len(batch)}",
                    'summary': summary
                })
                
                time.sleep(1.5)  # Increased delay to avoid rate limits
                
            except Exception as e:
                print(f"   ⚠️  Error: {e}")
                if "429" in str(e):
                    print("   ⏸️  Rate limit - waiting 30s...")
                    time.sleep(30)
                    summary = self.llm.invoke(prompt)
                    batch_summaries.append({
                        'batch_index': batch_num,
                        'chunk_range': f"{i+1}-{i+len(batch)}",
                        'summary': summary
                    })
                else:
                    batch_summaries.append({
                        'batch_index': batch_num,
                        'chunk_range': f"{i+1}-{i+len(batch)}",
                        'summary': f"[Error in batch {batch_num}]"
                    })
        
        self.summaries['batch_summaries'] = batch_summaries
        
        print(f"\n   ✓ Completed with {api_call_count} API calls (saved ~{len(self.chunks)-api_call_count} calls!)")
        
        # Create executive summary
        print("\n   📋 Creating executive summary (optimized)...")
        
        # Take only essential parts from each batch summary
        key_points = []
        for s in batch_summaries:
            summary_lines = s['summary'].split('\n')
            key_points.extend([
                line for line in summary_lines[:10]  # Take only first 10 lines
                if any(key in line.lower() for key in 
                    ['party', 'agree', 'oblig', 'term', 'date', 'right', 'condition'])
            ])
        
        combined = "\n".join(key_points)
        
        exec_prompt = f"""As a legal expert, create a focused EXECUTIVE SUMMARY.

Key Points from Document:
{combined}

Provide a CONCISE, high-impact summary covering:
1. Document Essence (type, core purpose)
2. Key Parties & Critical Terms
3. Essential Obligations & Rights
4. Notable Conditions & Risk Factors

EXECUTIVE SUMMARY (800-1200 words):"""
        
        try:
            api_call_count += 1
            print(f"   🤖 API Call #{api_call_count}...")
            executive = self.llm.invoke(exec_prompt)
            self.summaries['executive_summary'] = executive
        except Exception as e:
            print(f"   ⚠️  Error: {e}")
            self.summaries['executive_summary'] = "[Error creating executive]"
        
        # Cache results
        with open(cache_file, 'wb') as f:
            pickle.dump(self.summaries, f)
        
        print(f"\n✅ Summarization done! Total API calls: {api_call_count}")
        
        return self.summaries
    
    
    def save_summaries(self, output_dir: str = None):
        """Save all outputs"""
        if output_dir is None:
            # Use absolute path based on current file location
            current_dir = Path(__file__).parent
            # parent_dir = current_dir.parent   
            output_dir = str(current_dir / "output" / "fast_summarizer")
            
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True, parents=True)
        
        # Clear existing files in the directory
        if output_path.exists():
            for file in output_path.glob("*.md"):
                file.unlink()
            for file in output_path.glob("*.json"):
                file.unlink()
        
        print(f"\n💾 Saving to {output_dir}...")
        
        # Executive summary
        if 'executive_summary' in self.summaries:
            with open(output_path / "executive_summary.md", 'w', encoding='utf-8') as f:
                f.write("# Executive Summary\n\n")
                f.write("## Fast Summarizer Output\n\n")
                f.write("---\n\n")
                f.write(self.summaries['executive_summary'])
            print("   ✓ executive_summary.md")
        
        # Batch summaries
        if 'batch_summaries' in self.summaries:
            with open(output_path / "batch_summaries.md", 'w', encoding='utf-8') as f:
                f.write("# Batch Summaries\n\n")
                for batch in self.summaries['batch_summaries']:
                    f.write(f"\n## Sections {batch['chunk_range']}\n\n")
                    f.write("---\n\n")
                    if isinstance(batch['summary'], str):
                        f.write(batch['summary'])
                    else:
                        f.write(str(batch['summary']))  # Convert response object to string if needed
                    f.write("\n\n")
            print("   ✓ batch_summaries.md")
        
        # JSON
        import json
        with open(output_path / "all_summaries.json", 'w', encoding='utf-8') as f:
            json.dump(self.summaries, f, indent=2, ensure_ascii=False)
        print("   ✓ all_summaries.json")
    
    
    def setup_qa_chain(self):
        """Setup Q&A"""
        if not self.vectorstore:
            print("⚠️ No vectorstore available for Q&A")
            return None
        
        print("\n🤖 Setting up Q&A...")
        print(f"   📚 Vectorstore has {self.vectorstore.index.ntotal} vectors")
        
        qa_prompt = PromptTemplate(
            template="""You are an expert legal analyst. Answer the question based on the Strategic Alliance and Joint Development Agreement context provided. Be specific and focused on the legal document content.

Context:
{context}

Question: {question}

Provide a clear, specific answer based on the agreement contents:""",
            input_variables=["context", "question"]
        )
        
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vectorstore.as_retriever(search_kwargs={"k": 3}),
            chain_type_kwargs={"prompt": qa_prompt},
            return_source_documents=True
        )
        
        print("✓ Q&A ready")
        return self.qa_chain
    
    
    def ask(self, question: str) -> Dict:
        """Ask a question"""
        if not hasattr(self, 'qa_chain'):
            self.setup_qa_chain()
        
        try:
            result = self.qa_chain.invoke({"query": question})
            return {
                'answer': result['result'],
                'sources': [doc.page_content[:150] for doc in result['source_documents']]
            }
        except Exception as e:
            return {'answer': f"Error: {e}", 'sources': []}
    
    
    def process_fast(self, pdf_path: str, batch_size: int = 15, output_dir: str = None):
        """
        OPTIMIZED FAST PIPELINE
        
        Args:
            batch_size: Chunks per API call (optimized defaults)
                       15 = optimal balance (recommended)
                       20 = maximum speed
                       10 = maximum detail
            output_dir: Directory to save summaries (optional)
        """
        print("\n" + "="*70)
        print("🚀 FAST LEGAL DOCUMENT PIPELINE")
        print("="*70)
        
        start = time.time()
        
        self.load_document(pdf_path)
        self.chunk_document(chunk_size=5000)  # Larger chunks
        self.create_vector_store()
        self.batch_summarize(batch_size=batch_size)  # KEY: Batch processing
        
        # Use absolute path for output
        if output_dir is None:
            output_dir = str(Path(pdf_path).parent.parent / "output" / "fast_summarizer")
        self.save_summaries(output_dir=output_dir)
        
        self.setup_qa_chain()
        
        elapsed = time.time() - start
        
        print("\n" + "="*70)
        print(f"✅ DONE in {elapsed/60:.1f} minutes")
        print("="*70)
        
        return self.summaries


# ============================================
# USAGE
# ============================================

if __name__ == "__main__":
    # Get API key from environment variable
    API_KEY = os.getenv('GEMINI_API_KEY')
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY not found in .env file")
        
    # Get the current file's directory and construct paths
    current_dir = Path(__file__).parent.resolve()
    project_root = current_dir.parent.parent
    PDF_PATH = str(project_root / "src/test_pdf" / "legal_doc.pdf")
    OUTPUT_DIR = str(project_root / "output" / "fast_summarizer")
    
    # Initialize
    summarizer = FastLegalSummarizer(api_key=API_KEY)
    
    # Process with batch size
    # batch_size=10: ~5-6 API calls for 50 chunks (2-3 minutes)
    # batch_size=20: ~3 API calls (1-2 minutes, less detail)
    # batch_size=5: ~10 API calls (3-4 minutes, more detail)
    
    summaries = summarizer.process_fast(
        pdf_path=PDF_PATH,
        batch_size=10,  # Adjust for speed vs detail trade-off
        output_dir=OUTPUT_DIR
    )
    
    # View
    print("\n" + "="*70)
    print("EXECUTIVE SUMMARY:")
    print("="*70)
    print(summaries['executive_summary'])
    
    # Chat
    print("\n💬 Q&A MODE")
    
    # Example questions
    questions = [
        "What type of document is this?",
        "Who are the parties involved?",
        "What are the key obligations?"
    ]
    
    for q in questions:
        print(f"\n❓ {q}")
        result = summarizer.ask(q)
        print(f"💡 {result['answer'][:200]}...")