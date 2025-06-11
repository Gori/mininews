import { currentUser } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { Newsletter } from '@/types/supabase';
import {
  Card, CardHeader, CardTitle, CardContent, CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
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
  
  // Check if user is owner
  if (newsletter.owner_id !== userId) {
    return null; // Only owners can invite members
  }
  
  return newsletter;
}

async function inviteMember(formData: FormData) {
  'use server';
  
  const newsletterId = formData.get('newsletter_id') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  
  if (!email) {
    throw new Error('Email is required');
  }
  
  // Validate role
  if (role !== 'user') {
    throw new Error('Invalid role');
  }
  
  // For this version, we simply check if the user with this email exists
  // and add them to the newsletter_users table
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/newsletters/${newsletterId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        role,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to invite member');
    }
    
    // Redirect back to newsletter settings
    redirect(`/newsletters/${newsletterId}`);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to invite member');
  }
}

export default async function InviteMember({ params }: { params: { id: string } }) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/');
  }
  
  const newsletter = await getNewsletter(params.id, user.id);
  
  if (!newsletter) {
    notFound();
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <UIBreadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/dashboard">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href={`/newsletters/${newsletter.id}`} >{newsletter.name}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-foreground">Invite Member</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </UIBreadcrumb>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Invite Team Member</h1>
        <p className="text-muted-foreground">
          Invite a team member to collaborate on "{newsletter.name}"
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invitation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={inviteMember} className="space-y-6">
            <input type="hidden" name="newsletter_id" value={newsletter.id} />
            
            <div>
              <Label htmlFor="email" className="mb-1 block">Email Address</Label>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="team@example.com"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                The user must have already signed up for MiniNews with this email.
              </p>
            </div>
            
            <div>
              <Label htmlFor="role" className="mb-1 block">Role</Label>
              <Select name="role" defaultValue="user">
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  {/* Add other roles here if they become available, e.g., Admin */}
                  {/* <SelectItem value="admin">Admin</SelectItem> */}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Users can send newsletters but can't modify settings.
              </p>
            </div>
            
            <CardFooter className="flex justify-end space-x-3 pt-6 px-0 pb-0">
              <Link href={`/newsletters/${newsletter.id}`} passHref >
                <Button asChild variant="neutral">
                  <a>Cancel</a>
                </Button>
              </Link>
              <Button type="submit">
                Send Invitation
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 