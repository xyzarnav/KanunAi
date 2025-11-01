#!/usr/bin/env python3
"""
Debug script to examine PDF content extraction
"""

import sys
from pathlib import Path
from timeline_analyzer import TimelineAnalyzer

def debug_pdf_content(pdf_path: str):
    """Debug PDF content extraction"""
    print(f"=== DEBUG: Analyzing PDF: {pdf_path} ===")
    
    try:
        analyzer = TimelineAnalyzer()
        text = analyzer.load_document(pdf_path)
        
        print(f"=== EXTRACTED TEXT LENGTH: {len(text)} characters ===")
        print("=== FIRST 500 CHARACTERS ===")
        print(repr(text[:500]))
        print("\n=== FIRST 10 LINES ===")
        lines = text.split('\n')[:10]
        for i, line in enumerate(lines, 1):
            print(f"Line {i}: {repr(line)}")
            
        print(f"\n=== TOTAL LINES: {len(text.split('\n'))} ===")
        
        # Look for any obvious date patterns
        print("\n=== LOOKING FOR DATE-LIKE PATTERNS ===")
        import re
        date_like = re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b', text, re.IGNORECASE)
        print(f"Found {len(date_like)} potential date patterns:")
        for i, date in enumerate(date_like[:10]):  # Show first 10
            print(f"  {i+1}: {date}")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python debug_pdf.py <pdf_path>")
        sys.exit(1)
    
    debug_pdf_content(sys.argv[1])