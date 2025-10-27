
import { NextResponse } from 'next/server';
import { getGoogleOAuth2Client } from '@/lib/google-auth';

export async function GET() {
  const oauth2Client = getGoogleOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/documents.readonly',
    'profile',
    'email'
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force refresh token to be sent
  });

  return NextResponse.redirect(authorizationUrl);
}
