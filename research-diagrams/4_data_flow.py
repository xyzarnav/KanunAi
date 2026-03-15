"""
Data Flow Diagram Generator
Shows the complete request-response flow with caching
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Polygon
import numpy as np

fig, ax = plt.subplots(1, 1, figsize=(14, 11))
ax.set_xlim(0, 14)
ax.set_ylim(0, 11)
ax.axis('off')

# Title
ax.text(7, 10.5, 'Complete Data Flow: Request to Response', 
        ha='center', va='top', fontsize=15, fontweight='bold')
ax.text(7, 10.1, 'With Multi-Level Caching Strategy', 
        ha='center', va='top', fontsize=11, style='italic', color='gray')

# Colors
color_user = '#E3F2FD'
color_frontend = '#BBDEFB'
color_backend = '#C8E6C9'
color_ai = '#FFF9C4'
color_cache = '#FFE0B2'
color_db = '#F8BBD0'

# ========== ACTORS ==========
# User
user_circle = plt.Circle((1, 9), 0.4, color='#2196F3', ec='black', linewidth=2)
ax.add_patch(user_circle)
ax.text(1, 9, '👤', ha='center', va='center', fontsize=30)
ax.text(1, 8.3, 'User', ha='center', fontweight='bold', fontsize=10)

# ========== STEP 1: Upload Document ==========
step = 1
y = 8.7
# Arrow user -> frontend
arrow = FancyArrowPatch((1.5, 9), (2.5, 8.5),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2, color='black')
ax.add_patch(arrow)
ax.text(2, 9.2, f'{step}. Upload PDF', fontsize=8, 
        bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7))

# Frontend
frontend_box = FancyBboxPatch((2.5, 8), 2, 1, 
                              boxstyle="round,pad=0.08", 
                              edgecolor='#1976D2', facecolor=color_frontend, 
                              linewidth=2)
ax.add_patch(frontend_box)
ax.text(3.5, 8.7, 'Frontend', ha='center', fontweight='bold', fontsize=9)
ax.text(3.5, 8.45, 'Next.js', ha='center', fontsize=8)
ax.text(3.5, 8.2, 'React UI', ha='center', fontsize=7, style='italic')

# ========== STEP 2: Forward to Backend ==========
step = 2
arrow = FancyArrowPatch((4.5, 8.5), (5.5, 8.5),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2, color='black')
ax.add_patch(arrow)
ax.text(5, 8.8, f'{step}. POST /analyze', fontsize=8, 
        bbox=dict(boxstyle='round,pad=0.3', facecolor='lightgreen', alpha=0.7))

# Backend
backend_box = FancyBboxPatch((5.5, 8), 2, 1, 
                             boxstyle="round,pad=0.08", 
                             edgecolor='#388E3C', facecolor=color_backend, 
                             linewidth=2)
ax.add_patch(backend_box)
ax.text(6.5, 8.7, 'Backend', ha='center', fontweight='bold', fontsize=9)
ax.text(6.5, 8.45, 'Express.js', ha='center', fontsize=8)
ax.text(6.5, 8.2, 'REST API', ha='center', fontsize=7, style='italic')

# ========== STEP 3: Validate & Store ==========
step = 3
arrow = FancyArrowPatch((6.5, 8), (6.5, 7.3),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2, color='black')
ax.add_patch(arrow)
ax.text(7.2, 7.6, f'{step}. Validate file\n     Store temp', fontsize=7, 
        bbox=dict(boxstyle='round,pad=0.3', facecolor='lightyellow', alpha=0.7))

# File Storage
storage_box = FancyBboxPatch((5.8, 6.5), 1.4, 0.7, 
                             boxstyle="round,pad=0.05", 
                             edgecolor='gray', facecolor='#F5F5F5', 
                             linewidth=1.5)
ax.add_patch(storage_box)
ax.text(6.5, 7, '📄 /uploads/', ha='center', fontsize=8)
ax.text(6.5, 6.75, 'Temp Files', ha='center', fontsize=7, style='italic')

# ========== STEP 4: Spawn Python Process ==========
step = 4
arrow = FancyArrowPatch((7.5, 8.5), (9, 8.5),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2, color='black')
ax.add_patch(arrow)
ax.text(8.3, 8.8, f'{step}. spawn(python)', fontsize=8, 
        bbox=dict(boxstyle='round,pad=0.3', facecolor='orange', alpha=0.7))

# AI Service
ai_box = FancyBboxPatch((9, 7.8), 2.5, 1.4, 
                        boxstyle="round,pad=0.08", 
                        edgecolor='#F57C00', facecolor=color_ai, 
                        linewidth=2)
ax.add_patch(ai_box)
ax.text(10.25, 9, 'AI Service', ha='center', fontweight='bold', fontsize=9)
ax.text(10.25, 8.7, 'Python', ha='center', fontsize=8)
ax.text(9.2, 8.45, '• PyPDFLoader', fontsize=7)
ax.text(9.2, 8.25, '• LangChain', fontsize=7)
ax.text(9.2, 8.05, '• FAISS', fontsize=7)

# ========== DECISION: Check Cache ==========
step = 5
arrow = FancyArrowPatch((10.25, 7.8), (10.25, 7),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2, color='black')
ax.add_patch(arrow)

# Decision diamond
diamond_points = np.array([[10.25, 6.5], [11, 6], [10.25, 5.5], [9.5, 6]])
diamond = Polygon(diamond_points, closed=True, 
                  edgecolor='purple', facecolor='#E1BEE7', linewidth=2)
ax.add_patch(diamond)
ax.text(10.25, 6.15, f'{step}. Cache\nExists?', ha='center', fontsize=8, fontweight='bold')

# ========== PATH A: Cache Hit (Fast) ==========
# Arrow: YES -> Cache
arrow = FancyArrowPatch((11, 6), (12.2, 6),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2.5, color='green')
ax.add_patch(arrow)
ax.text(11.6, 6.3, 'YES', fontsize=8, fontweight='bold', color='green')

# Cache box
cache_box = FancyBboxPatch((12.2, 5.5), 1.5, 1, 
                           boxstyle="round,pad=0.08", 
                           edgecolor='green', facecolor=color_cache, 
                           linewidth=2)
ax.add_patch(cache_box)
ax.text(13, 6.2, '⚡ Cache', ha='center', fontweight='bold', fontsize=9, color='green')
ax.text(13, 5.95, 'Load:', fontsize=7)
ax.text(13, 5.75, '• .pkl files', fontsize=6)
ax.text(13, 5.6, '• FAISS index', fontsize=6)

# Fast response
arrow = FancyArrowPatch((12.2, 6), (11.5, 4.5),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2.5, color='green', linestyle='dashed')
ax.add_patch(arrow)
ax.text(12.5, 5, '<1 sec', fontsize=8, color='green', fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.3', facecolor='lightgreen'))

# ========== PATH B: Cache Miss (Slow) ==========
# Arrow: NO -> Processing
arrow = FancyArrowPatch((10.25, 5.5), (10.25, 4.8),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2.5, color='red')
ax.add_patch(arrow)
ax.text(10.6, 5.2, 'NO', fontsize=8, fontweight='bold', color='red')

# Processing steps box
process_box = FancyBboxPatch((8.5, 3.2), 3.5, 1.5, 
                             boxstyle="round,pad=0.08", 
                             edgecolor='red', facecolor='#FFEBEE', 
                             linewidth=2)
ax.add_patch(process_box)
ax.text(10.25, 4.5, '⏳ Full Processing', ha='center', fontweight='bold', 
        fontsize=9, color='red')

# Processing steps
steps_text = [
    'a) Load PDF (PyPDFLoader)',
    'b) Chunk text (25 pages)',
    'c) Generate embeddings',
    'd) Create FAISS index',
    'e) Summarize (LLM)',
    'f) Save to cache'
]
y_pos = 4.15
for text in steps_text:
    ax.text(8.7, y_pos, text, fontsize=7)
    y_pos -= 0.2

ax.text(10.25, 3.4, '30-60 seconds', fontsize=8, color='red', fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.3', facecolor='#FFCDD2'))

# Save to cache
arrow = FancyArrowPatch((12, 4), (13, 5.5),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2, color='orange', linestyle='dotted')
ax.add_patch(arrow)
ax.text(12.2, 4.7, 'save', fontsize=7, color='orange')

# ========== CONVERGENCE: Return Results ==========
# Both paths merge
merge_box = FancyBboxPatch((9, 2), 2.5, 0.8, 
                           boxstyle="round,pad=0.08", 
                           edgecolor='blue', facecolor='#E3F2FD', 
                           linewidth=2)
ax.add_patch(merge_box)
ax.text(10.25, 2.55, '6. Format Response', ha='center', fontweight='bold', fontsize=9)
ax.text(10.25, 2.25, 'JSON (summary + index)', ha='center', fontsize=7, style='italic')

# Arrows to merge
arrow = FancyArrowPatch((10.25, 3.2), (10.25, 2.8),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2, color='black')
ax.add_patch(arrow)

arrow = FancyArrowPatch((11.5, 4.5), (10.8, 2.8),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2, color='green', linestyle='dashed')
ax.add_patch(arrow)

# ========== RETURN PATH ==========
# AI -> Backend
arrow = FancyArrowPatch((9, 2.4), (7.5, 2.4),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2, color='black')
ax.add_patch(arrow)
ax.text(8.3, 2.7, '7. Return JSON', fontsize=8, 
        bbox=dict(boxstyle='round,pad=0.3', facecolor='lightblue', alpha=0.7))

# Backend receive
backend_box2 = FancyBboxPatch((5.5, 2), 2, 0.8, 
                              boxstyle="round,pad=0.08", 
                              edgecolor='#388E3C', facecolor=color_backend, 
                              linewidth=2)
ax.add_patch(backend_box2)
ax.text(6.5, 2.5, 'Backend', ha='center', fontweight='bold', fontsize=9)
ax.text(6.5, 2.2, 'Cleanup temp files', ha='center', fontsize=7, style='italic')

# Backend -> Frontend
arrow = FancyArrowPatch((5.5, 2.4), (4.5, 2.4),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2, color='black')
ax.add_patch(arrow)
ax.text(5, 2.7, '8. HTTP Response', fontsize=8, 
        bbox=dict(boxstyle='round,pad=0.3', facecolor='lightgreen', alpha=0.7))

# Frontend receive
frontend_box2 = FancyBboxPatch((2.5, 2), 2, 0.8, 
                               boxstyle="round,pad=0.08", 
                               edgecolor='#1976D2', facecolor=color_frontend, 
                               linewidth=2)
ax.add_patch(frontend_box2)
ax.text(3.5, 2.5, 'Frontend', ha='center', fontweight='bold', fontsize=9)
ax.text(3.5, 2.2, 'Display results', ha='center', fontsize=7, style='italic')

# Frontend -> User
arrow = FancyArrowPatch((2.5, 2.4), (1.5, 2.4),
                       arrowstyle='->', mutation_scale=20, 
                       linewidth=2, color='black')
ax.add_patch(arrow)
ax.text(2, 2.7, '9. Render UI', fontsize=8, 
        bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7))

# User receives
user_box = FancyBboxPatch((0.3, 2), 1.4, 0.8, 
                          boxstyle="round,pad=0.08", 
                          edgecolor='#2196F3', facecolor=color_user, 
                          linewidth=2)
ax.add_patch(user_box)
ax.text(1, 2.6, '✓ User', ha='center', fontweight='bold', fontsize=9)
ax.text(1, 2.3, 'Views Results', ha='center', fontsize=8)
ax.text(1, 2.05, '+ Asks Questions', ha='center', fontsize=7, style='italic')

# ========== Q&A FLOW (Below) ==========
ax.text(7, 1.4, 'Interactive Q&A Flow (Post-Analysis)', ha='center', 
        fontsize=10, fontweight='bold', color='purple')

# Q&A arrow
qa_arrow = FancyArrowPatch((1.7, 2), (1.7, 0.5),
                          arrowstyle='<->', mutation_scale=20, 
                          linewidth=2.5, color='purple')
ax.add_patch(qa_arrow)

# Q&A details
qa_box = FancyBboxPatch((2.5, 0.3), 9, 0.8, 
                        boxstyle="round,pad=0.08", 
                        edgecolor='purple', facecolor='#F3E5F5', 
                        linewidth=1.5)
ax.add_patch(qa_box)
ax.text(7, 0.85, 'Query → Embed → FAISS Search (cached index) → Retrieve Top-3 → LLM Generate → Answer (2-5s)', 
        ha='center', fontsize=8)
ax.text(7, 0.55, 'Repeated queries use same cached vector store (no re-processing)', 
        ha='center', fontsize=7, style='italic', color='green')

plt.tight_layout()
plt.savefig('data_flow_diagram.png', dpi=300, bbox_inches='tight', facecolor='white')
plt.savefig('data_flow_diagram.pdf', bbox_inches='tight', facecolor='white')
print("✓ Data Flow Diagram saved: data_flow_diagram.png & .pdf")
plt.close()
