import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Received request');
    
    // Get the request body
    const contentType = request.headers.get('content-type') || '';
    console.log('[API] Content-Type:', contentType);
    
    let body;
    if (contentType.includes('multipart/form-data')) {
      body = await request.formData();
      console.log('[API] FormData received');
    } else if (contentType.includes('application/json')) {
      const jsonData = await request.json();
      console.log('[API] JSON data:', jsonData);
      // Convert JSON to FormData for backend
      body = new FormData();
      if (jsonData.text) {
        body.append('text', jsonData.text);
      }
    } else {
      body = await request.text();
      console.log('[API] Text body:', body);
    }
    
    console.log('[API] Forwarding to backend...');
    
    // Forward the request to the backend
    const headers: Record<string, string> = {};
    
    // Forward the Content-Type header for multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      // Don't set Content-Type for multipart/form-data as fetch will set it with boundary
      console.log('[API] Forwarding as multipart/form-data');
    } else if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const backendResponse = await fetch('http://localhost:5000/api/analysis/summary', {
      method: 'POST',
      headers: headers,
      body: body,
    });

    console.log('[API] Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.log('[API] Backend error:', errorText);
      return NextResponse.json(
        { message: 'Backend error', error: errorText },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('[API] Backend success, returning data');
    return NextResponse.json(data);
  } catch (error: any) {
    console.log('[API] Error:', error.message);
    return NextResponse.json(
      { message: 'Proxy error', error: error.message },
      { status: 500 }
    );
  }
}
