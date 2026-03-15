"""
Preview all generated diagrams in a single window
Useful for quick review without opening individual files
"""

import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import os

# Check if diagrams exist
diagrams = [
    'system_architecture.png',
    'rag_workflow.png',
    'data_flow_diagram.png',
    'table_performance_metrics.png',
    'table_rag_comparison.png',
    'table_cost_analysis.png',
    'flow_case_analysis.png',
    'flow_contract_analysis.png'
]

print("=" * 60)
print("DIAGRAM PREVIEW GUIDE")
print("=" * 60)
print()

for i, diagram in enumerate(diagrams, 1):
    if os.path.exists(diagram):
        print(f"✓ {i}. {diagram} - Ready")
    else:
        print(f"✗ {i}. {diagram} - Missing (run generate_all.py)")

print()
print("=" * 60)
print("Opening preview of all diagrams...")
print("Close the window to continue viewing next diagram")
print("=" * 60)
print()

# Display each diagram
for diagram in diagrams:
    if os.path.exists(diagram):
        print(f"\nDisplaying: {diagram}")
        img = mpimg.imread(diagram)
        
        fig, ax = plt.subplots(figsize=(16, 10))
        ax.imshow(img)
        ax.axis('off')
        fig.suptitle(f"Preview: {diagram}", fontsize=14, fontweight='bold')
        plt.tight_layout()
        plt.show()
    else:
        print(f"\nSkipping: {diagram} (not found)")

print("\n" + "=" * 60)
print("✓ Preview complete!")
print("=" * 60)
