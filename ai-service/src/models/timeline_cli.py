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
    
    # Always output JSON, even on errors
    def output_error(error_msg: str):
        try:
            error_json = json.dumps({
                "error": error_msg,
                "events": [],
                "success": False
            })
            print(error_json)
            sys.stdout.flush()  # Ensure output is flushed
        except Exception as json_err:
            # Last resort: output basic error
            sys.stderr.write(f"Failed to output JSON error: {json_err}\n")
            sys.stderr.write(f"Original error: {error_msg}\n")
            sys.stderr.flush()
    
    if not args.pdf:
        output_error("Provide --pdf")
        sys.exit(1)
    
    try:
        # Verify file exists and is readable
        pdf_path = Path(args.pdf)
        if not pdf_path.exists():
            output_error(f"PDF file not found: {args.pdf}")
            sys.exit(1)
        
        if not pdf_path.is_file():
            output_error(f"Path is not a file: {args.pdf}")
            sys.exit(1)
        
        # Try to check if file is readable (without opening it fully)
        try:
            with open(pdf_path, 'rb') as f:
                # Read first few bytes to verify it's accessible
                f.read(10)
        except PermissionError:
            output_error(f"Permission denied reading file: {args.pdf}")
            sys.exit(1)
        except IOError as io_err:
            output_error(f"Cannot read file: {args.pdf}, error: {str(io_err)}")
            sys.exit(1)
        
        # Get output directory
        output_dir = args.output
        if output_dir:
            try:
                Path(output_dir).mkdir(exist_ok=True, parents=True)
            except Exception as dir_err:
                # Log but continue - output dir is optional
                sys.stderr.write(f"Warning: Could not create output directory {output_dir}: {dir_err}\n")
        
        # Analyze timeline with timeout protection
        try:
            analyzer = TimelineAnalyzer()
            result = analyzer.analyze_document(str(pdf_path), output_dir)
            
            # Ensure result has required fields
            if not isinstance(result, dict):
                output_error("Analyzer returned invalid result format")
                sys.exit(1)
            
            if 'events' not in result:
                result['events'] = []
            if 'success' not in result:
                result['success'] = False
            
            # Return results - ONLY output valid JSON
            result_json = json.dumps(result, default=str)
            print(result_json)
            sys.stdout.flush()  # Ensure output is flushed immediately
            sys.exit(0 if result.get('success', False) else 1)
            
        except KeyboardInterrupt:
            output_error("Analysis interrupted by user")
            sys.exit(1)
        except MemoryError:
            output_error("Insufficient memory to process document")
            sys.exit(1)
        except Exception as analysis_err:
            import traceback
            error_detail = f"{str(analysis_err)}"
            sys.stderr.write(f"Analysis error: {error_detail}\n")
            sys.stderr.write(f"Traceback: {traceback.format_exc()}\n")
            sys.stderr.flush()
            output_error(f"Analysis failed: {error_detail}")
            sys.exit(1)
        
    except KeyboardInterrupt:
        output_error("Process interrupted")
        sys.exit(1)
    except Exception as e:
        import traceback
        error_detail = f"Unexpected error: {str(e)}"
        sys.stderr.write(f"{error_detail}\n")
        sys.stderr.write(f"Traceback: {traceback.format_exc()}\n")
        sys.stderr.flush()
        output_error(error_detail)
        sys.exit(1)


if __name__ == "__main__":
    main()
