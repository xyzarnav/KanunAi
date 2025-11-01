'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import mermaid from 'mermaid';

interface TimelineEvent {
  readonly id: string;
  readonly eventName: string;
  readonly date: string;
  readonly eventType: string;
  readonly context?: string;
}

interface CaseTimelineProps {
  readonly parsedResult?: {
    readonly events: readonly TimelineEvent[];
  };
}

export default function CaseTimeline({ parsedResult = { events: [] } }: CaseTimelineProps) {
  const { events } = parsedResult;

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [diagramId] = useState(() => `timeline-${Math.random().toString(36).substring(7)}`);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [zoom, setZoom] = useState(1);

  // Utility functions
  const cleanText = (text: string, maxLength: number = 50): string => {
    return text
      .replaceAll(/[:"]/g, '') // Remove colons and quotes
      .replaceAll(/\([^)]*\)/g, '') // Remove parenthetical content
      .replaceAll(/\b\d{1,2}(?:st|nd|rd|th)?\s+\w+,?\s+\d{4}\b/g, '') // Remove dates
      .replaceAll(/\bw\.e\.f\.\s+[^.]*\./g, '') // Remove w.e.f. phrases
      .replaceAll(/\bdated\s+[^.]*\./g, '') // Remove dated phrases
      .replaceAll(/\bvide\s+[^.]*\./g, '') // Remove vide phrases
      .replaceAll(/\bMANU\/[^.]*/g, '') // Remove MANU references
      .replaceAll(/\bCriminal Appeal\s+[^.]*/g, '') // Remove Criminal Appeal references
      .replaceAll(/\bNo\.\s*\d+/g, '') // Remove case numbers
      .replaceAll(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, maxLength);
  };

  const extractSummary = (context: string): string[] => {
    if (!context) return [];

    const lowerContext = context.toLowerCase();

    // Simple pattern matching for common legal actions
    const patterns = [
      { keywords: ['maintenance', 'awarded', 'wife'], summary: 'Maintenance awarded to wife' },
      { keywords: ['maintenance', 'awarded', 'respondent'], summary: 'Maintenance awarded to wife' },
      { keywords: ['directed to pay', 'maintenance'], summary: 'Husband ordered to pay maintenance' },
      { keywords: ['husband', 'directed'], summary: 'Husband directed to pay maintenance' },
      { keywords: ['interim maintenance'], summary: 'Interim maintenance granted' },
      { keywords: ['final order'], summary: 'Final court order passed' },
      { keywords: ['appeal', 'filed'], summary: 'Appeal filed against order' },
      { keywords: ['judgment', 'delivered'], summary: 'Court judgment delivered' },
      { keywords: ['petition', 'filed'], summary: 'Legal petition filed' },
      { keywords: ['hearing'], summary: 'Court hearing held' },
      { keywords: ['opportunity', 'granted'], summary: 'Final opportunity granted' },
      { keywords: ['payment', 'made'], summary: 'Payment made as ordered' },
      { keywords: ['application', 'filed'], summary: 'Application submitted' },
      { keywords: ['order', 'passed'], summary: 'Court order issued' }
    ];

    // Find the first matching pattern
    for (const pattern of patterns) {
      if (pattern.keywords.every(keyword => lowerContext.includes(keyword))) {
        return [pattern.summary];
      }
    }

    // Default summary
    return ['Legal proceeding recorded'];
  };

  const categorizeEvent = (event: TimelineEvent): string => {
    const context = (event.context?.toLowerCase() || '');
    const eventType = (event.eventType?.toLowerCase() || '');

    // Judgment related
    if (eventType === 'judgment' || context.includes('judgment') || context.includes('decided') ||
        context.includes('verdict') || context.includes('ruling') || context.includes('decision')) {
      return 'Court Judgment';
    }

    // Legislative amendments and acts
    if (context.includes('act') || context.includes('amendment') || context.includes('section') ||
        context.includes('legislation') || context.includes('law') || context.includes('bill')) {
      return 'Legislative Action';
    }

    // Court proceedings and hearings
    if (context.includes('court') || context.includes('proceeding') || context.includes('hearing') ||
        context.includes('petition') || context.includes('appeal') || context.includes('application') ||
        eventType.includes('proceeding')) {
      return 'Court Proceeding';
    }

    // Financial and maintenance related
    if (context.includes('maintenance') || context.includes('alimony') || context.includes('payment') ||
        context.includes('arrears') || context.includes('amount') || context.includes('rs.') ||
        context.includes('compensation')) {
      return 'Financial Order';
    }

    // Marriage and divorce related
    if (context.includes('marriage') || context.includes('divorce') || context.includes('dissolution') ||
        context.includes('husband') || context.includes('wife') || context.includes('spouse')) {
      return 'Marriage/Divorce';
    }

    // Custody and child related
    if (context.includes('custody') || context.includes('child') || context.includes('minor') ||
        context.includes('parent') || context.includes('guardian')) {
      return 'Child Custody';
    }

    // Default category
    return 'Legal Action';
  };

  // Generate clean event title
  const getEventTitle = (event: TimelineEvent): string => {
    const context = event.context?.toLowerCase() || '';

    // Specific titles based on content
    if (context.includes('maintenance')) {
      return 'Maintenance Order';
    }
    if (context.includes('appeal')) {
      return 'Appeal Filed';
    }
    if (context.includes('judgment') || context.includes('decided')) {
      return 'Court Judgment';
    }
    if (context.includes('petition')) {
      return 'Petition Filed';
    }
    if (context.includes('hearing')) {
      return 'Court Hearing';
    }
    if (context.includes('application')) {
      return 'Application Filed';
    }

    // Fallback to category-based title
    const category = categorizeEvent(event);
    return category;
  };

  // Sort events by date and deduplicate
  const sortedEvents = useMemo(() => {
    // First filter and sort
    const filtered = [...events]
      .filter(event => event.context && !event.context.includes('www.manupatra.com'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by date and merge similar events
    const groupedByDate = new Map<string, TimelineEvent[]>();

    for (const event of filtered) {
      const dateKey = event.date.split('T')[0];
      const dateEvents = groupedByDate.get(dateKey) || [];
      dateEvents.push(event);
      groupedByDate.set(dateKey, dateEvents);
    }

    // For each date, keep only unique events (merge similar ones)
    const deduplicated: TimelineEvent[] = [];

    for (const [, dateEvents] of groupedByDate) {
      if (dateEvents.length === 1) {
        deduplicated.push(dateEvents[0]);
      } else {
        // For multiple events on same date, keep the one with most detailed context
        const bestEvent = dateEvents.reduce((best, current) => {
          const bestContext = best.context || '';
          const currentContext = current.context || '';
          return currentContext.length > bestContext.length ? current : best;
        }, dateEvents[0]);
        deduplicated.push(bestEvent);
      }
    }

    return deduplicated;
  }, [events]);

  // Helper to wrap long text into multiple lines for diagram
  const wrapTextForDiagram = (text: string, maxLineLength: number = 90): string[] => {
    if (text.length <= maxLineLength) {
      return [text];
    }

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).length > maxLineLength && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }

    if (currentLine) {
      lines.push(currentLine.trim());
    }

    return lines.slice(0, 2); // Limit to 2 lines maximum
  };

  // Helper to build event lines for a timeline event
  const buildEventLines = (event: TimelineEvent): string[] => {
    const date = event.date.split('T')[0];
    const eventTitle = getEventTitle(event);
    const lines = [`        ${date} : ${eventTitle}`];

    if (event.context) {
      const summaryLines = extractSummary(event.context);

      for (const summaryLine of summaryLines) {
        const cleaned = cleanText(summaryLine, 120); // Reduced from 200 to 120 for diagram
        if (cleaned && cleaned.length > 10) {
          const wrappedLines = wrapTextForDiagram(cleaned);
          for (const wrappedLine of wrappedLines) {
            lines.push(`                     : ${wrappedLine}`);
          }
        }
      }
    }
    return lines;
  };

  // Generate mermaid diagram with detailed timeline format
  const mermaidDiagram = useMemo(() => {
    const themeConfig = [
      "%%{init: {'theme':'default', 'themeVariables': {",
      "  'primaryColor':'#4F46E5',",
      "  'primaryTextColor':'#FFFFFF',",
      "  'primaryBorderColor':'#4F46E5',",
      "  'lineColor':'#6366F1',",
      "  'fontSize':'14px',",
      "  'fontFamily':'system-ui',",
      "  'wrap':true",
      "}}}%%"
    ];

    if (!sortedEvents.length) {
      return [
        ...themeConfig,
        '',
        'timeline',
        '    title Legal Case Timeline',
        '    section Sample',
        '        2023-01-01 : No events found'
      ].join('\n');
    }

    const categorizedEvents = new Map<string, TimelineEvent[]>();
    for (const event of sortedEvents) {
      const category = categorizeEvent(event);
      const categoryEvents = categorizedEvents.get(category) || [];
      categoryEvents.push(event);
      categorizedEvents.set(category, categoryEvents);
    }

    const lines = [
      ...themeConfig,
      '',
      'timeline',
      '    title Legal Case Timeline',
      ''
    ];

    for (const [category, categoryEvents] of categorizedEvents) {
      lines.push(`    section ${category}`);
      for (const event of categoryEvents) {
        lines.push(...buildEventLines(event));
      }
      lines.push('');
    }

    return lines.join('\n');
  }, [sortedEvents]);

  // Handle zoom controls
  const handleZoom = (action: 'in' | 'out' | 'reset') => {
    if (action === 'in') {
      setZoom(prev => Math.min(prev + 0.2, 10));
    } else if (action === 'out') {
      setZoom(prev => Math.max(prev - 0.2, 0.5));
    } else {
      setZoom(1);
    }
  };

  // Initialize mermaid and render diagram
  useEffect(() => {
    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        setError(null);

        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          themeVariables: {
            primaryColor: '#008000',
            primaryTextColor: '#FFFFFF',
            primaryBorderColor: '#008000',
            lineColor: '#0000FF',
            secondaryColor: '#FFFFFF',
            tertiaryColor: '#FFFFFF',
            fontSize: '14px',
            fontFamily: 'sans-serif'
          },
          securityLevel: 'loose'
        });

        if (mermaidDiagram) {
          console.log('Rendering diagram:', mermaidDiagram.substring(0, 200) + '...');

          const { svg } = await mermaid.render(diagramId, mermaidDiagram);
          setSvgContent(svg);
          console.log('SVG rendered successfully');
        }
      } catch (err) {
        console.error('Failed to render timeline:', err);
        setError(err instanceof Error ? err.message : 'Failed to render timeline');
      } finally {
        setIsLoading(false);
      }
    };

    if (mermaidDiagram) {
      renderDiagram();
    } else {
      setIsLoading(false);
    }
  }, [mermaidDiagram, diagramId]);

  useEffect(() => {
    if (!isLoading && svgContent && svgContainerRef.current) {
      const container = svgContainerRef.current;
      // Adjust SVG attributes
      const svgEl = container.querySelector('svg');
      if (svgEl) {
        svgEl.setAttribute('width', '100%');
        svgEl.setAttribute('height', 'auto');
        svgEl.style.minHeight = '600px';
        svgEl.style.maxHeight = '1200px';
        svgEl.style.background = '#FFFFFF';
        svgEl.style.borderRadius = '8px';
        svgEl.style.padding = '16px';
        svgEl.style.display = 'block';
      }
    }
  }, [isLoading, svgContent]);

  if (!events?.length) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-600 bg-white rounded-lg border border-gray-200 shadow-sm">
        <p>No timeline events to display</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Generating timeline diagram...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Timeline rendering error: {error}</p>
          <p className="text-red-600 text-sm mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Mermaid Timeline Container */}
      <div className="bg-white rounded-lg border-2 border-blue-200 shadow-lg overflow-visible" style={{ minHeight: '700px' }}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Timeline Diagram</h3>
          {!isLoading && svgContent && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleZoom('out')}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                title="Zoom Out"
              >
                −
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-50 rounded min-w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom('in')}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => handleZoom('reset')}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                title="Reset Zoom"
              >
                Reset
              </button>
            </div>
          )}
        </div>
        {isLoading ? (
          <div
            className="w-full h-full overflow-x-auto p-4 flex items-center justify-center"
            style={{
              minHeight: '600px',
              backgroundColor: '#ffffff'
            }}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-600">Generating timeline diagram...</p>
            </div>
          </div>
        ) : (
          <div
            className="w-full overflow-auto"
            style={{
              minHeight: '600px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start'
            }}
          >
            <div
              ref={svgContainerRef}
              className="p-4"
              style={{
                display: 'inline-block',
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                transition: 'transform 0.2s ease-in-out',
                maxWidth: '100%',
                overflow: 'visible'
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        )}
        {!mermaidDiagram && !isLoading && (
          <div className="flex items-center justify-center h-96 text-gray-500">
            <p>No diagram to display</p>
          </div>
        )}
      </div>



      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Events</h3>
        <div className="space-y-4">
          {sortedEvents.map((event) => {
            const summary = extractSummary(event.context || '').join(' ');
            const category = categorizeEvent(event);
            const displayText = summary || event.eventName;

            return (
              <div
                key={event.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 text-sm">
                  <div className="text-gray-600 font-medium">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {category}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">{getEventTitle(event)}</div>
                  {displayText && (
                    <div className="mt-2 text-gray-700 text-sm leading-snug bg-blue-50 p-3 rounded overflow-hidden">
                      <div style={{
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxHeight: '6em', // Increased from 3.5em to 6em
                        lineHeight: '1.6',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 4, // Allow up to 4 lines
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {displayText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 px-4">
        <div>Total Events: {sortedEvents.length}</div>
        <div>✨ Generated using Mermaid.js</div>
      </div>
    </div>
  );
}