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
    
    
    def load_document(self, file_path: str) -> List[Document]:
        """Load PDF or text file"""
        
        print(f"\n📄 Loading document: {file_path}")
        
        cache_file = self.cache_dir / f"{Path(file_path).stem}_docs.pkl"
        if cache_file.exists():
            print("   ⚡ Loading from cache...")
            with open(cache_file, 'rb') as f:
                self.documents = pickle.load(f)
            print(f"   ✓ Loaded {len(self.documents)} pages from cache")
            return self.documents
        
        try:
            # Determine whether the file is a PDF. Some uploads may not have a .pdf
            # extension (for example when saved with a random name). Check the
            # extension first, then fall back to checking the file magic bytes.
            file_ext = Path(file_path).suffix.lower()
            is_pdf = False

            try:
                if file_ext == '.pdf':
                    is_pdf = True
                else:
                    # Read the first few bytes to check for PDF magic header
                    with open(file_path, 'rb') as fb:
                        head = fb.read(4)
                        if head.startswith(b'%PDF'):
                            is_pdf = True
            except Exception as header_exc:
                print(f"   ⚠️ Could not read file header: {header_exc}")

            if is_pdf:
                # Load PDF
                loader = PyPDFLoader(file_path)
                self.documents = loader.load()
                print(f"   ✓ Loaded {len(self.documents)} pages from PDF")
            else:
                # Load as text file. Try utf-8, then fall back to latin-1. If both
                # fail, attempt to treat file as a PDF as a last resort.
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except UnicodeDecodeError:
                    try:
                        with open(file_path, 'r', encoding='latin-1') as f:
                            content = f.read()
                        print("   ⚠️ Read text file with latin-1 encoding (fallback)")
                    except Exception as text_exc:
                        print(f"   ⚠️ Text read failed: {text_exc}. Attempting to load as PDF.")
                        loader = PyPDFLoader(file_path)
                        self.documents = loader.load()
                        print(f"   ✓ Loaded {len(self.documents)} pages from PDF (fallback)")
                        with open(cache_file, 'wb') as f:
                            pickle.dump(self.documents, f)
                        return self.documents

                # Create a single document from text content
                self.documents = [Document(page_content=content, metadata={"pages": "1", "chunk": 1})]
                print(f"   ✓ Loaded text file ({len(content)} characters)")
            
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
        Combines pages into chunks for better context
        """
        
        if not self.documents:
            raise ValueError("No documents loaded. Please run load_document() first.")
        
        print(f"\n📦 Chunking document (pages per chunk={pages_per_chunk})...")
        
        # Clear cache to force new chunking
        cache_file = self.cache_dir / "chunks.pkl"
        if cache_file.exists():
            os.remove(cache_file)
        
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
        
        if not self.chunks:
            raise ValueError("No chunks available. Please run chunk_document() first.")

        # Clear cache to force new vector store creation
        cache_file = self.cache_dir / "vectorstore"
        if cache_file.exists():
            import shutil
            shutil.rmtree(cache_file)
        
        print(f"   Processing {len(self.chunks)} chunks locally...")
        print("   (This runs on your CPU, may take 1-2 minutes)")
        
        # Create embeddings - all local, no API!
        self.vectorstore = FAISS.from_documents(self.chunks, self.embeddings)
        
        print("   ✓ Vector store created (NO API calls used!)")
        
        # Cache it
        self.vectorstore.save_local(str(cache_file))
        
        return self.vectorstore
    
    
    def generate_executive_summary_from_chunks(self, chunk_summaries: List[str]) -> str:
        """Generates a 500-600 word executive summary from chunk summaries."""
        
        print("\n   STEP 3: Creating executive summary...")

        combined = "\n\n".join([f"Section {i+1}:\n{s}" for i, s in enumerate(chunk_summaries)])
        
        # Force cache reset if needed for testing
        summary_cache_file = self.cache_dir / "summaries.pkl"
        if os.environ.get("FORCE_RESUMMARY") == "1" and summary_cache_file.exists():
            print("   🔄 Forcing resummary (FORCE_RESUMMARY=1)")
            try:
                os.remove(summary_cache_file)
            except Exception as e:
                print(f"   ⚠️ Could not remove cache: {e}")
                
        exec_prompt = f"""Using the combined summaries below, create an executive summary EXACTLY BETWEEN 500 and 600 WORDS TOTAL.

Structure the output into these three sections, using EXACTLY these headings:

Case Summary:
What did the court decide:
What are the outcomes:

Follow these rules PRECISELY:
1. Each section MUST be EXACTLY ONE PARAGRAPH of 160-180 words with a clear beginning and end.
2. Each section MUST focus only on its specific topic:
   - First section: ONLY about the case background and constitutional context
   - Second section: ONLY about the court's legal reasoning and principles
   - Third section: ONLY about the specific orders and practical directives
3. EMPHASIZE key legal terms by putting them in ** marks:
   - Legal Acts (e.g., **Hindu Marriage Act**)
   - Section numbers (e.g., **Section 125**)
   - Case names (e.g., **v.** or **versus**)
   - Monetary values (e.g., **Rs. 15,000**)
   - Important dates
3. Each section MUST be COMPLETELY SELF-CONTAINED with no references to other sections.
4. Use simple, direct language with short sentences.
5. For "Case Summary:" - Begin with "The case explains" (not "This Supreme Court case") and explain the background, parties, and issues.
6. For "What did the court decide:" - Start with "The Court" (not specifically Supreme Court) and explain the legal principles.
7. For "What are the outcomes:" - Start with "The Court ordered" and explain the specific orders.
8. DO NOT use complex sentences or constructions.
9. Aim for 160-180 words per section, allowing flexibility to complete sentences properly.
10. NEVER end a section with ellipses (...) or incomplete sentences.
11. ALWAYS end each paragraph with a complete sentence and proper punctuation.
12. If a sentence won't fit within the word limit, rewrite it to be shorter rather than truncating it.

Combined summaries:
{combined}
"""

        self.rate_limiter.wait_if_needed()
        callback = ProgressCallback()

        try:
            executive_summary = self.llm.predict(exec_prompt, callbacks=[callback])
            # Post-process and enforce structure and word count (500-600 words)
            import re

            def _ensure_three_headings(text: str) -> str:
                """Ensure text contains the three required headings. If not, split into 3 parts and add them."""
                headings = [
                    "Case Summary:",
                    "What did the court decide:",
                    "What are the outcomes:",
                ]

                # Normalize whitespace
                t = re.sub(r"\s+", " ", text.strip())

                # Check if headings exist
                found = [re.search(rf"{re.escape(h)}", t, flags=re.IGNORECASE) for h in headings]
                if all(found):
                    # Return text but normalize heading casing to exact expected headings
                    for h in headings:
                        t = re.sub(rf"(?i){re.escape(h)}", h, t)
                    return t

                # If headings not present, attempt to split into three roughly equal parts by sentences
                sents = re.split(r"(?<=[\.!?])\s+", t)
                # If too few sentences, return with headings prepended as simple wrapper
                if len(sents) < 6:
                    # Wrap entire text under the first heading and add placeholders
                    return f"{headings[0]}\n\n{text}\n\n\n{headings[1]}\n\n[See above]\n\n\n{headings[2]}\n\n[See above]"

                # Distribute sentences into 3 buckets
                n = len(sents)
                a = sents[: n//3]
                b = sents[n//3: 2*n//3]
                c = sents[2*n//3:]
                
                # Ensure each section is approximately balanced
                # Target roughly 160-170 words per section (480-510 total across 3 sections)
                part_a = " ".join(a).strip()[:1000]  # Roughly 170 words max
                part_b = " ".join(b).strip()[:1000]
                part_c = " ".join(c).strip()[:1000]

                return f"{headings[0]}\n\n{part_a}\n\n\n{headings[1]}\n\n{part_b}\n\n\n{headings[2]}\n\n{part_c}"

            def _word_count(text: str) -> int:
                return len(text.split())

            def _shorten_to_limit(text: str, max_words: int = 600) -> str:
                words = text.split()
                if len(words) <= max_words:
                    return text
                return " ".join(words[:max_words]).rstrip(' ,;:.')

            # Normalize initial output into 3 headings
            candidate = _ensure_three_headings(executive_summary)

            # Enforce word count by re-prompting LLM if necessary (up to 2 retries)
            max_retries = 2
            retries = 0
            final = candidate
            wc = _word_count(final)
            while (wc < 500 or wc > 600) and retries < max_retries:
                retries += 1
                self.rate_limiter.wait_if_needed()
                if wc < 500:
                    # Ask LLM to expand while preserving headings
                    expand_prompt = (
                        "The executive summary below is TOO SHORT. Expand it to be between 500 and 600 words. "
                        "Preserve the three headings exactly. Ensure each section has a complete, self-contained paragraph. "
                        "Make sure the 'What did the court decide' section clearly explains the legal reasoning and principles. "
                        "Make sure the 'What are the outcomes' section clearly explains concrete orders and practical implications. "
                        "IMPORTANT: Each section should be 160-180 words - allow flexibility to complete sentences properly. "
                        "Start the first section with 'The case explains' rather than 'This Supreme Court case'. "
                        "EMPHASIZE key legal terms by putting them in ** marks (Acts, Sections, case names, monetary values). "
                        "ALWAYS end each paragraph with a complete sentence and proper punctuation. "
                        "NEVER cut off sentences or end with ellipses - always complete the final thought. "
                        "DO NOT prefix your response with any introduction. "
                        "ONLY return the expanded summary with exactly the same formatting.\n\n" + final
                    )
                    try:
                        expanded = self.llm.predict(expand_prompt, callbacks=[callback])
                        final = _ensure_three_headings(expanded)
                    except Exception as e:
                        print(f"   ⚠️  Error expanding summary: {e}")
                        break
                else:
                    # Too long: ask LLM to shorten
                    shorten_prompt = (
                        "The executive summary below is TOO LONG. Shorten it to be between 500 and 600 words. "
                        "Preserve the three headings exactly and the main points. Do not add or remove headings. "
                        "IMPORTANT: Each section should be 160-180 words - allow flexibility to complete sentences properly. "
                        "Start the first section with 'The case explains' rather than 'This Supreme Court case'. "
                        "EMPHASIZE key legal terms by putting them in ** marks (Acts, Sections, case names, monetary values). "
                        "Ensure each section has a complete, self-contained paragraph with a proper conclusion. "
                        "NEVER cut off sentences or end with ellipses - always complete the thought. "
                        "Use simple sentences and direct language. NEVER end with ellipses or incomplete sentences. "
                        "DO NOT prefix your response with any introduction. "
                        "ONLY return the shortened summary with exactly the same formatting.\n\n" + final
                    )
                    try:
                        shortened = self.llm.predict(shorten_prompt, callbacks=[callback])
                        final = _ensure_three_headings(shortened)
                    except Exception as e:
                        print(f"   ⚠️  Error shortening summary: {e}")
                        # As a fallback, truncate to 600 words
                        final = _shorten_to_limit(final, max_words=600)
                        break

                wc = _word_count(final)

            # Final cleanup to remove any introductory text and markdown hashes
            def _clean_final_output(text: str) -> str:
                # Remove any markdown hashes from headings
                cleaned_text = re.sub(r'#+\s*(Case Summary:|What did the court decide:|What are the outcomes:)', r'\1', text, flags=re.IGNORECASE)
                
                # Find the start of the first real heading
                match = re.search(r'Case Summary:', cleaned_text, re.IGNORECASE)
                if match:
                    cleaned_text = cleaned_text[match.start():]
                
                # Remove any extra annotations that might be coming from the model
                cleaned_text = re.sub(r'###\s*(Case Summary:|What did the court decide:|What are the outcomes:)', r'\1', cleaned_text, flags=re.IGNORECASE)
                
                # Clean up any duplicate headings
                for heading in ['Case Summary:', 'What did the court decide:', 'What are the outcomes:']:
                    pattern = f"({re.escape(heading)}.*?){re.escape(heading)}"
                    cleaned_text = re.sub(pattern, r'\1', cleaned_text, flags=re.DOTALL|re.IGNORECASE)
                
                # Remove any "Case Summary" text that appears without the colon (model sometimes repeats the heading)
                cleaned_text = re.sub(r'Case Summary\s+', '', cleaned_text)
                cleaned_text = re.sub(r'What did the court decide\s+', '', cleaned_text)
                cleaned_text = re.sub(r'What are the outcomes\s+', '', cleaned_text)
                
                return cleaned_text.strip()

            final = _clean_final_output(final)

            # Final safety truncation if still too long
            if _word_count(final) > 600:
                final = _shorten_to_limit(final, max_words=600)
                print(f"   ⚠️ Summary exceeded 600 words - truncated to {_word_count(final)} words")
            elif _word_count(final) < 500:
                print(f"   ⚠️ Summary too short ({_word_count(final)} words) - below 500 word target")
            else:
                print(f"   ✓ Summary word count: {_word_count(final)} words (target: 500-600)")

            # Final validation - ensure proper section formatting and structure
            def _ensure_complete_sections(text):
                # Extract the three sections using regex
                case_overview_match = re.search(r'Case Summary:(.*?)(?=What did the court decide:|$)', text, re.DOTALL)
                court_decide_match = re.search(r'What did the court decide:(.*?)(?=What are the outcomes:|$)', text, re.DOTALL)
                outcomes_match = re.search(r'What are the outcomes:(.*?)$', text, re.DOTALL)

                # Extract content and clean it
                case_overview = case_overview_match.group(1).strip() if case_overview_match else ""
                court_decide = court_decide_match.group(1).strip() if court_decide_match else ""
                outcomes = outcomes_match.group(1).strip() if outcomes_match else ""

                # Fix incomplete sentences or truncated text (ending with "..")
                def fix_truncated_text(text):
                    # Remove trailing ellipses followed by proper sentence ending
                    text = re.sub(r'\.+\s*[.!?]$', '.', text)
                    # Replace trailing ellipses with a period if at the end of text
                    text = re.sub(r'\.+\s*$', '.', text)
                    # Replace any remaining ellipses in the text with periods
                    text = re.sub(r'\.+', '.', text)
                    # Ensure the section ends with a proper sentence
                    if not re.search(r'[.!?]\s*$', text.strip()):
                        text = text.rstrip() + '.'
                    
                    # Ensure the last sentence is complete by checking for common sentence structures
                    sentences = re.split(r'(?<=[.!?])\s+', text)
                    if sentences:
                        last_sentence = sentences[-1]
                        if len(last_sentence.split()) < 5:  # Arbitrary threshold for incomplete sentence
                            sentences = sentences[:-1]  # Remove the incomplete sentence
                            text = ' '.join(sentences).strip()
                            if not text.endswith('.'):  # Ensure proper punctuation
                                text += '.'
                    return text

                # Apply fixes to each section
                case_overview = fix_truncated_text(case_overview)
                court_decide = fix_truncated_text(court_decide)
                outcomes = fix_truncated_text(outcomes)

                # Add emphasis to key legal concepts, dates, and monetary values
                def add_emphasis_to_key_elements(text):
                    # Emphasize legal terms, section numbers, monetary values, and dates
                    text = re.sub(r'\b([A-Z][a-z]*(Act|Code|Rules|Constitution|Amendment|Section|Article|Chapter))\b', r'**\1**', text)
                    text = re.sub(r'\b(Section|Article|Chapter)\s+(\d+[A-Z]?(\(\d+\))?)\b', r'**\1 \2**', text)
                    text = re.sub(r'\b(v\.|vs\.|versus)\b', r'**\1**', text)
                    text = re.sub(r'\b(Rs\.\s*\d+[\,\d]*(\.\d+)?)\b', r'**\1**', text)
                    text = re.sub(r'\b(\d{1,2}(st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4})\b', r'**\1**', text)
                    return text

                # Apply emphasis to each section
                case_overview = add_emphasis_to_key_elements(case_overview)
                court_decide = add_emphasis_to_key_elements(court_decide)
                outcomes = add_emphasis_to_key_elements(outcomes)

                # Format the output with clear headings and separators (with bold headings)
                result = "**Case Summary:**\n\n"
                result += case_overview
                result += "\n\n\n**What did the court decide:**\n\n"
                result += court_decide
                result += "\n\n\n**What are the outcomes:**\n\n"
                result += outcomes

                return result

            # Apply final validation
            final = _ensure_complete_sections(final)
            
            # If still shorter than 500, leave as-is but note (do not modify content further)
            return final
        except Exception as e:
            print(f"   ⚠️  Error: {e}")
            return "[Error creating executive summary]"

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
        executive_summary = self.generate_executive_summary_from_chunks(summaries_for_exec)
        self.summaries['executive_summary'] = executive_summary
        
        # Save cache
        with open(cache_file, 'wb') as f:
            pickle.dump(self.summaries, f)
        
        print("\n✅ Hierarchical summarization complete!")
        
        return self.summaries
    
    
    def save_summaries(self, output_dir: str = None):
        """Save summaries to files"""
        
        if output_dir is None:
            # Use absolute path based on current file location
            current_dir = Path(__file__).parent
            output_dir = str(current_dir.parent.parent / "output" / "chatbot_summarizer")
            
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True, parents=True)
        
        # Clear existing files in the directory
        if output_path.exists():
            for file in output_path.glob("*.md"):
                file.unlink()
            for file in output_path.glob("*.json"):
                file.unlink()
        
        print(f"\n💾 Saving summaries to {output_dir}...")
        
        if 'executive_summary' in self.summaries:
            with open(output_path / "executive_summary.md", 'w', encoding='utf-8') as f:
                f.write("# Executive Summary\n\n")
                f.write("## Chatbot Summarizer Output\n\n")
                f.write("---\n\n")
                f.write(self.summaries['executive_summary'])
            print("   ✓ executive_summary.md")
        
        if 'chunk_summaries' in self.summaries:
            with open(output_path / "chunk_summaries.md", 'w', encoding='utf-8') as f:
                f.write("# Chunk Summaries\n\n")
                for i, summary in enumerate(self.summaries['chunk_summaries']):
                    f.write(f"\n## Chunk {i+1}\n\n")
                    f.write("---\n\n")
                    f.write(summary)
                    f.write("\n\n")
            print("   ✓ chunk_summaries.md")
        
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
    
    
    def process_full_pipeline(self, pdf_path: str, quick_mode: bool = False, chunk_size: int = 25, output_dir: str = None):
        """Complete pipeline"""
        
        print("\n" + "="*70)
        print("🚀 LEGAL DOCUMENT PIPELINE (FREE TIER - LOCAL EMBEDDINGS)")
        print("="*70)
        
        start_time = time.time()
        
        self.load_document(pdf_path)
        self.chunk_document(pages_per_chunk=chunk_size)  # Use user-defined chunk size
        self.create_vector_store()  # LOCAL - no API!
        self.summarize_hierarchical(chunk_summaries_only=quick_mode)
        
        # Use absolute path for output
        if output_dir is None:
            output_dir = str(Path(pdf_path).parent.parent / "output" / "chatbot_summarizer")
        self.save_summaries(output_dir=output_dir)
        
        self.setup_qa_chain()
        
        elapsed = time.time() - start_time
        
        print("\n" + "="*70)
        print(f"✅ COMPLETE! (Time: {elapsed/60:.1f} minutes)")
        print("="*70)
        
        return self.summaries


# ============================================
# USAGE
# ============================================

# Example usage:
# if __name__ == "__main__":
#     API_KEY = os.getenv('GEMINI_API_KEY')  # Get from .env file
#     PDF_PATH = input("Enter the path to your PDF file: ")
#     
#     summarizer = LegalDocSummarizer(api_key=API_KEY)
#     summaries = summarizer.process_full_pipeline(
#         pdf_path=PDF_PATH,
#         quick_mode=False  # True = faster
#     )

if __name__ == "__main__":
    # Get the current file's directory and construct relative paths
    current_dir = Path(__file__).parent.resolve()
    project_root = current_dir.parent.parent
    
    # Get API key from environment variable
    API_KEY = os.getenv('GEMINI_API_KEY')
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY not found in .env file")
    
    # Use relative path from project root
    PDF_PATH = str(project_root / "src/test_pdf" / "legal_doc.pdf")
    CACHE_DIR = str(project_root / "cache")
    
    # Get chunk size from user
    while True:
        try:
            chunk_size = int(input("Enter the number of pages per chunk (recommended 5-25): "))
            if chunk_size <= 0:
                print("Please enter a positive number.")
                continue
            break
        except ValueError:
            print("Please enter a valid number.")
    
    # Initialize with proper directories
    summarizer = LegalDocSummarizer(
        api_key=API_KEY,
        cache_dir=CACHE_DIR
    )
    
    # Process with user-defined chunk size
    summaries = summarizer.process_full_pipeline(
        pdf_path=PDF_PATH,
        quick_mode=False,  # True = faster
        chunk_size=chunk_size  # Pass the user-defined chunk size
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