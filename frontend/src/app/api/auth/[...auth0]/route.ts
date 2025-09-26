import { NextRequest } from 'next/server';

// Simple Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '');
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL;
const AUTH0_SECRET = process.env.AUTH0_SECRET;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  console.log('Auth0 route called:', pathname);
  
  if (pathname === '/api/auth/login') {
    try {
      console.log('Starting login...');
      
      if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_BASE_URL) {
        return new Response(
          JSON.stringify({ error: 'Auth0 configuration missing' }), 
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Create login URL manually
      const loginUrl = new URL('/authorize', `https://${AUTH0_DOMAIN}`);
      loginUrl.searchParams.set('response_type', 'code');
      loginUrl.searchParams.set('client_id', AUTH0_CLIENT_ID);
      loginUrl.searchParams.set('redirect_uri', `${AUTH0_BASE_URL}/api/auth/callback`);
      loginUrl.searchParams.set('scope', 'openid profile email');
      loginUrl.searchParams.set('state', 'login');
      
      console.log('Redirecting to:', loginUrl.toString());
      
      return new Response(null, { 
        status: 302, 
        headers: { Location: loginUrl.toString() } 
      });
    } catch (error) {
      console.error('Login error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Login failed', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  if (pathname === '/api/auth/logout') {
    try {
      console.log('Starting logout...');
      
      if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_BASE_URL) {
        return new Response(null, { 
          status: 302, 
          headers: { Location: '/' } 
        });
      }
      
      const logoutUrl = new URL('/v2/logout', `https://${AUTH0_DOMAIN}`);
      logoutUrl.searchParams.set('client_id', AUTH0_CLIENT_ID);
      logoutUrl.searchParams.set('returnTo', AUTH0_BASE_URL);
      
      return new Response(null, { 
        status: 302, 
        headers: { Location: logoutUrl.toString() } 
      });
    } catch (error) {
      console.error('Logout error:', error);
      return new Response(null, { 
        status: 302, 
        headers: { Location: '/' } 
      });
    }
  }
  
  if (pathname === '/api/auth/callback') {
    try {
      console.log('Handling callback...');
      
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      
      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Authorization code not found' }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET || !AUTH0_BASE_URL) {
        return new Response(
          JSON.stringify({ error: 'Auth0 configuration missing' }), 
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Exchange code for tokens
      const tokenResponse = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: AUTH0_CLIENT_ID,
          client_secret: AUTH0_CLIENT_SECRET,
          code: code,
          redirect_uri: `${AUTH0_BASE_URL}/api/auth/callback`,
        }),
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for tokens');
      }
      
      const tokens = await tokenResponse.json();
      
      // Get user info
      const userResponse = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }
      
      const user = await userResponse.json();
      
      // Set session cookie
      const sessionData = {
        user,
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000)
      };
      
      // Encode the session data properly for the cookie
      const encodedSessionData = encodeURIComponent(JSON.stringify(sessionData));
      
      return new Response(null, { 
        status: 302, 
        headers: { 
          Location: '/',
          'Set-Cookie': `auth0.session=${encodedSessionData}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${tokens.expires_in}`
        } 
      });
    } catch (error) {
      console.error('Callback error:', error);
      return new Response(null, { 
        status: 302, 
        headers: { Location: '/' } 
      });
    }
  }
  
  if (pathname === '/api/auth/me') {
    try {
      console.log('Getting session...');
      
      const cookies = request.headers.get('cookie');
      if (!cookies) {
        console.log('No cookies found');
        return Response.json({ user: null });
      }
      
      const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('auth0.session='));
      if (!sessionCookie) {
        console.log('No session cookie found');
        return Response.json({ user: null });
      }
      
      // Extract the cookie value and decode it properly
      const cookieValue = sessionCookie.split('=')[1];
      console.log('Cookie value:', cookieValue);
      
      // URL decode the cookie value first
      const decodedValue = decodeURIComponent(cookieValue);
      console.log('Decoded value:', decodedValue);
      
      const sessionData = JSON.parse(decodedValue);
      
      // Check if session is expired
      if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
        console.log('Session expired');
        return Response.json({ user: null });
      }
      
      console.log('Session data:', sessionData);
      return Response.json({ user: sessionData.user || null });
    } catch (error) {
      console.error('Session error:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      return Response.json({ user: null });
    }
  }
  
  return new Response('Not Found', { status: 404 });
}

export async function POST(request: NextRequest) {
  return new Response('Method Not Allowed', { status: 405 });
}
