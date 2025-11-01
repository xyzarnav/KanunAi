'use client';

import { Upload, FileText, Sparkles, FileCheck } from 'lucide-react';
import Link from 'next/link';
import styles from '../../styles/viewer.module.css';

interface ContractInputPanelProps {
  contractTitle: string;
  setContractTitle: (value: string) => void;
  contractDescription: string;
  setContractDescription: (value: string) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  selectedAreas: string[];
  toggleArea: (area: string) => void;
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

export default function ContractInputPanel({
  contractTitle,
  setContractTitle,
  contractDescription,
  setContractDescription,
  uploadedFile,
  setUploadedFile,
  selectedAreas,
  toggleArea,
  dragActive,
  setDragActive,
  handleDrag,
  handleDrop,
  handleFileChange,
  validateFile,
  removeFile,
  isAnalyzing,
  handleSubmit,
}: ContractInputPanelProps) {
  const focusAreas = [
    'Financial Terms',
    'Liability & Risk',
    'Termination Clauses',
    'Obligations',
    'IP Rights',
    'Confidentiality',
  ];

  return (
    <div className="relative">
      {/* Professional Loading Overlay */}
      {isAnalyzing && (
        <div
          className="absolute inset-0 z-0 bg-transparent backdrop-blur-sm rounded-2xl flex items-center justify-center animate-in fade-in duration-300"
          style={{ transform: 'translateY(-0px)', height: '600px' }}
        >
          <div className="bg-transparent border border-blue-500/30 rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
            {/* Animated Icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Outer spinning ring */}
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>

              {/* Inner pulsing circle */}
              <div className="absolute inset-3 bg-blue-500/20 rounded-full animate-pulse"></div>

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <FileCheck className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
            </div>

            {/* Text Content */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Analyzing Contract</h3>
              <p className="text-gray-400 text-sm">KanunAI is analyzing your contract...</p>

              {/* Progress dots */}
              <div className="flex justify-center items-center gap-2 pt-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contract Title */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <div className="block mb-3">
            <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Contract Title (optional)
            </span>
          </div>
          <input
            value={contractTitle}
            onChange={(e) => setContractTitle(e.target.value)}
            placeholder="e.g., Software License Agreement"
            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Document Upload */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <div className="block mb-4">
            <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Upload Contract PDF
            </span>
          </div>
          {!uploadedFile ? (
            <button
              type="button"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`w-full text-left border-2 border-dashed rounded-xl p-10 transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/5'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-950'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                accept=".pdf"
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 font-medium mb-2">
                  Drop your contract here or click to browse
                </p>
                <p className="text-gray-500 text-sm">PDF format only (Max 50MB)</p>
              </label>
            </button>
          ) : (
            <div className="bg-gray-950 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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

        {/* Analysis Focus Areas
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <div className="block mb-4">
            <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Focus Areas (optional)
            </span>
          </div>
          <div className="text-sm text-gray-400 mb-3">
            Select areas to prioritize in the analysis:
          </div>
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((area) => {
              const active = selectedAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`${styles.pill} px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    active
                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
                  }`}
                  aria-pressed={active}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </div> */}

        {/* Contract Description
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <div className="block mb-3">
            <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Additional Notes (optional)
            </span>
          </div>
          <textarea
            value={contractDescription}
            onChange={(e) => setContractDescription(e.target.value)}
            placeholder="Add any specific concerns or questions about the contract..."
            rows={6}
            className="w-full bg-gray-950 border border-gray-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
          />
        </div> */}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all"
          >
            Back
          </Link>
          <button
            type="submit"
            disabled={isAnalyzing || !uploadedFile}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                <span>Analyze Contract</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
