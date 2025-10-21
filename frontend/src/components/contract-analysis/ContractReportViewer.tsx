'use client';

import { Download, Printer, Copy } from 'lucide-react';
import styles from '../../styles/viewer.module.css';
import { ColorfulMarkdown } from './ColorfulMarkdown';

interface ContractReportViewerProps {
  reportMd?: string;
  executiveSummary: string;
  detailedAnalysis?: string;
  contractTitle: string;
  activeTab: 'summary' | 'detailed';
  setActiveTab: (tab: 'summary' | 'detailed') => void;
}

export default function ContractReportViewer({
  reportMd = '',
  executiveSummary,
  detailedAnalysis = '',
  contractTitle,
  activeTab,
  setActiveTab,
}: ContractReportViewerProps) {
  const downloadReport = () => {
    let content = '';
    let filename = 'contract_analysis';
    
    if (activeTab === 'summary') {
      content = executiveSummary;
      filename = 'executive_summary';
    } else if (activeTab === 'detailed') {
      content = detailedAnalysis || '';
      filename = 'detailed_chunk_analysis';
    }
    
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contractTitle ? contractTitle.replace(/[^a-z0-9]/gi, '_') : filename}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    let content = '';
    let title = activeTab === 'summary' ? 'Executive Summary' : 'Detailed Chunk Analysis';
    
    if (activeTab === 'summary') {
      content = executiveSummary;
    } else if (activeTab === 'detailed') {
      content = detailedAnalysis || '';
    }
    
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
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
    let content = '';
    
    if (activeTab === 'summary') {
      content = executiveSummary;
    } else if (activeTab === 'detailed') {
      content = detailedAnalysis || '';
    }
    
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      alert('Copied to clipboard');
    } catch {
      alert('Could not copy to clipboard');
    }
  };

  const getDisplayContent = () => {
    let content = '';
    if (activeTab === 'summary') {
      content = executiveSummary;
    } else if (activeTab === 'detailed') {
      content = detailedAnalysis;
    }
    
    // Remove emojis from content using a more compatible pattern
    return content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();
  };

  const displayContent = getDisplayContent();

  return (
    <div className="min-h-[700px] bg-white">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 flex-wrap lg:flex-nowrap">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'summary'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Executive Summary
              </button>
              {detailedAnalysis && (
                <button
                  onClick={() => setActiveTab('detailed')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === 'detailed'
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Detailed Analysis
                </button>
              )}
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
        <div className={`p-8 max-h-[80vh] overflow-y-auto ${styles.scrollArea} bg-white`}>
          {displayContent ? (
            <ColorfulMarkdown>{displayContent}</ColorfulMarkdown>
          ) : (
            <div className="text-center text-gray-600 py-20 ">
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
