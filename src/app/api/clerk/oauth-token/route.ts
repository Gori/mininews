import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getGoogleOAuthToken } from "@/lib/clerk";

export async function GET(request: NextRequest) {
  try {
    // First verify the user is authenticated
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    try {
      // Use the REST-based helper to get the OAuth token
      const token = await getGoogleOAuthToken(user.id);
      if (!token) {
        return NextResponse.json({
          error: "No OAuth tokens found",
          message: "No OAuth tokens were returned from Clerk's API"
        }, { status: 404 });
      }
      // Success - return the token details (but not the actual token for security)
      return NextResponse.json({
        success: true,
        hasToken: true,
        tokenPreview: `${token.substring(0, 5)}...`
      });
    } catch (error) {
      // Handle specific errors that might occur
      console.error('Error retrieving OAuth token:', error);
      return NextResponse.json({
        error: "OAuth token retrieval failed",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null
      }, { status: 500 });
    }
  } catch (error) {
    console.error('General error in OAuth token endpoint:', error);
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 