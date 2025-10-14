'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import CaseInputPanel from '../../components/case-analysis/CaseInputPanel';
import CaseSummaryViewer from '../../components/case-analysis/CaseSummaryViewer';

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