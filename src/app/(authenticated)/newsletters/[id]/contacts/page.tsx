import { currentUser } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { Newsletter, Contact } from '@/types/supabase';
import AddContactForm from './components/AddContactForm';
import ContactsList from './components/ContactsList';
import {
  Card, CardHeader, CardTitle, CardContent
} from '@/components/ui/card';
import {
  Breadcrumb as UIBreadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadCloud, Users } from 'lucide-react'; // For Import Options and Stats icons

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

async function getContacts(newsletterId: string) {
  const supabase = createAdminClient();
  
  // Get contacts
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*, unsubscribes(unsubscribed_at)')
    .eq('newsletter_id', newsletterId)
    .order('email');
    
  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
  
  // Format contacts with subscription status
  return contacts.map((contact: any) => ({
    ...contact,
    isSubscribed: contact.unsubscribes === null,
    unsubscribed_at: contact.unsubscribes?.unsubscribed_at || null,
  }));
}

export default async function ContactsPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/');
  }
  
  const newsletter = await getNewsletter(params.id, user.id);
  
  if (!newsletter) {
    notFound();
  }
  
  const contacts = await getContacts(newsletter.id);
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      <UIBreadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/dashboard">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href={`/newsletters/${newsletter.id}`}>{newsletter.name}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-foreground">Contacts</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </UIBreadcrumb>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Manage Contacts</h1>
        <p className="text-muted-foreground">
          View, add, and manage subscribers for {newsletter.name}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactsList 
                contacts={contacts} 
                newsletterId={newsletter.id} 
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Add Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <AddContactForm newsletterId={newsletter.id} />
            </CardContent>
            <CardHeader className="pt-6">
              <CardTitle>Import Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert variant="default">
                <UploadCloud className="h-4 w-4" />
                <AlertTitle>CSV Import</AlertTitle>
                <AlertDescription>Coming in v2</AlertDescription>
              </Alert>
              <Alert variant="default">
                <Users className="h-4 w-4" />
                <AlertTitle>Google Contacts Import</AlertTitle>
                <AlertDescription>Coming in v2</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Subscriber Statistics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-600">{contacts.filter((c: any) => c.isSubscribed).length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Active Subscribers</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">{contacts.filter((c: any) => !c.isSubscribed).length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Unsubscribed</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl">{contacts.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total Contacts</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
} 