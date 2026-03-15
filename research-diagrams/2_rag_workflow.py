"""
RAG Workflow Diagram Generator
Creates the complete RAG pipeline visualization
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle
import numpy as np

fig, ax = plt.subplots(1, 1, figsize=(16, 10))
ax.set_xlim(0, 16)
ax.set_ylim(0, 10)
ax.axis('off')

# Title
ax.text(8, 9.5, 'Retrieval-Augmented Generation (RAG) Workflow', 
        ha='center', va='top', fontsize=16, fontweight='bold')
ax.text(8, 9.1, 'End-to-End Pipeline for Legal Document Analysis', 
        ha='center', va='top', fontsize=11, style='italic', color='gray')

# Define colors
color_input = '#E8F4F8'
color_process = '#FFF4E6'
color_embedding = '#E8F5E9'
color_vector = '#F3E5F5'
color_query = '#FFF9C4'
color_output = '#FFEBEE'

# ========== STAGE 1: Document Ingestion ==========
y_base = 8
stage1_box = FancyBboxPatch((0.3, y_base-0.8), 2.8, 1.5, 
                            boxstyle="round,pad=0.1", 
                            edgecolor='#2196F3', facecolor=color_input, 
                            linewidth=2)
ax.add_patch(stage1_box)

ax.text(1.7, y_base+0.5, '1. Document Ingestion', ha='center', 
        fontsize=10, fontweight='bold', color='#1976D2')
ax.text(1.7, y_base+0.15, 'Input: PDF File', ha='center', fontsize=8)
ax.text(0.5, y_base-0.15, '• PyPDFLoader', fontsize=7)
ax.text(0.5, y_base-0.35, '• Page extraction', fontsize=7)
ax.text(0.5, y_base-0.55, '• Metadata preservation', fontsize=7)

# Arrow 1->2
arrow = FancyArrowPatch((3.2, y_base), (3.8, y_base),
                       arrowstyle='->', mutation_scale=25, 
                       linewidth=2.5, color='black')
ax.add_patch(arrow)

# ========== STAGE 2: Text Chunking ==========
stage2_box = FancyBboxPatch((3.8, y_base-0.8), 2.8, 1.5, 
                            boxstyle="round,pad=0.1", 
                            edgecolor='#FF9800', facecolor=color_process, 
                            linewidth=2)
ax.add_patch(stage2_box)

ax.text(5.2, y_base+0.5, '2. Text Chunking', ha='center', 
        fontsize=10, fontweight='bold', color='#F57C00')
ax.text(5.2, y_base+0.15, 'Strategy Selection', ha='center', fontsize=8)
ax.text(4.0, y_base-0.15, '• Case: 25 pages/chunk', fontsize=7)
ax.text(4.0, y_base-0.35, '• Contract: 2 pages/chunk', fontsize=7)
ax.text(4.0, y_base-0.55, '• Metadata tagging', fontsize=7)

# Arrow 2->3
arrow = FancyArrowPatch((6.7, y_base), (7.3, y_base),
                       arrowstyle='->', mutation_scale=25, 
                       linewidth=2.5, color='black')
ax.add_patch(arrow)

# ========== STAGE 3: Embedding Generation ==========
stage3_box = FancyBboxPatch((7.3, y_base-0.8), 2.8, 1.5, 
                            boxstyle="round,pad=0.1", 
                            edgecolor='#4CAF50', facecolor=color_embedding, 
                            linewidth=2)
ax.add_patch(stage3_box)

ax.text(8.7, y_base+0.5, '3. Embedding Generation', ha='center', 
        fontsize=10, fontweight='bold', color='#388E3C')
ax.text(8.7, y_base+0.15, 'all-MiniLM-L6-v2 (Local)', ha='center', fontsize=8)
ax.text(7.5, y_base-0.15, '• 384-dim vectors', fontsize=7)
ax.text(7.5, y_base-0.35, '• CPU processing', fontsize=7)
ax.text(7.5, y_base-0.55, '• Zero cost', fontsize=7, color='green', fontweight='bold')

# Arrow 3->4
arrow = FancyArrowPatch((10.2, y_base), (10.8, y_base),
                       arrowstyle='->', mutation_scale=25, 
                       linewidth=2.5, color='black')
ax.add_patch(arrow)

# ========== STAGE 4: Vector Store Creation ==========
stage4_box = FancyBboxPatch((10.8, y_base-0.8), 2.8, 1.5, 
                            boxstyle="round,pad=0.1", 
                            edgecolor='#9C27B0', facecolor=color_vector, 
                            linewidth=2)
ax.add_patch(stage4_box)

ax.text(12.2, y_base+0.5, '4. Vector Indexing', ha='center', 
        fontsize=10, fontweight='bold', color='#7B1FA2')
ax.text(12.2, y_base+0.15, 'FAISS Database', ha='center', fontsize=8)
ax.text(11.0, y_base-0.15, '• IndexFlatIP', fontsize=7)
ax.text(11.0, y_base-0.35, '• <10ms retrieval', fontsize=7, color='green')
ax.text(11.0, y_base-0.55, '• Disk persistence', fontsize=7)

# Arrow 4->5 (downward)
arrow = FancyArrowPatch((13.7, y_base-0.9), (13.7, y_base-1.5),
                       arrowstyle='->', mutation_scale=25, 
                       linewidth=2.5, color='black')
ax.add_patch(arrow)

# ========== STAGE 5: Summarization (Optional Path) ==========
y_base2 = 5.5
stage5_box = FancyBboxPatch((10.8, y_base2-0.8), 2.8, 1.5, 
                            boxstyle="round,pad=0.1", 
                            edgecolor='#FF5722', facecolor='#FFE0B2', 
                            linewidth=2)
ax.add_patch(stage5_box)

ax.text(12.2, y_base2+0.5, '5. Summarization', ha='center', 
        fontsize=10, fontweight='bold', color='#E64A19')
ax.text(12.2, y_base2+0.15, 'Hierarchical Process', ha='center', fontsize=8)
ax.text(11.0, y_base2-0.15, '• Chunk summaries', fontsize=7)
ax.text(11.0, y_base2-0.35, '• Aggregate summaries', fontsize=7)
ax.text(11.0, y_base2-0.55, '• Executive summary', fontsize=7)

# ========== QUERY PATH ==========
y_query = 5.5

# Query Input
query_box = FancyBboxPatch((0.3, y_query-0.6), 2.3, 1.1, 
                           boxstyle="round,pad=0.1", 
                           edgecolor='#FFC107', facecolor=color_query, 
                           linewidth=2)
ax.add_patch(query_box)

ax.text(1.45, y_query+0.3, 'User Query', ha='center', 
        fontsize=10, fontweight='bold', color='#F57F17')
ax.text(1.45, y_query-0.05, '"What is the judgment?"', ha='center', 
        fontsize=8, style='italic')
ax.text(1.45, y_query-0.35, 'Convert to embedding ➜', ha='center', fontsize=7)

# Arrow Query -> Retrieval
arrow = FancyArrowPatch((2.7, y_query), (3.3, y_query),
                       arrowstyle='->', mutation_scale=25, 
                       linewidth=2.5, color='black')
ax.add_patch(arrow)

# Retrieval
retrieval_box = FancyBboxPatch((3.3, y_query-0.6), 3, 1.1, 
                               boxstyle="round,pad=0.1", 
                               edgecolor='#9C27B0', facecolor=color_vector, 
                               linewidth=2)
ax.add_patch(retrieval_box)

ax.text(4.8, y_query+0.3, 'Similarity Search', ha='center', 
        fontsize=10, fontweight='bold', color='#7B1FA2')
ax.text(4.8, y_query-0.05, 'FAISS: Top-K Retrieval', ha='center', fontsize=8)
ax.text(3.5, y_query-0.4, 'K=3 most similar chunks', fontsize=7)

# Arrow Retrieval -> Context
arrow = FancyArrowPatch((6.4, y_query), (7.0, y_query),
                       arrowstyle='->', mutation_scale=25, 
                       linewidth=2.5, color='black')
ax.add_patch(arrow)

# Context Construction
context_box = FancyBboxPatch((7.0, y_query-0.6), 3, 1.1, 
                             boxstyle="round,pad=0.1", 
                             edgecolor='#03A9F4', facecolor='#E1F5FE', 
                             linewidth=2)
ax.add_patch(context_box)

ax.text(8.5, y_query+0.3, 'Context Construction', ha='center', 
        fontsize=10, fontweight='bold', color='#0277BD')
ax.text(7.2, y_query-0.05, '• Chunk 1 (Pages 1-25)', fontsize=7)
ax.text(7.2, y_query-0.25, '• Chunk 2 (Pages 26-50)', fontsize=7)
ax.text(7.2, y_query-0.45, '• Chunk 3 (Pages 51-75)', fontsize=7)

# ========== STAGE 6: LLM Generation ==========
y_llm = 3.5
stage6_box = FancyBboxPatch((3.5, y_llm-0.9), 6.5, 1.8, 
                            boxstyle="round,pad=0.1", 
                            edgecolor='#F44336', facecolor=color_output, 
                            linewidth=2.5)
ax.add_patch(stage6_box)

ax.text(6.75, y_llm+0.7, '6. LLM Answer Generation', ha='center', 
        fontsize=11, fontweight='bold', color='#C62828')
ax.text(6.75, y_llm+0.35, 'Gemini 2.5 Flash (Cloud API)', ha='center', 
        fontsize=9, style='italic')

# LLM Process
ax.text(3.7, y_llm, 'Input:', fontsize=8, fontweight='bold')
ax.text(3.7, y_llm-0.2, '• Retrieved context chunks', fontsize=7)
ax.text(3.7, y_llm-0.35, '• User query', fontsize=7)
ax.text(3.7, y_llm-0.5, '• System instructions', fontsize=7)
ax.text(3.7, y_llm-0.65, '• Temperature: 0.2-0.3', fontsize=7)

ax.text(6.5, y_llm, 'Output:', fontsize=8, fontweight='bold')
ax.text(6.5, y_llm-0.2, '• Grounded answer', fontsize=7)
ax.text(6.5, y_llm-0.35, '• Source citations', fontsize=7)
ax.text(6.5, y_llm-0.5, '• Page references', fontsize=7)
ax.text(6.5, y_llm-0.65, '• Formatted response', fontsize=7)

# Arrow Context -> LLM
arrow = FancyArrowPatch((8.5, y_query-0.7), (7.5, y_llm+1.0),
                       arrowstyle='->', mutation_scale=25, 
                       linewidth=2.5, color='black')
ax.add_patch(arrow)

# Arrow LLM -> Final Output
arrow = FancyArrowPatch((6.75, y_llm-1.0), (6.75, y_llm-1.6),
                       arrowstyle='->', mutation_scale=25, 
                       linewidth=2.5, color='black')
ax.add_patch(arrow)

# ========== FINAL OUTPUT ==========
output_box = FancyBboxPatch((3, 0.3), 7.5, 1.2, 
                            boxstyle="round,pad=0.1", 
                            edgecolor='#4CAF50', facecolor='#E8F5E9', 
                            linewidth=2.5)
ax.add_patch(output_box)

ax.text(6.75, 1.2, '✓ Final Response to User', ha='center', 
        fontsize=11, fontweight='bold', color='#2E7D32')
ax.text(6.75, 0.85, 'Accurate • Traceable • Reduced Hallucination', 
        ha='center', fontsize=9, style='italic', color='#388E3C')
ax.text(3.2, 0.55, '• Answer grounded in document', fontsize=7)
ax.text(3.2, 0.35, '• Citations to page numbers', fontsize=7)
ax.text(6.2, 0.55, '• Verifiable claims', fontsize=7)
ax.text(6.2, 0.35, '• No hallucination', fontsize=7)
ax.text(8.8, 0.55, '• Response time: 2-5s', fontsize=7)
ax.text(8.8, 0.35, '• Cost: ~$0.01/query', fontsize=7)

# ========== KEY ADVANTAGES CALLOUTS ==========
# Callout 1: Local Embeddings
ax.annotate('FREE!\nNo API Cost', xy=(8.7, y_base-0.3), xytext=(10, 7),
            fontsize=8, color='green', fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.5', facecolor='lightgreen', alpha=0.8),
            arrowprops=dict(arrowstyle='->', lw=1.5, color='green'))

# Callout 2: Fast Retrieval
ax.annotate('<10ms\nRetrieval', xy=(12.2, y_base-0.3), xytext=(14, 7.2),
            fontsize=8, color='purple', fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.5', facecolor='plum', alpha=0.8),
            arrowprops=dict(arrowstyle='->', lw=1.5, color='purple'))

# Callout 3: Accuracy
ax.annotate('95% Search\nAccuracy', xy=(4.8, y_query), xytext=(1.5, 3.8),
            fontsize=8, color='blue', fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.5', facecolor='lightblue', alpha=0.8),
            arrowprops=dict(arrowstyle='->', lw=1.5, color='blue'))

plt.tight_layout()
plt.savefig('rag_workflow.png', dpi=300, bbox_inches='tight', facecolor='white')
plt.savefig('rag_workflow.pdf', bbox_inches='tight', facecolor='white')
print("✓ RAG Workflow diagram saved: rag_workflow.png & .pdf")
plt.close()
