import { currentUser } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { Newsletter } from '@/types/supabase';

async function getNewsletter(id: string, userId: string) {
  const supabase = createAdminClient();
  
  // Get newsletter details
  const { data: newsletter, error } = await supabase
    .from('newsletters')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error || !newsletter) {
    return null;
  }
  
  // Check if user is owner or has access
  if (newsletter.owner_id !== userId) {
    // Check if user is a member
    const { data: membership, error: membershipError } = await supabase
      .from('newsletter_users')
      .select('role')
      .eq('newsletter_id', id)
      .eq('user_id', userId)
      .single();
      
    if (membershipError || !membership) {
      return null; // User has no access
    }
    
    return { ...newsletter, role: membership.role };
  }
  
  return { ...newsletter, role: 'owner' };
}

async function getContactCount(newsletterId: string) {
  const supabase = createAdminClient();
  
  // Get total contacts
  const { count: totalCount, error: totalError } = await supabase
    .from('contacts')
    .select('id', { count: 'exact' })
    .eq('newsletter_id', newsletterId);
  
  // Get unsubscribed contacts
  const { count: unsubscribedCount, error: unsubError } = await supabase
    .from('contacts')
    .select('id', { count: 'exact' })
    .eq('newsletter_id', newsletterId)
    .not('unsubscribes', 'is', null);
  
  return {
    total: totalCount || 0,
    subscribed: (totalCount || 0) - (unsubscribedCount || 0),
    unsubscribed: unsubscribedCount || 0,
  };
}

export default async function SubscriptionPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/');
  }
  
  const newsletter = await getNewsletter(params.id, user.id);
  
  if (!newsletter) {
    notFound();
  }
  
  const contacts = await getContactCount(newsletter.id);
  const subscriptionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/${newsletter.id}`;
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <Link href={`/newsletters/${newsletter.id}`} className="hover:text-blue-600">{newsletter.name}</Link>
          <span>/</span>
          <span className="text-gray-700">Subscription Page</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Subscription Page</h1>
        <p className="text-gray-600">
          View and share your public subscription page
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h2 className="text-xl font-semibold mb-4">Public Signup URL</h2>
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={subscriptionUrl}
            readOnly
            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(subscriptionUrl);
              alert('Link copied to clipboard!');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            Copy Link
          </button>
        </div>
        
        <div className="flex justify-center mt-6">
          <Link
            href={subscriptionUrl}
            target="_blank"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Open Signup Page
          </Link>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h2 className="text-xl font-semibold mb-4">Subscriber Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{contacts.subscribed}</div>
            <div className="text-sm text-gray-600">Active Subscribers</div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{contacts.unsubscribed}</div>
            <div className="text-sm text-gray-600">Unsubscribed</div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold">{contacts.total}</div>
            <div className="text-sm text-gray-600">Total Contacts</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Embed Instructions</h2>
        <p className="text-gray-600 mb-4">
          You can embed a subscription form on your website using the following HTML code:
        </p>
        
        <div className="bg-gray-50 p-4 rounded-md mb-4 overflow-x-auto">
          <pre className="text-sm text-gray-800">
{`<iframe
  src="${subscriptionUrl}"
  width="100%"
  height="450"
  frameborder="0"
></iframe>`}
          </pre>
        </div>
        
        <p className="text-sm text-gray-500">
          Copy and paste this code into your website where you want the subscription form to appear.
        </p>
      </div>
    </div>
  );
} 