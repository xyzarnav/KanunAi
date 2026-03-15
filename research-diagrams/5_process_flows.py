"""
Process Flow Diagrams for Different Analysis Modes
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle
import numpy as np

def create_case_analysis_flow():
    """Case Analysis Workflow"""
    fig, ax = plt.subplots(1, 1, figsize=(10, 12))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 12)
    ax.axis('off')
    
    ax.text(5, 11.5, 'Case Analysis Workflow', ha='center', 
            fontsize=14, fontweight='bold')
    ax.text(5, 11.1, 'Hierarchical Summarization + Q&A', ha='center', 
            fontsize=10, style='italic', color='gray')
    
    # Step boxes
    steps = [
        (10.2, 'Input', 'Legal Case PDF\n(10-200 pages)', '#E3F2FD'),
        (9.4, 'Step 1', 'Load Document\nPyPDFLoader → Pages', '#BBDEFB'),
        (8.6, 'Step 2', 'Chunk Pages\n25 pages/chunk', '#90CAF9'),
        (7.8, 'Step 3', 'Generate Embeddings\nall-MiniLM-L6-v2\n384-dim vectors', '#64B5F6'),
        (7.0, 'Step 4', 'Create FAISS Index\nVector storage\nSave to cache', '#42A5F5'),
        (6.2, 'Step 5', 'Chunk Summarization\nLLM processes each chunk', '#FFF9C4'),
        (5.4, 'Step 6', 'Aggregate Summaries\nCombine chunk summaries', '#FFF59D'),
        (4.6, 'Step 7', 'Executive Summary\nFinal high-level overview', '#FFEE58'),
        (3.8, 'Output', 'Complete Summary\n+ Q&A Ready', '#C8E6C9'),
    ]
    
    for y, label, text, color in steps:
        box = FancyBboxPatch((2, y-0.35), 6, 0.7, 
                             boxstyle="round,pad=0.08", 
                             edgecolor='black', facecolor=color, linewidth=1.5)
        ax.add_patch(box)
        ax.text(2.3, y+0.15, label, fontsize=9, fontweight='bold')
        ax.text(5, y-0.05, text, ha='center', fontsize=8)
        
        # Arrow to next step
        if y > 4:
            arrow = FancyArrowPatch((5, y-0.4), (5, y-0.95),
                                   arrowstyle='->', mutation_scale=20, 
                                   linewidth=2, color='black')
            ax.add_patch(arrow)
    
    # Q&A Branch
    arrow = FancyArrowPatch((8, 7.0), (8.5, 6),
                           arrowstyle='->', mutation_scale=15, 
                           linewidth=1.5, color='purple', linestyle='dashed')
    ax.add_patch(arrow)
    
    qa_box = FancyBboxPatch((8.5, 5), 1.3, 2.5, 
                            boxstyle="round,pad=0.08", 
                            edgecolor='purple', facecolor='#F3E5F5', linewidth=1.5)
    ax.add_patch(qa_box)
    ax.text(9.15, 7.2, 'Q&A Mode', ha='center', fontsize=8, fontweight='bold', color='purple')
    ax.text(8.65, 6.9, '1. User query', fontsize=6)
    ax.text(8.65, 6.7, '2. Embed query', fontsize=6)
    ax.text(8.65, 6.5, '3. FAISS search', fontsize=6)
    ax.text(8.65, 6.3, '4. Top-3 chunks', fontsize=6)
    ax.text(8.65, 6.1, '5. Context prompt', fontsize=6)
    ax.text(8.65, 5.9, '6. LLM generate', fontsize=6)
    ax.text(8.65, 5.7, '7. Cite sources', fontsize=6)
    ax.text(8.65, 5.5, '8. Return answer', fontsize=6)
    ax.text(9.15, 5.2, '2-5 seconds', ha='center', fontsize=7, 
            color='green', fontweight='bold')
    
    # Timing annotations
    ax.text(1.2, 7.0, '30-60s\n(first time)', fontsize=7, color='red', 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#FFCDD2'))
    ax.text(1.2, 3.8, '<1s\n(cached)', fontsize=7, color='green', 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='lightgreen'))
    
    # Legend
    legend_y = 2.5
    ax.text(5, legend_y, 'Key Features:', ha='center', fontsize=9, fontweight='bold')
    features = [
        '✓ Hierarchical approach preserves context',
        '✓ Page-level citations in answers',
        '✓ Handles documents up to 200 pages',
        '✓ Cache enables instant subsequent access'
    ]
    y_pos = legend_y - 0.3
    for feat in features:
        ax.text(5, y_pos, feat, ha='center', fontsize=7)
        y_pos -= 0.25
    
    plt.tight_layout()
    plt.savefig('flow_case_analysis.png', dpi=300, bbox_inches='tight', facecolor='white')
    plt.savefig('flow_case_analysis.pdf', bbox_inches='tight', facecolor='white')
    print("✓ Case Analysis Flow saved")
    plt.close()

def create_contract_analysis_flow():
    """Contract Analysis Workflow"""
    fig, ax = plt.subplots(1, 1, figsize=(12, 10))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 10)
    ax.axis('off')
    
    ax.text(6, 9.5, 'Contract Analysis Workflow', ha='center', 
            fontsize=14, fontweight='bold')
    ax.text(6, 9.1, 'Detailed Clause-Level Analysis', ha='center', 
            fontsize=10, style='italic', color='gray')
    
    # Input
    input_box = FancyBboxPatch((4.5, 8.2), 3, 0.6, 
                               boxstyle="round,pad=0.08", 
                               edgecolor='black', facecolor='#E3F2FD', linewidth=2)
    ax.add_patch(input_box)
    ax.text(6, 8.6, 'Input: Contract PDF', ha='center', fontsize=10, fontweight='bold')
    
    # Arrow
    arrow = FancyArrowPatch((6, 8.2), (6, 7.8),
                           arrowstyle='->', mutation_scale=20, linewidth=2, color='black')
    ax.add_patch(arrow)
    
    # Processing
    process_box = FancyBboxPatch((0.5, 5.5), 5, 2, 
                                 boxstyle="round,pad=0.1", 
                                 edgecolor='orange', facecolor='#FFF9C4', linewidth=2)
    ax.add_patch(process_box)
    ax.text(3, 7.3, 'Fine-Grained Processing', ha='center', fontsize=10, fontweight='bold')
    ax.text(0.7, 7, '1. Load PDF', fontsize=8)
    ax.text(0.7, 6.75, '2. Chunk: 2 pages/chunk', fontsize=8)
    ax.text(0.7, 6.5, '3. Per-Chunk Analysis:', fontsize=8, fontweight='bold')
    
    analyses = [
        'Parties & Roles',
        'Key Terms & Definitions',
        'Financial Obligations',
        'Risks & Liabilities',
        'Termination Clauses',
        'IP Rights',
        'Confidentiality',
        'Dispute Resolution'
    ]
    
    y_pos = 6.25
    for analysis in analyses:
        ax.text(1, y_pos, f'  • {analysis}', fontsize=7)
        y_pos -= 0.18
    
    # Arrow to aggregation
    arrow = FancyArrowPatch((5.5, 6.5), (6.5, 6.5),
                           arrowstyle='->', mutation_scale=20, linewidth=2, color='black')
    ax.add_patch(arrow)
    
    # Aggregation
    agg_box = FancyBboxPatch((6.5, 5.5), 5, 2, 
                             boxstyle="round,pad=0.1", 
                             edgecolor='green', facecolor='#C8E6C9', linewidth=2)
    ax.add_patch(agg_box)
    ax.text(9, 7.3, 'Aggregation & Scoring', ha='center', fontsize=10, fontweight='bold')
    ax.text(6.7, 7, '4. Combine chunk analyses', fontsize=8)
    ax.text(6.7, 6.75, '5. Extract consolidated data:', fontsize=8, fontweight='bold')
    
    outputs = [
        'All parties identified',
        'Complete term list',
        'Financial summary',
        'Comprehensive risk assessment',
        'All critical clauses',
        'Missing provisions flagged'
    ]
    
    y_pos = 6.5
    for output in outputs:
        ax.text(7, y_pos, f'  • {output}', fontsize=7)
        y_pos -= 0.18
    
    ax.text(6.7, 5.75, '6. Calculate Risk Score (1-10)', fontsize=8, 
            color='red', fontweight='bold')
    
    # Arrow to outputs
    arrow = FancyArrowPatch((9, 5.5), (9, 4.8),
                           arrowstyle='->', mutation_scale=20, linewidth=2, color='black')
    ax.add_patch(arrow)
    
    # Output section
    ax.text(6, 4.5, 'Output: 16-Section Comprehensive Report', ha='center', 
            fontsize=11, fontweight='bold', color='#1976D2')
    
    # Two-column output
    sections_left = [
        '1. Executive Summary',
        '2. Risk Score & Analysis',
        '3. Parties & Roles',
        '4. Contract Overview',
        '5. Key Terms',
        '6. Financial Terms',
        '7. Payment Obligations',
        '8. Delivery Terms'
    ]
    
    sections_right = [
        '9. Warranties & Representations',
        '10. Liabilities & Indemnities',
        '11. Termination Provisions',
        '12. IP & Confidentiality',
        '13. Dispute Resolution',
        '14. Compliance Requirements',
        '15. Missing Provisions',
        '16. Recommendations'
    ]
    
    # Left column
    left_box = FancyBboxPatch((0.5, 1), 5.5, 3, 
                              boxstyle="round,pad=0.08", 
                              edgecolor='#1976D2', facecolor='#E3F2FD', linewidth=1.5)
    ax.add_patch(left_box)
    y_pos = 3.8
    for section in sections_left:
        ax.text(0.7, y_pos, section, fontsize=7)
        y_pos -= 0.32
    
    # Right column
    right_box = FancyBboxPatch((6, 1), 5.5, 3, 
                               boxstyle="round,pad=0.08", 
                               edgecolor='#1976D2', facecolor='#E3F2FD', linewidth=1.5)
    ax.add_patch(right_box)
    y_pos = 3.8
    for section in sections_right:
        ax.text(6.2, y_pos, section, fontsize=7)
        y_pos -= 0.32
    
    # Performance note
    perf_box = FancyBboxPatch((2, 0.2), 8, 0.5, 
                              boxstyle="round,pad=0.08", 
                              edgecolor='purple', facecolor='#F3E5F5', linewidth=1.5)
    ax.add_patch(perf_box)
    ax.text(6, 0.55, '⏱️ Processing Time: 1-5 minutes  |  💰 Cost: ~$0.10-0.15 per contract', 
            ha='center', fontsize=8, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('flow_contract_analysis.png', dpi=300, bbox_inches='tight', facecolor='white')
    plt.savefig('flow_contract_analysis.pdf', bbox_inches='tight', facecolor='white')
    print("✓ Contract Analysis Flow saved")
    plt.close()

# Generate all flow diagrams
if __name__ == "__main__":
    create_case_analysis_flow()
    create_contract_analysis_flow()
    print("\n✓ All process flow diagrams generated!")
