'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import CaseInputPanel from '../../components/case-analysis/CaseInputPanel';
import CaseSummaryViewer from '../../components/case-analysis/CaseSummaryViewer';
import ChatBot from '../../components/case-analysis/ChatBot';

export default function CaseAnalysis() {
  // For floating dock chatbot icon popup
  const [showChatPopup, setShowChatPopup] = useState(false);

  const [caseTitle, setCaseTitle] = useState('');
  const [legalIssue, setLegalIssue] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const toggleQuestion = (q: string) => {
    setSelectedQuestions((prev) => {
      if (prev.includes(q)) return prev.filter((x) => x !== q);
      return [...prev, q];
    });
  };
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summaryMd, setSummaryMd] = useState<string>('');
  const [session, setSession] = useState<string | null>(null);
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    // Listen for floating dock chatbot icon event
    const handler = () => {
      if (chatReady && session) {
        // Already handled by UI, do nothing (left panel is chat)
      } else {
        setShowChatPopup(true);
        setTimeout(() => setShowChatPopup(false), 2200);
      }
    };
    window.addEventListener('open-case-chatbot', handler);
    return () => window.removeEventListener('open-case-chatbot', handler);
  }, [chatReady, session]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile && validateFile(droppedFile)) setUploadedFile(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) setUploadedFile(file);
  };

  const validateFile = (file: File): boolean => {
    if (!file.type.includes('pdf')) {
      alert('Please upload a PDF file');
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('File size should be less than 50MB');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile && !legalIssue.trim()) {
      alert('Please upload a file or provide a legal issue description');
      return;
    }
    
    // Auto-generate case title from filename if not provided and file is uploaded
    let finalCaseTitle = caseTitle.trim();
    if (!finalCaseTitle && uploadedFile) {
      finalCaseTitle = uploadedFile.name.replace(/\.[^/.]+$/, ""); // Remove file extension
    }
    if (!finalCaseTitle && !uploadedFile) {
      alert('Please provide a case title');
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('caseTitle', finalCaseTitle);
      formData.append('legalIssue', legalIssue);
      formData.append('selectedQuestions', JSON.stringify(selectedQuestions));
      if (uploadedFile) formData.append('file', uploadedFile);

      const resp = await fetch('/api/analysis/summary', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        let errMsg = `HTTP ${resp.status}`;
        try {
          if (contentType.includes('application/json')) {
            const data = await resp.json();
            errMsg = data?.message || data?.detail?.error || JSON.stringify(data);
          } else {
            errMsg = await resp.text();
          }
        } catch {
          errMsg = await resp.text().catch(() => errMsg);
        }
        throw new Error(errMsg);
      }

      const contentType = resp.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await resp.json() : { summary: await resp.text() };
      const summary = (data as unknown as { summary?: string; session?: string })?.summary ?? '';
      const sess = (data as unknown as { session?: string })?.session ?? null;
      setSummaryMd(summary);
      setSession(sess);
      
      console.log('[CaseAnalysis] Summary completed, session:', sess);
      
      if (sess) {
        // initialize QA in background
        try {
          console.log('[CaseAnalysis] Initializing QA for session:', sess);
          const initResp = await fetch('/api/analysis/init-qa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session: sess }),
          });
          console.log('[CaseAnalysis] Init response status:', initResp.status);
          if (initResp.ok) {
            const initData = await initResp.json();
            console.log('[CaseAnalysis] Init data:', initData);
            if (initData?.ready) {
              console.log('[CaseAnalysis] Setting chatReady to true');
              setChatReady(true);
            } else {
              console.log('[CaseAnalysis] Init data ready is false:', initData?.ready);
            }
          } else {
            const errorText = await initResp.text();
            console.error('[CaseAnalysis] Init failed:', initResp.status, errorText);
          }
        } catch (error) {
          console.error('[CaseAnalysis] Init error:', error);
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to summarize');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = () => setUploadedFile(null);

  const downloadSummary = () => {
    if (!summaryMd) return;
    const blob = new Blob([summaryMd], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseTitle ? caseTitle.replace(/[^a-z0-9]/gi, '_') : 'summary'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printSummary = () => {
    if (!summaryMd) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Case Summary - ${caseTitle}</title></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
          <h1>${caseTitle}</h1>
          <pre style="white-space: pre-wrap;">${summaryMd}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const copySummary = async () => {
    if (!summaryMd) return;
    try {
      await navigator.clipboard.writeText(summaryMd);
      alert('Summary copied to clipboard');
    } catch {
      alert('Could not copy to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-7xl mx-auto px-6 py-42">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">AI-Powered Case Analysis</h2>
              <p className="text-gray-400 mt-1">Get comprehensive legal insights in seconds</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
          {(() => {
            console.log('[CaseAnalysis] Render check:', { 
              summaryMd: !!summaryMd, 
              chatReady, 
              session: !!session 
            });
            return summaryMd && chatReady && session ? (
              <ChatBot session={session} />
            ) : (
              <>
                <CaseInputPanel
                  caseTitle={caseTitle}
                  setCaseTitle={setCaseTitle}
                  legalIssue={legalIssue}
                  setLegalIssue={setLegalIssue}
                  uploadedFile={uploadedFile}
                  setUploadedFile={setUploadedFile}
                  selectedQuestions={selectedQuestions}
                  toggleQuestion={toggleQuestion}
                  dragActive={dragActive}
                  setDragActive={setDragActive}
                  handleDrag={handleDrag}
                  handleDrop={handleDrop}
                  handleFileChange={handleFileChange}
                  validateFile={validateFile}
                  removeFile={removeFile}
                  isAnalyzing={isAnalyzing}
                  handleSubmit={handleSubmit}
                />
                {showChatPopup && (
                  <div className="absolute left-1/2 top-8 z-[100] -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg border border-yellow-700 animate-fade-in">
                    Please analyse the doc first
                  </div>
                )}
              </>
            );
          })()}

          <CaseSummaryViewer
            summaryMd={summaryMd}
            caseTitle={caseTitle}
            downloadSummary={downloadSummary}
            printSummary={printSummary}
            copySummary={copySummary}
          />
        </div>
      </main>
    </div>
  );
}