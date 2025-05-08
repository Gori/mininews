'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

export default function DirectGoogleAuth() {
  const { user, isLoaded } = useUser();
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleCheckAuthStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setAuthStatus(null);
      setDebugInfo(null);
      
      const response = await fetch('/api/google/auth-debug');
      const data = await response.json();
      
      setDebugInfo(data);
      
      if (data.success) {
        if (data.googleOAuth?.connected && data.googleOAuth?.hasToken) {
          setSuccess("Google account connected successfully with access token available.");
          setAuthStatus("connected");
        } else if (data.googleOAuth?.connected && !data.googleOAuth?.hasToken) {
          setError("Google account is connected but no access token is available. Check scopes and permissions.");
          setAuthStatus("no_token");
        } else {
          setAuthStatus("not_connected");
          setError("No Google account connected. Please connect your Google account in the Clerk user settings.");
        }
      } else if (data.error) {
        setError(`Error: ${data.error}. ${data.message || ''}`);
      } else {
        setError("Failed to check authorization status");
      }
    } catch (err) {
      setError("An error occurred while trying to check the authorization status");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Google Auth Status</h1>
        {isLoaded && user && <UserButton />}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Check Google Connection</h2>
        
        <p className="mb-4 text-gray-600">
          This page helps you check if your Clerk account has a connected Google account
          with the necessary OAuth permissions.
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <div className="mb-4">
          <button 
            onClick={handleCheckAuthStatus}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Check Google Auth Status'}
          </button>
        </div>
        
        {authStatus === "not_connected" && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="mb-2 font-medium">Google Account Not Connected:</p>
            <p className="mb-4">To use Google Drive integration, you need to connect your Google account in Clerk.</p>
            <p className="text-sm text-gray-700">
              1. Open your Clerk user profile<br/>
              2. Go to "Connected Accounts"<br/>
              3. Connect your Google account
            </p>
          </div>
        )}
        
        {authStatus === "no_token" && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="mb-2 font-medium">Google Account Connected but Missing Permissions:</p>
            <p className="mb-4">Your Google account is connected, but we don't have proper access to Google Drive. You may need to reconnect your account with additional permissions.</p>
            <p className="text-sm text-gray-700">
              1. Open your Clerk user profile<br/>
              2. Go to "Connected Accounts"<br/>
              3. Disconnect your Google account<br/>
              4. Reconnect and approve all requested permissions
            </p>
          </div>
        )}
        
        {authStatus === "connected" && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="mb-2 font-medium">Google Account Successfully Connected:</p>
            <p className="mb-4">Your Google account is connected and has the proper permissions for Google Drive access.</p>
          </div>
        )}
        
        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded border">
            <h3 className="font-medium mb-2">Debug Information:</h3>
            <pre className="text-xs whitespace-pre-wrap overflow-x-auto bg-gray-100 p-2 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Ensure <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> are correctly set in your <code>.env.local</code> file</li>
          <li>Make sure your Clerk OAuth settings for Google are configured correctly</li>
          <li>Verify that your Google account has been connected in your Clerk user profile</li>
          <li>Check that you've granted the necessary permissions for Google Drive access</li>
        </ol>
      </div>
    </div>
  );
} 