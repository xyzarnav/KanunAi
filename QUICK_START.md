# Contract Analysis - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Python 3.8+ with virtual environment activated
- GEMINI_API_KEY from Google Generative AI

---

## 1️⃣ Setup (First Time Only)

### Backend Setup
```bash
cd backend
npm install
npm start
```
Server runs on `http://localhost:8000`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:3000`

### Python Setup
```bash
cd ai-service
# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows
# or source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

---

## 2️⃣ Configure Environment

### Create `.env` in ai-service directory:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 3️⃣ Run Application

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to**: `http://localhost:3000`

---

## 4️⃣ Use Contract Analysis

### Step 1: Navigate
- Click **"Contract Analysis"** from home page
- Or go directly to: `http://localhost:3000/contract-analysis`

### Step 2: Upload
- Drag & drop a PDF contract, or click to browse
- Title auto-fills from filename
- (Optional) Add notes or select focus areas

### Step 3: Analyze
- Click **"Analyze Contract"**
- Wait for analysis (2-5 minutes)
- You'll see a loading animation

### Step 4: View Results
- **Full Report**: Comprehensive analysis with all details
- **Executive Summary**: Quick overview
- Use buttons to download, print, or copy

### Step 5: Ask Questions
- Once analysis completes, **Q&A button** appears in floating dock
- Click to open chat
- Ask any questions about the contract
- Get AI-powered responses

---

## 📁 File Locations

```
kanunai/
├── frontend/
│   └── src/
│       ├── app/
│       │   └── contract-analysis/
│       │       └── page.tsx          ← Main contract page
│       └── components/
│           └── contract-analysis/
│               ├── ContractInputPanel.tsx
│               ├── ContractReportViewer.tsx
│               └── ContractChatBot.tsx
├── backend/
│   └── src/
│       └── controllers/
│           └── analysis.controller.ts    ← Updated for contracts
└── ai-service/
    └── src/
        └── models/
            ├── contract_analysis.py       ← Core analyzer
            └── contract_analysis_cli.py   ← New CLI wrapper
```

---

## 🧪 Test with Sample Contract

1. Create a test PDF or use an existing contract
2. Place in: `ai-service/src/test_pdf/`
3. Upload via the web interface
4. Wait for analysis
5. View results

---

## 🐛 Troubleshooting

### Issue: "Failed to start Python process"
**Solution**: 
- Check Python executable path
- Ensure venv is activated
- Check PYTHON_BIN environment variable

### Issue: "GEMINI_API_KEY not found"
**Solution**:
- Create `.env` file in `ai-service` directory
- Add: `GEMINI_API_KEY=your_key_here`
- Restart backend

### Issue: "Analysis timeout"
**Solution**:
- Increase `SUMMARY_TIMEOUT_MS` in backend environment
- Split large contracts into smaller files

### Issue: "Q&A not working"
**Solution**:
- Wait for analysis to fully complete
- Check browser console for errors
- Try refreshing the page

### Issue: Components not found (TypeScript error)
**Solution**:
- Files may need compilation rebuild
- Try: `npm run build` in frontend
- Restart dev server

---

## 📊 Performance Tips

- **Optimal PDF size**: 5-50 MB
- **Optimal pages**: 10-100 pages
- **Analysis time**: 2-5 minutes typically
- **Q&A response**: 3-10 seconds

---

## 🎯 Common Use Cases

### 1. Review Service Agreement
- Upload SLA document
- Focus on: Liability & Risk, Termination Clauses
- Ask: "What are our obligations?"

### 2. Review Software License
- Upload license PDF
- Focus on: IP Rights, Financial Terms
- Ask: "Can we modify the software?"

### 3. Review Employment Contract
- Upload contract
- Focus on: Obligations, Termination Clauses
- Ask: "What are the notice period requirements?"

### 4. Review Purchase Agreement
- Upload agreement
- Focus on: Financial Terms, Liability & Risk
- Ask: "What are the payment terms?"

---

## 📞 Support

If you encounter issues:
1. Check the console logs (Browser DevTools)
2. Check backend server logs
3. Check Python output in terminal
4. Review error messages carefully
5. Refer to IMPLEMENTATION_COMPLETE.md for detailed docs

---

## 🎉 You're Ready!

Your contract analysis system is now ready to use.

**Quick Links:**
- 🏠 Home: `http://localhost:3000`
- 📋 Contracts: `http://localhost:3000/contract-analysis`
- 📝 Case Analysis: `http://localhost:3000/case-analysis` (reference)

---

**Happy Analyzing!** 🚀
