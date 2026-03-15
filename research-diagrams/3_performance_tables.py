"""
Performance Tables Generator
Creates publication-ready tables for the research paper
"""

import matplotlib.pyplot as plt
import numpy as np

def create_performance_metrics_table():
    """Table 1: System Performance Metrics"""
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.axis('tight')
    ax.axis('off')
    
    # Title
    fig.suptitle('TABLE I\nSYSTEM PERFORMANCE METRICS', 
                 fontsize=14, fontweight='bold', y=0.98)
    
    # Table data
    data = [
        ['Metric Category', 'Measurement', 'Value', 'Notes'],
        ['Embedding Generation', 'Time per chunk (CPU)', '0.3 seconds', 'Local processing'],
        ['', 'Memory usage', '~200 MB RAM', 'Stable during operation'],
        ['', 'Storage per 100 chunks', '~500 KB', 'FAISS index size'],
        ['', '', '', ''],
        ['Vector Search', 'Retrieval time (1000+ chunks)', '<10 ms', 'Top-3 search'],
        ['', 'Search accuracy', '95%', 'vs. exact search'],
        ['', 'Scalability', '10,000+ chunks', 'Efficient handling'],
        ['', '', '', ''],
        ['Document Processing', 'First load (embedding + summary)', '30-60 seconds', 'Document size dependent'],
        ['', 'Cached load', '<1 second', 'Sub-second response'],
        ['', 'Contract analysis', '1-5 minutes', 'Comprehensive analysis'],
        ['', '', '', ''],
        ['Q&A Response Time', 'Average (retrieval + generation)', '2-5 seconds', 'End-to-end'],
        ['', '95th percentile', '8 seconds', ''],
        ['', '99th percentile', '12 seconds', ''],
        ['', '', '', ''],
        ['Accuracy (100 Q&A pairs)', 'Accurate and complete', '87%', 'Expert evaluation'],
        ['', 'Partially accurate', '10%', 'Missing details'],
        ['', 'Inaccurate', '3%', 'Hallucination/errors'],
        ['', '', '', ''],
        ['Source Citation', 'Correct page references', '95%', 'Exact matches'],
        ['', 'Adjacent pages (±2)', '5%', 'Near matches'],
    ]
    
    # Create table
    table = ax.table(cellText=data, cellLoc='left', loc='center',
                     bbox=[0, 0, 1, 1])
    
    # Style the table
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    
    # Header row styling
    for i in range(4):
        cell = table[(0, i)]
        cell.set_facecolor('#4A90E2')
        cell.set_text_props(weight='bold', color='white')
        cell.set_height(0.05)
    
    # Category rows (bold)
    category_rows = [1, 5, 9, 13, 17, 21]
    for row in category_rows:
        cell = table[(row, 0)]
        cell.set_text_props(weight='bold')
        cell.set_facecolor('#E8F4F8')
    
    # Empty rows (separators)
    empty_rows = [4, 8, 12, 16, 20]
    for row in empty_rows:
        for col in range(4):
            cell = table[(row, col)]
            cell.set_facecolor('#F0F0F0')
            cell.set_height(0.02)
    
    # Adjust column widths
    table.auto_set_column_width([0, 1, 2, 3])
    for i in range(len(data)):
        table[(i, 0)].set_width(0.25)
        table[(i, 1)].set_width(0.35)
        table[(i, 2)].set_width(0.15)
        table[(i, 3)].set_width(0.25)
    
    plt.savefig('table_performance_metrics.png', dpi=300, bbox_inches='tight', 
                facecolor='white', pad_inches=0.1)
    plt.savefig('table_performance_metrics.pdf', bbox_inches='tight', 
                facecolor='white', pad_inches=0.1)
    print("✓ Performance Metrics Table saved")
    plt.close()

def create_comparison_table():
    """Table 2: RAG vs Standalone LLM Comparison"""
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.axis('tight')
    ax.axis('off')
    
    # Title
    fig.suptitle('TABLE II\nRAG vs STANDALONE LLM COMPARISON', 
                 fontsize=14, fontweight='bold', y=0.95)
    
    # Table data
    data = [
        ['Metric', 'RAG System\n(Our Approach)', 'Standalone LLM\n(Gemini 2.5 Flash)', 'Improvement'],
        ['Hallucination Rate', '3%', '15%', '80% reduction'],
        ['Verifiable Claims', '97%', '60%', '+37%'],
        ['Source Citation', 'Yes (page numbers)', 'No', '✓'],
        ['Document Grounding', 'Yes (retrieved chunks)', 'No (parametric only)', '✓'],
        ['Accuracy (expert eval.)', '87% accurate', '65% accurate', '+22%'],
        ['Response Time', '2-5 seconds', '1-2 seconds', '-3s (acceptable)'],
        ['Cost per Query', '~$0.01', '~$0.005', '2× (justified)'],
        ['Traceability', 'Full (chunk + page)', 'None', '✓'],
        ['Context Limit', 'Unlimited (retrieval)', '32K tokens', 'Scalable'],
        ['Update Frequency', 'Per document', 'Model retraining', 'Dynamic'],
    ]
    
    # Create table
    table = ax.table(cellText=data, cellLoc='center', loc='center',
                     bbox=[0, 0, 1, 1])
    
    # Style the table
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    
    # Header row styling
    for i in range(4):
        cell = table[(0, i)]
        cell.set_facecolor('#2E7D32')
        cell.set_text_props(weight='bold', color='white')
        cell.set_height(0.12)
    
    # Alternate row colors
    for i in range(1, len(data)):
        color = '#E8F5E9' if i % 2 == 0 else 'white'
        for j in range(4):
            cell = table[(i, j)]
            cell.set_facecolor(color)
            cell.set_height(0.08)
    
    # Highlight improvement column
    for i in range(1, len(data)):
        cell = table[(i, 3)]
        if '+' in str(data[i][3]) or 'reduction' in str(data[i][3]) or '✓' in str(data[i][3]):
            cell.set_text_props(weight='bold', color='green')
        elif '-' in str(data[i][3]):
            cell.set_text_props(color='orange')
    
    # Adjust column widths
    for i in range(len(data)):
        table[(i, 0)].set_width(0.25)
        table[(i, 1)].set_width(0.25)
        table[(i, 2)].set_width(0.25)
        table[(i, 3)].set_width(0.25)
    
    plt.savefig('table_rag_comparison.png', dpi=300, bbox_inches='tight', 
                facecolor='white', pad_inches=0.1)
    plt.savefig('table_rag_comparison.pdf', bbox_inches='tight', 
                facecolor='white', pad_inches=0.1)
    print("✓ RAG Comparison Table saved")
    plt.close()

def create_cost_analysis_table():
    """Table 3: Cost Analysis"""
    fig, ax = plt.subplots(figsize=(12, 5))
    ax.axis('tight')
    ax.axis('off')
    
    # Title
    fig.suptitle('TABLE III\nCOST ANALYSIS (1000 Documents)', 
                 fontsize=14, fontweight='bold', y=0.93)
    
    # Table data
    data = [
        ['Component', 'Traditional\n(API Embeddings)', 'Our Approach\n(Local Embeddings)', 'Savings'],
        ['Embedding Generation', '$500', '$0 (local CPU)', '$500'],
        ['Vector Storage', '$50/month', '$0 (local disk)', '$50/month'],
        ['LLM Summarization', '$100', '$100', '$0'],
        ['Q&A Queries (10/doc)', '$100', '$100', '$0'],
        ['Infrastructure', '$100/month', '$20/month', '$80/month'],
        ['Total First Month', '$850', '$120', '$730 (86%)'],
        ['Total Ongoing (monthly)', '$250/month', '$120/month', '$130 (52%)'],
    ]
    
    # Create table
    table = ax.table(cellText=data, cellLoc='center', loc='center',
                     bbox=[0, 0, 1, 1])
    
    # Style the table
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    
    # Header row styling
    for i in range(4):
        cell = table[(0, i)]
        cell.set_facecolor('#F57C00')
        cell.set_text_props(weight='bold', color='white')
        cell.set_height(0.15)
    
    # Total rows
    for row in [6, 7]:
        for col in range(4):
            cell = table[(row, col)]
            cell.set_facecolor('#FFF3E0')
            cell.set_text_props(weight='bold')
    
    # Savings column
    for i in range(1, len(data)):
        cell = table[(i, 3)]
        cell.set_text_props(weight='bold', color='green')
    
    # Adjust column widths
    for i in range(len(data)):
        table[(i, 0)].set_width(0.30)
        table[(i, 1)].set_width(0.25)
        table[(i, 2)].set_width(0.25)
        table[(i, 3)].set_width(0.20)
    
    plt.savefig('table_cost_analysis.png', dpi=300, bbox_inches='tight', 
                facecolor='white', pad_inches=0.1)
    plt.savefig('table_cost_analysis.pdf', bbox_inches='tight', 
                facecolor='white', pad_inches=0.1)
    print("✓ Cost Analysis Table saved")
    plt.close()

# Generate all tables
if __name__ == "__main__":
    create_performance_metrics_table()
    create_comparison_table()
    create_cost_analysis_table()
    print("\n✓ All tables generated successfully!")
