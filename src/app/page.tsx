import Link from 'next/link';
import { SignInButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function Home() {
  const { userId } = await auth();
  
  // If user is already logged in, redirect to dashboard
  if (userId) {
    redirect('/dashboard');
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="max-w-4xl w-full">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">MiniNews</h1>
          <p className="text-xl text-gray-600">
            A minimal newsletter creation tool with Google Drive and Gmail integration.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Create Newsletters</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Easily create and manage one or more newsletters with a clean, simple interface.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Google Drive Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Use Google Docs for content creation, then send it directly as an HTML email.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Manage Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Import or add contacts manually, and track unsubscribes automatically.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Schedule Sends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Set up automatic sends based on date-formatted filenames in your Drive folder.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-center">
          <SignInButton mode="modal">
            <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="mr-2 fill-current">
                <path d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.447,1.722-1.997,2.996-3.846,2.996 c-2.22,0-4.001-1.781-4.001-4.001s1.781-4.001,4.001-4.001c0.995,0,1.906,0.354,2.613,0.949l0.293,0.253l1.523-1.523l-0.297-0.252 C16.792,6.201,15.372,5.6,13.817,5.6c-3.581,0-6.455,2.874-6.455,6.455s2.874,6.455,6.455,6.455c5.813,0,6.439-5.452,6.439-7.27 c0-0.59-0.048-1.134-0.122-1.63h-7.589V12.151z" />
              </svg>
              Sign in with Gmail
            </button>
          </SignInButton>
        </div>
      </div>
    </main>
  );
}
