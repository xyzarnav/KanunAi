'use client';

import { useState } from 'react';
import { Upload, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import styles from './viewer.module.css';

export default function CaseAnalysis() {
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
    if (droppedFile) {
      const file = droppedFile;
      if (validateFile(file)) setUploadedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const file = selected;
      if (validateFile(file)) setUploadedFile(file);
    }
  };

  const validateFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, DOCX, or TXT file');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile && !legalIssue.trim()) {
      alert('Provide text or upload a file');
      return;
    }
    setIsAnalyzing(true);
    setSummaryMd('');
    try {
      const form = new FormData();
      if (uploadedFile) {
        form.append('file', uploadedFile);
      } else {
        const textPayload = `${caseTitle ? 'Title: ' + caseTitle + '\n\n' : ''}${legalIssue}`;
        form.append('text', textPayload);
      }
      if (selectedQuestions.length > 0) {
        form.append('questions', selectedQuestions.join('||'));
      }

      const resp = await fetch('/api/analysis/summary', {
        method: 'POST',
        body: form,
      });
      const contentType = resp.headers.get('content-type') || '';
      if (!resp.ok) {
        let errMsg = 'Failed to summarize';
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
  const data = contentType.includes('application/json') ? await resp.json() : { summary: await resp.text() };
  const summary = (data as unknown as { summary?: string })?.summary ?? '';
  setSummaryMd(summary);
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
    const w = window.open('', '_blank');
    if (!w) return;
    const doc = w.document;
    const pre = doc.createElement('pre');
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    pre.textContent = summaryMd;
    doc.body.appendChild(pre);
    w.focus();
    w.print();
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Panel */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
              <div className="block mb-3">
                <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Case Title (optional)</span>
              </div>
              <input
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                placeholder="Enter case title to make the summary header look nicer"
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
              />
            </div> */}
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
              <div className="block mb-4">
                <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Upload Documents</span>
              </div>
              {!uploadedFile ? (
                <button
                  type="button"
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full text-left border-2 border-dashed rounded-xl p-10 transition-all ${dragActive ? 'border-yellow-500 bg-yellow-500/5' : 'border-gray-700 hover:border-gray-600 bg-gray-950'}`}
                >
                  <input type="file" id="file-upload" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" className="hidden" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-300 font-medium mb-2">Drop your document here or click to browse</p>
                    <p className="text-gray-500 text-sm">Supports PDF, DOC, DOCX, TXT (Max 10MB)</p>
                  </label>
                </button>
              ) : (
                <div className="bg-gray-950 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button type="button" onClick={removeFile} className="text-gray-400 hover:text-red-500 transition-colors" aria-label="Remove file" title="Remove file">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
              <div className="block mb-3">
                <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Legal Question / Issue Description *</span>
              </div>
                {/* Quick question checkboxes */}
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">Quick prompts — tap to include in the analysis:</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'What is the case about? (short)',
                      'Give a short/simple summary',
                      'Parties involved',
                      'Purpose / relief sought',
                      'Rights / obligations of each party',
                      'Key terms to note'
                    ].map((q) => {
                      const active = selectedQuestions.includes(q);
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => toggleQuestion(q)}
                          className={`${styles.pill} px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                            active
                              ? 'bg-yellow-500 text-black border-yellow-500 shadow-sm'
                              : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
                          }`}
                          aria-pressed={active}
                          
                          
                          
                          
                        >
                          {q}
                        </button>
                      );
                    })}
                  </div>
                </div>
              <textarea
                value={legalIssue}
                onChange={(e) => setLegalIssue(e.target.value)}
                placeholder="Describe the legal issue, question, or the specific aspect you want to analyze..."
                rows={8}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all resize-none"
                required={!uploadedFile}
              />
              <p className="text-gray-500 text-sm mt-3">Be specific about the legal principles, statutes, or precedents you want analyzed</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link href="/dashboard" className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all">Cancel</Link>
              <button type="submit" disabled={isAnalyzing} className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Summary</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Panel - PDF-like viewer */}
          <div className="min-h-[600px]">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              {/* Header bar like a PDF viewer */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                <div>
                  <div className="text-sm text-gray-500">Executive Summary</div>
                  <div className="text-lg font-semibold text-gray-900">{caseTitle || 'Untitled Case'}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-4 flex items-center space-x-2">
                    <button type="button" title="Download" onClick={downloadSummary} className={`${styles.toolbarBtn} p-2 rounded-md`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                      </svg>
                    </button>
                    <button type="button" title="Print" onClick={printSummary} className={`${styles.toolbarBtn} p-2 rounded-md`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18h12v-7H6v7z" />
                      </svg>
                    </button>
                    <button type="button" title="Copy" onClick={copySummary} className={`${styles.toolbarBtn} p-2 rounded-md`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8M8 15h8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content area with aesthetic scrollbar and spacing */}
              <div className={`p-8 max-h-[70vh] overflow-y-auto ${styles.scrollArea}`}>
                {summaryMd ? (
                  <article className="prose max-w-none text-gray-900 leading-relaxed space-y-4">
                    <ReactMarkdown>{summaryMd}</ReactMarkdown>
                  </article>
                ) : (
                  <div className="text-gray-600">The generated summary will appear here.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}