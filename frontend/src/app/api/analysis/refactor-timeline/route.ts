import { NextRequest, NextResponse } from 'next/server';

/**
 * Refactor raw legal document context into concise, meaningful summaries
 * using Gemini API via the backend
 */
export async function POST(request: NextRequest) {
  try {
    const { context, parsed_date, maxLength = 3 } = await request.json();

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      );
    }

    console.log('[API:refactor-timeline] Received context for date:', parsed_date);

    // Forward to backend for Gemini processing
    const backendResponse = await fetch('http://localhost:5000/api/analysis/refactor-timeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context,
        parsed_date,  // NEW: Pass parsed date
        maxLength,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.log('[API:refactor-timeline] Backend error:', errorText);
      return NextResponse.json(
        { message: 'Backend error', error: errorText },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('[API:refactor-timeline] Refactored successfully');
    return NextResponse.json(data);
  } catch (err: any) {
    console.log('[API:refactor-timeline] Proxy error:', err?.message || err);
    return NextResponse.json(
      { message: 'Proxy error', error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
