'use client';

import React, { useState, useEffect } from 'react';

interface TimelineEvent {
  readonly id: string;
  readonly eventName: string;
  readonly date: string;
  readonly eventType: string;
  readonly context?: string;
  readonly summary?: string;
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
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden timeline-container">
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
                        }}
                      >
                        {/* Date marker above line */}
                        <div className="mb-2 relative z-10">
                          <div className="px-3 py-1 bg-white border-2 border-gray-600 rounded-md text-xs font-semibold text-gray-800 whitespace-nowrap shadow-sm">
                            {formattedDate}
                          </div>
                        </div>

                        {/* Vertical connector line to timeline */}
                        <div
                          className="w-0.5 bg-gray-400 relative z-0"
                          style={{
                            height: `${VERTICAL_CONNECTOR_HEIGHT}px`, // Height to reach timeline below cards
                            marginBottom: '2px',
                          }}
                        />

                        {/* Event details box */}
                        <div
                          className="bg-white border-2 rounded-lg shadow-lg p-3"
                          style={{
                            borderColor: categoryColor,
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
              .sort((a, b) => b[1].length - a[1].length) // Sort by count descending
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
    </div>
  );
}
