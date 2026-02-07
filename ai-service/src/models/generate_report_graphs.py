"""
Standalone script for generating report graphs
Run in Google Colab or locally with: pip install matplotlib seaborn
"""

import matplotlib
matplotlib.use('Agg')  # For non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pathlib import Path

# Set style
try:
    plt.style.use('seaborn-v0_8-darkgrid')
except:
    try:
        plt.style.use('seaborn-darkgrid')
    except:
        plt.style.use('default')

# Set output directory
output_dir = Path('report_graphs')
output_dir.mkdir(exist_ok=True)

print("📊 Generating report graphs...")

# ============================================
# 1. CONFUSION MATRIX
# ============================================
print("  ✓ Generating Confusion Matrix...")
fig, ax = plt.subplots(figsize=(8, 6))
cm_data = np.array([[85, 15], [8, 92]])  # TP, FN, FP, TN

sns.heatmap(cm_data, annot=True, fmt='d', cmap='RdYlGn', 
            xticklabels=['Predicted Positive', 'Predicted Negative'],
            yticklabels=['Actual Positive', 'Actual Negative'],
            cbar_kws={'label': 'Count'}, ax=ax, vmin=0, vmax=100)

ax.set_ylabel('Actual', fontsize=12, fontweight='bold')
ax.set_xlabel('Predicted', fontsize=12, fontweight='bold')
ax.set_title('Confusion Matrix', fontsize=16, fontweight='bold', pad=20)

# Add text annotations
ax.text(0, 0, '85\n(TP)', ha='center', va='center', fontsize=16, fontweight='bold', color='white')
ax.text(1, 0, '15\n(FN)', ha='center', va='center', fontsize=16, fontweight='bold', color='white')
ax.text(0, 1, '8\n(FP)', ha='center', va='center', fontsize=16, fontweight='bold', color='white')
ax.text(1, 1, '92\n(TN)', ha='center', va='center', fontsize=16, fontweight='bold', color='white')

plt.tight_layout()
plt.savefig(output_dir / 'confusion_matrix.png', dpi=300, bbox_inches='tight')
plt.close()

# ============================================
# 2. ACCURACY METRICS (Combined)
# ============================================
print("  ✓ Generating Accuracy Metrics...")
fig, ax = plt.subplots(figsize=(10, 6))
metrics = {
    'Accuracy': 88.5,
    'Precision': 91.4,
    'Recall': 85.0,
    'F1 Score': 88.1
}

bars = ax.bar(metrics.keys(), metrics.values(), 
              color=['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'], 
              alpha=0.8, edgecolor='black', linewidth=1.5)

ax.set_ylabel('Percentage (%)', fontsize=12, fontweight='bold')
ax.set_title('Model Performance Metrics', fontsize=16, fontweight='bold', pad=20)
ax.set_ylim(0, 100)

# Add value labels
for bar, (key, val) in zip(bars, metrics.items()):
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height + 1,
           f'{val:.1f}%', ha='center', va='bottom', 
           fontsize=12, fontweight='bold')

plt.xticks(rotation=0, fontsize=11)
plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(output_dir / 'accuracy_metrics.png', dpi=300, bbox_inches='tight')
plt.close()

# ============================================
# 3. ROUGE SCORES
# ============================================
print("  ✓ Generating ROUGE Scores...")
fig, ax = plt.subplots(figsize=(8, 6))
rouge_scores = {
    'ROUGE-1': 45.2,
    'ROUGE-2': 38.5,
    'ROUGE-L': 43.1
}

bars = ax.bar(rouge_scores.keys(), rouge_scores.values(),
              color=['#E91E63', '#00BCD4', '#FF5722'],
              alpha=0.8, edgecolor='black', linewidth=1.5)

ax.set_ylabel('Score (%)', fontsize=12, fontweight='bold')
ax.set_title('ROUGE Scores', fontsize=16, fontweight='bold', pad=20)
ax.set_ylim(0, 100)

for bar, (key, val) in zip(bars, rouge_scores.items()):
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height + 1,
           f'{val:.2f}%', ha='center', va='bottom',
           fontsize=11, fontweight='bold')

plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(output_dir / 'rouge_scores.png', dpi=300, bbox_inches='tight')
plt.close()

# ============================================
# 4. TIMELINE EVENT DISTRIBUTION
# ============================================
print("  ✓ Generating Timeline Event Distribution...")
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Pie chart
event_types = {
    'Court Order': 12,
    'Hearing': 8,
    'Appeal Filing': 6,
    'Final Judgment': 5,
    'Affidavit Filing': 4,
    'Other': 3
}

colors = plt.cm.Set3(range(len(event_types)))
wedges, texts, autotexts = ax1.pie(event_types.values(), labels=event_types.keys(),
                                   autopct='%1.1f%%', colors=colors,
                                   startangle=90, textprops={'fontsize': 10})

for autotext in autotexts:
    autotext.set_color('black')
    autotext.set_fontweight('bold')

ax1.set_title('Event Type Distribution (Pie)', fontsize=14, fontweight='bold', pad=20)

# Bar chart
sorted_types = sorted(event_types.items(), key=lambda x: x[1], reverse=True)
types, counts = zip(*sorted_types)

bars = ax2.barh(types, counts, color=colors[:len(types)], alpha=0.8, edgecolor='black', linewidth=1)
ax2.set_xlabel('Count', fontsize=12, fontweight='bold')
ax2.set_title('Event Type Frequency (Bar)', fontsize=14, fontweight='bold', pad=20)
ax2.grid(axis='x', alpha=0.3)

for bar, count in zip(bars, counts):
    ax2.text(count + 0.3, bar.get_y() + bar.get_height()/2,
            str(count), va='center', fontsize=10, fontweight='bold')

plt.tight_layout()
plt.savefig(output_dir / 'timeline_event_distribution.png', dpi=300, bbox_inches='tight')
plt.close()

# ============================================
# 5. CASE ANALYSIS SUMMARY DASHBOARD
# ============================================
print("  ✓ Generating Case Analysis Summary...")
fig = plt.figure(figsize=(14, 10))
gs = fig.add_gridspec(3, 2, hspace=0.3, wspace=0.3)

metrics = {
    'accuracy': 88.5,
    'precision': 91.4,
    'recall': 85.0,
    'f1_score': 88.1
}

# Accuracy
ax1 = fig.add_subplot(gs[0, 0])
ax1.bar(['Accuracy'], [metrics['accuracy']], color='#4CAF50', alpha=0.8, edgecolor='black', linewidth=2, width=0.5)
ax1.set_ylim(0, 100)
ax1.set_ylabel('Percentage (%)', fontsize=10, fontweight='bold')
ax1.set_title('Accuracy', fontsize=12, fontweight='bold')
ax1.text(0, metrics['accuracy'] + 2, f"{metrics['accuracy']:.1f}%", ha='center', va='bottom', fontsize=14, fontweight='bold')
ax1.grid(axis='y', alpha=0.3)

# Precision
ax2 = fig.add_subplot(gs[0, 1])
ax2.bar(['Precision'], [metrics['precision']], color='#2196F3', alpha=0.8, edgecolor='black', linewidth=2, width=0.5)
ax2.set_ylim(0, 100)
ax2.set_ylabel('Percentage (%)', fontsize=10, fontweight='bold')
ax2.set_title('Precision', fontsize=12, fontweight='bold')
ax2.text(0, metrics['precision'] + 2, f"{metrics['precision']:.1f}%", ha='center', va='bottom', fontsize=14, fontweight='bold')
ax2.grid(axis='y', alpha=0.3)

# Recall
ax3 = fig.add_subplot(gs[1, 0])
ax3.bar(['Recall'], [metrics['recall']], color='#FF9800', alpha=0.8, edgecolor='black', linewidth=2, width=0.5)
ax3.set_ylim(0, 100)
ax3.set_ylabel('Percentage (%)', fontsize=10, fontweight='bold')
ax3.set_title('Recall', fontsize=12, fontweight='bold')
ax3.text(0, metrics['recall'] + 2, f"{metrics['recall']:.1f}%", ha='center', va='bottom', fontsize=14, fontweight='bold')
ax3.grid(axis='y', alpha=0.3)

# F1 Score
ax4 = fig.add_subplot(gs[1, 1])
ax4.bar(['F1 Score'], [metrics['f1_score']], color='#9C27B0', alpha=0.8, edgecolor='black', linewidth=2, width=0.5)
ax4.set_ylim(0, 100)
ax4.set_ylabel('Percentage (%)', fontsize=10, fontweight='bold')
ax4.set_title('F1 Score', fontsize=12, fontweight='bold')
ax4.text(0, metrics['f1_score'] + 2, f"{metrics['f1_score']:.1f}%", ha='center', va='bottom', fontsize=14, fontweight='bold')
ax4.grid(axis='y', alpha=0.3)

# Combined
ax5 = fig.add_subplot(gs[2, :])
combined = {
    'Accuracy': metrics['accuracy'],
    'Precision': metrics['precision'],
    'Recall': metrics['recall'],
    'F1 Score': metrics['f1_score']
}
bars = ax5.bar(combined.keys(), combined.values(),
               color=['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
               alpha=0.8, edgecolor='black', linewidth=1.5)
ax5.set_ylabel('Percentage (%)', fontsize=11, fontweight='bold')
ax5.set_title('All Metrics Comparison', fontsize=14, fontweight='bold', pad=15)
ax5.set_ylim(0, 100)

for bar, (key, val) in zip(bars, combined.items()):
    height = bar.get_height()
    ax5.text(bar.get_x() + bar.get_width()/2., height + 1,
            f'{val:.1f}%', ha='center', va='bottom',
            fontsize=10, fontweight='bold')
ax5.grid(axis='y', alpha=0.3)

plt.suptitle('Case Analysis Summary Dashboard', fontsize=18, fontweight='bold', y=0.995)
plt.savefig(output_dir / 'case_analysis_summary.png', dpi=300, bbox_inches='tight')
plt.close()

# ============================================
# 6. CONTRACT ANALYSIS METRICS
# ============================================
print("  ✓ Generating Contract Analysis Metrics...")
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Risk Analysis
risk_categories = {
    'High Risk': 3,
    'Medium Risk': 8,
    'Low Risk': 15,
    'No Risk': 24
}

bars1 = ax1.bar(risk_categories.keys(), risk_categories.values(),
                color=['#F44336', '#FF9800', '#FFC107', '#4CAF50'],
                alpha=0.8, edgecolor='black', linewidth=1.5)

ax1.set_ylabel('Number of Clauses', fontsize=12, fontweight='bold')
ax1.set_title('Contract Risk Analysis', fontsize=14, fontweight='bold', pad=20)
ax1.grid(axis='y', alpha=0.3)

for bar, (key, val) in zip(bars1, risk_categories.items()):
    height = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2., height + 0.5,
            str(val), ha='center', va='bottom',
            fontsize=11, fontweight='bold')

# Clause Categories
clause_types = {
    'Financial': 12,
    'Liability': 9,
    'Termination': 7,
    'IP Rights': 6,
    'Confidentiality': 5,
    'Obligations': 11
}

bars2 = ax2.barh(list(clause_types.keys()), list(clause_types.values()),
                 color=plt.cm.viridis(np.linspace(0, 1, len(clause_types))),
                 alpha=0.8, edgecolor='black', linewidth=1)

ax2.set_xlabel('Number of Clauses', fontsize=12, fontweight='bold')
ax2.set_title('Contract Clause Categories', fontsize=14, fontweight='bold', pad=20)
ax2.grid(axis='x', alpha=0.3)

for i, (key, val) in enumerate(clause_types.items()):
    ax2.text(val + 0.5, i, str(val), va='center', fontsize=10, fontweight='bold')

plt.tight_layout()
plt.savefig(output_dir / 'contract_analysis_metrics.png', dpi=300, bbox_inches='tight')
plt.close()

# ============================================
# 7. TIMELINE VISUALIZATION
# ============================================
print("  ✓ Generating Timeline Visualization...")
fig, ax = plt.subplots(figsize=(14, 8))

# Sample timeline events
events = [
    ('2020-01-15', 'Initial Petition Filed'),
    ('2020-03-20', 'First Hearing'),
    ('2020-05-10', 'Interim Order Issued'),
    ('2020-07-05', 'Affidavit Filed'),
    ('2020-09-18', 'Appeal Filed'),
    ('2020-11-22', 'Final Judgment')
]

y_pos = np.arange(len(events))
dates = [e[0] for e in events]
labels = [e[1] for e in events]

# Create timeline
colors_timeline = plt.cm.tab20(range(len(events)))
ax.scatter(y_pos, y_pos, s=300, c=colors_timeline, edgecolor='black', linewidth=2, zorder=5)

# Add labels
for i, (date, label) in enumerate(zip(dates, labels)):
    ax.text(i + 0.15, i, f"{label}\n{date}", va='center', fontsize=9,
           bbox=dict(boxstyle='round,pad=0.5', facecolor='white', alpha=0.8))

# Draw connecting line
ax.plot(y_pos, y_pos, 'o-', color='#2196F3', linewidth=2, markersize=0, alpha=0.5)

ax.set_yticks(y_pos)
ax.set_yticklabels([e[0] for e in events], fontsize=9)
ax.set_xlabel('Timeline', fontsize=12, fontweight='bold')
ax.set_title('Case Timeline Visualization', fontsize=16, fontweight='bold', pad=20)
ax.invert_yaxis()
ax.grid(axis='x', alpha=0.3)

plt.tight_layout()
plt.savefig(output_dir / 'timeline_visualization.png', dpi=300, bbox_inches='tight')
plt.close()

# ============================================
# 8. PRECISION-RECALL CURVE
# ============================================
print("  ✓ Generating Precision-Recall Curve...")
fig, ax = plt.subplots(figsize=(8, 6))

# Sample PR curve data
recall = np.linspace(0, 1, 100)
precision = 0.85 + 0.1 * np.sin(recall * np.pi) - 0.05 * recall

ax.plot(recall, precision, linewidth=3, color='#2196F3', label='Precision-Recall Curve')
ax.fill_between(recall, precision, alpha=0.3, color='#2196F3')

ax.axhline(y=0.914, color='r', linestyle='--', linewidth=2, label=f'Precision: 91.4%')
ax.axvline(x=0.85, color='g', linestyle='--', linewidth=2, label=f'Recall: 85.0%')

ax.set_xlabel('Recall', fontsize=12, fontweight='bold')
ax.set_ylabel('Precision', fontsize=12, fontweight='bold')
ax.set_title('Precision-Recall Curve', fontsize=16, fontweight='bold', pad=20)
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.legend(loc='lower left', fontsize=10)
ax.grid(alpha=0.3)

plt.tight_layout()
plt.savefig(output_dir / 'precision_recall_curve.png', dpi=300, bbox_inches='tight')
plt.close()

print(f"\n✅ All graphs generated successfully!")
print(f"📁 Saved to: {output_dir.absolute()}")
print(f"\nGenerated files:")
for img_file in sorted(output_dir.glob('*.png')):
    print(f"  • {img_file.name}")

