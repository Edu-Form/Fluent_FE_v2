// pages/api/auth/google/callback.ts (Next.js API route)
// OR app/api/auth/google/callback/route.ts (App Router)

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Handle OAuth error
  // Handle OAuth error
  if (error) {
    console.error('❌ OAuth error:', error);
    const errorMessages: { [key: string]: string } = {
      'access_denied': 'Access was denied. Google Calendar sync requires calendar permissions.',
      'invalid_request': 'Invalid request. Please try signing in again.',
      'unsupported_response_type': 'Authentication error. Please contact support.',
      'invalid_scope': 'Invalid permissions requested. Please try again.',
      'server_error': 'Google server error. Please try again later.',
      'temporarily_unavailable': 'Google Calendar is temporarily unavailable. Please try again later.'
    };
    
    const userFriendlyError = errorMessages[error] || `Authentication failed: ${error}`;
    
    return NextResponse.redirect(
      new URL(`/calendar?error=${encodeURIComponent(userFriendlyError)}`, request.url)
    );
  }

  // Handle successful authorization
  if (code) {
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        console.error('Token exchange error:', tokens.error);
        return NextResponse.redirect(
          new URL(`/calendar?error=${encodeURIComponent(tokens.error)}`, request.url)
        );
      }

      // Store tokens securely (you might want to use cookies or session storage)
      // For this example, we'll redirect with success and let the frontend handle it
      return NextResponse.redirect(
        new URL(`/calendar?success=true&access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`, request.url)
      );

    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return NextResponse.redirect(
        new URL(`/calendar?error=token_exchange_failed`, request.url)
      );
    }
  }

  // No code or error, redirect to calendar
  return NextResponse.redirect(new URL('/calendar', request.url));
}

// For Pages Router (pages/api/auth/google/callback.ts)
/*
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, error, state } = req.query;

  if (error) {
    console.error('OAuth error:', error);
    return res.redirect(`/calendar?error=${encodeURIComponent(error as string)}`);
  }

  if (code) {
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        console.error('Token exchange error:', tokens.error);
        return res.redirect(`/calendar?error=${encodeURIComponent(tokens.error)}`);
      }

      return res.redirect(`/calendar?success=true&access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`);

    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return res.redirect(`/calendar?error=token_exchange_failed`);
    }
  }

  res.redirect('/calendar');
}
*/