# Timeline Context Refactoring - Implementation Summary

## Overview
The timeline analysis descriptions are now intelligently refactored using Gemini API to convert raw, messy legal document text into concise, meaningful 2-3 line summaries that make sense to users.

## How It Works

### 1. **Frontend Flow** (`CaseTimeline.tsx`)
- Timeline events are extracted from the backend
- Each event's raw `context` is sent to the refactoring API
- Refactored descriptions are cached locally in `refactoredEvents` state
- Events are refactored in batches of 3 for optimal performance
- Timeline Events section displays the refactored descriptions with loading indicators

### 2. **Frontend API** (`/api/analysis/refactor-timeline`)
- Route: `POST /api/analysis/refactor-timeline`
- Accepts: `{ context: string, maxLength?: number }`
- Forwards request to backend for Gemini processing
- Returns: `{ refactored: string, original: string }`

### 3. **Backend Processing** (`analysis.controller.ts`)
New `refactorTimeline` function:
- Receives refactoring request
- Spawns Python CLI (`refactor_timeline_cli.py`)
- Passes context via stdin as JSON
- Returns refactored text or original as fallback
- Handles errors gracefully

### 4. **Python Refactoring** (`refactor_timeline_cli.py`)
Key features:
- Reads JSON input from stdin
- Uses Gemini 2.5-flash model for refactoring
- Intelligent prompt removes:
  - `--- PAGE BREAK ---` markers
  - `Respondent No.2`, `Petitioner` headers
  - Metadata lines (`Date:`, `Page`, `No.`)
  - Manupatra URLs and document markers
- Falls back to manual cleaning if Gemini API fails
- Returns maximum 2 lines of meaningful content
- Uses `temperature=0.3` for consistent, professional output

### 5. **Route Integration** (`analysis.routes.ts`)
- Added route: `POST /api/analysis/refactor-timeline`
- Connects to `refactorTimeline` controller

## Data Flow

```
User views Timeline Events
        ↓
React component loads events
        ↓
For each event with context:
        ↓
Batch refactoring (3 at a time)
        ↓
POST /api/analysis/refactor-timeline
        ↓
Backend: analyzeTimeline controller
        ↓
Spawn Python: refactor_timeline_cli.py
        ↓
Call Gemini API with prompt
        ↓
Get refactored text (2-3 lines max)
        ↓
Return to frontend
        ↓
Cache in refactoredEvents state
        ↓
Display in Timeline Events section
```

## Benefits

✅ **Raw → Refined**: Converts messy PDF text to professional summaries
✅ **Smart Filtering**: Removes all document noise automatically
✅ **Concise**: Maximum 2-3 lines per event
✅ **Meaningful**: Uses Gemini to understand context, not just regex
✅ **Fallback**: Manual cleaning if API fails
✅ **Performance**: Batched requests (3 at a time)
✅ **Caching**: Refactored text cached locally to avoid redundant calls
✅ **Loading States**: Shows "(refactoring...)" indicator while processing

## Files Modified

### Frontend
- `frontend/src/components/case-analysis/CaseTimeline.tsx`
  - Added `refactoredEvents` state
  - Added `refactorContextWithGemini` function
  - Added batch refactoring useEffect
  - Updated Timeline Events display to show refactored text

- `frontend/src/app/api/analysis/refactor-timeline/route.ts` (NEW)
  - Proxy route that forwards to backend

### Backend
- `backend/src/controllers/analysis.controller.ts`
  - Added `refactorTimeline` function

- `backend/src/routes/analysis.routes.ts`
  - Imported `refactorTimeline`
  - Added route: `POST /api/analysis/refactor-timeline`

### AI Service (Python)
- `ai-service/src/models/refactor_timeline_cli.py` (NEW)
  - Main refactoring engine
  - Uses Gemini API or manual fallback
  - Reads/writes JSON

## Example Transformation

**Raw Context (from PDF):**
```
--- PAGE BREAK --- 
Respondent No.2. On 02.09.2013, the wife filed a petition under Section 24 of the Hindu Marriage Act, 1955 for grant of maintenance. The petitioner alleged that...
```

**Refactored Output (2 lines max):**
```
On 02.09.2013, the wife filed a petition under Section 24 of the Hindu Marriage Act for maintenance grant. Alleged husband's financial inability to provide support.
```

## Configuration

No additional configuration needed. Uses existing:
- `GEMINI_API_KEY` from `.env`
- Existing Gemini model: `gemini-2.5-flash`
- Temperature: `0.3` (professional, consistent)
- Max output: `200` tokens

## Testing

1. Upload a case PDF with timeline events
2. Navigate to Case Analysis → Timeline section
3. Observe Timeline Diagram (zoomed to 1000%)
4. Scroll to "Timeline Events" section
5. Wait for events to show "(refactoring...)" indicator
6. Refactored, concise descriptions appear

## Error Handling

- If Gemini API fails: Falls back to manual regex cleaning
- If Python script fails: Returns original context
- Network errors: Graceful degradation with fallback text
- Invalid JSON: Handled with error logging

## Future Enhancements

- Cache refactored descriptions in database for faster loading
- Batch multiple contexts in single API call
- Add user-configurable summary length
- Store refactoring preferences per user
