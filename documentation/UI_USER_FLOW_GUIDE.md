# Contract Analysis - UI & User Flow Guide

## 📱 User Interface Components

### 1. Contract Input Panel
```
┌─────────────────────────────────────────────┐
│  Contract Title (optional)                   │
├─────────────────────────────────────────────┤
│  [Input Field: e.g., "Software License..."] │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Upload Contract PDF                         │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │   📄 Drag here or click to browse     │  │
│  │                                       │  │
│  │   Supports PDF (Max 50MB)             │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  OR (after upload):                          │
│  ┌───────────────────────────────────────┐  │
│  │ 📄 contract.pdf        2.3 MB     ✕   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Focus Areas (optional)                      │
├─────────────────────────────────────────────┤
│  [Financial Terms] [Liability & Risk]       │
│  [Termination Clauses] [Obligations]        │
│  [IP Rights] [Confidentiality]              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Additional Notes (optional)                 │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐  │
│  │ Add any specific concerns or questions│  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ [Back]                    [✨ Analyze...]   │
└─────────────────────────────────────────────┘
```

### 2. Loading State
```
┌─────────────────────────────────────────────┐
│                                              │
│              🔄 Analyzing Document          │
│                                              │
│        KanunAI is analyzing your...          │
│                                              │
│           ● ● ●                             │
│       (animated dots)                        │
│                                              │
└─────────────────────────────────────────────┘
```

### 3. Report Viewer - Tabs View
```
┌─────────────────────────────────────────────┐
│  [Full Report] [Executive Summary]          │
│  ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ [Print] [Copy]              │
├─────────────────────────────────────────────┤
│                                              │
│  # CONTRACT ANALYSIS REPORT                 │
│                                              │
│  ## Executive Summary                       │
│  This contract is a software licensing      │
│  agreement between...                       │
│                                              │
│  ## Parties & Roles                         │
│  - Party A: XYZ Corporation                │
│  - Party B: ABC Inc                        │
│                                              │
│  ## Financial Terms                         │
│  - Annual Fee: $50,000                     │
│  - Payment Terms: Net 30                   │
│  ...                                        │
│                                              │
│  [Scroll for more content]                 │
│                                              │
└─────────────────────────────────────────────┘
```

### 4. Chat Interface
```
┌─────────────────────────────────────────────┐
│  Contract Analysis                          │
│  AI-powered contract Q&A                    │
├─────────────────────────────────────────────┤
│                                              │
│  AI: Hi! Ask me anything about this        │
│      contract...                            │
│                                              │
│                   You: What are the        │
│                   termination clauses?     │
│                                              │
│  AI: The contract can be terminated by    │
│      either party with 30 days notice...  │
│                                              │
│                   You: Any penalties?      │
│                                              │
│  AI: ● ● ●                                 │
│  (thinking animation)                       │
│                                              │
├─────────────────────────────────────────────┤
│  [Type question here...] [→]                │
│  Press Enter to send                        │
└─────────────────────────────────────────────┘
```

### 5. Floating Dock Options
```
While on /contract-analysis page:

┌──────────────┐
│ Home         │
│ Profile      │
│ Logout       │
│ Q&A          │ ← Opens chat (when ready)
│ Report       │ ← Views report
│ Files        │
└──────────────┘

If Q&A not ready yet:
┌─────────────────────────────────────────┐
│ Please analyze the document first       │
└─────────────────────────────────────────┘
(Shows for 2 seconds)
```

---

## 🔄 Complete User Flow

```
START
  │
  ├─→ User navigates to /contract-analysis
  │
  ├─→ ContractInputPanel appears
  │   ├─ Input: Contract title (optional)
  │   ├─ Upload: PDF file (drag & drop)
  │   ├─ Select: Focus areas (optional)
  │   └─ Add: Notes (optional)
  │
  ├─→ User clicks "Analyze Contract"
  │
  ├─→ Loading animation shows
  │   ├─ 🔄 Analyzing Document
  │   ├─ ● ● ● (progress dots)
  │   └─ Duration: 2-5 minutes
  │
  ├─→ Analysis completes
  │   ├─ Executive Summary generated
  │   ├─ Full Report generated
  │   ├─ Session ID created
  │   └─ Vector store initialized
  │
  ├─→ ContractReportViewer appears
  │   ├─ Tab 1: Full Report (selected)
  │   ├─ Tab 2: Executive Summary
  │   ├─ Buttons: Download, Print, Copy
  │   └─ Content: Markdown formatted
  │
  ├─→ Q&A becomes available
  │   └─ Floating dock shows Q&A button
  │
  ├─→ User can:
  │   ├─ Read the report
  │   ├─ Switch tabs
  │   ├─ Download/Print report
  │   ├─ Ask questions via chat
  │   └─ Navigate away
  │
  └─→ END

ALTERNATE FLOW - Q&A Usage:
  │
  ├─→ User clicks Q&A button (floating dock)
  │
  ├─→ ContractChatBot opens
  │   ├─ Shows welcome message
  │   ├─ Message input field
  │   └─ Message history area
  │
  ├─→ User types question
  │   └─ Clicks Send (or presses Enter)
  │
  ├─→ Message shows in chat
  │   └─ "You: What are the payment terms?"
  │
  ├─→ AI processes question
  │   ├─ Shows thinking animation
  │   ├─ Searches relevant sections
  │   └─ Duration: 3-10 seconds
  │
  ├─→ AI response appears
  │   └─ Formatted with markdown
  │
  ├─→ User can:
  │   ├─ Ask more questions
  │   ├─ Continue conversation
  │   └─ Return to report
  │
  └─→ END
```

---

## 📊 State Transitions

### Main Page States
```
┌─────────────────┐
│   INIT STATE    │ (form visible)
│ (empty report)  │
└────────┬────────┘
         │
         ├─ User uploads file
         │
         ▼
┌─────────────────┐
│  ANALYZING      │ (loading overlay, form hidden)
│ (progress: 0%)  │
└────────┬────────┘
         │
         ├─ 2-5 minutes...
         │
         ▼
┌─────────────────┐
│  COMPLETE       │ (report visible, form hidden)
│ (progress: 100%)│
└────────┬────────┘
         │
         ├─ Chat becomes available
         │
         ▼
┌─────────────────┐
│  READY FOR Q&A  │ (chat accessible)
│ (session ready) │
└─────────────────┘
```

### Chat States
```
┌──────────────────────┐
│  WAITING FOR INPUT   │
│ (input field active) │
└────────┬─────────────┘
         │
         ├─ User types message
         │
         ▼
┌──────────────────────┐
│  MESSAGE SENT        │
│ (user msg visible)   │
└────────┬─────────────┘
         │
         ├─ Message added to history
         │
         ▼
┌──────────────────────┐
│  PROCESSING          │
│ (thinking animation) │
└────────┬─────────────┘
         │
         ├─ AI generates response
         │
         ▼
┌──────────────────────┐
│  RESPONSE RECEIVED   │
│ (AI msg visible)     │
└────────┬─────────────┘
         │
         ├─ Return to waiting state
         │
         ▼
┌──────────────────────┐
│  WAITING FOR INPUT   │
└──────────────────────┘
```

---

## 🎨 Color Guide

| Element | Color | Use |
|---------|-------|-----|
| Primary Button | Blue (`#3b82f6`) | Analyze, Send, Submit |
| Secondary Button | Gray | Back, Cancel |
| Success State | Green | ✓ Complete |
| Error State | Red | ✗ Failed |
| Loading | Blue | Animation |
| Tab Active | Blue | Selected tab |
| Tab Inactive | Gray | Unselected tab |
| User Message | Blue | Chat bubble |
| AI Message | Gray | Chat bubble |

---

## 📐 Responsive Layout

### Desktop (lg screens)
```
┌──────────────────────────────────────────┐
│  Input Panel    │    Report Viewer       │
│  (40%)          │    (60%)               │
│                 │                        │
│  - Title input  │  - Full report         │
│  - Upload area  │  - Tabs navigation     │
│  - Options      │  - Action buttons      │
│  - Submit btn   │  - Content area        │
└──────────────────────────────────────────┘
```

### Mobile (sm/md screens)
```
┌────────────────────┐
│   Input Panel      │
│   (100%)           │
│                    │
│  - Title input     │
│  - Upload area     │
│  - Options         │
│  - Submit btn      │
├────────────────────┤
│  Report Viewer     │
│  (100%)            │
│                    │
│  - Tabs            │
│  - Buttons         │
│  - Content         │
└────────────────────┘
```

---

## 🔐 Permission Flow

```
User Navigation:
  ├─ /contract-analysis → Allowed (public)
  ├─ Floating dock Q&A → Allowed (public)
  ├─ Chat interface → Allowed (public)
  └─ Download/Print → Allowed (public)

Backend Validation:
  ├─ PDF upload → Size < 50MB, Type = PDF
  ├─ Analysis → API key required
  ├─ Q&A init → Session must exist
  └─ Chat → Session must be valid
```

---

## 🎯 Key Interaction Points

### 1. File Upload
- **Trigger**: Click or drag-drop
- **Validation**: File type, size
- **Feedback**: File preview with name & size

### 2. Analysis Submission
- **Trigger**: Click "Analyze Contract"
- **Validation**: File must be uploaded
- **Feedback**: Loading animation + estimated time

### 3. Report Tabs
- **Trigger**: Click tab header
- **Effect**: Instant tab switching
- **Content**: Dynamic based on tab

### 4. Export Actions
- **Download**: Creates markdown file
- **Print**: Opens print dialog
- **Copy**: Copies to clipboard with notification

### 5. Chat Interaction
- **Trigger**: Type + Enter or click Send
- **Validation**: Non-empty message
- **Feedback**: Message appears, loading animation

---

## ⚡ Performance Metrics

| Action | Typical Time |
|--------|------|
| Page Load | < 1s |
| File Upload | < 5s |
| Contract Analysis | 2-5 min |
| Vector Store Init | 30-60s |
| Q&A Response | 3-10s |
| Tab Switch | < 100ms |
| Download | < 1s |

---

## 🚨 Error States

### Upload Errors
```
❌ File is not PDF
❌ File exceeds 50MB
❌ Upload failed, try again
```

### Analysis Errors
```
❌ Analysis failed - server error
❌ Analysis timeout - try smaller file
❌ API rate limit - try again later
```

### Q&A Errors
```
❌ Please analyze first
❌ Session not found
❌ Q&A not ready yet
```

---

This document provides a complete visual reference for the Contract Analysis UI and user experience.
