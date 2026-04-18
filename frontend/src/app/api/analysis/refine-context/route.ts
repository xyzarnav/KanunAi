import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { context } = body;

    console.log('[API:refine-context] Received context for refinement');

    const backendResponse = await fetch('http://localhost:5000/api/analysis/refine-context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.log('[API:refine-context] Backend error:', errorText);
      return NextResponse.json({ 
        error: 'Backend refinement failed',
        refined: context // Fallback
      }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('[API:refine-context] Refined successfully');

    return NextResponse.json(data);
  } catch (err: any) {
    console.log('[API:refine-context] Proxy error:', err?.message || err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
