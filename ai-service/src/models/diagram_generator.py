"""
Diagram Generator Module
Generates visualization diagrams for case analysis and timeline using matplotlib
"""

import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from collections import defaultdict
import json

# Set style for better-looking plots
try:
    plt.style.use('seaborn-v0_8-darkgrid')
except:
    try:
        plt.style.use('seaborn-darkgrid')
    except:
        plt.style.use('default')
matplotlib.rcParams['figure.facecolor'] = 'white'
matplotlib.rcParams['axes.facecolor'] = 'white'


class DiagramGenerator:
    """Generate various diagrams for case analysis and timeline"""
    
    def __init__(self, cache_dir: Optional[str] = None):
        self.cache_dir = Path(cache_dir) if cache_dir else Path(__file__).parent.parent.parent / 'cache'
        self.cache_dir.mkdir(exist_ok=True)
    
    def generate_confusion_matrix(self, 
                                  true_positives: int,
                                  true_negatives: int,
                                  false_positives: int,
                                  false_negatives: int,
                                  filename: str = 'confusion_matrix.png') -> str:
        """Generate confusion matrix diagram"""
        fig, ax = plt.subplots(figsize=(8, 6))
        
        # Create confusion matrix data
        cm_data = [
            [true_positives, false_negatives],
            [false_positives, true_negatives]
        ]
        
        # Create color map
        im = ax.imshow(cm_data, cmap='RdYlGn', interpolation='nearest', vmin=0, vmax=max(
            true_positives, true_negatives, false_positives, false_negatives
        ))
        
        # Add text annotations
        thresh = max(cm_data[0] + cm_data[1]) / 2.0
        for i in range(2):
            for j in range(2):
                text_color = 'white' if cm_data[i][j] > thresh else 'black'
                ax.text(j, i, str(cm_data[i][j]), 
                       ha="center", va="center", color=text_color, fontsize=24, fontweight='bold')
        
        # Labels
        ax.set_xticks([0, 1])
        ax.set_yticks([0, 1])
        ax.set_xticklabels(['Predicted Positive', 'Predicted Negative'], fontsize=12)
        ax.set_yticklabels(['Actual Positive', 'Actual Negative'], fontsize=12)
        ax.set_ylabel('Actual', fontsize=14, fontweight='bold')
        ax.set_xlabel('Predicted', fontsize=14, fontweight='bold')
        ax.set_title('Confusion Matrix', fontsize=16, fontweight='bold', pad=20)
        
        # Add colorbar
        plt.colorbar(im, ax=ax)
        
        plt.tight_layout()
        filepath = self.cache_dir / filename
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(filepath)
    
    def generate_accuracy_charts(self,
                                 accuracy: float,
                                 precision: float,
                                 recall: float,
                                 f1_score: float,
                                 filename_prefix: str = 'accuracy_metrics') -> Dict[str, str]:
        """Generate accuracy, precision, recall, and F1 score charts"""
        metrics = {
            'Accuracy': accuracy,
            'Precision': precision,
            'Recall': recall,
            'F1 Score': f1_score
        }
        
        filepaths = {}
        
        # Combined bar chart
        fig, ax = plt.subplots(figsize=(10, 6))
        bars = ax.bar(metrics.keys(), [v * 100 for v in metrics.values()], 
                     color=['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'], 
                     alpha=0.8, edgecolor='black', linewidth=1.5)
        
        ax.set_ylabel('Percentage (%)', fontsize=12, fontweight='bold')
        ax.set_title('Model Performance Metrics', fontsize=16, fontweight='bold', pad=20)
        ax.set_ylim(0, 100)
        
        # Add value labels on bars
        for bar, (key, val) in zip(bars, metrics.items()):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{val*100:.1f}%', ha='center', va='bottom', 
                   fontsize=12, fontweight='bold')
        
        plt.xticks(rotation=0, fontsize=11)
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        
        filepath = self.cache_dir / f'{filename_prefix}_combined.png'
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        filepaths['combined'] = str(filepath)
        
        # Individual charts
        for metric_name, metric_value in metrics.items():
            fig, ax = plt.subplots(figsize=(6, 6))
            bar = ax.bar([metric_name], [metric_value * 100], 
                        color=['#4CAF50' if 'Accuracy' in metric_name else 
                               '#2196F3' if 'Precision' in metric_name else
                               '#FF9800' if 'Recall' in metric_name else '#9C27B0'],
                        alpha=0.8, edgecolor='black', linewidth=2, width=0.5)
            
            ax.set_ylabel('Percentage (%)', fontsize=12, fontweight='bold')
            ax.set_title(f'{metric_name}', fontsize=16, fontweight='bold', pad=20)
            ax.set_ylim(0, 100)
            ax.set_xticks([])
            
            # Add value label
            ax.text(0, metric_value * 100 + 2, f'{metric_value*100:.1f}%',
                   ha='center', va='bottom', fontsize=20, fontweight='bold')
            
            plt.grid(axis='y', alpha=0.3)
            plt.tight_layout()
            
            filepath = self.cache_dir / f'{filename_prefix}_{metric_name.lower().replace(" ", "_")}.png'
            plt.savefig(filepath, dpi=300, bbox_inches='tight')
            plt.close()
            filepaths[metric_name.lower().replace(" ", "_")] = str(filepath)
        
        return filepaths
    
    def generate_rouge_scores(self,
                             rouge1: float,
                             rouge2: float,
                             rougeL: float,
                             filename: str = 'rouge_scores.png') -> str:
        """Generate ROUGE scores bar chart"""
        fig, ax = plt.subplots(figsize=(8, 6))
        
        scores = {
            'ROUGE-1': rouge1,
            'ROUGE-2': rouge2,
            'ROUGE-L': rougeL
        }
        
        bars = ax.bar(scores.keys(), [v * 100 for v in scores.values()],
                     color=['#E91E63', '#00BCD4', '#FF5722'],
                     alpha=0.8, edgecolor='black', linewidth=1.5)
        
        ax.set_ylabel('Score (%)', fontsize=12, fontweight='bold')
        ax.set_title('ROUGE Scores', fontsize=16, fontweight='bold', pad=20)
        ax.set_ylim(0, 100)
        
        # Add value labels
        for bar, (key, val) in zip(bars, scores.items()):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{val*100:.2f}%', ha='center', va='bottom',
                   fontsize=11, fontweight='bold')
        
        plt.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        
        filepath = self.cache_dir / filename
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(filepath)
    
    def generate_timeline_event_distribution(self,
                                            events: List[Dict[str, Any]],
                                            filename: str = 'timeline_event_distribution.png') -> str:
        """Generate event type distribution chart for timeline"""
        if not events:
            return ""
        
        # Count event types
        event_types = defaultdict(int)
        for event in events:
            event_type = event.get('eventType', 'Other')
            event_types[event_type] += 1
        
        if not event_types:
            return ""
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        # Pie chart
        colors = plt.cm.Set3(range(len(event_types)))
        wedges, texts, autotexts = ax1.pie(event_types.values(), labels=event_types.keys(),
                                          autopct='%1.1f%%', colors=colors,
                                          startangle=90, textprops={'fontsize': 10})
        
        for autotext in autotexts:
            autotext.set_color('black')
            autotext.set_fontweight('bold')
        
        ax1.set_title('Event Type Distribution', fontsize=14, fontweight='bold', pad=20)
        
        # Bar chart
        sorted_types = sorted(event_types.items(), key=lambda x: x[1], reverse=True)
        types, counts = zip(*sorted_types) if sorted_types else ([], [])
        
        bars = ax2.barh(types, counts, color=colors[:len(types)], alpha=0.8, edgecolor='black', linewidth=1)
        ax2.set_xlabel('Count', fontsize=12, fontweight='bold')
        ax2.set_title('Event Type Frequency', fontsize=14, fontweight='bold', pad=20)
        ax2.grid(axis='x', alpha=0.3)
        
        # Add value labels
        for i, (bar, count) in enumerate(zip(bars, counts)):
            ax2.text(count + 0.5, bar.get_y() + bar.get_height()/2,
                    str(count), va='center', fontsize=10, fontweight='bold')
        
        plt.tight_layout()
        filepath = self.cache_dir / filename
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(filepath)
    
    def generate_timeline_visualization(self,
                                       events: List[Dict[str, Any]],
                                       filename: str = 'timeline_visualization.png') -> str:
        """Generate timeline visualization diagram"""
        if not events:
            return ""
        
        # Parse dates
        dates = []
        labels = []
        for event in events:
            try:
                date_str = event.get('date', '')
                if date_str:
                    # Try to parse date
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                    dates.append(date_obj)
                    event_type = event.get('eventType', 'Event')
                    labels.append(f"{event_type}\n{date_str}")
            except:
                continue
        
        if not dates:
            return ""
        
        fig, ax = plt.subplots(figsize=(16, max(8, len(dates) * 0.5)))
        
        # Create timeline
        y_positions = list(range(len(dates)))
        colors_list = plt.cm.tab20(range(len(dates)))
        
        # Draw timeline line
        if len(dates) > 1:
            min_date = min(dates)
            max_date = max(dates)
            date_range = (max_date - min_date).days
            if date_range > 0:
                normalized_dates = [(d - min_date).days / date_range for d in dates]
                ax.plot(normalized_dates, y_positions, 'o-', color='#2196F3', 
                       linewidth=2, markersize=8, alpha=0.7)
        
        # Add event markers
        for i, (date, label, color) in enumerate(zip(dates, labels, colors_list)):
            ax.scatter(i, i, s=200, color=color, edgecolor='black', linewidth=2, zorder=5)
            ax.text(i + 0.02, i, label, va='center', fontsize=8, 
                   bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8))
        
        ax.set_yticks(y_positions)
        ax.set_yticklabels([d.strftime('%Y-%m-%d') for d in dates], fontsize=9)
        ax.set_xlabel('Timeline', fontsize=12, fontweight='bold')
        ax.set_title('Case Timeline Visualization', fontsize=16, fontweight='bold', pad=20)
        ax.invert_yaxis()
        ax.grid(axis='x', alpha=0.3)
        
        plt.tight_layout()
        filepath = self.cache_dir / filename
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(filepath)
    
    def generate_case_analysis_summary(self,
                                      metrics: Dict[str, Any],
                                      filename: str = 'case_analysis_summary.png') -> str:
        """Generate comprehensive case analysis summary diagram"""
        fig = plt.figure(figsize=(14, 10))
        gs = fig.add_gridspec(3, 2, hspace=0.3, wspace=0.3)
        
        # Metric 1: Accuracy
        ax1 = fig.add_subplot(gs[0, 0])
        if 'accuracy' in metrics:
            ax1.bar(['Accuracy'], [metrics['accuracy'] * 100], 
                   color='#4CAF50', alpha=0.8, edgecolor='black', linewidth=2)
            ax1.set_ylim(0, 100)
            ax1.set_ylabel('Percentage (%)', fontsize=10, fontweight='bold')
            ax1.set_title('Accuracy', fontsize=12, fontweight='bold')
            ax1.text(0, metrics['accuracy'] * 100 + 2, f'{metrics["accuracy"]*100:.1f}%',
                    ha='center', va='bottom', fontsize=14, fontweight='bold')
            ax1.grid(axis='y', alpha=0.3)
        
        # Metric 2: Precision
        ax2 = fig.add_subplot(gs[0, 1])
        if 'precision' in metrics:
            ax2.bar(['Precision'], [metrics['precision'] * 100],
                   color='#2196F3', alpha=0.8, edgecolor='black', linewidth=2)
            ax2.set_ylim(0, 100)
            ax2.set_ylabel('Percentage (%)', fontsize=10, fontweight='bold')
            ax2.set_title('Precision', fontsize=12, fontweight='bold')
            ax2.text(0, metrics['precision'] * 100 + 2, f'{metrics["precision"]*100:.1f}%',
                    ha='center', va='bottom', fontsize=14, fontweight='bold')
            ax2.grid(axis='y', alpha=0.3)
        
        # Metric 3: Recall
        ax3 = fig.add_subplot(gs[1, 0])
        if 'recall' in metrics:
            ax3.bar(['Recall'], [metrics['recall'] * 100],
                   color='#FF9800', alpha=0.8, edgecolor='black', linewidth=2)
            ax3.set_ylim(0, 100)
            ax3.set_ylabel('Percentage (%)', fontsize=10, fontweight='bold')
            ax3.set_title('Recall', fontsize=12, fontweight='bold')
            ax3.text(0, metrics['recall'] * 100 + 2, f'{metrics["recall"]*100:.1f}%',
                    ha='center', va='bottom', fontsize=14, fontweight='bold')
            ax3.grid(axis='y', alpha=0.3)
        
        # Metric 4: F1 Score
        ax4 = fig.add_subplot(gs[1, 1])
        if 'f1_score' in metrics:
            ax4.bar(['F1 Score'], [metrics['f1_score'] * 100],
                   color='#9C27B0', alpha=0.8, edgecolor='black', linewidth=2)
            ax4.set_ylim(0, 100)
            ax4.set_ylabel('Percentage (%)', fontsize=10, fontweight='bold')
            ax4.set_title('F1 Score', fontsize=12, fontweight='bold')
            ax4.text(0, metrics['f1_score'] * 100 + 2, f'{metrics["f1_score"]*100:.1f}%',
                    ha='center', va='bottom', fontsize=14, fontweight='bold')
            ax4.grid(axis='y', alpha=0.3)
        
        # Combined metrics
        ax5 = fig.add_subplot(gs[2, :])
        if all(k in metrics for k in ['accuracy', 'precision', 'recall', 'f1_score']):
            combined_metrics = {
                'Accuracy': metrics['accuracy'] * 100,
                'Precision': metrics['precision'] * 100,
                'Recall': metrics['recall'] * 100,
                'F1 Score': metrics['f1_score'] * 100
            }
            bars = ax5.bar(combined_metrics.keys(), combined_metrics.values(),
                          color=['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
                          alpha=0.8, edgecolor='black', linewidth=1.5)
            ax5.set_ylabel('Percentage (%)', fontsize=11, fontweight='bold')
            ax5.set_title('All Metrics Comparison', fontsize=14, fontweight='bold', pad=15)
            ax5.set_ylim(0, 100)
            
            for bar, (key, val) in zip(bars, combined_metrics.items()):
                height = bar.get_height()
                ax5.text(bar.get_x() + bar.get_width()/2., height,
                        f'{val:.1f}%', ha='center', va='bottom',
                        fontsize=10, fontweight='bold')
            
            ax5.grid(axis='y', alpha=0.3)
        
        plt.suptitle('Case Analysis Summary', fontsize=18, fontweight='bold', y=0.995)
        filepath = self.cache_dir / filename
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        return str(filepath)


if __name__ == '__main__':
    # Test the diagram generator
    generator = DiagramGenerator()
    
    # Test confusion matrix
    generator.generate_confusion_matrix(85, 92, 8, 15)
    print("Generated confusion matrix")
    
    # Test accuracy charts
    generator.generate_accuracy_charts(0.885, 0.914, 0.850, 0.881)
    print("Generated accuracy charts")
    
    # Test ROUGE scores
    generator.generate_rouge_scores(0.452, 0.385, 0.431)
    print("Generated ROUGE scores")
    
    print(f"All diagrams saved to: {generator.cache_dir}")

