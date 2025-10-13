'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle, Sparkles, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function CaseAnalysis() {
  const [caseTitle, setCaseTitle] = useState('');
  const [legalIssue, setLegalIssue] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setUploadedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setUploadedFile(file);
      }
    }
  };

  const validateFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
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
    
    if (!caseTitle.trim() || !legalIssue.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false);
      console.log('Analysis complete');
    }, 2000);
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      {/* <header className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Case Analysis Dashboard</h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                <span className="text-sm font-semibold text-black">AS</span>
              </div>
            </div>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-42">
        {/* Page Title & Description */}
        <div className="mb-10">
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

        {/* Analysis Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Case Title Section
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
            <label className="block mb-3">
              <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Case Title / Keywords *
              </span>
            </label>
            <input
              type="text"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              placeholder="e.g., Breach of Contract - ABC Corp vs XYZ Ltd"
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
              required
            />
          </div> */}

         

          {/* File Upload Section */}
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
            <label className="block mb-4">
              <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Upload Documents 
              </span>
            </label>
            
            {!uploadedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-yellow-500 bg-yellow-500/5'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-950'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-300 font-medium mb-2">
                    Drop your document here or click to browse
                  </p>
                  <p className="text-gray-500 text-sm">
                    Supports PDF, DOC, DOCX, TXT (Max 10MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="bg-gray-950 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove file"
                    title="Remove file"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
           {/* Legal Issue Section */}
           <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
            <label className="block mb-3">
              <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Legal Question / Issue Description *
              </span>
            </label>
            <textarea
              value={legalIssue}
              onChange={(e) => setLegalIssue(e.target.value)}
              placeholder="Describe the legal issue, question, or the specific aspect you want to analyze..."
              rows={6}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all resize-none"
              required
            />
            <p className="text-gray-500 text-sm mt-3">
              Be specific about the legal principles, statutes, or precedents you want analyzed
            </p>
          </div>

          {/* Info Banner */}
          <div className="flex items-start space-x-3 p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">AI Analysis Process</p>
              <p className="text-blue-400/80">
                Our AI will analyze your case using 75K+ precedents, identify relevant legal principles, 
                and provide argument maps with supporting citations.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isAnalyzing}
              className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
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
                  <span>Start Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Precedent Analysis</h3>
            <p className="text-sm text-gray-400">
              Search through 75K+ precedents to find relevant case law
            </p>
          </div>

          <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Argument Mapping</h3>
            <p className="text-sm text-gray-400">
              Visual argument structures with supporting citations
            </p>
          </div>

          <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Instant Insights</h3>
            <p className="text-sm text-gray-400">
              Get comprehensive analysis in seconds, not hours
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}