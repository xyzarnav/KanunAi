"""
Legal Document Summarizer - Fixed for Free Tier
Uses LOCAL embeddings (no API quota!) + Gemini for summaries

Install:
pip install langchain langchain-google-genai sentence-transformers pypdf faiss-cpu
"""

import os
import time
import pickle
from typing import List, Dict
from pathlib import Path

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from langchain.callbacks.base import BaseCallbackHandler

# LOCAL EMBEDDINGS - No API calls!
from langchain_community.embeddings import HuggingFaceEmbeddings


class RateLimiter:
    """Handle API rate limits for Gemini"""
    
    def __init__(self, requests_per_minute=15):
        self.requests_per_minute = requests_per_minute
        self.request_times = []
    
    def wait_if_needed(self):
        now = time.time()
        self.request_times = [t for t in self.request_times if now - t < 60]
        
        if len(self.request_times) >= self.requests_per_minute:
            wait_time = 60 - (now - self.request_times[0]) + 1
            if wait_time > 0:
                print(f"⏳ Rate limit: waiting {wait_time:.0f}s...")
                time.sleep(wait_time)
                self.request_times = []
        
        self.request_times.append(now)


class ProgressCallback(BaseCallbackHandler):
    """Show progress"""
    def __init__(self):
        self.call_count = 0
    
    def on_llm_start(self, serialized, prompts, **kwargs):
        self.call_count += 1
        print(f"   🤖 API Call #{self.call_count}...")


class LegalDocSummarizer:
    """
    FREE TIER FRIENDLY VERSION
    - Uses LOCAL embeddings (no API quota)
    - Only uses Gemini API for text generation (summaries/chat)
    """
    
    def __init__(self, api_key: str, cache_dir: str = "./cache"):
        """Initialize with Gemini API key"""
        
        self.api_key = api_key
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
        # Rate limiter
        self.rate_limiter = RateLimiter(requests_per_minute=12)  # Conservative
        
        # Gemini LLM (only for text generation)
        self.llm = GoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            temperature=0.3,
            max_retries=3
        )
        
        # LOCAL embeddings - runs on your computer, NO API calls!
        print("🔧 Loading local embedding model...")
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        print("✓ Local embeddings loaded")
        
        # Storage
        self.documents = []
        self.chunks = []
        self.vectorstore = None
        self.summaries = {}
        
        print("✓ Initialized LangChain + Gemini (FREE TIER MODE)")
    
    
    def load_document(self, pdf_path: str) -> List[Document]:
        """Load PDF"""
        
        print(f"\n📄 Loading document: {pdf_path}")
        
        cache_file = self.cache_dir / f"{Path(pdf_path).stem}_docs.pkl"
        if cache_file.exists():
            print("   ⚡ Loading from cache...")
            with open(cache_file, 'rb') as f:
                self.documents = pickle.load(f)
            print(f"   ✓ Loaded {len(self.documents)} pages from cache")
            return self.documents
        
        try:
            loader = PyPDFLoader(pdf_path)
            self.documents = loader.load()
            
            print(f"   ✓ Loaded {len(self.documents)} pages")
            
            with open(cache_file, 'wb') as f:
                pickle.dump(self.documents, f)
            
            return self.documents
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return []
    
    
    # def chunk_document(self, pages_per_chunk: int = 15):
    def chunk_document(self, pages_per_chunk: int = 25):
        """
        Smart chunking based on page numbers
        Combines 15 pages into one chunk for better context
        """
        
        print(f"\n📦 Chunking document (pages per chunk={pages_per_chunk})...")
        
        cache_file = self.cache_dir / "chunks.pkl"
        if cache_file.exists():
            print("   ⚡ Loading chunks from cache...")
            with open(cache_file, 'rb') as f:
                self.chunks = pickle.load(f)
            print(f"   ✓ Loaded {len(self.chunks)} chunks from cache")
            return self.chunks
        
        # Calculate number of chunks needed (ceiling division)
        total_pages = len(self.documents)
        num_chunks = (total_pages + pages_per_chunk - 1) // pages_per_chunk
        
        print(f"   📄 Total pages: {total_pages}")
        print(f"   📦 Creating {num_chunks} chunks ({pages_per_chunk} pages per chunk)")
        
        # Create chunks by combining pages
        self.chunks = []
        for i in range(num_chunks):
            start_idx = i * pages_per_chunk
            end_idx = min((i + 1) * pages_per_chunk, total_pages)
            
            # Combine the content of these pages
            combined_content = "\n\n=== PAGE BREAK ===\n\n".join(
                doc.page_content for doc in self.documents[start_idx:end_idx]
            )
            
            # Create a new document for this chunk
            chunk = Document(
                page_content=combined_content,
                metadata={
                    'pages': f"{start_idx + 1}-{end_idx}",
                    'chunk': i + 1
                }
            )
            self.chunks.append(chunk)
        
        print(f"   ✓ Created {len(self.chunks)} chunks")
        
        with open(cache_file, 'wb') as f:
            pickle.dump(self.chunks, f)
        
        return self.chunks
    
    
    def create_vector_store(self):
        """
        Create vector store using LOCAL embeddings
        NO API CALLS - runs on your computer!
        """
        
        print("\n🔍 Creating vector embeddings (LOCAL - no API usage)...")
        
        cache_file = self.cache_dir / "vectorstore"
        if cache_file.exists():
            print("   ⚡ Loading vector store from cache...")
            self.vectorstore = FAISS.load_local(
                str(cache_file), 
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            print("   ✓ Loaded from cache")
            return self.vectorstore
        
        print(f"   Processing {len(self.chunks)} chunks locally...")
        print("   (This runs on your CPU, may take 1-2 minutes)")
        
        # Create embeddings - all local, no API!
        self.vectorstore = FAISS.from_documents(self.chunks, self.embeddings)
        
        print("   ✓ Vector store created (NO API calls used!)")
        
        # Cache it
        self.vectorstore.save_local(str(cache_file))
        
        return self.vectorstore
    
    
    def summarize_hierarchical(self, chunk_summaries_only: bool = False):
        """Hierarchical summarization using Gemini API (with rate limiting)"""
        
        print("\n📝 Starting hierarchical summarization...")
        
        cache_file = self.cache_dir / "summaries.pkl"
        if cache_file.exists():
            print("   ⚡ Loading summaries from cache...")
            with open(cache_file, 'rb') as f:
                self.summaries = pickle.load(f)
            print("   ✓ Loaded from cache")
            return self.summaries
        
        # STEP 1: Chunk Summaries
        print("\n   STEP 1: Summarizing chunks...")
        
        chunk_summary_prompt = PromptTemplate(
            template="""You are a Supreme Court case analyst. Summarize this section of the judgment.

Focus on:
- Main legal issues and arguments
- Constitutional provisions discussed
- Court's reasoning and interpretation
- Key findings and precedents
- Relief granted or orders passed

Section:
{text}

Provide a clear, focused summary (300-400 words):""",
            input_variables=["text"]
        )
        
        chunk_summaries = []
        callback = ProgressCallback()
        
        for i, chunk in enumerate(self.chunks):
            print(f"   Chunk {i+1}/{len(self.chunks)}...")
            
            self.rate_limiter.wait_if_needed()
            
            try:
                summary = self.llm.predict(
                    chunk_summary_prompt.format(text=chunk.page_content),
                    callbacks=[callback]
                )
                chunk_summaries.append(summary)
                
            except Exception as e:
                if "429" in str(e) or "quota" in str(e).lower():
                    print(f"   ⏸️  Rate limit hit. Waiting 60s...")
                    time.sleep(60)
                    # Retry
                    summary = self.llm.predict(
                        chunk_summary_prompt.format(text=chunk.page_content),
                        callbacks=[callback]
                    )
                    chunk_summaries.append(summary)
                else:
                    print(f"   ⚠️  Error: {e}")
                    chunk_summaries.append(f"[Error on chunk {i+1}]")
            
            time.sleep(1)  # Extra buffer
        
        self.summaries['chunk_summaries'] = chunk_summaries
        
        if chunk_summaries_only:
            with open(cache_file, 'wb') as f:
                pickle.dump(self.summaries, f)
            return self.summaries
        
        # STEP 2: Group Summaries (if many chunks)
        if len(chunk_summaries) > 10:
            print("\n   STEP 2: Creating group summaries...")
            
            group_size = 5
            group_summaries = []
            
            for i in range(0, len(chunk_summaries), group_size):
                group = chunk_summaries[i:i+group_size]
                combined = "\n\n".join([f"Section {j+i+1}:\n{s}" for j, s in enumerate(group)])
                
                print(f"   Group {i//group_size + 1}...")
                
                self.rate_limiter.wait_if_needed()
                
                try:
                    group_summary = self.llm.predict(
                        f"Synthesize these summaries:\n\n{combined}\n\nUnified summary:",
                        callbacks=[callback]
                    )
                    group_summaries.append(group_summary)
                except Exception as e:
                    print(f"   ⚠️  Error: {e}")
                    group_summaries.append("[Error in group summary]")
                
                time.sleep(1)
            
            self.summaries['group_summaries'] = group_summaries
            summaries_for_exec = group_summaries
        else:
            summaries_for_exec = chunk_summaries
        
        # STEP 3: Executive Summary
        print("\n   STEP 3: Creating executive summary...")
        
        combined = "\n\n".join([f"Section {i+1}:\n{s}" for i, s in enumerate(summaries_for_exec)])
        
        exec_prompt = f"""Create a comprehensive executive summary of this Supreme Court judgment.

Summaries:
{combined}

Structure the summary as follows:
1. Case Overview
   - Case name, citation, bench composition
   - Date of judgment
   - Brief background

2. Legal Issues
   - Main constitutional questions
   - Key arguments by parties

3. Constitutional Provisions
   - Articles discussed
   - Previous precedents considered

4. Court's Analysis
   - Main reasoning
   - Interpretation of provisions
   - Treatment of precedents

5. Key Findings
   - Principal holdings
   - Constitutional principles established

6. Final Orders
   - Relief granted
   - Specific directions
   - Implications

7. Significance
   - Impact on constitutional law
   - Precedential value
   - Broader implications

Executive Summary (800-1200 words):"""
        
        self.rate_limiter.wait_if_needed()
        
        try:
            executive_summary = self.llm.predict(exec_prompt, callbacks=[callback])
            self.summaries['executive_summary'] = executive_summary
        except Exception as e:
            print(f"   ⚠️  Error: {e}")
            self.summaries['executive_summary'] = "[Error creating executive summary]"
        
        # Save cache
        with open(cache_file, 'wb') as f:
            pickle.dump(self.summaries, f)
        
        print("\n✅ Hierarchical summarization complete!")
        
        return self.summaries
    
    
    def save_summaries(self, output_dir: str = "./output"):
        """Save summaries to files"""
        
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        print(f"\n💾 Saving summaries to {output_dir}...")
        
        if 'executive_summary' in self.summaries:
            with open(output_path / "executive_summary.txt", 'w', encoding='utf-8') as f:
                f.write("="*60 + "\n")
                f.write("EXECUTIVE SUMMARY\n")
                f.write("="*60 + "\n\n")
                f.write(self.summaries['executive_summary'])
            print("   ✓ executive_summary.txt")
        
        if 'chunk_summaries' in self.summaries:
            with open(output_path / "chunk_summaries.txt", 'w', encoding='utf-8') as f:
                for i, summary in enumerate(self.summaries['chunk_summaries']):
                    f.write(f"\n{'='*60}\n")
                    f.write(f"CHUNK {i+1} SUMMARY\n")
                    f.write(f"{'='*60}\n\n")
                    f.write(summary)
                    f.write("\n\n")
            print("   ✓ chunk_summaries.txt")
        
        import json
        with open(output_path / "all_summaries.json", 'w', encoding='utf-8') as f:
            json.dump(self.summaries, f, indent=2, ensure_ascii=False)
        print("   ✓ all_summaries.json")
    
    
    def setup_qa_chain(self):
        """Setup Q&A system"""
        
        if not self.vectorstore:
            print("❌ Run create_vector_store() first")
            return None
        
        print("\n🤖 Setting up Q&A system...")
        
        qa_prompt = PromptTemplate(
            template="""You are a Supreme Court case expert. Answer based on the judgment context provided.

Context from judgment:
{context}

Question: {question}

Provide a clear answer, citing relevant paragraphs and constitutional provisions where applicable:""",
            input_variables=["context", "question"]
        )
        
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vectorstore.as_retriever(search_kwargs={"k": 3}),
            chain_type_kwargs={"prompt": qa_prompt},
            return_source_documents=True
        )
        
        print("✓ Q&A system ready")
        return self.qa_chain
    
    
    def ask(self, question: str) -> Dict:
        """Ask a question"""
        
        if not hasattr(self, 'qa_chain') or not self.qa_chain:
            self.setup_qa_chain()
        
        print(f"\n❓ Question: {question}")
        
        self.rate_limiter.wait_if_needed()
        
        try:
            result = self.qa_chain.invoke({"query": question})
            
            print(f"💬 Answer: {result['result'][:150]}...")
            
            return {
                'answer': result['result'],
                'sources': [doc.page_content[:200] + "..." for doc in result['source_documents']]
            }
        except Exception as e:
            print(f"❌ Error: {e}")
            return {'answer': f"Error: {e}", 'sources': []}
    
    
    def process_full_pipeline(self, pdf_path: str, quick_mode: bool = False):
        """Complete pipeline"""
        
        print("\n" + "="*70)
        print("🚀 LEGAL DOCUMENT PIPELINE (FREE TIER - LOCAL EMBEDDINGS)")
        print("="*70)
        
        start_time = time.time()
        
        self.load_document(pdf_path)
        # self.chunk_document(pages_per_chunk=15)  # 15 pages per chunk
        self.chunk_document(pages_per_chunk=25)  # 15 pages per chunk
        self.create_vector_store()  # LOCAL - no API!
        self.summarize_hierarchical(chunk_summaries_only=quick_mode)
        self.save_summaries()
        self.setup_qa_chain()
        
        elapsed = time.time() - start_time
        
        print("\n" + "="*70)
        print(f"✅ COMPLETE! (Time: {elapsed/60:.1f} minutes)")
        print("="*70)
        
        return self.summaries


# ============================================
# USAGE
# ============================================

# if __name__ == "__main__":
    
#     API_KEY = "AIzaSyCotDum4DodejfnQdFLLHbJEwNEGKTbCPA"
#     # Make sure this PDF file exists in your directory
#     PDF_PATH = input("Enter the path to your PDF file: ")
    
    
#     # Initialize
#     summarizer = LegalDocSummarizer(api_key=API_KEY)
    
#     # Process
#     summaries = summarizer.process_full_pipeline(
#         pdf_path=PDF_PATH,
#         quick_mode=False  # True = faster
#     )

if __name__ == "__main__":
    # Get the current file's directory and construct relative paths
    current_dir = Path(__file__).parent.resolve()
    project_root = current_dir.parent.parent
    
    API_KEY = "AIzaSyCotDum4DodejfnQdFLLHbJEwNEGKTbCPA"
    
    # Use relative path from project root
    PDF_PATH = str(project_root / "test_pdf" / "legal_doc.pdf")
    CACHE_DIR = str(project_root / "cache")
    
    # Initialize with proper directories
    summarizer = LegalDocSummarizer(
        api_key=API_KEY,
        cache_dir=CACHE_DIR
    )
    
    # Process
    summaries = summarizer.process_full_pipeline(
        pdf_path=PDF_PATH,
        quick_mode=False  # True = faster
    )
    # View
    print("\n" + "="*70)
    print("EXECUTIVE SUMMARY:")
    print("="*70)
    print(summaries['executive_summary'])
    
    # Chat
    print("\n💬 CHAT MODE")
    while True:
        q = input("\nQuestion (or 'quit'): ")
        if q.lower() in ['quit', 'q', 'exit']:
            break
        result = summarizer.ask(q)
        print(f"\n💡 {result['answer']}")