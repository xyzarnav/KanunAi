import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API:init-qa] Received request');
    const contentType = request.headers.get('content-type') || '';
    console.log('[API:init-qa] Content-Type:', contentType);

    let body: FormData | string | undefined;
    let headers: Record<string, string> = {};
    
    if (contentType.includes('multipart/form-data')) {
      body = await request.formData();
      console.log('[API:init-qa] FormData received');
      // Don't set Content-Type for FormData, let fetch handle it
    } else if (contentType.includes('application/json')) {
      const jsonData = await request.json();
      console.log('[API:init-qa] JSON data:', jsonData);
      // Keep as JSON, don't convert to FormData
      body = JSON.stringify(jsonData);
      headers['Content-Type'] = 'application/json';
    } else {
      body = await request.text();
      console.log('[API:init-qa] Text body:', body);
      if (contentType) headers['Content-Type'] = contentType;
    }

    const backendResp = await fetch('http://localhost:5000/api/analysis/init-qa', {
      method: 'POST',
      headers,
      body,
    });

    if (!backendResp.ok) {
      const errText = await backendResp.text();
      console.log('[API:init-qa] Backend error:', errText);
      return NextResponse.json({ message: 'Backend error', error: errText }, { status: backendResp.status });
    }

    const data = await backendResp.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.log('[API:init-qa] Proxy error:', err?.message || err);
    return NextResponse.json({ message: 'Proxy error', error: err?.message || String(err) }, { status: 500 });
  }
}
