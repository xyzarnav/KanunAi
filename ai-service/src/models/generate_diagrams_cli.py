#!/usr/bin/env python3
"""
Diagram Generation CLI
Generates visualization diagrams from case analysis and timeline data
Usage: python generate_diagrams_cli.py <input_json> [output_dir]
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any, Optional

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from diagram_generator import DiagramGenerator


def generate_timeline_diagrams(data: Dict[str, Any], output_dir: str, base_name: str):
    """Generate diagrams from timeline data"""
    generator = DiagramGenerator(cache_dir=output_dir)
    
    events = data.get('events', [])
    if not events:
        print("No events found in timeline data", file=sys.stderr)
        return {}
    
    diagrams = {}
    
    # Generate event distribution
    try:
        dist_file = generator.generate_timeline_event_distribution(
            events,
            filename=f"{base_name}_event_distribution.png"
        )
        diagrams['event_distribution'] = dist_file
        print(f"Generated event distribution: {dist_file}", file=sys.stderr)
    except Exception as e:
        print(f"Error generating event distribution: {e}", file=sys.stderr)
    
    # Generate timeline visualization
    try:
        timeline_file = generator.generate_timeline_visualization(
            events,
            filename=f"{base_name}_timeline.png"
        )
        diagrams['timeline_visualization'] = timeline_file
        print(f"Generated timeline visualization: {timeline_file}", file=sys.stderr)
    except Exception as e:
        print(f"Error generating timeline visualization: {e}", file=sys.stderr)
    
    return diagrams


def generate_case_analysis_diagrams(data: Dict[str, Any], output_dir: str, base_name: str):
    """Generate diagrams from case analysis metrics"""
    generator = DiagramGenerator(cache_dir=output_dir)
    
    diagrams = {}
    
    # Extract metrics
    metrics = data.get('metrics', {})
    rouge_scores = data.get('rouge_scores', {})
    confusion_matrix = data.get('confusion_matrix', {})
    
    # Generate confusion matrix if available
    if all(k in confusion_matrix for k in ['true_positives', 'true_negatives', 'false_positives', 'false_negatives']):
        try:
            cm_file = generator.generate_confusion_matrix(
                confusion_matrix['true_positives'],
                confusion_matrix['true_negatives'],
                confusion_matrix['false_positives'],
                confusion_matrix['false_negatives'],
                filename=f"{base_name}_confusion_matrix.png"
            )
            diagrams['confusion_matrix'] = cm_file
            print(f"Generated confusion matrix: {cm_file}", file=sys.stderr)
        except Exception as e:
            print(f"Error generating confusion matrix: {e}", file=sys.stderr)
    
    # Generate accuracy charts if metrics available
    if all(k in metrics for k in ['accuracy', 'precision', 'recall', 'f1_score']):
        try:
            acc_files = generator.generate_accuracy_charts(
                metrics['accuracy'],
                metrics['precision'],
                metrics['recall'],
                metrics['f1_score'],
                filename_prefix=f"{base_name}_accuracy"
            )
            diagrams.update(acc_files)
            print(f"Generated accuracy charts: {len(acc_files)} files", file=sys.stderr)
        except Exception as e:
            print(f"Error generating accuracy charts: {e}", file=sys.stderr)
    
    # Generate ROUGE scores if available
    if all(k in rouge_scores for k in ['rouge1', 'rouge2', 'rougeL']):
        try:
            rouge_file = generator.generate_rouge_scores(
                rouge_scores['rouge1'],
                rouge_scores['rouge2'],
                rouge_scores['rougeL'],
                filename=f"{base_name}_rouge_scores.png"
            )
            diagrams['rouge_scores'] = rouge_file
            print(f"Generated ROUGE scores: {rouge_file}", file=sys.stderr)
        except Exception as e:
            print(f"Error generating ROUGE scores: {e}", file=sys.stderr)
    
    # Generate case analysis summary if metrics available
    if metrics:
        try:
            summary_file = generator.generate_case_analysis_summary(
                {
                    'accuracy': metrics.get('accuracy', 0),
                    'precision': metrics.get('precision', 0),
                    'recall': metrics.get('recall', 0),
                    'f1_score': metrics.get('f1_score', 0)
                },
                filename=f"{base_name}_case_analysis_summary.png"
            )
            diagrams['case_analysis_summary'] = summary_file
            print(f"Generated case analysis summary: {summary_file}", file=sys.stderr)
        except Exception as e:
            print(f"Error generating case analysis summary: {e}", file=sys.stderr)
    
    return diagrams


def main():
    """Main CLI entry point"""
    if len(sys.argv) < 2:
        print("Usage: python generate_diagrams_cli.py <input_json> [output_dir]", file=sys.stderr)
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    output_dir = sys.argv[2] if len(sys.argv) > 2 else str(Path(__file__).parent.parent.parent / 'cache')
    
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}", file=sys.stderr)
        sys.exit(1)
    
    # Load JSON data
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON file: {e}", file=sys.stderr)
        sys.exit(1)
    
    base_name = input_file.stem
    
    # Determine type of data and generate appropriate diagrams
    all_diagrams = {}
    
    # Check if it's timeline data
    if 'events' in data:
        timeline_diagrams = generate_timeline_diagrams(data, output_dir, base_name)
        all_diagrams.update(timeline_diagrams)
    
    # Check if it's case analysis data
    if 'metrics' in data or 'rouge_scores' in data or 'confusion_matrix' in data:
        case_diagrams = generate_case_analysis_diagrams(data, output_dir, base_name)
        all_diagrams.update(case_diagrams)
    
    # Output diagram paths as JSON
    result = {
        'success': len(all_diagrams) > 0,
        'diagrams': all_diagrams,
        'count': len(all_diagrams)
    }
    
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()

