import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { getGoogleOAuthToken } from "@/lib/clerk";
import { createAdminClient } from "@/lib/supabase";

// Create a function to get the OAuth2 client with the correct callback URL
function getOAuth2Client(requestUrl: string) {
  // Extract the base URL from the request URL (protocol, host, port)
  const url = new URL(requestUrl);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/account/google/callback`
  );
}

// Function to create a Google Drive client from an access token
async function createDriveClientFromToken(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function GET(request: NextRequest) {
  const user = await currentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get the parent folder ID from query parameters (optional)
    const url = new URL(request.url);
    const parentId = url.searchParams.get('parentId') || 'root';
    
    // Debug: Log user information
    console.log("User ID:", user.id);
    console.log("External accounts count:", user.externalAccounts.length);
    console.log("External providers:", user.externalAccounts.map(acc => acc.provider));
    
    // Try to get Google OAuth token from Clerk REST API
    let accessToken = await getGoogleOAuthToken(user.id);
    if (accessToken) {
      const drive = await createDriveClientFromToken(accessToken);
      const response = await drive.files.list({
        q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name, mimeType)',
        orderBy: 'name',
      });
      const folders = response.data.files || [];
      if (parentId === 'root' && folders.length > 0) {
        const rootFolder = {
          id: 'root',
          name: 'My Drive',
          mimeType: 'application/vnd.google-apps.folder',
        };
        return NextResponse.json({
          folders: [rootFolder, ...folders],
          parentId,
        });
      }
      return NextResponse.json({
        folders,
        parentId,
      });
    }

    // Fallback: Try to get refresh token from database (legacy method)
    const supabase = createAdminClient();
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('refresh_token')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData?.refresh_token) {
      console.log("No stored token found, need to authenticate");
      return NextResponse.json({ 
        error: "Google account not connected", 
        needsAuth: true 
      }, { status: 401 });
    }

    console.log("Found stored refresh token, creating Drive client");
    // Create OAuth client with correct callback URL
    const oauth2Client = getOAuth2Client(request.url);
    
    // Set the credentials from the refresh token
    oauth2Client.setCredentials({
      refresh_token: tokenData.refresh_token,
    });

    // Create Drive client
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    console.log("Querying folders in parent:", parentId);
    // Query for folders in the parent folder
    const response = await drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType)',
      orderBy: 'name',
    });

    const folders = response.data.files || [];
    console.log(`Found ${folders.length} folders`);

    // If requesting root, also include "My Drive" as an option
    if (parentId === 'root' && folders.length > 0) {
      const rootFolder = {
        id: 'root',
        name: 'My Drive',
        mimeType: 'application/vnd.google-apps.folder',
      };
      
      return NextResponse.json({
        folders: [rootFolder, ...folders],
        parentId,
      });
    }

    return NextResponse.json({
      folders,
      parentId,
    });
  } catch (error: any) {
    console.error('Error fetching Drive folders:', error);
    
    // Check if it's an auth error
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return NextResponse.json({ 
        error: "Authorization expired", 
        needsAuth: true 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch Drive folders',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 