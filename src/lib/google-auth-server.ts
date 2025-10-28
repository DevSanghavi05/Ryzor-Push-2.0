import { OAuth2Client } from 'google-auth-library';
import { NextRequest } from 'next/server';

// This is a new server-side helper to get an authenticated client for API routes.
export const getAuthenticatedClient = async (req: NextRequest): Promise<OAuth2Client> => {
  const accessToken = req.cookies.get('google_access_token')?.value;

  if (!accessToken) {
    throw { code: 401, message: 'Missing authentication token.' };
  }

  const oauth2Client = new OAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return oauth2Client;
};

    