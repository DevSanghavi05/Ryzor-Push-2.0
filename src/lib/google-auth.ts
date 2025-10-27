
import { OAuth2Client } from 'google-auth-library';

export const getGoogleOAuth2Client = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.APP_BASE_URL) {
    throw new Error("Missing Google OAuth credentials or App Base URL in environment variables.");
  }
  
  const redirectURI = `${process.env.APP_BASE_URL}/api/auth/google/callback`;

  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectURI
  );
};
