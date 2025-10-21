'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import ContractInputPanel from '../../components/contract-analysis/ContractInputPanel';
import ContractReportViewer from '../../components/contract-analysis/ContractReportViewer';
import ContractChatBot from '../../components/contract-analysis/ContractChatBot';

export default function ContractAnalysis() {
  // For floating dock popup
  const [showDocPopup, setShowDocPopup] = useState(false);

  const [contractTitle, setContractTitle] = useState('');
  const [contractDescription, setContractDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  
  const toggleArea = (area: string) => {
    setSelectedAreas((prev) => {
      if (prev.includes(area)) return prev.filter((x) => x !== area);
      return [...prev, area];
    });
  };

  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState<string>('');
  const [detailedAnalysis, setDetailedAnalysis] = useState<string>('');
  const [session, setSession] = useState<string | null>(null);
  const [chatReady, setChatReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed'>('summary');

  useEffect(() => {
    // Listen for floating dock events
    const handler = () => {
      if (chatReady && session) {
        // Chat is already ready, do nothing
      } else {
        setShowDocPopup(true);
        setTimeout(() => setShowDocPopup(false), 2200);
      }
    };
    window.addEventListener('open-contract-analysis', handler);
    return () => window.removeEventListener('open-contract-analysis', handler);
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

  const initializeQA = async (sess: string) => {
    try {
      console.log('[ContractAnalysis] Initializing QA for session:', sess);
      const initResp = await fetch('/api/analysis/init-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sess }),
      });
      console.log('[ContractAnalysis] Init response status:', initResp.status);
      if (initResp.ok) {
        const initData = await initResp.json();
        console.log('[ContractAnalysis] Init data:', initData);
        if (initData?.ready) {
          console.log('[ContractAnalysis] Setting chatReady to true');
          setChatReady(true);
        }
      } else {
        const errorText = await initResp.text();
        console.error('[ContractAnalysis] Init failed:', initResp.status, errorText);
      }
    } catch (error) {
      console.error('[ContractAnalysis] Init error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      alert('Please upload a contract PDF');
      return;
    }

    // Auto-generate title from filename if not provided
    let finalTitle = contractTitle.trim();
    if (!finalTitle && uploadedFile) {
      finalTitle = uploadedFile.name.replace(/\.[^/.]+$/, '');
    }
    if (!finalTitle) {
      alert('Please provide a contract title');
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('contractTitle', finalTitle);
      formData.append('contractDescription', contractDescription);
      formData.append('selectedAreas', JSON.stringify(selectedAreas));
      formData.append('file', uploadedFile);
      formData.append('analysisType', 'contract');

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

      const summary = (data as any)?.summary ?? '';
      const detailed = (data as any)?.detailed ?? '';
      const sess = (data as any)?.session ?? null;

      setExecutiveSummary(summary);
      setDetailedAnalysis(detailed);
      setSession(sess);

      console.log('[ContractAnalysis] Analysis completed, session:', sess);

      if (sess) {
        await initializeQA(sess);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to analyze contract');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = () => setUploadedFile(null);

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-7xl mx-auto px-6 py-36">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">AI-Powered Contract Analysis</h2>
              <p className="text-gray-400 mt-1">Get comprehensive contract insights with detailed risk assessment</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
          {(() => {
            console.log('[ContractAnalysis] Render check:', {
              executiveSummary: !!executiveSummary,
              chatReady,
              session: !!session,
            });
            
            return executiveSummary && chatReady && session ? (
              <ContractChatBot session={session} />
            ) : (
              <>
                <ContractInputPanel
                  contractTitle={contractTitle}
                  setContractTitle={setContractTitle}
                  contractDescription={contractDescription}
                  setContractDescription={setContractDescription}
                  uploadedFile={uploadedFile}
                  setUploadedFile={setUploadedFile}
                  selectedAreas={selectedAreas}
                  toggleArea={toggleArea}
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
                {showDocPopup && (
                  <div className="absolute left-1/2 top-8 z-[100] -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg border border-yellow-700 animate-fade-in">
                    Please analyze the document first
                  </div>
                )}
              </>
            );
          })()}

          <ContractReportViewer
            executiveSummary={executiveSummary}
            detailedAnalysis={detailedAnalysis}
            contractTitle={contractTitle}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </main>
    </div>
  );
}
