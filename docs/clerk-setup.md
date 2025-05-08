# Clerk Authentication Setup Guide

This guide explains how to set up Clerk authentication for MiniNews, which requires **Gmail-only authentication** as specified in the product requirements.

## 1. Create a Clerk Account and Application

1. Sign up for a Clerk account at [clerk.dev](https://clerk.dev)
2. Create a new application in the Clerk dashboard
3. Name your application (e.g., "MiniNews")

## 2. Configure Authentication Methods

### Disable All Authentication Methods Except Google

1. In the Clerk dashboard, go to **User & Authentication** → **Email, Phone, Username**
2. **IMPORTANT**: Disable "Email Address" authentication completely by turning off all email-related options
3. Go to **User & Authentication** → **Social Connections**
4. Enable only **Google** as the authentication provider
5. Make sure all other social providers are disabled

### Completely Remove Email Login Option

1. Navigate to **User & Authentication** → **Authentication** → **Sign-in**
2. Under "Authentication Strategies", disable everything except "OAuth" 
3. Make sure "Email Address" is set to "Disabled"
4. Under "Session Settings", set appropriate session durations

### Configure Google OAuth

1. Follow Clerk's documentation to set up Google OAuth
2. When configuring the Google OAuth application, ensure:
   - You request the necessary scopes for Gmail and Google Drive access
   - You set the correct redirect URIs as provided by Clerk

## 3. Update Application Instance Settings

1. Go to **Customization** → **Appearance**
2. In the "Sign-in & Sign-up" section:
   - Set "Available integrations" to show only Google
   - Make sure email sign-in is completely removed from the UI

## 4. Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Clerk Auth (Gmail-only authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key
CLERK_SECRET_KEY=sk_test_your-secret-key

# Only allow Google as an OAuth provider
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Force OAuth-only (Google) authentication
NEXT_PUBLIC_CLERK_SIGN_UP_MODE=oauth_only
NEXT_PUBLIC_CLERK_SIGN_IN_MODE=oauth_only

# Request necessary Google API scopes
NEXT_PUBLIC_CLERK_OAUTH_GOOGLE_SCOPE="email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive.readonly"
```

## 5. Additional Code Configuration

If the above dashboard settings don't fully disable the email option, add this configuration to your Clerk provider:

```tsx
// src/app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider 
      appearance={{
        layout: {
          socialButtonsPlacement: "top",
          socialButtonsVariant: "iconButton",
        },
        signIn: {
          socialButtonsPlacement: "top"
        }
      }}
      localization={{
        formFieldLabel__emailAddress: "",
        signIn: {
          start: {
            title: "Sign in with Gmail",
            subtitle: "Please sign in with your Google account to continue",
            actionText: ""
          }
        }
      }}
    >
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

## 6. Webhooks (Optional)

You can set up webhooks to synchronize user data between Clerk and your Supabase database.

## Verification Steps

After making these changes:
1. Test the sign-in flow in both development and production environments
2. Verify that only the Google sign-in option appears, with no email input field
3. Ensure the "Sign up" option is removed or redirects to Google authentication
4. Confirm that trying to access the email sign-in directly (via URL manipulation) doesn't work

## Important Requirements Reminder

According to the MiniNews product specifications, **only Gmail sign-in is permitted**. Do not enable any other authentication methods in your Clerk configuration.

The product is designed to:
1. Only work with Google/Gmail accounts
2. Use Google Drive for document access
3. Use Gmail for sending newsletters

This authentication restriction ensures that users will always have the necessary Google services available for the application's core functionality. 