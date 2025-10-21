"""
Accuracy Improvement Module for Case Analysis
Add this to your case_analysis.py to measure and improve accuracy
"""

import statistics
from typing import Dict, List
import re

# ============================================
# 1. ACCURACY METRICS MODULE
# ============================================

class AccuracyEvaluator:
    """Measure summary accuracy against source documents"""
    
    def __init__(self):
        self.rouge_available = False
        self.spacy_available = False
        
        try:
            from rouge_score import rouge_scorer
            self.rouge_scorer = rouge_scorer
            self.rouge_available = True
            print("✓ ROUGE scoring available")
        except ImportError:
            print("⚠️  ROUGE not installed. Run: pip install rouge-score")
        
        try:
            import spacy
            self.nlp = spacy.load("en_core_web_lg")
            self.spacy_available = True
            print("✓ SpaCy NER available")
        except Exception as e:
            print(f"⚠️  SpaCy not ready: {e}")
    
    
    def calculate_rouge_scores(self, reference: str, hypothesis: str) -> Dict:
        """Calculate ROUGE-1 and ROUGE-L scores"""
        
        if not self.rouge_available:
            return {'error': 'ROUGE not installed'}
        
        scorer = self.rouge_scorer.RougeScorer(['rouge1', 'rougeL'], use_stemmer=True)
        scores = scorer.score(reference, hypothesis)
        
        return {
            'rouge1_precision': scores['rouge1'].precision,
            'rouge1_recall': scores['rouge1'].recall,
            'rouge1_fmeasure': scores['rouge1'].fmeasure,
            'rougeL_precision': scores['rougeL'].precision,
            'rougeL_recall': scores['rougeL'].recall,
            'rougeL_fmeasure': scores['rougeL'].fmeasure,
        }
    
    
    def extract_legal_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract critical legal information"""
        
        entities = {
            'case_citations': [],
            'sections': [],
            'articles': [],
            'money_amounts': [],
            'time_periods': [],
            'years': [],
            'acts_and_laws': []
        }
        
        # Case citations (MANU format)
        manu_pattern = r'MANU/[A-Z]+/\d+/\d+'
        entities['case_citations'] = re.findall(manu_pattern, text)
        
        # Section references
        section_pattern = r'Section\s+(\d+[A-Z]?(?:\(\d+\))?)'
        entities['sections'] = re.findall(section_pattern, text)
        
        # Article references
        article_pattern = r'Article\s+(\d+[A-Z]?(?:\(\d+\))?)'
        entities['articles'] = re.findall(article_pattern, text)
        
        # Money amounts (Indian format)
        money_pattern = r'Rs\.?\s+([\d,]+(?:\.\d{2})?)'
        entities['money_amounts'] = re.findall(money_pattern, text)
        
        # Time periods
        time_pattern = r'(\d+)\s+(month|year|week|day|hour)s?'
        entities['time_periods'] = re.findall(time_pattern, text)
        
        # Years
        year_pattern = r'\b(19|20)\d{2}\b'
        entities['years'] = list(set(re.findall(year_pattern, text)))
        
        # Acts/Laws
        act_pattern = r'(Criminal Procedure Code|Hindu Marriage Act|Protection of Women|Domestic Violence Act|CrPC|HMA|SMA|HAMA|DV Act)'
        entities['acts_and_laws'] = list(set(re.findall(act_pattern, text, re.IGNORECASE)))
        
        return entities
    
    
    def validate_facts(self, summary: str, source_docs: List[str], critical_facts: Dict) -> Dict:
        """Validate that critical facts are preserved"""
        
        results = {
            'facts_checked': 0,
            'facts_found': 0,
            'facts_preserved': 0,
            'missing_facts': [],
            'accuracy_score': 0.0
        }
        
        for fact_name, fact_value in critical_facts.items():
            results['facts_checked'] += 1
            
            # Check if in summary
            in_summary = str(fact_value).lower() in summary.lower()
            
            # Check if in source
            in_source = any(str(fact_value).lower() in doc.lower() for doc in source_docs)
            
            if in_summary:
                results['facts_found'] += 1
            
            if in_summary and in_source:
                results['facts_preserved'] += 1
            else:
                results['missing_facts'].append(fact_name)
        
        if results['facts_checked'] > 0:
            results['accuracy_score'] = (results['facts_preserved'] / results['facts_checked']) * 100
        
        return results
    
    
    def compare_summaries(self, chunk_summaries: List[str], reference_chunks: List[str]) -> Dict:
        """Compare summaries at chunk level"""
        
        if not self.rouge_available:
            return {'error': 'ROUGE not installed'}
        
        scores = []
        
        for i, (summary, reference) in enumerate(zip(chunk_summaries, reference_chunks)):
            rouge_scores = self.calculate_rouge_scores(reference[:2000], summary[:1000])
            scores.append(rouge_scores['rouge1_fmeasure'])
        
        return {
            'chunk_scores': scores,
            'average_rouge1': statistics.mean(scores) if scores else 0,
            'min_score': min(scores) if scores else 0,
            'max_score': max(scores) if scores else 0,
            'std_dev': statistics.stdev(scores) if len(scores) > 1 else 0,
            'quality_assessment': self._assess_quality(statistics.mean(scores) if scores else 0)
        }
    
    
    def _assess_quality(self, rouge_score: float) -> str:
        """Assess summary quality based on ROUGE score"""
        
        if rouge_score >= 0.50:
            return "EXCELLENT (>0.50)"
        elif rouge_score >= 0.45:
            return "VERY GOOD (0.45-0.50)"
        elif rouge_score >= 0.40:
            return "GOOD (0.40-0.45)"
        elif rouge_score >= 0.35:
            return "FAIR (0.35-0.40)"
        else:
            return "NEEDS IMPROVEMENT (<0.35)"


# ============================================
# 2. ENHANCED PROMPTS FOR LEGAL DOCUMENTS
# ============================================

ENHANCED_CHUNK_PROMPT = """You are an expert constitutional and family law analyst with 25+ years of Supreme Court experience.

CRITICAL TASK: Extract and preserve ALL legal significance from this judgment section.

MANDATORY ELEMENTS TO INCLUDE:
1. Constitutional Provisions (cite with exact Article numbers)
2. Precedents Referenced (full case names and years in parentheses)
3. Legal Principles (established, modified, or clarified)
4. Specific Directives (amounts, dates, time limits - must be exact)
5. Procedural Changes (any reform in court procedures)
6. Enforcement Mechanisms (how to implement the judgment)

LEGAL LANGUAGE HIERARCHY:
- Use "SHALL" = Mandatory (cannot be deviated)
- Use "MUST" = Mandatory requirement
- Use "SHOULD" = Strong recommendation
- Use "MAY" = Discretionary option
- Use "CAN" = Possibility

FORMATTING RULES:
1. **Bold** all case names (e.g., *Rajnesh v. Neha*)
2. **Bold** all statutory references (e.g., Section 125 CrPC)
3. **Bold** all money amounts (e.g., Rs. 15,000)
4. Use Article references exactly (e.g., Article 15(3))
5. Quote critical phrases exactly with quotation marks
6. Separate each finding with a bullet point

AVOID:
- Vague generalizations
- Missing specific numbers or time limits
- Misquoting the court's language
- Omitting constitutional references

Source Section:
{text}

STRUCTURED OUTPUT:
## Constitutional Framework
- [Article X: exact interpretation]

## Key Precedents
- *Case Name* (Year): [brief relevance]

## Major Holdings
- [Finding with specificity]

## Specific Directives
- [Exact requirement with money/time]

## Implementation Requirements
- [What must be done and by whom]

## Reasoning Summary
[2-3 sentences of court's main logic]"""


ENHANCED_EXECUTIVE_PROMPT = """Create a DEFINITIVE executive summary of this Supreme Court judgment.

Your summary will be used by:
- Senior judges and lawyers
- Law students and researchers
- Government policy makers
- Appeals counsel

THEREFORE: Accuracy and completeness are CRITICAL.

MANDATORY STRUCTURE (DO NOT OMIT ANY SECTION):

1. CASE INFORMATION
   - Full case name and citation
   - Bench composition (if mentioned)
   - Date of judgment
   - Brief factual background

2. LEGAL FRAMEWORK
   - Constitutional provisions analyzed
   - Relevant statutes cited
   - Previous precedents discussed

3. ISSUES AND ARGUMENTS
   - Each party's main contentions
   - Specific legal questions posed to court

4. COURT'S ANALYSIS
   - How court approached each issue
   - Key reasoning (with quotes from judgment where possible)
   - Treatment of precedents

5. PRINCIPAL HOLDINGS
   - Each major finding (as separate bullet)
   - Constitutional principles established/modified
   - Any overruling of prior law

6. SPECIFIC DIRECTIVES
   - All numeric values (money amounts, percentages, time limits)
   - Who must do what and when
   - Consequences of non-compliance

7. ORDERS PASSED
   - For the specific case
   - General guidelines (if any)
   - Implementation deadlines

8. SIGNIFICANCE & IMPLICATIONS
   - Impact on Indian law
   - Precedential value
   - Practical implications for courts/litigants

QUALITY CHECKS:
□ No facts are contradicted
□ All money amounts match original
□ All time limits are exact
□ Constitutional articles cited correctly
□ Case names spelled exactly right
□ Dates (if any) are accurate

Source Summaries:
{text}

Write a comprehensive executive summary (800-1200 words) following the structure above.
PRIORITIZE ACCURACY over readability."""


VALIDATION_FACTS = {
    'case_name': 'Rajnesh v. Neha',
    'case_citation': 'MANU/SC/0833/2020',
    'judgment_year': '2020',
    'maintenance_wife_monthly': '15000',
    'maintenance_son_monthly': '10000',
    'final_order_deadline': '6 months',
    'affidavit_deadline': '4 weeks',
    'arrears_payment_deadline': '12 weeks',
    'constitutonal_article_15_3': 'Article 15(3)',
    'constitutonal_article_39': 'Article 39',
    'constitutonal_article_142': 'Article 142',
}


# ============================================
# 3. INTEGRATION WITH EXISTING CODE
# ============================================

def enhance_case_analysis_class():
    """
    Add this method to your LegalDocSummarizer class:
    
    def evaluate_accuracy(self, critical_facts: Dict = None):
        \"""Evaluate summary accuracy\"""
        
        evaluator = AccuracyEvaluator()
        
        print("\n" + "="*60)
        print("📊 ACCURACY EVALUATION REPORT")
        print("="*60)
        
        # 1. Extract entities from source
        source_text = "\n".join([doc.page_content for doc in self.documents])
        source_entities = evaluator.extract_legal_entities(source_text)
        
        print("\n✓ LEGAL ENTITIES FOUND IN SOURCE:")
        print(f"  - Case Citations: {len(source_entities['case_citations'])}")
        print(f"  - Sections: {len(source_entities['sections'])}")
        print(f"  - Articles: {len(source_entities['articles'])}")
        print(f"  - Money Amounts: {len(source_entities['money_amounts'])}")
        print(f"  - Acts/Laws: {len(source_entities['acts_and_laws'])}")
        
        # 2. Validate critical facts
        if critical_facts is None:
            critical_facts = VALIDATION_FACTS
        
        summary_text = self.summaries.get('executive_summary', '')
        source_docs = [doc.page_content[:3000] for doc in self.documents[:5]]
        
        fact_validation = evaluator.validate_facts(summary_text, source_docs, critical_facts)
        
        print("\n✓ FACT VALIDATION:")
        print(f"  - Facts Checked: {fact_validation['facts_checked']}")
        print(f"  - Facts Preserved: {fact_validation['facts_preserved']}")
        print(f"  - Accuracy: {fact_validation['accuracy_score']:.1f}%")
        if fact_validation['missing_facts']:
            print(f"  - Missing: {', '.join(fact_validation['missing_facts'])}")
        
        # 3. ROUGE Scoring (if available)
        try:
            chunk_scores = evaluator.compare_summaries(
                self.summaries.get('chunk_summaries', []),
                [doc.page_content for doc in self.chunks]
            )
            
            if 'average_rouge1' in chunk_scores:
                print("\n✓ CONTENT PRESERVATION (ROUGE SCORES):")
                print(f"  - Average ROUGE-1: {chunk_scores['average_rouge1']:.3f}")
                print(f"  - Min Score: {chunk_scores['min_score']:.3f}")
                print(f"  - Max Score: {chunk_scores['max_score']:.3f}")
                print(f"  - Quality: {chunk_scores['quality_assessment']}")
        except Exception as e:
            print(f"\n⚠️  ROUGE scoring error: {e}")
        
        print("\n" + "="*60)
        
        return {
            'entities': source_entities,
            'fact_validation': fact_validation,
            'chunk_scores': chunk_scores if 'chunk_scores' in locals() else None
        }
    """
    pass


# ============================================
# 4. USAGE EXAMPLE
# ============================================

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║   CASE ANALYSIS ACCURACY IMPROVEMENT MODULE                ║
    ║   Add these components to your case_analysis.py            ║
    ╚════════════════════════════════════════════════════════════╝
    
    TO USE:
    
    1. Install ROUGE scoring:
       pip install rouge-score
    
    2. Update your prompts in case_analysis.py:
       - Use ENHANCED_CHUNK_PROMPT instead of generic prompt
       - Use ENHANCED_EXECUTIVE_PROMPT for executive summary
    
    3. Add to your LegalDocSummarizer class:
       
       from accuracy_improvement import AccuracyEvaluator, VALIDATION_FACTS
       
       def evaluate_accuracy(self):
           evaluator = AccuracyEvaluator()
           # ... (see enhance_case_analysis_class() above)
    
    4. Call after summarization:
       
       summaries = summarizer.process_full_pipeline(pdf_path)
       results = summarizer.evaluate_accuracy()
    
    EXPECTED RESULTS:
    - Current accuracy: ~70-75% (estimated)
    - Target accuracy: >85% (with improvements)
    - ROUGE-1 target: >0.45
    
    IMPROVEMENTS ESTIMATE:
    - Chunk size (25→10): +8% accuracy
    - Enhanced prompts: +5% accuracy
    - Entity validation: +3% accuracy
    - Total potential: +16% improvement
    """)
