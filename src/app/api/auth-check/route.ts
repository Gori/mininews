import { NextResponse } from 'next/server';

export async function GET() {
  // Return information about current Clerk configuration
  const config = {
    signInMode: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_MODE || 'not_set',
    signUpMode: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_MODE || 'not_set',
    googleScope: process.env.NEXT_PUBLIC_CLERK_OAUTH_GOOGLE_SCOPE ? 'configured' : 'not_set',
    appName: 'MiniNews',
    authMode: 'gmail_only'
  };
  
  return NextResponse.json({
    status: 'ok',
    message: 'Auth configuration check',
    config
  });
} 