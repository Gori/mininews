import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Newsletter } from '@/types/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function getNewsletters(userId: string) {
  const supabase = createAdminClient();
  
  // Get newsletters where the user is the owner
  const { data: ownedNewsletters, error: ownedError } = await supabase
    .from('newsletters')
    .select('*')
    .eq('owner_id', userId);
    
  if (ownedError) {
    console.error('Error fetching owned newsletters:', ownedError);
    return [];
  }
  
  // Get newsletters where the user is a member
  const { data: memberNewsletters, error: memberError } = await supabase
    .from('newsletter_users')
    .select('newsletter_id, role, newsletters(*)')
    .eq('user_id', userId);
    
  if (memberError) {
    console.error('Error fetching member newsletters:', memberError);
    return ownedNewsletters || [];
  }
  
  // Format member newsletters
  const memberNewslettersFormatted = memberNewsletters
    ? memberNewsletters.map((item: any) => ({
        ...item.newsletters,
        role: item.role
      }))
    : [];
  
  // Add role to owned newsletters
  const ownedNewslettersWithRole = ownedNewsletters
    ? ownedNewsletters.map((newsletter: Newsletter) => ({
        ...newsletter,
        role: 'owner'
      }))
    : [];
  
  return [...ownedNewslettersWithRole, ...memberNewslettersFormatted];
}

export default async function Dashboard() {
  const user = await currentUser();
  
  // Protect the route - redirect to home if not logged in
  if (!user) {
    redirect('/');
  }
  
  // Fetch user's newsletters
  const newsletters = await getNewsletters(user.id);
  const hasNewsletters = newsletters.length > 0;
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress.split('@')[0]}
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Your Newsletters</CardTitle>
            <Link href="/newsletters/new" passHref legacyBehavior>
              <Button asChild>
                <a>New Newsletter</a>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {hasNewsletters ? (
            <div className="space-y-4">
              {newsletters.map((newsletter: any) => (
                <Card key={newsletter.id}>
                  <CardHeader>
                    <CardTitle>{newsletter.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {newsletter.description && (
                      <p className="text-sm text-gray-600 mt-1">{newsletter.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Role: {newsletter.role.charAt(0).toUpperCase() + newsletter.role.slice(1)}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link 
                      href={`/newsletters/${newsletter.id}`} 
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Manage →
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 mb-4">You don't have any newsletters yet.</p>
                <p className="text-gray-500">
                  Create your first newsletter to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-600">
              <li>1. Create a newsletter</li>
              <li>2. Add a Google Drive folder</li>
              <li>3. Import or add contacts</li>
              <li>4. Send your first newsletter</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-600">
              <p>Email: {user.emailAddresses[0]?.emailAddress}</p>
              <p>Connected to Gmail: No</p>
              <p className="pt-2">
                <Link href="/account/google" className="text-blue-600 hover:underline">
                  Connect Google Account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 