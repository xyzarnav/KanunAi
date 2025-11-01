#!/usr/bin/env python3
"""
Refactor timeline JSON using Gemini API to improve summaries and categorization
Reads timeline JSON from stdin and outputs improved JSON
"""

import json
import sys
import os
import time
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent))

import google.generativeai as genai
from typing import Dict, Any, Optional, List

# Rate limiting settings
MAX_REQUESTS_PER_MINUTE = 60
REQUEST_WINDOW = 60  # seconds
request_timestamps = []

# Define legal event categories
LEGAL_CATEGORIES = [
    "Court Order", "Maintenance Order", "Appeal Filing", "Court Direction",
    "Affidavit Filing", "Hearing", "Amendment", "Settlement", "Compliance",
    "Stay Order", "Final Judgment", "Interim Order"
]


def check_rate_limit():
    """
    Check if we've exceeded our rate limit.
    Returns True if we should wait, False if we can proceed.
    """
    global request_timestamps
    current_time = datetime.now()
    
    # Remove timestamps older than our window
    request_timestamps = [ts for ts in request_timestamps 
                        if current_time - ts < timedelta(seconds=REQUEST_WINDOW)]
    
    # Check if we've hit our limit
    if len(request_timestamps) >= MAX_REQUESTS_PER_MINUTE:
        return True
    
    # Add current timestamp
    request_timestamps.append(current_time)
    return False

def process_timeline_with_gemini(timeline: List[Dict[str, Any]], model: Any) -> List[Dict[str, Any]]:
    """Process timeline with Gemini API in one batch"""
    input_json = json.dumps(timeline, indent=2)
    
    prompt = f"""Improve this legal timeline JSON by:
1. Making summaries CLEAR, COMPLETE & SENSIBLE (2-3 lines max)
2. Using these specific categories: {', '.join(LEGAL_CATEGORIES)}
3. Ensuring dates are formatted as DD.MM.YYYY
4. Including key amounts (Rs.) and section references
5. Removing noise words while keeping essential details
6. Never truncating words or amounts mid-way

Input Timeline JSON:
{input_json}

Return ONLY the improved JSON with the same structure but better summaries and categories.
Ensure each event has:
- 'date': in DD.MM.YYYY format
- 'category': one of the specified categories
- 'summary': clear 2-3 line summary with complete sentences
"""
    
    # Attempt multiple tries with exponential backoff on transient failures (e.g., rate limits)
    max_attempts = 3
    backoff = 1.0
    # last_exc intentionally not stored; exceptions will be raised after retries
    for attempt in range(1, max_attempts + 1):
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1000,
                ),
                safety_settings=[
                    {
                        "category": genai.types.HarmCategory.HARM_CATEGORY_UNSPECIFIED,
                        "threshold": genai.types.HarmBlockThreshold.BLOCK_NONE,
                    },
                ]
            )

            # Expect the model to return a JSON array or object containing the improved timeline
            text = getattr(response, 'text', None) or str(response)
            improved_timeline = json.loads(text)

            # If the response is a dict with 'timeline' key, return that, otherwise if it's a list, return directly
            if isinstance(improved_timeline, dict) and 'timeline' in improved_timeline:
                return improved_timeline['timeline']
            if isinstance(improved_timeline, list):
                return improved_timeline

            raise ValueError('Unexpected response shape from Gemini')
        except Exception as e:
            # On the last attempt, re-raise so caller falls back to manual cleaning
            print(f"Gemini attempt {attempt} failed: {e}", file=sys.stderr)
            if attempt == max_attempts:
                raise
            # Backoff and retry
            time.sleep(backoff)
            backoff *= 2.0
        
    


def format_date(date_str: str) -> str:
    """Format date string to DD.MM.YYYY format"""
    try:
        if not date_str:
            return ""
        date = datetime.strptime(date_str.split('T')[0], '%Y-%m-%d')
        return date.strftime('%d.%m.%Y')
    except ValueError:
        return date_str

def clean_event_manually(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback: Clean event manually if Gemini API fails
    """
    cleaned_event = event.copy()
    
    # Format date
    if 'date' in cleaned_event:
        cleaned_event['date'] = format_date(cleaned_event['date'])
    
    # Ensure there's a category
    if 'category' not in cleaned_event or cleaned_event['category'] == 'Other':
        # Try to determine category from content
        summary = cleaned_event.get('summary', '').lower()
        if 'maintenance' in summary:
            cleaned_event['category'] = 'Maintenance Order'
        elif 'appeal' in summary:
            cleaned_event['category'] = 'Appeal Filing'
        elif 'affidavit' in summary:
            cleaned_event['category'] = 'Affidavit Filing'
        elif 'hearing' in summary:
            cleaned_event['category'] = 'Hearing'
        else:
            cleaned_event['category'] = 'Court Direction'
    
    # Clean summary if present
    if 'summary' in cleaned_event:
        lines = []
        for line in cleaned_event['summary'].split('\n'):
            line = line.strip()
            # Skip noisy lines
            if line and not any(noise in line for noise in [
                'PAGE BREAK', 'Respondent:', 'Petitioner:', 'Date:', 'Page'
            ]):
                lines.append(line)
        cleaned_event['summary'] = ' '.join(lines) or "No details available"
    
    return cleaned_event

def determine_category(summary: str) -> str:
    """Determine event category from summary content"""
    summary = summary.lower()
    
    if 'maintenance' in summary:
        return 'Maintenance Order'
    if 'appeal' in summary:
        return 'Appeal Filing'
    if 'affidavit' in summary:
        return 'Affidavit Filing'
    if 'hearing' in summary:
        return 'Hearing'
    if 'amendment' in summary:
        return 'Amendment'
    if 'settlement' in summary:
        return 'Settlement'
    if 'stay' in summary:
        return 'Stay Order'
    if 'final' in summary or 'judgment' in summary:
        return 'Final Judgment'
    if 'interim' in summary:
        return 'Interim Order'
    if any(word in summary for word in ['direct', 'order', 'instruct']):
        return 'Court Direction'
    
    return 'Court Order'

def main():
    """Main entry point"""
    try:
        # Read JSON from stdin
        input_data = json.loads(sys.stdin.read())
        
        if not isinstance(input_data, dict):
            json.dump({'error': 'Input must be a JSON object'}, sys.stdout)
            return
        
        # Get the timeline events
        timeline = input_data.get('timeline', [])
        if not timeline:
            json.dump({'error': 'No timeline events provided'}, sys.stdout)
            return
        
        # Configure Gemini
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            # Fallback to manual cleaning if no API key
            improved_timeline = [clean_event_manually(event) for event in timeline]
        else:
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                improved_timeline = process_timeline_with_gemini(timeline, model)
            except Exception as e:
                print(f"Gemini processing failed: {e}", file=sys.stderr)
                # Fallback to manual cleaning
                improved_timeline = [clean_event_manually(event) for event in timeline]
        
        # Output the result
        json.dump({
            'timeline': improved_timeline,
            'original_count': len(timeline),
            'improved_count': len(improved_timeline),
        }, sys.stdout)
        
    except json.JSONDecodeError as e:
        json.dump({'error': f'Invalid JSON input: {e}'}, sys.stdout)
    except Exception as e:
        json.dump({'error': f'Processing error: {e}'}, sys.stdout)


if __name__ == '__main__':
    main()
