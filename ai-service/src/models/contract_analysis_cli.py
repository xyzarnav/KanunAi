#!/usr/bin/env python3
"""
Contract Analysis CLI
Wraps ContractAnalyzer for backend integration
"""

import json
import sys
import argparse
import os
from pathlib import Path
from dotenv import load_dotenv
import io
import contextlib
import warnings

# Suppress only warnings and Google's verbose logging
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logging

# Load environment variables
load_dotenv(Path(__file__).parent.parent.parent / '.env')

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Import contract analyzer
try:
    from contract_analysis import ContractAnalyzer
except ImportError as e:
    print(json.dumps({
        "error": f"Failed to import ContractAnalyzer: {e}",
        "session": None
    }))
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Contract Analysis CLI")
    parser.add_argument("--pdf", type=str, help="Path to PDF file")
    parser.add_argument("--text", type=str, help="Contract text")
    parser.add_argument("--quick", action="store_true", help="Quick mode (2 page chunks)")
    
    args = parser.parse_args()
    
    if not args.pdf and not args.text:
        print(json.dumps({
            "error": "Provide --pdf or --text",
            "session": None
        }))
        sys.exit(1)
    
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print(json.dumps({
                "error": "GEMINI_API_KEY not found in environment",
                "session": None
            }))
            sys.exit(1)
        
        # Determine chunk size
        chunk_size = 2 if args.quick else 3
        
        # Get output directory
        project_root = Path(__file__).parent.parent.parent
        output_dir = str(project_root / "ai-service" / "src" / "output")
        Path(output_dir).mkdir(exist_ok=True, parents=True)
        
        # Analyze contract
        if args.pdf:
            # Verify file exists
            if not Path(args.pdf).exists():
                print(json.dumps({
                    "error": f"PDF file not found: {args.pdf}",
                    "session": None
                }))
                sys.exit(1)
            
            # Suppress stdout during analysis (but not stderr for error visibility)
            devnull = io.StringIO()
            with contextlib.redirect_stdout(devnull):
                try:
                    analyzer = ContractAnalyzer(api_key=api_key)
                    results = analyzer.analyze_contract(
                        pdf_path=args.pdf,
                        pages_per_chunk=chunk_size,
                        output_dir=output_dir
                    )
                except Exception as e:
                    print(json.dumps({
                        "error": f"Analysis error: {str(e)}",
                        "session": None
                    }))
                    sys.exit(1)
        else:
            # Text mode would need to be implemented separately
            print(json.dumps({
                "error": "Text mode not yet supported for contract analysis",
                "session": None
            }))
            sys.exit(1)
        
        # Generate session ID (use output folder hash)
        import hashlib
        session_id = hashlib.md5(
            f"{output_dir}_{Path(args.pdf).stem}".encode()
        ).hexdigest()
        
        # Return results - ONLY output valid JSON
        output = {
            "executive_summary": results.get('executive_summary', ''),
            "detailed_analysis": results.get('chunk_analyses', []),
            "session": session_id
        }
        
        # Print ONLY the JSON, nothing else
        print(json.dumps(output))
        sys.exit(0)
        
    except Exception as e:
        print(json.dumps({
            "error": f"Unexpected error: {str(e)}",
            "session": None
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
