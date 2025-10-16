# Contract Analysis Feature - Implementation Guide

## Overview
The contract analysis feature has been successfully implemented in the KanunAI application. It provides AI-powered contract review and analysis similar to the case analysis feature.

## Features

### 1. **Contract Upload & Analysis**
- Upload PDF contracts
- Automatic contract title generation from filename
- Optional contract description and notes
- Focus area selection (Financial Terms, Liability & Risk, Termination Clauses, etc.)

### 2. **Comprehensive Analysis**
- Full contract report with detailed analysis
- Executive summary for quick reference
- Risk assessment and identification of critical clauses
- Tab-based report viewer (Full Report / Executive Summary)

### 3. **Interactive Q&A**
- Chat interface for asking questions about the contract
- Real-time answers based on contract analysis
- Reference-based responses

### 4. **Report Export**
- Download as Markdown file
- Print functionality
- Copy to clipboard

## File Structure

### Frontend Components

#### `/frontend/src/app/contract-analysis/page.tsx`
Main page component that orchestrates the contract analysis flow.

**Key Functions:**
- `handleSubmit()` - Handles PDF upload and initiates analysis
- `initializeQA()` - Sets up Q&A system after analysis completes
- Manages state for contract data, report, and chat

#### `/frontend/src/components/contract-analysis/ContractInputPanel.tsx`
Input form component for contract upload and configuration.

**Features:**
- Drag-and-drop file upload
- Contract title input
- Focus areas selection (Financial Terms, Liability & Risk, etc.)
- Additional notes textarea
- Real-time loading animation

#### `/frontend/src/components/contract-analysis/ContractReportViewer.tsx`
Report viewing component with tabbed interface.

**Features:**
- Dual-tab interface (Full Report / Executive Summary)
- Download, Print, Copy buttons
- Markdown rendering
- Beautiful scroll area styling

#### `/frontend/src/components/contract-analysis/ContractChatBot.tsx`
Chat interface for asking questions about the analyzed contract.

**Features:**
- Message history with user/AI avatars
- Real-time responses
- Markdown rendering for formatted answers
- Thinking animation while processing

### Backend

#### `/backend/src/controllers/analysis.controller.ts`
Updated to handle both case and contract analysis.

**Key Changes:**
- `summarizeCase()` now accepts `analysisType` parameter
- Routes to appropriate Python CLI based on type
- Extended timeout for contract analysis (300s)
- Returns both `report` and `summary` for contracts

### AI Service (Python)

#### `/ai-service/src/models/contract_analysis_cli.py`
New CLI wrapper for contract analysis.

**Functions:**
- Accepts PDF or text input
- Calls `ContractAnalyzer` class
- Returns JSON with executive summary, comprehensive report, and session ID

#### `/ai-service/src/models/contract_analysis.py` (Existing)
Core contract analysis engine using Gemini API.

**Analyzes:**
- Parties involved
- Key clauses and terms
- Financial obligations
- Risk factors and red flags
- Termination provisions
- IP rights and confidentiality
- Liability and indemnification

## API Endpoints

### 1. **Upload & Analyze Contract**
```
POST /api/analysis/summary
Content-Type: multipart/form-data

Parameters:
- file: PDF contract file
- contractTitle: string
- contractDescription: string (optional)
- selectedAreas: JSON array of focus areas
- analysisType: "contract" (required)

Response:
{
  "report": "Full contract analysis report (markdown)",
  "summary": "Executive summary (markdown)",
  "session": "Session ID for Q&A"
}
```

### 2. **Initialize Q&A System**
```
POST /api/analysis/init-qa
Content-Type: application/json

Request:
{
  "session": "Session ID from analysis"
}

Response:
{
  "ready": true,
  "session": "Session ID"
}
```

### 3. **Ask Question**
```
POST /api/analysis/chat
Content-Type: application/json

Request:
{
  "session": "Session ID",
  "question": "What are the termination clauses?"
}

Response:
{
  "answer": "Detailed answer based on contract analysis",
  "sources": ["page references"]
}
```

## User Flow

1. **Navigate to Contract Analysis**
   - User clicks "Contract Analysis" from home page
   - Floating dock appears with contract-specific options

2. **Upload Contract**
   - Drag & drop or click to select PDF
   - Auto-fills title from filename
   - Optionally add notes and select focus areas
   - Click "Analyze Contract"

3. **View Results**
   - Full report appears with comprehensive analysis
   - Can switch to executive summary tab
   - Download, print, or copy report

4. **Interactive Q&A**
   - Once analysis completes, Q&A chat becomes available
   - Click Q&A button in floating dock to access chat
   - Ask specific questions about the contract
   - Get AI-powered responses based on analysis

5. **Export or Share**
   - Download as markdown
   - Print for physical reference
   - Copy summary to clipboard

## Configuration

### Environment Variables
Required in `/ai-service/.env`:
```
GEMINI_API_KEY=your_api_key_here
```

### Analysis Parameters
- **Timeout**: 300 seconds (5 minutes) for contract analysis
- **Chunk Size**: 2-3 pages per chunk for optimal analysis
- **Model**: Gemini 2.5 Flash for fast processing

## Integration with Floating Dock

The floating dock (`/frontend/src/components/ui/floating-dock-wrapper.tsx`) has been updated to show contract-specific options:

- **Q&A Button**: Opens chat interface for contract questions
- **Report Button**: Views/downloads the analysis report
- **Files Button**: Access uploaded files
- Shows popup notification if trying to use Q&A before analysis completes

## Error Handling

### Common Issues & Solutions

1. **"Please analyze the document first"**
   - Occurs when trying to use Q&A before analysis completes
   - Solution: Wait for analysis to complete

2. **"File size should be less than 50MB"**
   - Contract PDF exceeds maximum size
   - Solution: Upload smaller PDF or split large contracts

3. **"Analysis failed"**
   - Backend error during analysis
   - Check server logs for details
   - Ensure GEMINI_API_KEY is valid

4. **Q&A not responding**
   - Vector store initialization may be pending
   - Solution: Wait a few seconds and try again

## Performance Considerations

- **Analysis Time**: 2-5 minutes depending on contract length
- **Q&A Latency**: 3-10 seconds per question
- **Memory**: Local embeddings run on CPU (no external API calls)
- **Storage**: Reports saved to `/ai-service/src/output/`

## Future Enhancements

1. **Multi-page PDF summary**
2. **Comparison with standard templates**
3. **Redline suggestions**
4. **Custom risk scoring**
5. **Batch analysis**
6. **Export to Word/PDF**
7. **Integration with email notifications**

## Testing

### Manual Testing Steps
1. Upload a sample contract PDF
2. Verify analysis completes in reasonable time
3. Check report formatting and completeness
4. Test all tab switching (Full Report / Executive Summary)
5. Verify download/print/copy functionality
6. Test Q&A with various questions
7. Verify floating dock integration

### Test Contracts
Sample contracts can be placed in `/ai-service/src/test_pdf/` for testing.

## Support & Troubleshooting

For issues or questions:
1. Check server logs: `backend/logs/`
2. Check Python output: `/ai-service/src/output/`
3. Verify all dependencies installed: `pip install -r requirements.txt`
4. Ensure Python venv is activated
5. Verify GEMINI_API_KEY is correct
