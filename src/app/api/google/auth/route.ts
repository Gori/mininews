import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase";

// Create a function to get the OAuth2 client with the correct callback URL
function getOAuth2Client(requestUrl: string) {
  // Extract the base URL from the request URL (protocol, host, port)
  const url = new URL(requestUrl);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  // Log credentials to debug
  console.log("Client ID available:", !!process.env.GOOGLE_CLIENT_ID);
  console.log("Client Secret available:", !!process.env.GOOGLE_CLIENT_SECRET);
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("Missing required Google OAuth credentials!");
    throw new Error("Missing Google OAuth credentials");
  }
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/account/google/callback`
  );
}

// Set the scopes for Drive and Gmail
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

export async function GET(request: NextRequest) {
  const user = await currentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  
  // Skip the complex check for existing connections and just generate auth URL
  try {
    const oauth2Client = getOAuth2Client(request.url);
    
    // Generate the auth URL with the necessary scopes
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Always show consent screen to get refresh token
      state: request.nextUrl.searchParams.get('redirectUrl') || '/account/google',
    });
    
    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    return NextResponse.json({ 
      error: 'Failed to generate auth URL', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }
    
    const oauth2Client = getOAuth2Client(request.url);
    
    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      return NextResponse.json({ error: 'No refresh token returned' }, { status: 400 });
    }
    
    // Store the refresh token in the database
    const supabase = createAdminClient();
    
    // Check if a token already exists for this user
    const { data: existingToken } = await supabase
      .from('google_tokens')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (existingToken) {
      // Update the existing token
      const { error } = await supabase
        .from('google_tokens')
        .update({ refresh_token: tokens.refresh_token })
        .eq('user_id', user.id);
      
      if (error) {
        throw new Error(`Failed to update token: ${error.message}`);
      }
    } else {
      // Insert a new token
      const { error } = await supabase
        .from('google_tokens')
        .insert({ 
          user_id: user.id, 
          refresh_token: tokens.refresh_token,
          scope: SCOPES.join(' ') 
        });
      
      if (error) {
        throw new Error(`Failed to store token: ${error.message}`);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 500 });
  }
} 