"""
System Architecture Diagram Generator
Creates a 3-tier architecture diagram for the research paper
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

# Set up the figure
fig, ax = plt.subplots(1, 1, figsize=(14, 10))
ax.set_xlim(0, 14)
ax.set_ylim(0, 10)
ax.axis('off')

# Define colors
color_frontend = '#4A90E2'
color_backend = '#50C878'
color_ai = '#F5A623'
color_db = '#9013FE'
color_ext = '#E94B3C'

# Title
ax.text(7, 9.5, 'AI-Powered Virtual Legal Assistant\nSystem Architecture', 
        ha='center', va='top', fontsize=16, fontweight='bold')

# ===== Frontend Layer =====
frontend_box = FancyBboxPatch((0.5, 6.5), 3.5, 2.5, 
                              boxstyle="round,pad=0.1", 
                              edgecolor=color_frontend, 
                              facecolor=color_frontend, alpha=0.3, linewidth=2)
ax.add_patch(frontend_box)

ax.text(2.25, 8.6, 'Frontend Layer', ha='center', fontsize=12, fontweight='bold', color=color_frontend)
ax.text(2.25, 8.2, 'Next.js 15 + React 19', ha='center', fontsize=9)

# Frontend components
components = [
    'Document Upload (Drag & Drop)',
    'Analysis Results Viewer',
    'Interactive Chatbot',
    'Timeline Visualization',
    'Contract Report Viewer'
]
y_pos = 7.7
for comp in components:
    ax.text(0.7, y_pos, f'• {comp}', fontsize=8, va='top')
    y_pos -= 0.28

# ===== Backend Layer =====
backend_box = FancyBboxPatch((5, 6.5), 4, 2.5, 
                             boxstyle="round,pad=0.1", 
                             edgecolor=color_backend, 
                             facecolor=color_backend, alpha=0.3, linewidth=2)
ax.add_patch(backend_box)

ax.text(7, 8.6, 'Backend Layer', ha='center', fontsize=12, fontweight='bold', color=color_backend)
ax.text(7, 8.2, 'Express.js + TypeScript', ha='center', fontsize=9)

backend_components = [
    'File Upload (Multer)',
    'REST API Endpoints',
    'Python Process Manager',
    'Session Management',
    'Security Middleware',
    'Caching Coordinator'
]
y_pos = 7.7
for comp in backend_components:
    ax.text(5.2, y_pos, f'• {comp}', fontsize=8, va='top')
    y_pos -= 0.28

# ===== AI Service Layer =====
ai_box = FancyBboxPatch((10, 6.5), 3.5, 2.5, 
                        boxstyle="round,pad=0.1", 
                        edgecolor=color_ai, 
                        facecolor=color_ai, alpha=0.3, linewidth=2)
ax.add_patch(ai_box)

ax.text(11.75, 8.6, 'AI Service Layer', ha='center', fontsize=12, fontweight='bold', color=color_ai)
ax.text(11.75, 8.2, 'Python + LangChain', ha='center', fontsize=9)

ai_components = [
    'PDF Loader (PyPDF)',
    'Text Chunking',
    'Embedding Model (Local)',
    'FAISS Vector Store',
    'LLM Integration',
    'Specialized Analyzers'
]
y_pos = 7.7
for comp in ai_components:
    ax.text(10.2, y_pos, f'• {comp}', fontsize=8, va='top')
    y_pos -= 0.28

# ===== Core Components Section =====
ax.text(7, 5.8, 'Core Components', ha='center', fontsize=12, fontweight='bold')

# Embedding Model
embed_box = FancyBboxPatch((0.5, 4.2), 3, 1.3, 
                           boxstyle="round,pad=0.08", 
                           edgecolor=color_ai, 
                           facecolor=color_ai, alpha=0.2, linewidth=1.5)
ax.add_patch(embed_box)
ax.text(2, 5.2, 'Embedding Model', ha='center', fontsize=10, fontweight='bold')
ax.text(2, 4.9, 'all-MiniLM-L6-v2', ha='center', fontsize=8)
ax.text(2, 4.65, '384-dim vectors', ha='center', fontsize=7, style='italic')
ax.text(2, 4.4, 'Local CPU (FREE)', ha='center', fontsize=7, color='green', fontweight='bold')

# Vector Database
vector_box = FancyBboxPatch((4, 4.2), 3, 1.3, 
                            boxstyle="round,pad=0.08", 
                            edgecolor=color_db, 
                            facecolor=color_db, alpha=0.2, linewidth=1.5)
ax.add_patch(vector_box)
ax.text(5.5, 5.2, 'Vector Database', ha='center', fontsize=10, fontweight='bold')
ax.text(5.5, 4.9, 'FAISS', ha='center', fontsize=8)
ax.text(5.5, 4.65, '<10ms retrieval', ha='center', fontsize=7, style='italic')
ax.text(5.5, 4.4, '95% accuracy', ha='center', fontsize=7, color='green', fontweight='bold')

# LLM
llm_box = FancyBboxPatch((7.5, 4.2), 3, 1.3, 
                         boxstyle="round,pad=0.08", 
                         edgecolor=color_ext, 
                         facecolor=color_ext, alpha=0.2, linewidth=1.5)
ax.add_patch(llm_box)
ax.text(9, 5.2, 'LLM', ha='center', fontsize=10, fontweight='bold')
ax.text(9, 4.9, 'Gemini 2.5 Flash', ha='center', fontsize=8)
ax.text(9, 4.65, 'Cloud API', ha='center', fontsize=7, style='italic')
ax.text(9, 4.4, 'Answer Generation', ha='center', fontsize=7, fontweight='bold')

# Cache System
cache_box = FancyBboxPatch((11, 4.2), 2.5, 1.3, 
                           boxstyle="round,pad=0.08", 
                           edgecolor='gray', 
                           facecolor='gray', alpha=0.2, linewidth=1.5)
ax.add_patch(cache_box)
ax.text(12.25, 5.2, 'Cache System', ha='center', fontsize=10, fontweight='bold')
ax.text(12.25, 4.9, 'Multi-level', ha='center', fontsize=8)
ax.text(12.25, 4.65, '<1s cached response', ha='center', fontsize=7, style='italic')
ax.text(12.25, 4.4, 'Disk Persistence', ha='center', fontsize=7, fontweight='bold')

# ===== Data Flow Arrows =====
# Frontend to Backend
arrow1 = FancyArrowPatch((4, 7.75), (5, 7.75),
                         arrowstyle='->', mutation_scale=20, 
                         linewidth=2, color='black')
ax.add_patch(arrow1)
ax.text(4.5, 8, 'REST API', ha='center', fontsize=7, 
        bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor='black'))

# Backend to AI Service
arrow2 = FancyArrowPatch((9, 7.75), (10, 7.75),
                         arrowstyle='->', mutation_scale=20, 
                         linewidth=2, color='black')
ax.add_patch(arrow2)
ax.text(9.5, 8, 'Spawn\nProcess', ha='center', fontsize=7, 
        bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor='black'))

# Bidirectional arrows
arrow3 = FancyArrowPatch((5, 7.5), (4, 7.5),
                         arrowstyle='->', mutation_scale=20, 
                         linewidth=2, color='gray', linestyle='dashed')
ax.add_patch(arrow3)

arrow4 = FancyArrowPatch((10, 7.5), (9, 7.5),
                         arrowstyle='->', mutation_scale=20, 
                         linewidth=2, color='gray', linestyle='dashed')
ax.add_patch(arrow4)

# ===== Features Section =====
features_box = FancyBboxPatch((0.5, 0.3), 13, 3.5, 
                              boxstyle="round,pad=0.1", 
                              edgecolor='black', 
                              facecolor='lightgray', alpha=0.1, linewidth=1)
ax.add_patch(features_box)

ax.text(7, 3.5, 'Supported Analysis Modes', ha='center', fontsize=11, fontweight='bold')

# Feature columns
features = [
    ('Case Analysis', [
        'Hierarchical Summarization',
        'Interactive Q&A',
        'Source Citation',
        'Page-level References'
    ]),
    ('Contract Analysis', [
        'Clause Extraction',
        'Risk Assessment',
        'Term Identification',
        'Compliance Check'
    ]),
    ('Timeline Extraction', [
        'Date Identification',
        'Event Classification',
        'Chronological Ordering',
        'Visual Timeline'
    ]),
    ('Precedent Search', [
        'Similar Case Finding',
        'Legal Principle Matching',
        'Citation Recommendations',
        'Relevance Ranking'
    ])
]

x_positions = [1.5, 4.5, 7.5, 10.5]
for i, (title, items) in enumerate(features):
    ax.text(x_positions[i], 3.1, title, ha='center', fontsize=9, fontweight='bold', 
            color=color_ai)
    y_pos = 2.8
    for item in items:
        ax.text(x_positions[i], y_pos, f'• {item}', ha='center', fontsize=7)
        y_pos -= 0.25

# ===== Key Benefits at bottom =====
ax.text(7, 0.8, 'Key Benefits: ', ha='center', fontsize=10, fontweight='bold')
benefits = '87% Accuracy • 95% Semantic Search • <1s Cached Response • 80% Hallucination Reduction • FREE Embeddings • Cost: $0.15/doc'
ax.text(7, 0.4, benefits, ha='center', fontsize=8, 
        bbox=dict(boxstyle='round,pad=0.5', facecolor='yellow', alpha=0.3))

plt.tight_layout()
plt.savefig('system_architecture.png', dpi=300, bbox_inches='tight', facecolor='white')
plt.savefig('system_architecture.pdf', bbox_inches='tight', facecolor='white')
print("✓ System Architecture diagram saved: system_architecture.png & .pdf")
plt.close()
