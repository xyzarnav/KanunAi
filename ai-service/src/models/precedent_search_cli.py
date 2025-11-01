#!/usr/bin/env python3
"""
Precedent Search CLI
Searches for similar legal cases based on case summary.
Works for all types of Supreme Court, High Court, and other court cases.
Outputs JSON to stdout: { "precedents": [...] }
"""

import json
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent.parent.parent / '.env')

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

try:
    import google.generativeai as genai
except ImportError as e:
    print(json.dumps({
        "error": f"Failed to import required libraries: {e}",
        "precedents": []
    }), file=sys.stderr)
    sys.exit(1)


def search_precedents(summary: str) -> list:
    """
    Search for similar legal precedents based on case summary.
    Works for all court types (Supreme Court, High Courts, District Courts, etc.)
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Return example data if API key is missing
        return [{
            "caseName": "Example: Rajnesh v. Neha",
            "court": "Supreme Court of India",
            "year": 2020,
            "similarityReason": "Similar family law and maintenance issues",
            "keyPrinciple": "Interim maintenance under Section 125 CrPC"
        }]
    
    try:
        # Initialize Gemini
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""You are a legal research assistant. Based on the following case summary, find and list the top 5 most relevant legal precedents (cases) from Indian courts.

IMPORTANT REQUIREMENTS:
- Search for cases from ALL court types: Supreme Court, High Courts (Delhi, Bombay, Madras, Karnataka, Calcutta, etc.), District Courts, and other courts
- Do NOT hardcode court types - dynamically identify the court type based on the case citation or context provided
- Include cases that are legally similar in terms of issues, facts, or legal principles
- The precedents should be real, well-known Indian legal cases when possible
- CRITICAL: Only include cases from years 1990 to 2024 (inclusive). Do NOT include any cases outside this date range.

Case Summary:
{summary}

For each precedent, provide:
1. caseName: Full name of the case (e.g., "Rajnesh v. Neha", "Shah Bano v. Mohammed Ahmed Khan")
2. court: The court name (e.g., "Supreme Court of India", "Delhi High Court", "Bombay High Court", "Madras High Court", etc.)
3. year: Year of the judgment (as a number between 1990 and 2024)
4. similarityReason: Brief explanation of why this case is similar (2-3 sentences)
5. keyPrinciple: The main legal principle or holding from this case

Return ONLY a valid JSON array with this exact structure:
[
  {{
    "caseName": "Case Name v. Another Party",
    "court": "Supreme Court of India",
    "year": 2020,
    "similarityReason": "Deals with similar legal issues regarding maintenance and family law",
    "keyPrinciple": "Main legal principle established in this case"
  }},
  ...
]

Make sure the JSON is valid and can be parsed. Return maximum 5 precedents. All cases MUST be from years 1990-2024 only. If you cannot find specific cases within this range, provide well-known relevant precedents from 1990-2024 based on the legal issues in the summary."""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Parse JSON
        precedents = json.loads(response_text)
        
        # Validate structure
        if not isinstance(precedents, list):
            precedents = []
        
        # Ensure all required fields exist and filter by year range (1990-2024)
        validated_precedents = []
        for prec in precedents:
            if isinstance(prec, dict):
                # Extract and validate year
                year_val = prec.get("year", 0)
                if isinstance(year_val, str):
                    year_val = int(year_val) if year_val.isdigit() else 0
                elif isinstance(year_val, int):
                    year_val = year_val
                else:
                    year_val = 0
                
                # Only include cases between 1990 and 2024 (inclusive)
                if 1990 <= year_val <= 2024:
                    validated_precedents.append({
                        "caseName": prec.get("caseName", "Unknown Case"),
                        "court": prec.get("court", "Unknown Court"),
                        "year": year_val,
                        "similarityReason": prec.get("similarityReason", "Similar legal principles"),
                        "keyPrinciple": prec.get("keyPrinciple", "Legal principle applicable to similar cases")
                    })
                
                # Stop once we have 5 valid precedents
                if len(validated_precedents) >= 5:
                    break
        
        return validated_precedents
        
    except json.JSONDecodeError as e:
        print(f"[precedent-search] JSON parse error: {e}", file=sys.stderr)
        print(f"[precedent-search] Response was: {response_text[:500]}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"[precedent-search] Error: {e}", file=sys.stderr)
        return []


def main():
    """Main CLI entry point - reads JSON from stdin, outputs JSON to stdout"""
    try:
        # Read JSON input from stdin
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({
                "error": "No input provided",
                "precedents": []
            }))
            sys.exit(1)
        
        data = json.loads(input_data)
        summary = data.get("summary", "")
        
        if not summary:
            print(json.dumps({
                "error": "Case summary is required",
                "precedents": []
            }))
            sys.exit(1)
        
        # Search for precedents
        precedents = search_precedents(summary)
        
        # Output JSON result
        result = {
            "precedents": precedents,
            "count": len(precedents)
        }
        
        print(json.dumps(result))
        sys.exit(0)
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            "error": f"Invalid JSON input: {e}",
            "precedents": []
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "error": f"Unexpected error: {str(e)}",
            "precedents": []
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()