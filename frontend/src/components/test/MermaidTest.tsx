'use client';

import React, { useRef, useEffect, useState } from 'react';
import mermaid from 'mermaid';

export default function MermaidTest() {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useSimple, setUseSimple] = useState(true);
  const [svgContent, setSvgContent] = useState<string>('');
  const [zoom, setZoom] = useState(1);

  // Start with a simple flowchart to test if Mermaid works at all
  const simpleDiagram = `graph TD
    A[Start] --> B[Process]
    B --> C[End]`;

  // Detailed timeline with proper formatting
  const timelineDiagram = `%%{init: {'theme':'default', 'themeVariables': {
  'primaryColor':'#008000',
  'primaryTextColor':'#FFFFFF',
  'primaryBorderColor':'#008000',
  'lineColor':'#0000FF',
  'secondaryColor':'#FFFFFF',
  'tertiaryColor':'#FFFFFF',
  'fontSize':'16px',
  'fontFamily':'sans-serif',
  'timeline_background_color':'#FFFFFF',
  'timeline_border_color':'#FFFFFF'
}}}%%

timeline
    title Legal Case Timeline - Rajnesh v. Neha (2001-2020)

    section Legislative Changes
        2001-09-24 : Act 49 of 2001
                     : Section 24 proviso inserted
                     : 60-day disposal timeline

    section Family Court Proceedings
        2013-09-01 : Maintenance Awarded
                     : Rs. 15,000/month to wife
                     : Rs. 5,000/month to son
        2015-08-24 : Family Court Order
                     : Detailed maintenance judgment
                     : Increased son's maintenance

    section High Court Appeal
        2018-08-14 : Bombay High Court
                     : Writ Petition No. 875/2015
                     : Dismissed - FC order affirmed

    section Supreme Court Proceedings
        2019-07-24 : SC Judgment
                     : Criminal Appeal 1129-1130/2019
        2019-09-11 : Payment Directed
                     : Rs. 2,00,000 arrears
        2019-12-17 : Further Order
                     : Rs. 1,45,000 payment within 45 days

    section Compliance Issues
        2020-01-08 : MP High Court Order
                     : Additional proceedings
        2020-08-04 : Compliance Affidavit
                     : Partial payment acknowledged
        2020-08-25 : Arrears Outstanding
                     : Rs. 5,00,000 pending
        2020-10-08 : Mediation Failed
                     : No settlement reached

    section Final Judgment
        2020-10-15 : SC Final Orders
                     : Criminal Appeal 2483/2020
                     : Guidelines established
        2020-11-04 : Rajnesh Case Concluded
                     : Criminal Appeal 730/2020
                     : Landmark judgment on maintenance`;

  const currentDiagram = useSimple ? simpleDiagram : timelineDiagram;

  useEffect(() => {
    let isCancelled = false;

    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Mermaid version check...');
        
        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose'
        });

        console.log('Attempting to render diagram via mermaid.render...');

        const diagramId = `mermaid-${Date.now()}`;

        // Clear any previous content
        setSvgContent('');

        try {
          // mermaid.render returns an object with an `svg` property in current mermaid versions
          // We await it in case it's Promise-based.
          const renderResult = await mermaid.render(diagramId, currentDiagram);

          // Check if still mounted after async render
          if (isCancelled) {
            console.log('Component unmounted during render, skipping DOM update');
            return;
          }

          if (renderResult && (renderResult as any).svg) {
            const svgString = (renderResult as any).svg as string;
            console.log('mermaid.render() succeeded, svg length=', svgString.length);
            console.log('svg snippet:', svgString.slice(0, 300));

            setSvgContent(svgString);
          } else {
            // If render didn't return svg, fallback to using a container + init
            console.warn('mermaid.render() did not return svg, falling back to mermaid.init');
            
            setSvgContent(`<div class="mermaid" id="${diagramId}">${currentDiagram}</div>`);
          }
        } catch (renderError) {
          console.warn('mermaid.render() failed, trying legacy init fallback:', renderError);

          setSvgContent(`<pre class="mermaid">${currentDiagram}</pre>`);
        }
      } catch (err) {
        console.error('All methods failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(renderDiagram, 100);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [currentDiagram]);

  useEffect(() => {
    if (!isLoading && svgContent && svgContainerRef.current) {
      const container = svgContainerRef.current;
      if (container.querySelector('.mermaid')) {
        try {
          mermaid.init(undefined, container);
        } catch (e) {
          console.warn('mermaid.init failed:', e);
        }
      }
      // Adjust SVG attributes
      const svgEl = container.querySelector('svg');
      if (svgEl) {
        try {
          svgEl.setAttribute('width', '100%');
          svgEl.setAttribute('height', '100%');
          (svgEl as SVGElement).style.display = 'block';
          (svgEl as SVGElement).style.maxWidth = '100%';
          // If no viewBox is set, try to copy width/height into viewBox
          if (!svgEl.getAttribute('viewBox')) {
            const w = svgEl.getAttribute('width');
            const h = svgEl.getAttribute('height');
            if (w && h && !Number.isNaN(Number(w)) && !Number.isNaN(Number(h))) {
              svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
            }
          }

          // Ensure shapes are visible: set stroke if missing and avoid white fills hiding shapes
          const shapes = svgEl.querySelectorAll('rect,circle,path,polygon,polyline,ellipse');
          for (const s of shapes) {
            const el = s as SVGElement;
            const fill = el.getAttribute('fill');
            if (!el.getAttribute('stroke')) el.setAttribute('stroke', '#333');
            if (!fill || fill === 'white' || fill === '#ffffff' || fill === 'none') {
              // leave explicit 'none' alone, but if it's white we change to none to show stroke
              if (fill === 'white' || fill === '#ffffff') el.setAttribute('fill', 'none');
            }
          }
          const texts = svgEl.querySelectorAll('text');
          for (const t of texts) {
            (t as SVGElement).setAttribute('fill', '#111');
          }
        } catch (e) {
          console.warn('Could not adjust SVG attributes:', e);
        }
      }
    }
  }, [isLoading, svgContent]);

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    let newZoom = zoom;
    if (direction === 'in') {
      newZoom = Math.min(zoom + 0.2, 3);
    } else if (direction === 'out') {
      newZoom = Math.max(zoom - 0.2, 0.5);
    } else {
      newZoom = 1;
    }
    setZoom(newZoom);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Mermaid rendering error: {error}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Diagram source:</h4>
          <pre className="text-sm whitespace-pre-wrap">{currentDiagram}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Mermaid Timeline Test</h1>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setUseSimple(true)}
          className={`px-4 py-2 rounded ${useSimple ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Simple Flowchart
        </button>
        <button
          onClick={() => setUseSimple(false)}
          className={`px-4 py-2 rounded ${useSimple ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}
        >
          Timeline Diagram
        </button>
      </div>
      
      <div className="bg-white rounded-lg border-2 border-blue-200 shadow-lg relative" style={{ minHeight: '600px' }}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {useSimple ? 'Simple Flowchart Test' : 'Timeline Diagram Test'}
          </h3>
          {!useSimple && (
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handleZoom('out')}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded transition-colors"
                title="Zoom out"
              >
                −
              </button>
              <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom('in')}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded transition-colors"
                title="Zoom in"
              >
                +
              </button>
              <button
                onClick={() => handleZoom('reset')}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded transition-colors ml-2"
                title="Reset zoom"
              >
                Reset
              </button>
            </div>
          )}
        </div>
        <div ref={svgContainerRef}>
          {isLoading ? (
            <div
              className="w-full h-full overflow-x-auto p-4"
              style={{ 
                minHeight: '500px',
                backgroundColor: '#ffffff',
                border: '1px dashed #ccc',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.6)',
                zIndex: 20
              }}>
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-gray-600">Rendering Mermaid diagram...</p>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="w-full h-full overflow-auto p-4"
              style={{ 
                minHeight: '500px',
                backgroundColor: '#ffffff',
                border: '1px dashed #ccc',
                position: 'relative'
              }}
            >
              <div
                style={{ 
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.2s ease-out',
                  display: 'inline-block'
                }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Raw Mermaid Code:</h4>
        <pre className="text-sm whitespace-pre-wrap bg-gray-100 p-3 rounded overflow-x-auto max-h-64">
          {currentDiagram}
        </pre>
      </div>
    </div>
  );
}