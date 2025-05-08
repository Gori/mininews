import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { getGoogleOAuthToken } from "@/lib/clerk";

// Function to create a Google Drive client from an access token
async function createDriveClientFromToken(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Get parent folder ID from query parameters (optional)
    const url = new URL(request.url);
    const parentId = url.searchParams.get('parentId') || 'root';
    
    // Get OAuth token using the documented Clerk REST API
    const accessToken = await getGoogleOAuthToken(user.id);
    
    // If no token is available, return an error
    if (!accessToken) {
      return NextResponse.json({
        error: "OAuth token not available",
        message: "Could not retrieve Google OAuth token from Clerk",
        advice: "Make sure you have connected your Google account and granted necessary permissions."
      }, { status: 401 });
    }
    
    // Create Drive client
    const drive = await createDriveClientFromToken(accessToken);
    
    // Query for folders in the parent folder
    const response = await drive.files.list({
      q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, mimeType)',
      orderBy: 'name',
    });
    
    // Return the list of folders
    return NextResponse.json({
      success: true,
      folders: response.data.files || []
    });
  } catch (error) {
    console.error('Error fetching Google Drive folders:', error);
    
    return NextResponse.json({
      error: "Google Drive API error",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
} 