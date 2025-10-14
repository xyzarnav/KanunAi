'use client';

import { Upload, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';
import styles from '../../styles/viewer.module.css'

interface CaseInputPanelProps {
  caseTitle: string;
  setCaseTitle: (value: string) => void;
  legalIssue: string;
  setLegalIssue: (value: string) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  selectedQuestions: string[];
  toggleQuestion: (q: string) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validateFile: (file: File) => boolean;
  removeFile: () => void;
  isAnalyzing: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function CaseInputPanel({
  caseTitle,
  setCaseTitle,
  legalIssue,
  setLegalIssue,
  uploadedFile,
  setUploadedFile,
  selectedQuestions,
  toggleQuestion,
  dragActive,
  setDragActive,
  handleDrag,
  handleDrop,
  handleFileChange,
  validateFile,
  removeFile,
  isAnalyzing,
  handleSubmit,
}: CaseInputPanelProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Case Title - commented out as in original */}
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
  );
}