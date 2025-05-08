import { currentUser } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { Newsletter } from '@/types/supabase';
import TeamMembers from './components/TeamMembers';
import {
  Card, CardHeader, CardTitle, CardContent, CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb as UIBreadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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

async function updateNewsletter(formData: FormData) {
  'use server';
  
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const drive_folder_id = formData.get('drive_folder_id') as string;
  
  if (!name || !drive_folder_id) {
    throw new Error('Name and Drive folder ID are required');
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/newsletters/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      drive_folder_id,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update newsletter');
  }
  
  // Redirect to the same page to refresh data
  redirect(`/newsletters/${id}`);
}

export default async function NewsletterSettings({ params }: { params: { id: string } }) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/');
  }
  
  const newsletter = await getNewsletter(params.id, user.id);
  
  if (!newsletter) {
    notFound();
  }
  
  const isOwner = newsletter.role === 'owner';
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <UIBreadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-foreground">{newsletter.name}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </UIBreadcrumb>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Newsletter Settings</h1>
        <p className="text-muted-foreground">
          Manage your newsletter details and members
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Core Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateNewsletter}>
            <input type="hidden" name="id" value={newsletter.id} />
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="mb-1 block">Newsletter Name</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={newsletter.name}
                  placeholder="Monthly Company Updates"
                  required
                  disabled={!isOwner}
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="mb-1 block">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={newsletter.description || ''}
                  placeholder="Updates and announcements for our team and stakeholders"
                  disabled={!isOwner}
                />
              </div>
              
              <div>
                <Label htmlFor="drive_folder_id" className="mb-1 block">Google Drive Folder ID</Label>
                <Input
                  type="text"
                  id="drive_folder_id"
                  name="drive_folder_id"
                  defaultValue={newsletter.drive_folder_id}
                  placeholder="1a2b3c4d5e6f7g8h9i0j"
                  required
                  disabled={!isOwner}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is the folder that contains your newsletter documents.
                </p>
              </div>
            </div>
            
            {isOwner && (
              <CardFooter className="flex justify-end space-x-3 mt-6 p-0">
                <Link href="/dashboard" passHref legacyBehavior>
                  <Button asChild variant="neutral">
                    <a>Cancel</a>
                  </Button>
                </Link>
                <Button type="submit">
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </form>
        </CardContent>
      </Card>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Manage who has access to this newsletter. Owners can edit all settings, while users can only send newsletters.
          </p>
          <TeamMembers newsletterId={newsletter.id} isOwner={isOwner} currentUserId={user.id} />
        </CardContent>
        {isOwner && (
          <CardFooter className="flex justify-end">
            <Link href={`/newsletters/${newsletter.id}/members/invite`} passHref legacyBehavior>
              <Button asChild>
                <a>Invite Members</a>
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Newsletter</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href={`/newsletters/${newsletter.id}/contacts`} passHref legacyBehavior>
            <a className="block rounded-base focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <Card className="h-full hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Manage subscribers and lists</p>
                </CardContent>
              </Card>
            </a>
          </Link>
          
          <Link href={`/newsletters/${newsletter.id}/send`} passHref legacyBehavior>
            <a className="block rounded-base focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <Card className="h-full hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Send Newsletter</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Create and send newsletters</p>
                </CardContent>
              </Card>
            </a>
          </Link>
          
          <Link href={`/newsletters/${newsletter.id}/logs`} passHref legacyBehavior>
            <a className="block rounded-base focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <Card className="h-full hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">View send history and analytics</p>
                </CardContent>
              </Card>
            </a>
          </Link>
          
          <Link href={`/newsletters/${newsletter.id}/subscribe`} passHref legacyBehavior>
            <a className="block rounded-base focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <Card className="h-full hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Subscription Page</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Customize and view signup page</p>
                </CardContent>
              </Card>
            </a>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
} 