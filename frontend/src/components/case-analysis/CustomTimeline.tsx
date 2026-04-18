'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TimelineEvent {
  readonly id: string;
  readonly eventName: string;
  readonly date: string;
  readonly eventType: string;
  readonly context?: string;
  readonly summary?: string;
  readonly lineNumber?: number;
}

interface CustomTimelineProps {
  events: TimelineEvent[];
  categorizeEvent: (event: TimelineEvent) => string;
  getEventTitle: (event: TimelineEvent) => string;
  extractSummary: (event: TimelineEvent) => string[];
  formatDateForDisplay: (dateStr: string) => string;
}

// Color palette for different categories
const CATEGORY_COLORS: Record<string, string> = {
  'Family Court Order': '#FFD700', // Yellow/Gold
  'Legal Appeal': '#98FB98', // Light Green
  'Appellate Judgment': '#DDA0DD', // Plum/Purple
  'Compliance Matter': '#FFB6C1', // Light Pink
  'Maintenance Order': '#87CEEB', // Sky Blue
  'Supreme Court Judgment': '#FF6347', // Tomato
  'High Court Judgment': '#9370DB', // Medium Purple
  'Interim Maintenance Order': '#FFE4B5', // Moccasin
  'Legislative Amendment': '#90EE90', // Light Green
  'Payment/Arrears': '#FFA07A', // Light Salmon
  'Filing': '#AFEEEE', // Pale Turquoise
  'Court Proceeding': '#E6E6FA', // Lavender
};

const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#E0E0E0'; // Default gray
};

// Event card dimensions - Fixed layout
const EVENT_CARD_WIDTH = 280;
const EVENT_CARD_HEIGHT = 150;
const EVENTS_PER_ROW = 3; // Fixed 3 events per row
const HORIZONTAL_GAP = 40; // Fixed horizontal spacing between events
const ROW_GAP = 250; // Vertical spacing between rows (increased for better visibility)
const CONNECTOR_CURVE_HEIGHT = 100; // Height of the curved connector (increased)
const TIMELINE_Y_OFFSET = 100; // Y position where timeline line should be (increased spacing from cards)
const VERTICAL_CONNECTOR_HEIGHT = 60; // Height of vertical line from date marker to timeline
const LEFT_PADDING = 40; // Left padding for timeline

export default function CustomTimeline({
  events,
  categorizeEvent,
  getEventTitle,
  extractSummary,
  formatDateForDisplay,
}: CustomTimelineProps) {

  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Refined context cache: eventId -> refined text
  const [refinedContexts, setRefinedContexts] = useState<Record<string, string>>({});
  const [refiningIds, setRefiningIds] = useState<Set<string>>(new Set());

  // Find the hovered event
  const hoveredEvent = hoveredEventId ? events.find(e => e.id === hoveredEventId) : null;

  // Get all events that share the same date as the hovered event
  const getAllEventsForDate = (dateStr: string) => {
    return events.filter(e => e.date === dateStr);
  };

  // Auto-refine context when popup opens
  useEffect(() => {
    if (!hoveredEvent) return;
    const dateEvents = events.filter(e => e.date === hoveredEvent.date);
    // Refine each event's context that hasn't been refined yet
    dateEvents.forEach((evt) => {
      if (!evt.context || refinedContexts[evt.id] || refiningIds.has(evt.id)) return;
      setRefiningIds(prev => new Set(prev).add(evt.id));
      fetch('/api/analysis/refine-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: evt.context,
        }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.refined) {
            setRefinedContexts(prev => ({ ...prev, [evt.id]: data.refined }));
          }
        })
        .catch(() => { /* silently fail, show raw context */ })
        .finally(() => {
          setRefiningIds(prev => {
            const next = new Set(prev);
            next.delete(evt.id);
            return next;
          });
        });
    });
  }, [hoveredEvent?.date]);

  if (!events || events.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-600 bg-white rounded-lg border border-gray-200">
        <p>No timeline events to display</p>
      </div>
    );
  }

  // Group events by category for summary (but don't use for display)
  const categorizedEvents = new Map<string, TimelineEvent[]>();
  events.forEach((event) => {
    const category = categorizeEvent(event);
    const categoryEvents = categorizedEvents.get(category) || [];
    categoryEvents.push(event);
    categorizedEvents.set(category, categoryEvents);
  });

  // Sort ALL events by date (chronological order)
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Organize events into fixed rows of 3
  const rows: TimelineEvent[][] = [];
  for (let i = 0; i < sortedEvents.length; i += EVENTS_PER_ROW) {
    const row = sortedEvents.slice(i, i + EVENTS_PER_ROW);
    rows.push(row);
  }

  // Calculate fixed event center X positions
  const getEventCenterX = (eventIndexInRow: number): number => {
    // eventIndexInRow: 0, 1, or 2 (for 3 events per row)
    return LEFT_PADDING + eventIndexInRow * (EVENT_CARD_WIDTH + HORIZONTAL_GAP) + EVENT_CARD_WIDTH / 2;
  };

  // Generate smooth curved connector from last event of one row to first event of next row
  // Now with 5 more curve segments based on conditions
  const generateCurvePath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    rowIndex?: number
  ): string => {
    const deltaY = Math.abs(endY - startY);
    const deltaX = Math.abs(endX - startX);
    const midY = (startY + endY) / 2;
    const midX = (startX + endX) / 2;
    
    // Conditions to determine curve complexity
    const isLargeGap = deltaY > 200;
    const isWideGap = deltaX > 500;
    const isEvenRow = rowIndex !== undefined && rowIndex % 2 === 0;
    const needsSmoothTransition = deltaY > 150;
    
    // Use multiple curve segments if conditions are met
    if (isLargeGap || isWideGap || needsSmoothTransition) {
      // Create 6 curve segments (5 more than original)
      const segments = 6;
      let path = `M ${startX} ${startY}`;
      
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const tPrev = (i - 1) / segments;
        
        // Calculate intermediate points with curve
        const currentX = startX + (endX - startX) * t;
        const currentY = startY + (endY - startY) * t;
        
        // Add curve variation based on conditions
        let curveOffsetX = 0;
        let curveOffsetY = 0;
        
        if (isEvenRow) {
          // Alternating pattern for even rows
          curveOffsetX = Math.sin(t * Math.PI) * 20;
        } else {
          // Different pattern for odd rows
          curveOffsetX = -Math.sin(t * Math.PI) * 20;
        }
        
        if (isLargeGap) {
          curveOffsetY = Math.sin(t * Math.PI * 2) * (deltaY * 0.1);
        }
        
        if (isWideGap) {
          curveOffsetX += Math.cos(t * Math.PI) * 30;
        }
        
        // Control points for this segment
        const prevX = startX + (endX - startX) * tPrev;
        const prevY = startY + (endY - startY) * tPrev;
        
        const cp1x = prevX + (currentX - prevX) * 0.3 + curveOffsetX * 0.5;
        const cp1y = prevY + (currentY - prevY) * 0.3 + curveOffsetY * 0.5;
        const cp2x = currentX - (currentX - prevX) * 0.3 + curveOffsetX;
        const cp2y = currentY - (currentY - prevY) * 0.3 + curveOffsetY;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currentX} ${currentY}`;
      }
      
      return path;
    } else {
      // Original single curve for smaller gaps
      const cp1x = startX;
      const cp1y = startY + deltaY * 0.5;
      const cp2x = endX;
      const cp2y = endY - deltaY * 0.5;
      
      return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-visible timeline-container" style={{ position: 'relative' }}>
      {/* Popup animation styles */}
      <style>{`
        @keyframes popupFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .popup-overlay-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .popup-overlay-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .popup-overlay-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .popup-overlay-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Legal Case Timeline</h2>
        
        {/* Fixed 3-events-per-row timeline */}
        <div className="relative" style={{ 
          paddingLeft: `${LEFT_PADDING}px`, 
          paddingRight: `${LEFT_PADDING}px`, 
          minHeight: `${TIMELINE_Y_OFFSET + rows.length * ROW_GAP + 150}px`, 
          marginBottom: '40px',
          paddingBottom: '40px'
        }}>
          <svg
            className="absolute"
            style={{
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              top: '0',
              left: '0',
            }}
          >
            {/* Draw horizontal timeline lines for each row */}
            {rows.map((row, rowIndex) => {
              if (row.length === 0) return null;

              // Calculate line from first to last event in row
              const firstEventX = getEventCenterX(0);
              const lastEventIndex = Math.min(row.length - 1, EVENTS_PER_ROW - 1);
              const lastEventX = getEventCenterX(lastEventIndex);
              const timelineY = TIMELINE_Y_OFFSET + rowIndex * ROW_GAP;
              
              // For the last row, extend the line to the right edge to show it continues
              const lineEndX = rowIndex === rows.length - 1 
                ? LEFT_PADDING + EVENTS_PER_ROW * (EVENT_CARD_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP // Extend to end of row area
                : lastEventX;

              return (
                <line
                  key={`timeline-${rowIndex}`}
                  x1={firstEventX}
                  y1={timelineY}
                  x2={lineEndX}
                  y2={timelineY}
                  stroke="#9CA3AF"
                  strokeWidth="3"
                  style={{ zIndex: 0 }}
                />
              );
            })}

            {/* Draw curved connectors from last event of row to first event of next row */}
            {rows.map((row, rowIndex) => {
              if (rowIndex === rows.length - 1) return null; // Last row, no connector needed

              // Connect from last event of current row to first event of next row
              const lastEventIndex = Math.min(row.length - 1, EVENTS_PER_ROW - 1);
              const startX = getEventCenterX(lastEventIndex);
              const startY = TIMELINE_Y_OFFSET + rowIndex * ROW_GAP;
              
              const endX = getEventCenterX(0);
              const endY = TIMELINE_Y_OFFSET + (rowIndex + 1) * ROW_GAP;

              const path = generateCurvePath(startX, startY, endX, endY);

              return (
                <path
                  key={`connector-${rowIndex}`}
                  d={path}
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="3"
                  style={{ zIndex: 1 }}
                />
              );
            })}
          </svg>

          {/* Events organized in fixed rows of 3 */}
          <div className="relative" style={{ zIndex: 2, paddingTop: '0px' }}>
            {rows.map((row, rowIndex) => {
              return (
                <div
                  key={`row-${rowIndex}`}
                  className="flex relative"
                  style={{
                    marginTop: rowIndex === 0 ? `${TIMELINE_Y_OFFSET - VERTICAL_CONNECTOR_HEIGHT - 50}px` : `${ROW_GAP - CONNECTOR_CURVE_HEIGHT}px`,
                    marginBottom: rowIndex < rows.length - 1 ? `${CONNECTOR_CURVE_HEIGHT}px` : '60px',
                    justifyContent: 'flex-start',
                    flexDirection: 'row',
                    gap: `${HORIZONTAL_GAP}px`,
                  }}
                >
                  {row.map((event, eventIndexInRow) => {
                    const formattedDate = formatDateForDisplay(event.date);
                    const eventTitle = getEventTitle(event);
                    const summaryLines = extractSummary(event);
                    const category = categorizeEvent(event);
                    const categoryColor = getCategoryColor(category);
                    
                    return (
                      <div
                        key={event.id}
                        className="flex flex-col items-center relative"
                        style={{
                          width: `${EVENT_CARD_WIDTH}px`,
                          cursor: 'pointer',
                        }}
                        onMouseEnter={() => setHoveredEventId(event.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                      >
                        {/* Date marker above line */}
                        <div className="mb-2 relative z-20">
                          <div 
                            className={`px-3 py-1 bg-white border-2 rounded-md text-xs font-semibold text-gray-800 whitespace-nowrap shadow-sm transition-all duration-200 ${
                              hoveredEventId === event.id 
                                ? 'border-blue-500 shadow-md bg-blue-50' 
                                : 'border-gray-600'
                            }`}
                          >
                            {formattedDate}
                          </div>
                        </div>

                        {/* Vertical connector line to timeline */}
                        <div
                          className="w-0.5 bg-gray-400 relative z-0"
                          style={{
                            height: `${VERTICAL_CONNECTOR_HEIGHT}px`,
                            marginBottom: '2px',
                          }}
                        />

                        {/* Event details box */}
                        <div
                          className={`bg-white border-2 rounded-lg shadow-lg p-3 transition-all duration-200 ${
                            hoveredEventId === event.id ? 'shadow-xl ring-2 ring-blue-200' : ''
                          }`}
                          style={{
                            borderColor: hoveredEventId === event.id ? '#3b82f6' : categoryColor,
                            width: `${EVENT_CARD_WIDTH}px`,
                            minHeight: `${EVENT_CARD_HEIGHT}px`,
                          }}
                        >
                          {/* Event title */}
                          <div
                            className="font-semibold text-sm mb-2 px-2 py-1 rounded text-white"
                            style={{ backgroundColor: categoryColor }}
                          >
                            {eventTitle}
                          </div>

                          {/* Summary lines - complete text, no truncation */}
                          {summaryLines.length > 0 && (
                            <div className="space-y-1.5">
                              {summaryLines.map((line, lineIdx) => (
                                <div
                                  key={lineIdx}
                                  className="text-xs text-gray-700 leading-relaxed px-1 break-words"
                                  style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                                >
                                  {line}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Fallback to context if no summary */}
                          {summaryLines.length === 0 && event.context && (
                            <div className="text-xs text-gray-600 leading-relaxed px-1 break-words" style={{ wordBreak: 'break-word' }}>
                              {event.context.replace(/PAGE BREAK/gi, '').replace(/---/g, '').trim()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Summary - 2 Column Grid */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Categories Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            {Array.from(categorizedEvents.entries())
              .sort((a, b) => b[1].length - a[1].length)
              .map(([category, categoryEvents]) => {
                const categoryColor = getCategoryColor(category);
                return (
                  <div
                    key={category}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoryColor }}
                      />
                      <span className="font-medium text-gray-900">{category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-700">{categoryEvents.length}</span>
                      <span className="text-sm text-gray-500">events</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ===== CENTERED OVERLAY POPUP ===== */}
      {hoveredEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9998,
            background: 'rgba(0, 0, 0, 0.35)',
            animation: 'backdropFadeIn 0.15s ease-out',
            pointerEvents: 'none',
          }}
        />
      )}
      {hoveredEvent && (() => {
        const dateEvents = getAllEventsForDate(hoveredEvent.date);
        const displayDate = formatDateForDisplay(hoveredEvent.date);
        return (
          <div
            ref={popupRef}
            className="popup-overlay-scrollbar"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '840px',
              maxHeight: '85vh',
              overflowY: 'auto',
              zIndex: 9999,
              background: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
              animation: 'popupFadeIn 0.2s ease-out forwards',
              pointerEvents: 'auto',
            }}
            onMouseEnter={() => setHoveredEventId(hoveredEvent.id)}
            onMouseLeave={() => setHoveredEventId(null)}
          >
            {/* Popup Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '14px',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  border: '1px solid #bfdbfe',
                }}>
                  📅 {displayDate}
                </span>
                <span style={{
                  fontSize: '13px',
                  color: '#64748b',
                  fontWeight: 500,
                }}>
                  {dateEvents.length} event{dateEvents.length > 1 ? 's' : ''} on this date
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                color: '#94a3b8',
                fontStyle: 'italic',
              }}>
                Hover to keep open
              </span>
            </div>

            {/* Events List */}
            {dateEvents.map((dateEvent, idx) => {
              const evtCategory = categorizeEvent(dateEvent);
              const evtColor = getCategoryColor(evtCategory);
              return (
                <div
                  key={dateEvent.id}
                  style={{
                    marginBottom: idx < dateEvents.length - 1 ? '20px' : '0',
                    paddingBottom: idx < dateEvents.length - 1 ? '20px' : '0',
                    borderBottom: idx < dateEvents.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  {/* Event Name & Type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: 900,
                      color: '#0f172a',
                      letterSpacing: '-0.3px',
                    }}>
                      {dateEvent.eventName}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 10px',
                      borderRadius: '6px',
                      background: evtColor + '20',
                      color: '#334155',
                      fontWeight: 600,
                      border: `1px solid ${evtColor}66`,
                    }}>
                      {dateEvent.eventType}
                    </span>
                  </div>

                  {/* Summary */}
                  {dateEvent.summary && (
                    <div style={{
                      fontSize: '13px',
                      color: '#475569',
                      lineHeight: '1.7',
                      marginBottom: '12px',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${evtColor}`,
                    }}>
                      {dateEvent.summary}
                    </div>
                  )}

                  {/* Context - Refined via Gemini AI */}
                  {dateEvent.context && (
                    <div style={{
                      fontSize: '12px',
                      color: '#475569',
                      lineHeight: '1.7',
                      marginBottom: '10px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      padding: '12px 14px',
                      background: '#f1f5f9',
                      borderRadius: '8px',
                      position: 'relative',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#334155', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {refinedContexts[dateEvent.id] ? '✨ AI-Refined Context' : 'Context'}
                        </span>
                        {refiningIds.has(dateEvent.id) && (
                          <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            Refining with AI...
                          </span>
                        )}
                      </div>
                      <div style={{ color: refinedContexts[dateEvent.id] ? '#1e293b' : '#64748b' }}>
                        {refinedContexts[dateEvent.id] 
                          ? refinedContexts[dateEvent.id]
                          : dateEvent.context.replace(/PAGE BREAK/gi, '').replace(/---/g, '').trim()
                        }
                      </div>
                    </div>
                  )}

                  {/* Line Number */}
                  {dateEvent.lineNumber && (
                    <div style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '6px',
                    }}>
                      <span>📄 Document Line: {dateEvent.lineNumber}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
