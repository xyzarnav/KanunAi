'use client';

import ReactMarkdown from 'react-markdown';
import styles from '../../styles/viewer.module.css'

interface CaseSummaryViewerProps {
  summaryMd: string;
  caseTitle: string;
  downloadSummary: () => void;
  printSummary: () => void;
  copySummary: () => void;
}

export default function CaseSummaryViewer({
  summaryMd,
  caseTitle,
  downloadSummary,
  printSummary,
  copySummary,
}: CaseSummaryViewerProps) {
  return (
    <div className="min-h-[700px]">
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
        <div className={`p-8 max-h-[80vh] overflow-y-auto ${styles.scrollArea}`}>
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
  );
}