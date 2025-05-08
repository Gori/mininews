'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function SetupCredentials() {
  const { user, isLoaded } = useUser();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Display instructions for manually setting credentials
    setIsSubmitting(true);
    setSuccess(null);
    setError(null);
    
    try {
      // Since we can't directly set environment variables at runtime
      // We'll show instructions for setting them manually
      setSuccess(`
        Please add these credentials to your .env.local file:
        
        GOOGLE_CLIENT_ID=${clientId}
        GOOGLE_CLIENT_SECRET=${clientSecret}
        
        Then restart your Next.js development server.
      `);
    } catch (err) {
      setError('Failed to save credentials');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Google API Credentials Setup</h1>
        {isLoaded && user && <UserButton />}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Enter Your Google API Credentials</h2>
        
        <p className="mb-4 text-gray-600">
          To use Google Drive integration, you need to set up OAuth credentials in your Google Cloud Console.
          Enter the credentials below that you obtained from the Google Cloud Console.
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
            <pre className="whitespace-pre-wrap">{success}</pre>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Google Client ID
            </label>
            <input
              type="text"
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Your Google Client ID"
              required
            />
          </div>
          
          <div>
            <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
              Google Client Secret
            </label>
            <input
              type="text"
              id="clientSecret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Your Google Client Secret"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Generate Credentials Instructions'}
          </button>
        </form>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">How to Get Google API Credentials</h2>
        <ol className="list-decimal pl-5 space-y-3">
          <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Cloud Console</a></li>
          <li>Create a new project or select an existing one</li>
          <li>Navigate to "APIs & Services" > "Credentials"</li>
          <li>Click "Create Credentials" and select "OAuth client ID"</li>
          <li>Set the application type to "Web application"</li>
          <li>Set the redirect URI to: <code className="bg-gray-100 p-1 rounded">{typeof window !== 'undefined' ? `${window.location.origin}/account/google/callback` : '[your-app-url]/account/google/callback'}</code></li>
          <li>Click "Create" and you'll get a Client ID and Client Secret</li>
          <li>Copy these values to the form above</li>
        </ol>
        
        <div className="mt-6">
          <Link href="/test-google-drive/direct-auth" className="text-blue-500 hover:underline">
            ← Back to Direct Auth Setup
          </Link>
        </div>
      </div>
    </div>
  );
} 