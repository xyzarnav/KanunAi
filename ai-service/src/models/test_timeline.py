#!/usr/bin/env python3
"""
Test full timeline analysis
"""

from timeline_analyzer import TimelineAnalyzer

def test_timeline_analysis():
    """Test complete timeline analysis"""
    
    court_text = """MANU/SC/0833/2020
IN THE SUPREME COURT OF INDIA
Criminal Appeal No. 730 of 2020 (Arising out of SLP (Crl.) No. 9503 of 2018)
Decided On: 
04.11.2020
Appellants: 
Rajnesh
Vs.
Respondent: 
Neha and Ors.
Hon'ble Judges/Coram:
Indu Malhotra and R. Subhash Reddy, JJ.
JUDGMENT
Indu Malhotra, J.

The appeal was filed on 15.03.2019 before this Court.
The matter was heard on 25.09.2020.
Final judgment was delivered on 04.11.2020."""
    
    print("=== TESTING FULL TIMELINE ANALYSIS ===")
    
    analyzer = TimelineAnalyzer()
    events = analyzer.extract_timeline_events(court_text)
    
    print(f"Found {len(events)} events:")
    for event in events:
        print(f"  - {event['eventName']} on {event['date']}")
        print(f"    Type: {event['eventType']}")
        print(f"    Context: {event['context'][:100]}...")
        print()
    
    # Create a full analysis result
    result = {
        'events': events,
        'summary': {
            'total_events': len(events),
            'event_types': analyzer._count_event_types(events),
            'date_range': analyzer._get_date_range(events),
            'first_event': events[0] if events else None,
            'last_event': events[-1] if events else None,
        },
        'success': True
    }
    
    print("=== FULL RESULT ===")
    import json
    print(json.dumps(result, indent=2, default=str))

if __name__ == "__main__":
    test_timeline_analysis()