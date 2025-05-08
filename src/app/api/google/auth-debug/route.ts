import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getGoogleOAuthToken } from "@/lib/clerk";
import type { ExternalAccount } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    const envVars = {
      GOOGLE_CLIENT_ID: !!clientId ? "✅ Present" : "❌ Missing",
      GOOGLE_CLIENT_SECRET: !!clientSecret ? "✅ Present" : "❌ Missing",
      NODE_ENV: process.env.NODE_ENV,
      APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };
    
    try {
      // Get the Google OAuth token using the helper function
      const token = await getGoogleOAuthToken(user.id);
      
      // Check if the user has connected a Google OAuth account
      const hasGoogleOAuth = user.externalAccounts.some(
        (account: ExternalAccount) => account.provider === 'oauth_google'
      );
      
      return NextResponse.json({
        success: true,
        envVars,
        userInfo: {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
        },
        googleOAuth: {
          connected: hasGoogleOAuth,
          hasToken: !!token,
        },
        externalAccounts: user.externalAccounts.map((account: ExternalAccount) => ({
          id: account.id,
          provider: account.provider
        }))
      });
      
    } catch (oauthError) {
      // Return detailed error information
      return NextResponse.json({
        error: "OAuth Client Error",
        message: oauthError instanceof Error ? oauthError.message : "Unknown OAuth error",
        envVars,
        requestUrl: request.url,
        userInfo: {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
        },
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Auth Debug Error:', error);
    return NextResponse.json({
      error: "Auth Debug Error",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
} 