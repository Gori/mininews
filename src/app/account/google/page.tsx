'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GoogleAccountPage() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch('/api/google/drive/folders');
        const data = await response.json();
        
        if (response.ok) {
          setIsConnected(true);
        } else if (data.needsAuth) {
          setIsConnected(false);
        } else {
          setErrorMessage(data.error || 'An error occurred');
        }
      } catch (error) {
        setErrorMessage('Failed to check Google connection status');
        console.error('Error checking Google connection:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkConnection();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/google/auth');
      const data = await response.json();
      
      if (response.ok && data.url) {
        // Navigate to Google auth page
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || 'Failed to initialize Google authorization');
      }
    } catch (error) {
      setErrorMessage('An error occurred while connecting to Google');
      console.error('Error connecting to Google:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-700">Google Account</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Google Account Connection</h1>
        <p className="text-gray-600">
          Connect your Google account to access Drive folders and send emails via Gmail
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        {isLoading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking connection status...</p>
          </div>
        ) : isConnected ? (
          <div>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Connected to Google</h2>
                <p className="text-gray-600">Your Google Drive and Gmail are connected</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleConnect}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Reconnect
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Connect to Google</h2>
                <p className="text-gray-600">Connect your Google account to use Drive and Gmail</p>
              </div>
            </div>
            {errorMessage && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {errorMessage}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                {isConnecting ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
                  </span>
                ) : (
                  'Connect Google Account'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Why Connect Your Google Account?</h2>
        <div className="space-y-4">
          <div className="flex">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Access Google Docs</h3>
              <p className="text-sm text-gray-600">Browse and select documents from your Drive for newsletters</p>
            </div>
          </div>
          <div className="flex">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Send via Gmail</h3>
              <p className="text-sm text-gray-600">Use your Gmail account to send newsletters to your contacts</p>
            </div>
          </div>
          <div className="flex">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Secure Authorization</h3>
              <p className="text-sm text-gray-600">We use OAuth2 and only request the minimum permissions needed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 