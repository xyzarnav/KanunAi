"""
Contract Analysis Tool - Comprehensive Contract Review
Analyzes contracts for key clauses, risks, obligations, and financial terms

Install:
pip install langchain langchain-google-genai sentence-transformers pypdf faiss-cpu
"""

import os
import time
import json
from typing import List, Dict, Any
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent.parent.parent / '.env')

try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_google_genai import GoogleGenerativeAI
    from langchain_community.document_loaders import PyPDFLoader
    from langchain.docstore.document import Document
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Install with: pip install langchain langchain-google-genai pypdf")
    raise


class RateLimiter:
    """Handle API rate limits"""
    
    def __init__(self, requests_per_minute=12):
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


class ContractAnalyzer:
    """
    Comprehensive Contract Analysis Tool
    Analyzes contracts for key terms, risks, obligations, and financial details
    """
    
    def __init__(self, api_key: str):
        """Initialize with Gemini API key"""
        
        self.api_key = api_key
        self.rate_limiter = RateLimiter(requests_per_minute=12)
        
        # Gemini LLM
        self.llm = GoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            temperature=0.2,  # Lower temp for accuracy
            max_retries=3
        )
        
        self.document_text = ""
        self.chunks = []
        self.analysis_results = {}
    
    
    def load_contract(self, pdf_path: str) -> str:
        """Load contract PDF with caching"""
        cache_path = Path(pdf_path).with_suffix('.cache.json')

        if cache_path.exists():
            print("⚡ Loading contract from cache...")
            with open(cache_path, 'r', encoding='utf-8') as cache_file:
                self.document_text = json.load(cache_file)['document_text']
            return self.document_text

        try:
            loader = PyPDFLoader(pdf_path)
            documents = loader.load()

            # Combine all pages
            self.document_text = "\n\n--- PAGE BREAK ---\n\n".join(
                [doc.page_content for doc in documents]
            )

            # Save to cache
            with open(cache_path, 'w', encoding='utf-8') as cache_file:
                json.dump({'document_text': self.document_text}, cache_file)

            return self.document_text

        except Exception as e:
            raise ValueError(f"Error loading PDF: {e}")
            
    def is_contract_document(self) -> bool:
        """
        Check if the loaded document appears to be a contract based on key indicators
        Returns True if document is likely a contract, False otherwise
        """
        if not self.document_text:
            raise ValueError("No document loaded. Run load_contract() first.")
            
        # Common contract keywords and phrases to look for
        contract_indicators = [
            "agreement", "contract", "terms and conditions", 
            "parties", "hereby agree", "obligations", "shall",
            "hereinafter", "whereas", "in witness whereof",
            "covenant", "undertaking", "clause", "provision",
            "executed", "binding agreement", "consideration",
            "term of agreement", "termination", "governing law"
        ]
        
        # Check if document contains contract-specific language
        # Convert to lowercase for case-insensitive matching
        document_lower = self.document_text.lower()
        
        # Count the number of contract indicators found
        indicator_count = sum(1 for indicator in contract_indicators 
                             if indicator in document_lower)
        
        # If document has at least 3 contract indicators, it's likely a contract
        return indicator_count >= 3
    
    
    def chunk_contract(self, pdf_path: str, pages_per_chunk: int = 2):
        """
        Smart chunking for contract analysis with caching
        Default: 1-2 pages per chunk for detailed analysis
        """
        cache_path = Path(pdf_path).with_suffix(f'.chunks_{pages_per_chunk}.cache.json')

        if cache_path.exists():
            print("⚡ Loading chunks from cache...")
            with open(cache_path, 'r', encoding='utf-8') as cache_file:
                self.chunks = [Document(**chunk) for chunk in json.load(cache_file)]
            return self.chunks

        if not self.document_text:
            raise ValueError("No document loaded. Run load_contract() first.")

        # Load document pages
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()

        total_pages = len(documents)
        num_chunks = (total_pages + pages_per_chunk - 1) // pages_per_chunk

        self.chunks = []
        for i in range(num_chunks):
            start_idx = i * pages_per_chunk
            end_idx = min((i + 1) * pages_per_chunk, total_pages)

            combined_content = "\n\n=== PAGE BREAK ===\n\n".join(
                doc.page_content for doc in documents[start_idx:end_idx]
            )

            chunk = Document(
                page_content=combined_content,
                metadata={
                    'pages': f"{start_idx + 1}-{end_idx}",
                    'chunk': i + 1
                }
            )
            self.chunks.append(chunk)

        # Save chunks to cache
        with open(cache_path, 'w', encoding='utf-8') as cache_file:
            json.dump([chunk.__dict__ for chunk in self.chunks], cache_file)

        return self.chunks
    
    
    def analyze_chunk(self, chunk: Document, chunk_num: int) -> Dict[str, Any]:
        """Analyze individual chunk for contract elements"""
        
        analysis_prompt = f"""You are a contract analysis expert. Analyze this section of a contract and extract key information.

CONTRACT SECTION (Pages {chunk.metadata['pages']}):
{chunk.page_content}

Extract and categorize the following (use "Not found" if not present in this section):

1. **PARTIES INVOLVED**
   - List all parties mentioned with their roles

2. **KEY CLAUSES**
   - Main terms, conditions, and provisions
   - What is being agreed to?

3. **FINANCIAL TERMS**
   - Payment amounts, schedules, methods
   - Fees, penalties, late charges
   - Hidden costs or additional charges
   - Pricing models (fixed, variable, tiered)

4. **OBLIGATIONS**
   - Party A obligations (list specific duties)
   - Party B obligations (list specific duties)
   - Performance requirements

5. **DEADLINES & DATES**
   - Contract duration/term
   - Start and end dates
   - Milestone dates
   - Renewal dates and terms
   - Notice periods

6. **TERMINATION CLAUSES**
   - How can the contract be terminated?
   - Termination fees or penalties
   - Notice requirements

7. **RISK FACTORS & RED FLAGS** 🚩
   - Unfair or one-sided terms
   - Unusual clauses
   - Automatic renewal traps
   - Liability limitations
   - Non-compete or restrictive clauses
   - Arbitration/dispute resolution concerns

8. **INTELLECTUAL PROPERTY**
   - Ownership rights
   - License grants
   - Usage restrictions

9. **LIABILITY & INDEMNIFICATION**
   - Liability caps
   - Insurance requirements
   - Indemnification clauses

10. **CONFIDENTIALITY**
    - NDA terms
    - Data protection requirements

Provide detailed, specific information. Quote exact amounts, dates, and key phrases where relevant.
Format your response clearly with headers and bullet points."""

        self.rate_limiter.wait_if_needed()
        
        try:
            response = self.llm.predict(analysis_prompt)
            return {
                'chunk_num': chunk_num,
                'pages': chunk.metadata['pages'],
                'analysis': response
            }
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                time.sleep(60)
                response = self.llm.predict(analysis_prompt)
                return {
                    'chunk_num': chunk_num,
                    'pages': chunk.metadata['pages'],
                    'analysis': response
                }
            return {
                'chunk_num': chunk_num,
                'pages': chunk.metadata['pages'],
                'analysis': f"Error analyzing chunk: {e}"
            }
    
    
    def synthesize_analysis(self, chunk_analyses: List[Dict]) -> Dict[str, str]:
        """Synthesize all chunk analyses into comprehensive report"""
        
        # Combine all chunk analyses
        combined_analyses = "\n\n" + "="*80 + "\n\n".join([
            f"SECTION {a['chunk_num']} (Pages {a['pages']}):\n{a['analysis']}"
            for a in chunk_analyses
        ])
        
        synthesis_prompt = f"""You are a senior contract lawyer. Review all the analyzed sections below and create a COMPREHENSIVE CONTRACT ANALYSIS REPORT.

{combined_analyses}

Create a detailed report with these sections:

# CONTRACT ANALYSIS REPORT

## 1. EXECUTIVE SUMMARY
- Contract type and purpose
- Parties involved and their roles
- Contract duration and key dates
- Overall assessment (Fair/Unfair/Balanced)

## 2. PARTIES & ROLES
- Complete list of all parties with descriptions

## 3. KEY TERMS & MAIN CLAUSES
- All major provisions
- Core agreements and commitments
- Scope of work/services

## 4. FINANCIAL ANALYSIS 💰
- **Payment Structure**: All amounts, schedules, methods
- **Additional Costs**: Fees, penalties, hidden charges
- **Total Financial Obligation**: Estimated total cost
- **Payment Risks**: Late fees, interest, penalties

## 5. OBLIGATIONS MATRIX
### Party A Obligations:
- [List all specific duties]

### Party B Obligations:
- [List all specific duties]

### Mutual Obligations:
- [Shared responsibilities]

## 6. CRITICAL DATES & DEADLINES 📅
- Contract term/duration
- Start date
- End date
- Renewal dates and terms
- Notice periods
- Important milestones

## 7. TERMINATION PROVISIONS
- Termination rights and conditions
- Exit procedures
- Associated costs/penalties
- Notice requirements

## 8. RISK ASSESSMENT 🚩
### HIGH RISK (Critical Issues):
- [List serious concerns]

### MEDIUM RISK (Caution Advised):
- [List moderate concerns]

### LOW RISK (Standard Terms):
- [List minor concerns]

## 9. UNFAIR OR UNUSUAL CLAUSES ⚠️
- Identify any one-sided terms
- Automatic renewal traps
- Excessive penalties
- Restrictive covenants
- Liability limitations favoring one party

## 10. LIABILITY & PROTECTION
- Liability caps and limitations
- Insurance requirements
- Indemnification obligations
- Warranty terms

## 11. INTELLECTUAL PROPERTY
- IP ownership and rights
- License grants
- Usage restrictions

## 12. CONFIDENTIALITY & DATA
- NDA provisions
- Data protection requirements
- Privacy obligations

## 13. DISPUTE RESOLUTION
- Arbitration clauses
- Jurisdiction
- Legal recourse options

## 14. MISSING OR CONCERNING ELEMENTS
- Important clauses that should be present but aren't
- Vague or ambiguous language
- Undefined terms

## 15. RECOMMENDATIONS 💡
### Before Signing:
- [Action items and clarifications needed]

### Negotiation Points:
- [Suggested improvements or changes]

### Red Flags to Address:
- [Must-resolve issues]

## 16. OVERALL RISK SCORE
- **Risk Level**: [Low/Medium/High]
- **Fairness Rating**: [Fair/Somewhat Fair/Unfair] 
- **Recommendation**: [Sign/Negotiate/Reject/Seek Legal Counsel]

---
*This analysis is for informational purposes only and does not constitute legal advice.*

Provide a thorough, professional analysis. Be specific and reference actual terms from the contract."""

        self.rate_limiter.wait_if_needed()
        
        try:
            comprehensive_report = self.llm.predict(synthesis_prompt)
            return {
                'comprehensive_report': comprehensive_report,
                'chunk_analyses': chunk_analyses
            }
        except Exception as e:
            return {
                'comprehensive_report': f"Error creating comprehensive report: {e}",
                'chunk_analyses': chunk_analyses
            }
    
    
    def generate_executive_summary(self, comprehensive_report: str) -> str:
        """Generate a quick executive summary"""
        
        summary_prompt = f"""Based on this comprehensive contract analysis, create a concise EXECUTIVE SUMMARY (300-400 words) for a busy executive.

ANALYSIS:
{comprehensive_report}

Focus on:
1. What this contract is about (2 sentences)
2. Key financial obligations (total cost estimate)
3. Top 3 risks or concerns
4. Critical dates
5. Overall recommendation (Sign/Negotiate/Reject)

Make it scannable with bullet points and clear sections."""

        self.rate_limiter.wait_if_needed()
        
        try:
            summary = self.llm.predict(summary_prompt)
            return summary
        except Exception as e:
            return "Error generating executive summary"
    
    
    def save_analysis(self, output_dir: str = None):
        """Save analysis to files"""
        
        if output_dir is None:
            current_dir = Path(__file__).parent
            output_dir = str(current_dir.parent.parent / "output" / "contract_analysis")
        
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True, parents=True)
        
        # Clear existing files
        for file in output_path.glob("*.md"):
            file.unlink()
        for file in output_path.glob("*.json"):
            file.unlink()
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 1. Executive Summary
        if 'executive_summary' in self.analysis_results:
            with open(output_path / "1_executive_summary.md", 'w', encoding='utf-8') as f:
                f.write(f"# Executive Summary\n\n")
                f.write(f"**Generated**: {timestamp}\n\n")
                f.write("---\n\n")
                f.write(self.analysis_results['executive_summary'])
        
        # 3. Detailed Chunk Analysis
        if 'chunk_analyses' in self.analysis_results:
            with open(output_path / "3_detailed_chunk_analysis.md", 'w', encoding='utf-8') as f:
                f.write(f"# Detailed Section-by-Section Analysis\n\n")
                f.write(f"**Generated**: {timestamp}\n\n")
                f.write("---\n\n")
                for chunk_analysis in self.analysis_results['chunk_analyses']:
                    f.write(f"\n## Section {chunk_analysis['chunk_num']} (Pages {chunk_analysis['pages']})\n\n")
                    f.write(chunk_analysis['analysis'])
                    f.write("\n\n---\n\n")
        
        # 4. JSON export
        json_data = {
            'timestamp': timestamp,
            'analysis': self.analysis_results
        }
        with open(output_path / "contract_analysis.json", 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
    
    
    def analyze_chunks_parallel(self):
        """Analyze all chunks in parallel for faster processing"""
        from concurrent.futures import ThreadPoolExecutor

        def analyze_single_chunk(chunk_data):
            chunk, chunk_num = chunk_data
            return self.analyze_chunk(chunk, chunk_num)

        with ThreadPoolExecutor() as executor:
            chunk_analyses = list(executor.map(analyze_single_chunk, zip(self.chunks, range(1, len(self.chunks) + 1))))

        return chunk_analyses

    def analyze_contract(self, pdf_path: str, pages_per_chunk: int = 2, output_dir: str = None):
        """Complete contract analysis pipeline with parallel chunk analysis, prioritizing executive summary"""

        start_time = time.time()

        # Step 1: Load contract
        self.load_contract(pdf_path)
        
        # Step 1.5: Verify document is a contract
        if not self.is_contract_document():
            raise ValueError("The provided document does not appear to be a contract. Please verify the document and try again.")

        # Step 2: Chunk contract
        self.chunk_contract(pdf_path=pdf_path, pages_per_chunk=pages_per_chunk)

        # Step 3: Analyze each chunk in parallel
        chunk_analyses = self.analyze_chunks_parallel()

        # Step 4: Generate executive summary directly from chunk analyses
        # This is more efficient than generating a comprehensive report first
        combined_analyses = "\n\n" + "="*80 + "\n\n".join([
            f"SECTION {a['chunk_num']} (Pages {a['pages']}):\n{a['analysis']}"
            for a in chunk_analyses
        ])

        executive_summary_prompt = f"""Based on these contract analysis sections, create a concise EXECUTIVE SUMMARY (300-400 words) for a busy executive.

{combined_analyses}

Focus on:
1. What this contract is about (2 sentences)
2. Key financial obligations (total cost estimate)
3. Top 3-5 risks or concerns
4. Critical dates and deadlines
5. Overall recommendation (Sign/Negotiate/Reject)

Make it scannable with bullet points and clear sections."""

        self.rate_limiter.wait_if_needed()
        
        try:
            executive_summary = self.llm.predict(executive_summary_prompt)
        except Exception as e:
            executive_summary = f"Error generating executive summary: {e}"

        # Store results
        self.analysis_results = {
            'executive_summary': executive_summary,
            'chunk_analyses': chunk_analyses
        }

        # Step 5: Save results
        if output_dir is None:
            output_dir = str(Path(pdf_path).parent.parent / "output" / "contract_analysis")
        self.save_analysis(output_dir=output_dir)

        elapsed = time.time() - start_time

        return self.analysis_results


# ============================================
# USAGE
# ============================================

if __name__ == "__main__":
    # Setup paths
    current_dir = Path(__file__).parent.resolve()
    project_root = current_dir.parent.parent
    
    # Get API key
    API_KEY = os.getenv('GEMINI_API_KEY')
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY not found in .env file")
    
    # Get contract path
    CONTRACT_PATH = input("Enter the path to your contract PDF: ").strip()
    if not CONTRACT_PATH:
        CONTRACT_PATH = str(project_root / "src/test_pdf" / "contract.pdf")
        print(f"Using default: {CONTRACT_PATH}")
    
    # Get chunk size (default 2 pages for contracts)
    while True:
        chunk_input = input("Pages per chunk (recommended 1-2, press Enter for 2): ").strip()
        if not chunk_input:
            chunk_size = 2
            break
        try:
            chunk_size = int(chunk_input)
            if chunk_size <= 0:
                print("Please enter a positive number.")
                continue
            break
        except ValueError:
            print("Please enter a valid number.")
    
    # Initialize analyzer
    analyzer = ContractAnalyzer(api_key=API_KEY)
    
    # Run analysis
    results = analyzer.analyze_contract(
        pdf_path=CONTRACT_PATH,
        pages_per_chunk=chunk_size
    )
    
    # Display executive summary
    print("\n" + "="*80)
    print("📊 EXECUTIVE SUMMARY")
    print("="*80)
    print(results['executive_summary'])
    
    print("\n" + "="*80)
    print("💡 TIP: Check the output folder for detailed reports!")
    print("="*80)