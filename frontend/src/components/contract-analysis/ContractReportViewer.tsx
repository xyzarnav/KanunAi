'use client';

import ReactMarkdown from 'react-markdown';
import { Download, Printer, Copy } from 'lucide-react';
import styles from '../../styles/viewer.module.css';

interface ContractReportViewerProps {
  reportMd: string;
  executiveSummary: string;
  contractTitle: string;
  activeTab: 'report' | 'summary' | 'detailed';
  setActiveTab: (tab: 'report' | 'summary' | 'detailed') => void;
}

export default function ContractReportViewer({
  reportMd,
  executiveSummary,
  contractTitle,
  activeTab,
  setActiveTab,
}: ContractReportViewerProps) {
  const downloadReport = () => {
    const content = activeTab === 'summary' ? executiveSummary : reportMd;
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = activeTab === 'summary' ? 'executive_summary' : 'contract_analysis';
    a.download = `${contractTitle ? contractTitle.replace(/[^a-z0-9]/gi, '_') : fileName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const content = activeTab === 'summary' ? executiveSummary : reportMd;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const title = activeTab === 'summary' ? 'Executive Summary' : 'Contract Analysis Report';
    printWindow.document.write(`
      <html>
        <head><title>${title} - ${contractTitle}</title></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
          <h1>${contractTitle}</h1>
          <h2>${title}</h2>
          <pre style="white-space: pre-wrap;">${content}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const copyReport = async () => {
    const content = activeTab === 'summary' ? executiveSummary : reportMd;
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      alert('Copied to clipboard');
    } catch {
      alert('Could not copy to clipboard');
    }
  };

  const getDisplayContent = () => {
    if (activeTab === 'summary') return executiveSummary;
    return reportMd;
  };

  const displayContent = getDisplayContent();

  return (
    <div className="min-h-[700px]">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('report')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'report'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Full Report
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'summary'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Executive Summary
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {contractTitle || 'Contract Analysis'}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              title="Download"
              onClick={downloadReport}
              disabled={!displayContent}
              className={`${styles.toolbarBtn} p-2 rounded-md transition-colors ${
                displayContent
                  ? 'hover:bg-gray-200'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <Download className="h-4 w-4 text-gray-600" />
            </button>
            <button
              type="button"
              title="Print"
              onClick={printReport}
              disabled={!displayContent}
              className={`${styles.toolbarBtn} p-2 rounded-md transition-colors ${
                displayContent
                  ? 'hover:bg-gray-200'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <Printer className="h-4 w-4 text-gray-600" />
            </button>
            <button
              type="button"
              title="Copy"
              onClick={copyReport}
              disabled={!displayContent}
              className={`${styles.toolbarBtn} p-2 rounded-md transition-colors ${
                displayContent
                  ? 'hover:bg-gray-200'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <Copy className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className={`p-8 max-h-[80vh] overflow-y-auto ${styles.scrollArea}`}>
          {displayContent ? (
            <article className="prose max-w-none text-gray-900 leading-relaxed space-y-4">
              <ReactMarkdown>{displayContent}</ReactMarkdown>
            </article>
          ) : (
            <div className="text-center text-gray-600 py-20">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">Upload and analyze a contract to see the report here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
