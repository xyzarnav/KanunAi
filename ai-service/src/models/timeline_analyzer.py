"""
Timeline Analyzer for Legal Documents
Extracts dates and events from legal documents and generates deterministic timelines
"""

import re
import json
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict
from pathlib import Path

try:
    from langchain_community.document_loaders import PyPDFLoader
except ImportError:
    # Fallback for pdf extraction
    from pypdf import PdfReader
    
    class PyPDFLoader:
        """Fallback PDF loader"""
        def __init__(self, file_path):
            self.file_path = file_path
        
        def load(self):
            from langchain.docstore.document import Document
            reader = PdfReader(self.file_path)
            documents = []
            for page in reader.pages:
                text = page.extract_text()
                documents.append(Document(page_content=text))
            return documents


class DateExtractor:
    """Extract and parse dates from legal documents with high accuracy"""
    
    # Comprehensive regex patterns for date formats
    DATE_PATTERNS = {
        # ISO format: 2024-01-15
        'iso': r'\b(\d{4})-(\d{2})-(\d{2})\b',
        # US format: 01/15/2024 or 1/15/2024
        'us_slash': r'\b([01]?\d)/([0-3]?\d)/(\d{4})\b',
        # US format: 01-15-2024 or 1-15-2024
        'us_dash': r'\b([01]?\d)-([0-3]?\d)-(\d{4})\b',
        # UK/EU format: 15/01/2024 or 15-01-2024
        'eu_slash': r'\b([0-3]?\d)/([01]\d)/(\d{4})\b',
        'eu_dash': r'\b([0-3]?\d)-([01]\d)-(\d{4})\b',
        # Indian legal format: 04.11.2020 (dd.mm.yyyy)
        'indian_dot': r'\b([0-3]?\d)\.([01]?\d)\.(\d{4})\b',
        # Written dates: January 15, 2024 or Jan. 15, 2024
        'written_long': r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b',
        'written_short': r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[.]*\s+(\d{1,2}),?\s+(\d{4})\b',
        # Written format: 15 January 2024 or 15 Jan 2024
        'written_eu': r'\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[.]*\s+(\d{4})\b',
    }
    
    MONTH_MAP = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
        'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'jun': 6, 'jul': 7, 'aug': 8,
        'sep': 9, 'sept': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }
    
    EVENT_KEYWORDS = {
        'filing': [
            'appeal was filed', 'petition filed', 'complaint filed', 'application filed',
            'suit filed', 'case filed', 'filed on', 'filing', 'submitted', 'lodged', 'registered',
            'date of filing', 'filing date', 'instituted', 'commenced', 'initiated',
            'presented', 'preferred', 'petition instituted', 'case instituted'
        ],
        'hearing': [
            'matter was heard', 'case heard', 'heard on', 'hearing', 'trial', 'oral argument', 
            'hearing date', 'trial date', 'scheduled', 'appearing before', 'date of hearing', 
            'court hearing', 'proceedings', 'before the court', 'listed', 'matter listed', 
            'court proceedings', 'arguments heard', 'submissions heard'
        ],
        'judgment': [
            'judgment delivered', 'judgment was delivered', 'final judgment', 'decided on', 
            'judgment', 'verdict', 'decision', 'order', 'decreed', 'decided',
            'pronounced', 'rendered', 'delivered', 'date of judgment', 
            'judgment pronounced', 'final order', 'disposed', 'disposed of',
            'final disposal', 'court ordered', 'court directed', 'directions issued',
            'judgment passed', 'order passed'
        ],
        'appeal': [
            'appeal', 'appellate', 'appealed', 'appeal filed', 'appeal period', 'date of appeal',
            'revision', 'review', 'writ petition', 'special leave petition', 'slp filed',
            'review petition', 'appellate proceedings', 'second appeal', 'regular appeal',
            'criminal appeal', 'civil appeal', 'letters patent appeal', 'lpa filed'
        ],
        'settlement': [
            'settlement', 'settled', 'compromise', 'agreed', 'agreement date', 'settlement date',
            'mutual agreement', 'resolved', 'amicably settled', 'mediation', 'conciliation',
            'parties settled', 'matter settled', 'settlement deed', 'compromise deed',
            'terms of settlement', 'mutual consent'
        ],
        'dismissal': [
            'dismissed', 'dismissal', 'withdrawn', 'withdrawn case', 'struck off',
            'quashed', 'canceled', 'cancellation', 'petition dismissed', 'suit dismissed',
            'case dismissed', 'appeal dismissed', 'review dismissed', 'revision dismissed',
            'disposed as withdrawn', 'withdrawn by petitioner'
        ],
        'interim': [
            'interim order', 'stay', 'injunction', 'restraining order', 'temporary',
            'preliminary', 'interlocutory', 'interim relief', 'ad-interim', 'interim stay',
            'interim protection', 'temporary injunction', 'status quo', 'ex-parte',
            'interim arrangement', 'interim measures', 'interim directions'
        ],
        'adjournment': [
            'adjourned', 'postponed', 'deferred', 'adjournment date', 'next date',
            'date of adjournment', 'matter adjourned', 'hearing adjourned', 'stands over',
            'next hearing', 'further hearing', 'listed for', 'to come up on',
            'put up on', 'posted to'
        ]
    }
    
    @classmethod
    def _parse_numeric_date(cls, groups: Tuple[str, ...], format_key: str) -> Optional[datetime]:
        """Parse numeric date formats (ISO, US, EU, Indian)"""
        try:
            if format_key == 'iso':
                year, month, day = groups
            elif format_key in ('us_slash', 'us_dash'):
                month, day, year = groups
            else:  # eu formats and indian_dot format
                day, month, year = groups
            return datetime(int(year), int(month), int(day))
        except (ValueError, TypeError):
            return None
    
    @classmethod
    def _parse_written_date(cls, groups: Tuple[str, ...], format_key: str) -> Optional[datetime]:
        """Parse written date formats (Jan 15, 2024 style)"""
        try:
            if format_key == 'written_eu':
                day, month_str, year = groups
            else:
                month_str, day, year = groups
            
            month_str_clean = month_str.rstrip('.')
            month = cls.MONTH_MAP.get(month_str_clean.lower(), 0)
            return datetime(int(year), month, int(day)) if month > 0 else None
        except (ValueError, TypeError):
            return None
    
    @classmethod
    def normalize_date_string(cls, date_str: str, pattern_type: str) -> Optional[datetime]:
        """Convert extracted date string to datetime object"""
        try:
            match = re.search(cls.DATE_PATTERNS[pattern_type], date_str, re.IGNORECASE)
            if not match:
                return None
            
            groups = match.groups()
            
            # Numeric formats
            if pattern_type in ('iso', 'us_slash', 'us_dash', 'eu_slash', 'eu_dash', 'indian_dot'):
                return cls._parse_numeric_date(groups, pattern_type)
            
            # Written formats
            if pattern_type in ('written_long', 'written_short', 'written_eu'):
                return cls._parse_written_date(groups, pattern_type)
            
            return None
        except Exception:
            return None
    
    @classmethod
    def _extract_dates_from_line(cls, line: str, line_num: int) -> List[Tuple[datetime, str, int]]:
        """Extract all dates from a single line"""
        line_dates = []
        for pattern_type, pattern in cls.DATE_PATTERNS.items():
            matches = re.finditer(pattern, line, re.IGNORECASE)
            for match in matches:
                date_obj = cls.normalize_date_string(match.group(0), pattern_type)
                if date_obj and 1900 <= date_obj.year <= 2100:
                    line_dates.append((date_obj, line.strip(), line_num))
        return line_dates
    
    @classmethod
    def _expand_context(cls, lines: List[str], target_line_num: int, window: int = 2) -> str:
        """Expand context around a date by including surrounding lines"""
        start_idx = max(0, target_line_num - 1 - window)
        end_idx = min(len(lines), target_line_num + window)
        context_lines = lines[start_idx:end_idx]
        return ' '.join(line.strip() for line in context_lines if line.strip())
    
    @classmethod
    def extract_dates_from_text(cls, text: str) -> List[Tuple[datetime, str, int]]:
        """Extract all dates from text with line numbers and expanded context"""
        dates_found: List[Tuple[datetime, str, int]] = []
        lines = text.split('\n')
        seen_dates = set()  # Track unique date + context combinations

        HEADER_PATTERNS = [
            r'www\.manupatra\.com',
            r'Page \d+ of \d+',
            r'\(\s*Page \d+ of \d+\s*\)',
            r'Library \w+',
            r'©.*All rights reserved',
            r'https?://.*',
            r'\[.*\d+.*\].*\d{4}', # References and citations
            r'\d{4}\s+\(\d+\)\s+\w+', # Case citation formats 
            r'.*Manu/.*\d{4}', # Manupatra citation formats
        ]

        for line_num, line in enumerate(lines, 1):
            # Skip very long lines or header-like lines early
            if len(line) > 1000 or any(re.search(pattern, line, re.IGNORECASE) for pattern in HEADER_PATTERNS):
                continue

            # Get dates from line
            line_dates = cls._extract_dates_from_line(line, line_num)

            # Expand context and filter duplicates
            for date_obj, context, num in line_dates:
                # Use expanded context for better classification
                expanded_context = cls._expand_context(lines, num, window=2)
                date_ctx_key = (date_obj.isoformat(), expanded_context)
                if date_ctx_key not in seen_dates:
                    seen_dates.add(date_ctx_key)
                    dates_found.append((date_obj, expanded_context, num))

        # If nothing found with strict, line-based scanning, use a looser pass
        if not dates_found:
            loose = cls._find_dates_loose(text)
            # avoid duplicates
            for date_obj, context in loose:
                key = (date_obj.isoformat(), context)
                if key not in seen_dates:
                    seen_dates.add(key)
                    # line number unknown for loose matches -> use 0
                    dates_found.append((date_obj, context, 0))

        return dates_found

    @classmethod
    def _find_dates_loose(cls, text: str) -> List[Tuple[datetime, str]]:
            """Fallback looser extraction across the whole document.
            Finds common date-like substrings and returns (datetime, context)
            """
            loose_results: List[Tuple[datetime, str]] = []
            # broader patterns combining month names or numeric patterns
            loose_patterns = [
                # Full written month name
                r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}',
                # Abbrev month
                r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4}',
                # ISO / numeric sequences
                r'\b\d{4}-\d{2}-\d{2}\b',
                r'\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b',
                # Month Year (e.g., January 2024)
                r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}',
            ]

            for pat in loose_patterns:
                for m in re.finditer(pat, text, re.IGNORECASE):
                    snippet_start = max(0, m.start() - 60)
                    snippet_end = min(len(text), m.end() + 60)
                    context = text[snippet_start:snippet_end].strip().replace('\n', ' ')
                    # try to normalize by testing each known pattern type
                    date_obj = None
                    # try each DATE_PATTERNS to normalize
                    for ptype in cls.DATE_PATTERNS.keys():
                        candidate = m.group(0)
                        parsed = cls.normalize_date_string(candidate, ptype)
                        if parsed:
                            date_obj = parsed
                            break

                    # as a last resort, try parsing via datetime from known formats
                    if not date_obj:
                        try:
                            # Try common numeric ordering heuristics
                            candidate = m.group(0)
                            # replace slashes with dashes for datetime.fromisoformat attempt where possible
                            c = candidate.replace('/', '-').replace('.', '')
                            # try yyyy-mm-dd first
                            if re.match(r'^\d{4}-\d{2}-\d{2}$', c):
                                date_obj = datetime.fromisoformat(c)
                            else:
                                # try parse month name formats - let datetime try
                                date_obj = datetime.strptime(candidate, '%B %d, %Y')
                        except Exception:
                            date_obj = None

                    if date_obj and 1900 <= date_obj.year <= 2100:
                        loose_results.append((date_obj, context))

            # deduplicate by iso+context prefix
            unique = []
            seen = set()
            for d, c in loose_results:
                k = (d.isoformat(), c[:120])
                if k not in seen:
                    seen.add(k)
                    unique.append((d, c))

            return unique
    
    EVENT_VALIDATORS = {
        'filing': [
            'date of filing', 'filed on', 'submitted on', 'instituted on',
            'petition filed on', 'application filed on', 'case filed on',
            'complaint filed on', 'suit filed on', 'date when'
        ],
        'hearing': [
            'heard by', 'heard on', 'hearing held', 'hearing date',
            'appeared before', 'appeared on', 'court hearing on',
            'matter heard on', 'case heard on', 'came up for hearing'
        ],
        'judgment': [
            'judgment dated', 'decided on', 'order dated', 'ordered on',
            'delivered on', 'pronounced on', 'directed on', 'disposed of on',
            'judgment was passed', 'order was passed', 'final order dated'
        ],
        'appeal': [
            'appeal filed on', 'appealed on', 'appeal dated',
            'revision filed on', 'slp filed on', 'special leave filed',
            'appeal preferred on', 'review filed on', 'writ petition filed'
        ],
        'settlement': [
            'settled on', 'compromised on', 'settlement dated', 
            'mediated on', 'resolved on', 'mutually agreed on',
            'parties settled on', 'settlement recorded on'
        ],
        'dismissal': [
            'dismissed on', 'withdrawn on', 'disposed of on',
            'struck off on', 'dismissed by', 'dismissed with',
            'petition dismissed on', 'appeal dismissed on'
        ],
        'interim': [
            'interim order dated', 'stay granted on', 'injunction dated',
            'temporary relief on', 'interim relief granted',
            'stay order dated', 'temporary injunction on'
        ],
        'adjournment': [
            'adjourned to', 'postponed to', 'deferred to',
            'next hearing on', 'listed for', 'matter posted to',
            'hearing posted to', 'to come up on', 'put up for'
        ]
    }
    
    FILLER_WORDS = {'page', 'of', 'www', 'com', 'library'}
    
    @classmethod 
    def _is_filler_context(cls, words: set[str]) -> bool:
        """Check if context only contains filler words"""
        # More comprehensive filler word detection
        filler_patterns = [
            r'page \d+',
            r'copyright',
            r'all rights reserved',
            r'library',
            r'www\.',
            r'http',
            r'citation',
            r'reference',
            r'annexure',
            r'appendix'
        ]
        text = ' '.join(words)
        return any(re.search(pattern, text, re.IGNORECASE) for pattern in filler_patterns)
    
    @classmethod
    def _validate_event_type(cls, event_type: str, context: str) -> bool:
        """Validate event type with additional context if needed"""
        # Skip validation for 'other' type
        if event_type == 'other':
            return True
            
        # Be more permissive - if we have keywords, trust the classification
        if event_type not in cls.EVENT_VALIDATORS:
            return True
        
        # First check if it's not a header
        header_indicators = [
            'page', 'of', 'www', '.com', 'manu', 'citation',
            'reference', '©', 'copyright', 'library', 'annexure',
            'appendix', 'exhibit', 'section', 'para'
        ]
        
        # More comprehensive header detection
        header_patterns = [
            r'page \d+',
            r'copyright',
            r'all rights reserved',
            r'library',
            r'www\.',
            r'http',
            r'citation',
            r'reference',
            r'annexure',
            r'appendix',
            r'\d+\s*of\s*\d+',  # Page numbers
            r'exhibit\s+[a-z\d]',
            r'section\s+\d+',
            r'para\s+\d+'
        ]
        
        is_header = any(w in context.lower() for w in header_indicators) or \
                   any(re.search(pattern, context, re.IGNORECASE) for pattern in header_patterns)
                   
        if is_header:
            return False
            
        # For legal documents, be more permissive about context validation
        # If we found keywords, it's likely a valid event
        return True
    
    @classmethod
    def classify_event_type(cls, context_line: str) -> str:
        """Classify event type based on surrounding context"""
        context_lower = context_line.lower()
        words = set(context_lower.split())
        
        if cls._is_filler_context(words):
            return 'other'
        
        # Check for event type indicators - prioritize more specific matches
        scores = {}
        for event_type, keywords in cls.EVENT_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                if keyword in context_lower:
                    # Longer keywords get higher scores
                    score += len(keyword.split())
            if score > 0:
                scores[event_type] = score
        
        # Return the event type with highest score
        if scores:
            best_type = max(scores.items(), key=lambda x: x[1])[0]
            if cls._validate_event_type(best_type, context_lower):
                return best_type
        
        return 'other'


class TimelineAnalyzer:
    """Generate deterministic timelines from extracted dates"""
    
    def __init__(self):
        self.extractor = DateExtractor()
        self.cache = {}
    
    # Use DateExtractor's EVENT_KEYWORDS for consistency
    EVENT_KEYWORDS = DateExtractor.EVENT_KEYWORDS
    
    def load_document(self, pdf_path: str) -> str:
        """Load PDF document text with caching"""
        cache_path = Path(pdf_path).with_suffix('.cache.json')
        
        if cache_path.exists():
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('document_text', '')
        
        try:
            loader = PyPDFLoader(pdf_path)
            documents = loader.load()
            text = "\n\n--- PAGE BREAK ---\n\n".join(
                [doc.page_content for doc in documents]
            )
            
            # Cache the text
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump({'document_text': text}, f)
            
            return text
        except Exception as e:
            raise ValueError(f"Failed to load PDF: {str(e)}")
    
    def _classify_event(self, context_line: str) -> str:
        """Classify an event based on its context"""
        
        event_type = 'Other'
        max_keyword_count = 0
        
        for typ, keywords in self.EVENT_KEYWORDS.items():
            # Count matching keywords
            keyword_count = sum(1 for k in keywords if k.lower() in context_line.lower())
            if keyword_count > max_keyword_count:
                if DateExtractor._validate_event_type(typ, context_line):
                    event_type = typ.title()
                    max_keyword_count = keyword_count
                    
        return event_type
        
    def _create_event(self, date_obj: datetime, context_line: str, line_num: int, idx: int = 1) -> Dict[str, Any]:
        """Create a single event entry"""
        event_type = self._classify_event(context_line)
        event_id = f"{date_obj.isoformat()}_{idx}"
        event_name = f"{event_type}"
        
        if idx > 1:
            event_name += f" ({idx})"
            
        return {
            'id': event_id,
            'eventName': event_name,
            'date': date_obj.isoformat(),
            'eventType': event_type,
            'context': context_line,
            'lineNumber': line_num
        }
        
    def extract_timeline_events(self, text: str) -> List[Dict[str, Any]]:
        """Extract all events from document with deterministic sorting"""
        
        # Extract all dates using class method
        dates_with_context = DateExtractor.extract_dates_from_text(text)
        
        if not dates_with_context:
            return []
        
        # Filter and classify events
        valid_events = []
        for date_obj, context_line, line_num in dates_with_context:
            if DateExtractor._is_filler_context({word.lower() for word in context_line.split()}):
                continue
            valid_events.append((date_obj, context_line, line_num))
        
        # Sort by date, then line number for determinism
        valid_events.sort(key=lambda x: (x[0], x[2]))
        
        # Create final event list with proper indexing
        events = []
        current_date = None
        date_index = 0
        
        for date_obj, context_line, line_num in valid_events:
            # Reset counter for new date
            if date_obj != current_date:
                current_date = date_obj
                date_index = 1
            
            event = self._create_event(date_obj, context_line, line_num, date_index)
            events.append(event)
            
            date_index += 1
            
        return events
        

    
    def analyze_document(self, pdf_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
        """Complete timeline analysis for a document"""
        
        try:
            # Load document
            text = self.load_document(pdf_path)
            
            # Extract events
            events = self.extract_timeline_events(text)
            
            # Create summary statistics
            summary = {
                'total_events': len(events),
                'event_types': self._count_event_types(events),
                'date_range': self._get_date_range(events),
                'first_event': events[0] if events else None,
                'last_event': events[-1] if events else None,
            }
            
            result = {
                'events': events,
                'summary': summary,
                'success': True
            }
            
            # Cache results if output_dir provided
            if output_dir and len(events) > 0:
                cache_file = Path(output_dir) / f"{Path(pdf_path).stem}_timeline.json"
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(result, f, indent=2, default=str)
            
            return result
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'events': [],
                'summary': {}
            }
    
    @staticmethod
    def _count_event_types(events: List[Dict[str, Any]]) -> Dict[str, int]:
        """Count occurrences of each event type"""
        counts = defaultdict(int)
        for event in events:
            counts[event['eventType']] += 1
        return dict(counts)
    
    @staticmethod
    def _get_date_range(events: List[Dict[str, Any]]) -> Dict[str, str]:
        """Get first and last date in timeline"""
        if not events:
            return {'start': None, 'end': None}
        return {
            'start': events[0]['date'],
            'end': events[-1]['date']
        }
