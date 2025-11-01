#!/usr/bin/env python3
"""
Test date extraction patterns directly
"""

from timeline_analyzer import DateExtractor
from datetime import datetime

def test_date_patterns():
    """Test specific date patterns"""
    
    test_texts = [
        "04.11.2020",  # Indian format
        "Decided On: 04.11.2020",  # With context
        "Criminal Appeal No. 730 of 2020",  # With year but not a date
        "15/01/2024",  # EU format
        "01/15/2024",  # US format  
        "January 15, 2024",  # Written format
        "15 January 2024",  # EU written format
        "2024-01-15",  # ISO format
    ]
    
    print("=== TESTING DATE EXTRACTION PATTERNS ===")
    
    for i, text in enumerate(test_texts, 1):
        print(f"\nTest {i}: '{text}'")
        dates_found = DateExtractor.extract_dates_from_text(text)
        print(f"  Found {len(dates_found)} dates:")
        for date_obj, context, line_num in dates_found:
            print(f"    Date: {date_obj.strftime('%Y-%m-%d')}, Context: '{context}', Line: {line_num}")
    
    # Test with the actual court case text
    court_text = """MANU/SC/0833/2020
IN THE SUPREME COURT OF INDIA
Criminal Appeal No. 730 of 2020 (Arising out of SLP (Crl.) No. 9503 of 2018)
Decided On: 
04.11.2020
Appellants: 
Rajnesh"""
    
    print(f"\n=== TESTING COURT CASE TEXT ===")
    dates_found = DateExtractor.extract_dates_from_text(court_text)
    print(f"Found {len(dates_found)} dates:")
    for date_obj, context, line_num in dates_found:
        print(f"  Date: {date_obj.strftime('%Y-%m-%d')}, Context: '{context}', Line: {line_num}")

if __name__ == "__main__":
    test_date_patterns()