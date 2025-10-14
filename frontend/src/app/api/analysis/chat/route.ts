import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API:chat] Received request');
    const contentType = request.headers.get('content-type') || '';
    console.log('[API:chat] Content-Type:', contentType);

    let body: FormData | string | undefined;
    if (contentType.includes('multipart/form-data')) {
      body = await request.formData();
      console.log('[API:chat] FormData received');
    } else if (contentType.includes('application/json')) {
      const jsonData = await request.json();
      console.log('[API:chat] JSON data:', jsonData);
      body = JSON.stringify(jsonData);
    } else {
      body = await request.text();
      console.log('[API:chat] Text body:', body);
    }

    const headers: Record<string, string> = {};
    if (contentType) headers['Content-Type'] = contentType;

    const backendResp = await fetch('http://localhost:5000/api/analysis/chat', {
      method: 'POST',
      headers,
      body,
    });

    if (!backendResp.ok) {
      const errText = await backendResp.text();
      console.log('[API:chat] Backend error:', errText);
      return NextResponse.json({ message: 'Backend error', error: errText }, { status: backendResp.status });
    }

    const data = await backendResp.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.log('[API:chat] Proxy error:', err?.message || err);
    return NextResponse.json({ message: 'Proxy error', error: err?.message || String(err) }, { status: 500 });
  }
}
