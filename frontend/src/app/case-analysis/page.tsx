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
  const [timelineVisible, setTimelineVisible] = useState(true);
  const [precedentSearchLoading, setPrecedentSearchLoading] = useState(false);
  const [precedents, setPrecedents] = useState<Array<{
    caseName: string;
    court: string;
    year: number;
    similarityReason: string;
    keyPrinciple: string;
  }>>([]);
  const [showPrecedents, setShowPrecedents] = useState(false);
  const [precedentsVisible, setPrecedentsVisible] = useState(true);

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

  const searchPrecedents = async () => {
    if (!summaryMd) {
      alert('Please generate a case summary first');
      return;
    }

    // If precedents already exist, just show them without re-searching
    if (precedents.length > 0) {
      setShowPrecedents(true);
      setPrecedentsVisible(true);
      return;
    }

    setPrecedentSearchLoading(true);
    try {
      const resp = await fetch('/api/analysis/precedent-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ summary: summaryMd }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data?.message || data?.error || 'Failed to search precedents');
      }

      const data = await resp.json();
      setPrecedents(data.precedents || []);
      setShowPrecedents(true);
      setPrecedentsVisible(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to search precedents');
    } finally {
      setPrecedentSearchLoading(false);
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTimelineVisible(!timelineVisible)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {timelineVisible ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.011 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.011-9.963-7.178z" />
                    </svg>
                  )}
                  <span>{timelineVisible ? 'Hide Timeline' : 'Show Timeline'}</span>
                </button>
                <button
                  onClick={() => setShowTimeline(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors"
                >
                  Back to Summary
                </button>
              </div>
            </div>
            {timelineVisible && (
              <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6" style={{ minHeight: '500px' }}>
                <CaseTimeline parsedResult={{ events: timelineEvents }} />
              </div>
            )}
          </div>
        )}

        {/* Timeline Analysis and Precedent Search Buttons (visible when summary is available) - Left Aligned */}
        {summaryMd && !showTimeline && uploadedFile && (
          <div className="mb-8 flex gap-4 justify-start flex-wrap">
            <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/10 rounded-xl border border-purple-500/30 p-4 shadow-lg hover:shadow-purple-500/20 transition-all">
              <button
                onClick={analyzeTimeline}
                disabled={timelineLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg"
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
                    <span>Generate Timeline Analysis</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-400 mt-2 ml-1">Create a visual timeline of key events from your case</p>
            </div>

            <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/10 rounded-xl border border-blue-500/30 p-4 shadow-lg hover:shadow-blue-500/20 transition-all">
              <button
                onClick={searchPrecedents}
                disabled={precedentSearchLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                {precedentSearchLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Searching Precedents...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Precedent Search</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-400 mt-2 ml-1">Find top similar cases</p>
            </div>
          </div>
        )}

        {/* Precedent Search Results Table */}
        {showPrecedents && precedents.length > 0 && (
          <div className="mb-8 bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">Similar Cases Found</h3>
                <p className="text-gray-400 mt-1">Top {precedents.length} cases similar to your case</p>
              </div>
              <button
                onClick={() => setPrecedentsVisible(!precedentsVisible)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors flex items-center space-x-2"
              >
                {precedentsVisible ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.011 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.011-9.963-7.178z" />
                  </svg>
                )}
                <span>{precedentsVisible ? 'Hide Precedents' : 'Show Precedents'}</span>
              </button>
            </div>
            
            {precedentsVisible && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                      <th className="px-4 py-3 text-left font-semibold text-sm">Case Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-sm">Court</th>
                      <th className="px-4 py-3 text-left font-semibold text-sm">Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {precedents.map((precedent, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-900 font-medium">{precedent.caseName}</td>
                        <td className="px-4 py-3 text-gray-700">{precedent.court}</td>
                        <td className="px-4 py-3 text-gray-700">{precedent.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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