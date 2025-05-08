import { clerkClient } from "@clerk/nextjs/server";
import type { ExternalAccount } from "@clerk/nextjs/server";

/**
 * Get Google OAuth token from Clerk using the SDK method.
 * This is based on Clerk's blog post: https://clerk.com/blog/using-clerk-sso-access-google-calendar
 * And addresses the deprecation warning for the provider name.
 * @param userId The user ID to get the token for
 * @returns The Google OAuth token or null if not found
 */
export async function getGoogleOAuthToken(userId: string): Promise<string | null> {
  try {
    // Instantiate the client by calling and awaiting it, as per Clerk blog
    const client = await clerkClient();

    // Check if the user has a Google account connected first (optional but good practice)
    const user = await client.users.getUser(userId);
    const hasGoogleOAuth = user.externalAccounts.some(
      (account: ExternalAccount) => account.provider === 'oauth_google' // keep oauth_ prefix for externalAccounts check
    );

    if (!hasGoogleOAuth) {
      console.log('User does not have a Google OAuth account connected.');
      return null;
    }

    // Use the SDK method to get the token
    // Address deprecation warning: use 'google' instead of 'oauth_google' for the provider argument
    const tokens = await client.users.getUserOauthAccessToken(userId, 'google');

    if (tokens.data && tokens.data.length > 0 && tokens.data[0].token) {
      return tokens.data[0].token;
    } else {
      console.log('No token data returned by SDK method or token is null/empty for user:', userId, JSON.stringify(tokens));
      return null;
    }
  } catch (error) {
    console.error('Error getting Google OAuth token from Clerk SDK:', error);
    return null;
  }
} 