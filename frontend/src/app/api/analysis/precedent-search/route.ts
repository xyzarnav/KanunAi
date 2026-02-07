import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { summary } = body;

    if (!summary) {
      return NextResponse.json(
        { error: 'Case summary is required' },
        { status: 400 }
      );
    }

    // Forward to backend (use port 5000 like summary route)
    const backendUrl = 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/analysis/precedent-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ summary }),
    });

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';
    
    if (!contentType.includes('application/json')) {
      // Handle non-JSON responses (likely HTML error page)
      const text = await response.text();
      console.error('[API] Non-JSON response:', text.substring(0, 200));
      return NextResponse.json(
        { 
          error: 'Backend returned invalid response format', 
          precedents: [],
          details: response.status === 404 ? 'Route not found' : 'Server error'
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: data.message || data.error || 'Precedent search failed', 
          precedents: data.precedents || []
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] Precedent search error:', error);
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          error: 'Invalid response from backend server', 
          precedents: [],
          details: 'Backend may not be running or route does not exist'
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error', 
        precedents: [] 
      },
      { status: 500 }
    );
  }
}





