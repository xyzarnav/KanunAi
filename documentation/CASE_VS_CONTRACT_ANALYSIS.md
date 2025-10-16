# Case Analysis vs Contract Analysis - Feature Comparison

## 🔍 Overview

Both features use the same architecture but analyze different document types:

| Aspect | Case Analysis | Contract Analysis |
|--------|---------------|-------------------|
| **Document Type** | Legal cases, judgments | Contracts, agreements |
| **Purpose** | Understand legal precedents | Identify terms, risks, obligations |
| **Output Type** | Summary + Executive Summary | Report + Executive Summary |
| **Analysis Time** | 2-5 minutes | 1-3 minutes |
| **Main Focus** | Case facts, holdings, precedent | Clauses, financial terms, risks |
| **Python Model** | `case_analysis.py` | `contract_analysis.py` |
| **CLI Wrapper** | `summarize_cli.py` | `contract_analysis_cli.py` |

---

## 📁 Project Structure

### Frontend Components

```
components/
├── case-analysis/
│   ├── CaseInputPanel.tsx
│   ├── CaseSummaryViewer.tsx
│   └── ChatBot.tsx
│
└── contract-analysis/          ← NEW
    ├── ContractInputPanel.tsx
    ├── ContractReportViewer.tsx
    └── ContractChatBot.tsx
```

### Page Routes

```
app/
├── case-analysis/
│   └── page.tsx
│
└── contract-analysis/          ← NEW
    └── page.tsx
```

---

## 🎨 UI/UX Comparison

### Input Panel

**Case Analysis:**
- Case Title
- Legal Issue Description
- Quick question shortcuts
- Document upload (optional)

**Contract Analysis:**
- Contract Title
- Contract Description
- Focus Areas selection
- Document upload (required)

### Report Viewer

**Case Analysis:**
- Single summary view
- Markdown-formatted text
- Download, Print, Copy buttons

**Contract Analysis:**
- **Dual tabs**: Full Report + Executive Summary
- Detailed sections with risk scoring
- Same Download, Print, Copy functionality
- Richer formatting with sections

### Chat Interface

**Both are identical** - same Q&A system with session-based context

---

## 🔄 API Flow Comparison

### Case Analysis Flow
```
1. Frontend → POST /api/analysis/summary
   ├─ file: PDF
   ├─ caseTitle: string
   └─ analysisType: NOT SET

2. Backend → spawn summarize_cli.py
   ├─ Loads PDF
   └─ Runs LegalDocSummarizer

3. Python → Returns JSON
   ├─ executive_summary
   ├─ chunk_summaries
   └─ session

4. Frontend ← Displays summary + enables chat
```

### Contract Analysis Flow
```
1. Frontend → POST /api/analysis/summary
   ├─ file: PDF
   ├─ contractTitle: string
   ├─ contractDescription: string
   ├─ selectedAreas: ["Financial Terms", ...]
   └─ analysisType: "contract"              ← DIFFERENTIATOR

2. Backend → Check analysisType
   ├─ If "contract" → spawn contract_analysis_cli.py
   └─ Else → spawn summarize_cli.py

3. Python → Returns JSON
   ├─ executive_summary
   ├─ comprehensive_report               ← ADDED
   └─ session

4. Frontend ← Displays dual tabs + enables chat
```

---

## 🎯 Key Differences

### Input Validation
```typescript
// Case Analysis
if (!uploadedFile && !legalIssue.trim()) {
  alert('Please upload a file or provide a legal issue');
}

// Contract Analysis
if (!uploadedFile) {
  alert('Please upload a contract PDF');
}
```

### State Management
```typescript
// Case Analysis
const [summaryMd, setSummaryMd] = useState<string>('');

// Contract Analysis
const [reportMd, setReportMd] = useState<string>('');
const [executiveSummary, setExecutiveSummary] = useState<string>('');
const [activeTab, setActiveTab] = useState<'report' | 'summary'>('report');
```

### Response Handling
```typescript
// Case Analysis
const summary = data?.summary ?? '';

// Contract Analysis
const report = data?.report ?? '';
const summary = data?.summary ?? '';
```

---

## 🔧 Backend Changes

### Single Endpoint, Two Analyzers

```typescript
export async function summarizeCase(req: Request, res: Response) {
  const analysisType = req.body?.analysisType; // 'case' or 'contract'
  
  const isContractAnalysis = analysisType === 'contract';
  const cliPath = isContractAnalysis 
    ? 'contract_analysis_cli.py'
    : 'summarize_cli.py';
  
  // Rest of the logic uses appropriate CLI
}
```

**Benefit:** Single API endpoint handles both analysis types

---

## 📊 Floating Dock Integration

### Case Analysis Links
```
/case-analysis → Shows:
- Home
- Profile
- Logout
- Chatbot (Q&A)
- Files
- Analysis
```

### Contract Analysis Links (NEW)
```
/contract-analysis → Shows:
- Home
- Profile
- Logout
- Q&A (Questions)
- Report
- Files
```

**Event Listeners:**
```typescript
// Case Analysis
window.addEventListener('open-case-chatbot', handler);

// Contract Analysis
window.addEventListener('open-contract-analysis', handler);
```

---

## 🚀 How to Switch Between Them

### From Home Page
```
Floating Dock Navigation:
- Case Analysis → /case-analysis
- Contract Analysis → /contract-analysis
```

### Programmatic Navigation
```typescript
// Case Analysis
router.push('/case-analysis');

// Contract Analysis
router.push('/contract-analysis');
```

---

## 📋 Feature Checklist

### Both Features Include
✅ PDF document upload  
✅ AI-powered analysis  
✅ Executive summary  
✅ Download/Print/Copy  
✅ Q&A chatbot  
✅ Session-based context  
✅ Error handling  
✅ Loading states  

### Contract Analysis ADDS
✅ Comprehensive detailed report  
✅ Dual-tab interface  
✅ Risk scoring system  
✅ Obligation matrix  
✅ Financial analysis  
✅ Clause-by-clause breakdown  
✅ Negotiation recommendations  

---

## 🔐 Data Flow Security

Both features:
- Upload PDF to backend temporarily
- Process in Python (secure)
- Delete temp file after use
- Return analysis only (no original PDF stored)
- Session ID for Q&A context

---

## 🎓 Analysis Depth Comparison

### Case Analysis
- Focuses on: Facts, Holdings, Precedent
- Sections: ~6-8 main areas
- Typical length: 2,000-3,000 words

### Contract Analysis
- Focuses on: Clauses, Risks, Obligations  
- Sections: ~16 detailed areas
- Typical length: 4,000-6,000 words

---

## 📈 Performance Metrics

### Analysis Time
| Document Type | Size | Time |
|---|---|---|
| Small Contract | 2-5 pages | 1-2 min |
| Large Contract | 10-20 pages | 2-3 min |
| Small Case | 5-10 pages | 2-3 min |
| Large Case | 20-40 pages | 3-5 min |

### File Size Limits
- Maximum: 50MB for both
- Recommended: <20MB for fastest processing
- Supported: PDF only

---

## 🔄 Migration Notes

If you're familiar with Case Analysis, Contract Analysis is:
- **Similar** in structure and flow
- **Different** in depth and detail
- **Enhanced** with risk scoring and dual views
- **Optimized** for contract-specific terminology

---

## 📝 Python Model Comparison

### Case Analysis (`case_analysis.py`)
- Loads PDF pages
- Creates chunks (25 pages each)
- Hierarchical summarization
- Focus: Legal reasoning and precedent

### Contract Analysis (`contract_analysis.py`)
- Loads PDF pages
- Creates chunks (2 pages each)
- Detailed clause analysis
- Focus: Terms, risks, financial impact

---

## ✨ Future Enhancements

Possible additions for both:
- [ ] Side-by-side comparison view
- [ ] Export to different formats (PDF, Word)
- [ ] Template creation from contracts
- [ ] Red-flag alerts during upload
- [ ] Multi-document analysis
- [ ] Team collaboration features
- [ ] Historical analysis tracking

---

**Both features are production-ready and fully integrated!** 🎉
