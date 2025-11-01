#!/usr/bin/env python3
"""
Refactor timeline JSON using Gemini API to improve summaries and categorization
Reads timeline JSON from stdin and outputs improved JSON
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

def extract_event_date(event: Dict[str, Any]) -> str:
    """Extract and format the event date from the event object"""
    # First try the date field
    date_str = event.get('date', '')
    if date_str:
        try:
            # Handle ISO format: 2001-09-24T00:00:00
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return date_obj.strftime('%d.%m.%Y')
        except (ValueError, AttributeError):
            # Try parsing as is
            return format_date(date_str)
    
    # Fallback to formatted date if available
    return format_date(date_str)


def refactor_single_event(event: Dict[str, Any], model: Any) -> Dict[str, Any]:
    """Refactor a single event with Gemini, using the correct event date"""
    event_date = extract_event_date(event)
    context = event.get('context', '')
    event_type = event.get('eventType', 'Legal Event')
    event_name = event.get('eventName', '')
    
    # Clean context - remove noise but preserve complete sentences
    clean_context = context.replace('--- PAGE BREAK ---', ' ').replace('PAGE BREAK', ' ')
    clean_context = ' '.join(clean_context.split())  # Normalize whitespace
    
    # Build prompt with date context
    date_context = f"Event Date: {event_date}\n" if event_date else ""
    
    prompt = f"""You are analyzing a legal document timeline event. Generate a concise, accurate, and COMPLETE summary.

{date_context}Event Type: {event_type}
Event Context: {clean_context[:800]}

TASK: Write a clear, COMPLETE 2-sentence summary of what happened on {event_date}.

CRITICAL REQUIREMENTS:
1. Write EXACTLY 2 COMPLETE sentences - each MUST end with proper punctuation (. or ;)
2. NEVER truncate - every sentence must be grammatically complete
3. NEVER cut off dates, amounts (Rs.), sections, or legal terms
4. Keep sentences concise but complete - aim for 20-40 words per sentence
5. First sentence: What happened (court/event + action) - use date if context fits
6. Second sentence: Key details (amounts, sections, parties, directives)
7. Remove ALL noise: citations like "MANU/", URLs, headers, "Refer to", case citation numbers
8. For maintenance orders: State amount clearly (e.g., "Rs. 15,000 per month")
9. For amendments: State section number and what changed (e.g., "Section 24 was amended...")
10. For court orders: State court name and directive clearly
11. If context seems truncated, infer logical completion but stay factual

OUTPUT FORMAT:
- Exactly 2 sentences
- One sentence per line
- Each sentence ends with a period
- No truncation markers (..., etc.)
- No incomplete legal terms or amounts

GOOD EXAMPLES (complete and accurate):
Example 1 - Maintenance Order:
"On 24.08.2015, the Family Court awarded interim maintenance of Rs. 15,000 per month to the wife from 01.09.2013.
The Court also ordered Rs. 5,000 per month as interim maintenance for the minor son from the same date."

Example 2 - Legislative Amendment:
"On 24.09.2001, Section 24 of the Hindu Marriage Act was amended via Act 49 of 2001.
The amendment inserted a proviso requiring disposal of maintenance applications within 60 days."

Example 3 - Compliance:
"On 14.10.2019, the Court recorded that arrears of Rs. 3,00,000 were due and payable to the wife as per the husband's admission.
The Court directed the husband to file his Income Tax Returns and Assessment Orders from 2005-2006 onwards."

BAD EXAMPLES (avoid - these are wrong):
- "Section 24 - (i) The proviso to Section 24 of the HMA (inserted vide Act 49 of 2001 w.e.f. 24.09.2001), and the third proviso to Sect" (truncated, verbose)
- "Rs. 15,000 - 24.08.2015 awarded interim maintenance of Rs. 15,000 per month to the Respondent No. 1-wife from 01.09.2013; and Rs. 5,0" (truncated amount)

Now generate the 2-sentence summary:"""
    
    max_attempts = 3
    backoff = 1.0
    
    for attempt in range(1, max_attempts + 1):
        try:
            if check_rate_limit():
                time.sleep(2)  # Wait if rate limited
            
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,  # Lower temperature for more consistent, factual output
                    max_output_tokens=300,  # Sufficient for 2 complete sentences
                    top_p=0.8,
                    top_k=40,
                ),
                safety_settings=[
                    {
                        "category": genai.types.HarmCategory.HARM_CATEGORY_UNSPECIFIED,
                        "threshold": genai.types.HarmBlockThreshold.BLOCK_NONE,
                    },
                ]
            )

            text = getattr(response, 'text', None) or str(response)
            summary = text.strip()
            
            # Clean up the summary - ensure exactly 2 complete sentences
            # Remove any leading/trailing markers or quotes
            summary = summary.strip('"').strip("'").strip()
            
            # Split by newlines and periods to identify sentences
            lines = [line.strip() for line in summary.split('\n') if line.strip()]
            
            if not lines:
                summary = f"Event occurred on {event_date}. See context for details."
            else:
                # Reconstruct sentences - split by periods if needed
                sentences = []
                for line in lines:
                    # Split by period but keep the period with the sentence
                    parts = line.split('.')
                    for i, part in enumerate(parts):
                        part = part.strip()
                        if part and len(part) > 10:  # Only substantial sentences
                            if i < len(parts) - 1:  # Not the last part (which may be empty)
                                sentences.append(part + '.')
                            elif part.endswith('.'):
                                sentences.append(part)
                            elif len(part) > 20:  # Substantial text without period
                                sentences.append(part + '.')
                
                # Take exactly 2 sentences, ensure they're complete
                if len(sentences) >= 2:
                    summary = '\n'.join(sentences[:2])
                elif len(sentences) == 1:
                    # If only one sentence, try to split it or use as-is
                    summary = sentences[0]
                    # Check if we can create a second sentence from context
                    if event_type and event_type != 'Legal Event':
                        summary = f"{summary}\nThis was classified as a {event_type}."
                    else:
                        summary = f"{summary}\nSee context for additional details."
                else:
                    # Fallback: use cleaned lines
                    summary = '\n'.join(lines[:2]) if len(lines) >= 2 else '\n'.join(lines)
                    # Ensure it ends properly
                    if summary and not summary.rstrip().endswith(('.', '!', '?')):
                        summary = summary.rstrip() + '.'
            
            # Build improved event
            improved_event = event.copy()
            improved_event['summary'] = summary
            improved_event['date'] = event_date
            improved_event['eventType'] = event_type  # Keep the improved event type from timeline_analyzer
            improved_event['eventName'] = event_name  # Keep the improved event name
            
            return improved_event
            
        except Exception as e:
            print(f"Gemini attempt {attempt} failed for event {event.get('id', 'unknown')}: {e}", file=sys.stderr)
            if attempt == max_attempts:
                # Fallback to manual cleaning
                return clean_event_manually(event)
            time.sleep(backoff)
            backoff *= 2.0
    
    return clean_event_manually(event)


def process_timeline_with_gemini(timeline: List[Dict[str, Any]], model: Any) -> List[Dict[str, Any]]:
    """Process timeline events individually with Gemini API for accurate date-aware summaries"""
    improved_events = []
    
    print(f"Processing {len(timeline)} events individually...", file=sys.stderr)
    
    for idx, event in enumerate(timeline, 1):
        try:
            improved_event = refactor_single_event(event, model)
            improved_events.append(improved_event)
            
            # Progress indicator
            if idx % 5 == 0:
                print(f"Processed {idx}/{len(timeline)} events...", file=sys.stderr)
            
            # Small delay to avoid rate limits
            time.sleep(0.2)
            
        except Exception as e:
            print(f"Error processing event {idx}: {e}", file=sys.stderr)
            # Fallback to manual cleaning
            improved_events.append(clean_event_manually(event))
    
    return improved_events
        
    


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
    Generates 2 complete sentences that don't end abruptly
    """
    cleaned_event = event.copy()
    
    # Format date
    event_date = extract_event_date(event)
    cleaned_event['date'] = event_date
    
    # Preserve improved eventType and eventName if available
    event_type = event.get('eventType', 'Legal Event')
    event_name = event.get('eventName', event_type)
    
    # Generate a basic summary from context - ensure 2 complete sentences
    context = event.get('context', '')
    if context:
        # Clean context first
        clean_context = context.replace('--- PAGE BREAK ---', ' ').replace('PAGE BREAK', ' ')
        clean_context = re.sub(r'MANU/[^\s]+', '', clean_context)  # Remove citations
        clean_context = re.sub(r'https?://\S+', '', clean_context)  # Remove URLs
        clean_context = ' '.join(clean_context.split())  # Normalize whitespace
        
        lines = []
        
        # Extract date references
        date_match = re.search(r'(\d{1,2}\.\d{1,2}\.\d{4})', clean_context)
        extracted_date = date_match.group(1) if date_match else event_date
        
        # Extract amounts (complete, not truncated)
        amount_matches = re.findall(r'Rs\.\s*([0-9,]+(?:\.[0-9]+)?)', clean_context)
        amounts_list = [f"Rs. {amt}" for amt in amount_matches[:2]]  # Limit to 2 amounts
        
        # Extract section references (complete)
        section_match = re.search(r'Section\s+(\d+(?:[A-Za-z])?)', clean_context, re.IGNORECASE)
        section_ref = section_match.group(0) if section_match else ""
        
        # Build first sentence - what happened
        first_parts = []
        if extracted_date:
            first_parts.append(f"On {extracted_date}")
        
        # Identify court
        court_name = None
        if 'family court' in clean_context.lower():
            court_name = "the Family Court"
        elif 'supreme court' in clean_context.lower() or ' sc ' in clean_context.lower():
            court_name = "the Supreme Court"
        elif 'high court' in clean_context.lower() or ' hc ' in clean_context.lower():
            court_name = "the High Court"
        elif 'court' in clean_context.lower():
            court_name = "the Court"
        
        # Identify action
        action = None
        if 'awarded' in clean_context.lower() or 'award' in clean_context.lower():
            action = "awarded"
        elif 'directed' in clean_context.lower() or 'direction' in clean_context.lower():
            action = "directed"
        elif 'ordered' in clean_context.lower() or 'order' in clean_context.lower():
            action = "ordered"
        elif 'amended' in clean_context.lower() or 'amendment' in clean_context.lower():
            action = "amended"
        elif 'filed' in clean_context.lower() or 'filing' in clean_context.lower():
            action = "filed"
        elif 'decided' in clean_context.lower() or 'decision' in clean_context.lower():
            action = "decided"
        
        # Build first sentence
        if court_name and action:
            first_parts.append(f"{court_name} {action}")
        elif action:
            first_parts.append(f"{action}")
        
        # Add event type if relevant
        if 'maintenance' in clean_context.lower():
            if 'interim' in clean_context.lower():
                first_parts.append("interim maintenance")
            else:
                first_parts.append("maintenance")
        elif section_ref:
            first_parts.append(section_ref)
        
        if first_parts:
            first_sentence = ' '.join(first_parts) + "."
            # Ensure it ends with period
            if not first_sentence.rstrip().endswith('.'):
                first_sentence = first_sentence.rstrip() + '.'
            lines.append(first_sentence)
        else:
            lines.append(f"Event occurred on {extracted_date}.")
        
        # Build second sentence - key details
        second_parts = []
        
        # Add amounts if available
        if amounts_list:
            if len(amounts_list) == 1:
                second_parts.append(f"The amount awarded was {amounts_list[0]}.")
            else:
                second_parts.append(f"Amounts involved were {', '.join(amounts_list[:-1])} and {amounts_list[-1]}.")
        
        # Add section if not already mentioned
        elif section_ref and section_ref not in lines[0]:
            second_parts.append(f"This relates to {section_ref} of the relevant Act.")
        
        # Add period information for maintenance
        elif 'maintenance' in clean_context.lower():
            period_match = re.search(r'(?:from|since|w\.e\.f\.|with effect from)\s+(\d{1,2}\.\d{1,2}\.\d{4})', clean_context, re.IGNORECASE)
            if period_match:
                period_date = period_match.group(1)
                second_parts.append(f"This order was effective from {period_date}.")
            else:
                second_parts.append("This was a maintenance-related order.")
        
        # Generic fallback for second sentence
        if not second_parts:
            if 'arrears' in clean_context.lower():
                second_parts.append("The matter involved payment of arrears.")
            elif 'compliance' in clean_context.lower() or 'affidavit' in clean_context.lower():
                second_parts.append("This involved compliance or filing requirements.")
            else:
                second_parts.append("See context for additional details.")
        
        lines.append(second_parts[0] if second_parts else "See context for additional details.")
        
        # Ensure exactly 2 sentences
        cleaned_event['summary'] = '\n'.join(lines[:2])
    
    else:
        # No context available
        cleaned_event['summary'] = f"Event occurred on {event_date}.\nSee context for details."
    
    cleaned_event['eventType'] = event_type
    cleaned_event['eventName'] = event_name
    
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
        
        # Get the timeline events - support multiple input formats
        timeline = input_data.get('timeline', input_data.get('events', []))
        
        # If timeline is empty or not a list, try to extract events from other structures
        if not timeline:
            if isinstance(input_data, list):
                timeline = input_data
            else:
                json.dump({'error': 'No timeline events provided', 'refactored': []}, sys.stdout)
                return
        
        if not isinstance(timeline, list):
            json.dump({'error': 'Timeline must be a list of events', 'refactored': []}, sys.stdout)
            return
        
        if len(timeline) == 0:
            json.dump({'error': 'Empty timeline provided', 'refactored': []}, sys.stdout)
            return
        
        # Configure Gemini
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("Warning: No GEMINI_API_KEY found, using manual cleaning", file=sys.stderr)
            # Fallback to manual cleaning if no API key
            improved_timeline = [clean_event_manually(event) for event in timeline]
        else:
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                improved_timeline = process_timeline_with_gemini(timeline, model)
            except Exception as e:
                print(f"Gemini processing failed: {e}, falling back to manual cleaning", file=sys.stderr)
                # Fallback to manual cleaning
                improved_timeline = [clean_event_manually(event) for event in timeline]
        
        # Output the result - use 'refactored' key for compatibility
        output = {
            'refactored': improved_timeline,
            'timeline': improved_timeline,  # Also include 'timeline' for compatibility
            'original_count': len(timeline),
            'improved_count': len(improved_timeline),
        }
        
        json.dump(output, sys.stdout, indent=2)
        
    except json.JSONDecodeError as e:
        json.dump({'error': f'Invalid JSON input: {e}', 'refactored': []}, sys.stdout)
    except Exception as e:
        json.dump({'error': f'Processing error: {e}', 'refactored': []}, sys.stdout)


if __name__ == '__main__':
    main()
