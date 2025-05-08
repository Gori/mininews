'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams?.get('code');
      const state = searchParams?.get('state'); // Contains the redirect URL
      const error = searchParams?.get('error');
      
      if (error) {
        setStatus('error');
        setErrorMessage(`Google authorization failed: ${error}`);
        return;
      }
      
      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received.');
        return;
      }
      
      try {
        // Exchange the code for a token
        const response = await fetch('/api/google/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to exchange code for token');
        }
        
        setStatus('success');
        
        // Redirect after a short delay to the original redirect URL or default
        setTimeout(() => {
          router.push(state || '/account/google');
        }, 1500);
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.message || 'An error occurred while processing your request.');
      }
    }
    
    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Google Account Connection</h1>
        
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Connecting your Google account...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-700 mb-2">Success!</h2>
            <p className="text-gray-600 mb-4">Your Google Drive and Gmail are now connected to MiniNews.</p>
            <p className="text-sm text-gray-500">Redirecting you back...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-700 mb-2">Connection Failed</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <Link href="/account/google" className="text-blue-600 hover:underline">
              Try Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 