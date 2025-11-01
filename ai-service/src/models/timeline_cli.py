#!/usr/bin/env python3
"""
Timeline Analysis CLI
Wraps TimelineAnalyzer for backend integration
"""

import json
import sys
import argparse
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent.parent.parent / '.env')

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Import timeline analyzer
try:
    from timeline_analyzer import TimelineAnalyzer
except ImportError as e:
    print(json.dumps({
        "error": f"Failed to import TimelineAnalyzer: {e}",
        "events": [],
        "success": False
    }))
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Timeline Analysis CLI")
    parser.add_argument("--pdf", type=str, help="Path to PDF file")
    parser.add_argument("--output", type=str, help="Output directory for caching")
    
    args = parser.parse_args()
    
    if not args.pdf:
        print(json.dumps({
            "error": "Provide --pdf",
            "events": [],
            "success": False
        }))
        sys.exit(1)
    
    try:
        # Verify file exists
        if not Path(args.pdf).exists():
            print(json.dumps({
                "error": f"PDF file not found: {args.pdf}",
                "events": [],
                "success": False
            }))
            sys.exit(1)
        
        # Get output directory
        output_dir = args.output
        if output_dir:
            Path(output_dir).mkdir(exist_ok=True, parents=True)
        
        # Analyze timeline
        analyzer = TimelineAnalyzer()
        result = analyzer.analyze_document(args.pdf, output_dir)
        
        # Return results - ONLY output valid JSON
        print(json.dumps(result, default=str))
        sys.exit(0 if result.get('success', False) else 1)
        
    except Exception as e:
        print(json.dumps({
            "error": f"Unexpected error: {str(e)}",
            "events": [],
            "success": False
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
