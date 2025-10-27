
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google-auth';
import { setCookie } from 'nookies';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    const oauth2Client = getGoogleOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to retrieve tokens');
    }
    
    const response = NextResponse.redirect(new URL('/documents', req.url));

    // Store tokens in secure, httpOnly cookies
    setCookie({ res: response }, 'google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3599,
    });

    setCookie({ res: response }, 'google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;

  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 500 });
  }
}
