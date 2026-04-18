#!/usr/bin/env python3
"""
Refine legal context using Gemini API to reduce vagueness and improve readability
without reducing the content or omitting details.
"""

import json
import sys
import os
import time
import re
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent))

import google.generativeai as genai
from typing import Dict, Any, Optional, List

def check_rate_limit():
    # Basic rate limit check could be added here if needed
    return False

def refine_legal_context(text: str, model: Any) -> str:
    """Refine legal context to be clear and readable while preserving all details."""
    
    prompt = f"""You are a legal document expert. Your task is to REWRITE the following legal text to be clear, professional, and REDUCE VAGUENESS. 

CRITICAL INSTRUCTIONS:
1. DO NOT SHORTEN the content significantly.
2. DO NOT OMIT any legal details, dates, party names, section numbers, or court names.
3. FIX OCR errors, awkward line breaks, and formatting issues.
4. IMPROVE readability by fixing grammar and flow.
5. If the text is a court judgment snippet, make it read as a clear narrative of what was being discussed or held.
6. REMOVE noise like "--- PAGE BREAK ---", "MANU/", or random citations that break the flow, but keep the substance.
7. The goal is "UNVAGUE" - if a sentence is awkward or unclear, rewrite it to be precise.

ORIGINAL TEXT:
{text}

REFINED TEXT:"""
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,  # Low temperature for factual consistency
                max_output_tokens=1024,
                top_p=0.9,
            ),
        )
        return response.text.strip()
    except Exception as e:
        print(f"Refine context failed: {e}", file=sys.stderr)
        return text # Fallback to original

def main():
    try:
        input_data = json.loads(sys.stdin.read())
        context = input_data.get('context', '')
        
        # If context is a list (from some frontend formats), join it
        if isinstance(context, list):
            context = " ".join([str(c.get('context', c)) if isinstance(c, dict) else str(c) for c in context])
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            # Fallback
            json.dump({'refined': context}, sys.stdout)
            return

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        refined = refine_legal_context(context, model)
        
        json.dump({'refined': refined}, sys.stdout)
        
    except Exception as e:
        json.dump({'error': str(e)}, sys.stdout)

if __name__ == '__main__':
    main()
