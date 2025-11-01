'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import CaseInputPanel from '../../components/case-analysis/CaseInputPanel';
import CaseSummaryViewer from '../../components/case-analysis/CaseSummaryViewer';
import CaseTimeline from '../../components/case-analysis/CaseTimeline';
import ChatBot from '../../components/case-analysis/ChatBot';

interface TimelineEvent {
  id: string;
  eventName: string;
  date: string;
  eventType: string;
  context?: string;
  lineNumber?: number;
}

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
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);

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
    globalThis.addEventListener('open-case-chatbot', handler);
    return () => globalThis.removeEventListener('open-case-chatbot', handler);
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

  const analyzeTimeline = async () => {
    if (!uploadedFile) {
      alert('Please upload a file first');
      return;
    }

    setTimelineLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const resp = await fetch('/api/analysis/timeline', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        let errMsg = `HTTP ${resp.status}`;
        try {
          if (contentType.includes('application/json')) {
            const data = await resp.json();
            errMsg = data?.message || data?.error || JSON.stringify(data);
          } else {
            errMsg = await resp.text();
          }
        } catch {
          errMsg = await resp.text().catch(() => errMsg);
        }
        throw new Error(errMsg);
      }

      const data = await resp.json();
      setTimelineEvents(data.events || []);
      setShowTimeline(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate timeline');
    } finally {
      setTimelineLoading(false);
    }
  };

  const downloadSummary = () => {
    if (!summaryMd) return;
    const blob = new Blob([summaryMd], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseTitle ? caseTitle.replaceAll(/[^a-z0-9]/gi, '_') : 'summary'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printSummary = () => {
    if (!summaryMd) return;
    const printWindow = globalThis.open('', '_blank');
    if (!printWindow) return;
    const html = `
      <html>
        <head><title>Case Summary - ${caseTitle}</title></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
          <h1>${caseTitle}</h1>
          <pre style="white-space: pre-wrap;">${summaryMd}</pre>
        </body>
      </html>
    `;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    printWindow.document.write(html);
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

        {/* Timeline View */}
        {showTimeline && timelineEvents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">Case Timeline</h3>
                <p className="text-gray-400 mt-1">Visual timeline of key events</p>
              </div>
              <button
                onClick={() => setShowTimeline(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors"
              >
                Back to Summary
              </button>
            </div>
            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6" style={{ minHeight: '500px' }}>
              <CaseTimeline parsedResult={{ events: timelineEvents }} />
            </div>
          </div>
        )}

        {/* Timeline Analysis Button (visible when summary is available) */}
        {summaryMd && !showTimeline && uploadedFile && (
          <div className="mb-8 flex gap-4 justify-center">
            <button
              onClick={analyzeTimeline}
              disabled={timelineLoading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {timelineLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Analyzing Timeline...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Generate Timeline</span>
                </>
              )}
            </button>
          </div>
        )}

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