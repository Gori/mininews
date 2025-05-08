import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Get the authenticated user
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const newsletterId = params.id;
  
  try {
    const supabase = createAdminClient();
    
    // Check if user is the owner of the newsletter
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('owner_id')
      .eq('id', newsletterId)
      .single();
      
    if (newsletterError || !newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }
    
    if (newsletter.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to add members to this newsletter' }, { status: 403 });
    }
    
    // Get the request data
    const requestData = await request.json();
    const { email, role } = requestData;
    
    // Basic validation
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    if (role !== 'user') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    
    // Find the user by email using Clerk
    try {
      const userList = await clerkClient.users.getUserList({
        emailAddress: [email],
      });
      
      if (userList.length === 0) {
        return NextResponse.json({ error: 'User with this email not found' }, { status: 404 });
      }
      
      const invitedUser = userList[0];
      
      // Check if the user is already a member
      const { data: existingMember, error: memberError } = await supabase
        .from('newsletter_users')
        .select('*')
        .eq('newsletter_id', newsletterId)
        .eq('user_id', invitedUser.id)
        .single();
        
      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member of this newsletter' }, { status: 400 });
      }
      
      // Add the user to the newsletter
      const { error: insertError } = await supabase
        .from('newsletter_users')
        .insert({
          newsletter_id: newsletterId,
          user_id: invitedUser.id,
          role,
        });
        
      if (insertError) {
        console.error('Error adding member:', insertError);
        return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true });
    } catch (clerkError) {
      console.error('Error finding user:', clerkError);
      return NextResponse.json({ error: 'Failed to find user' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Get the authenticated user
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const newsletterId = params.id;
  
  try {
    const supabase = createAdminClient();
    
    // Check if user has access to the newsletter
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('owner_id')
      .eq('id', newsletterId)
      .single();
      
    if (newsletterError || !newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }
    
    const isOwner = newsletter.owner_id === user.id;
    
    if (!isOwner) {
      // Check if user is a member
      const { data: membership, error: membershipError } = await supabase
        .from('newsletter_users')
        .select('role')
        .eq('newsletter_id', newsletterId)
        .eq('user_id', user.id)
        .single();
        
      if (membershipError || !membership) {
        return NextResponse.json({ error: 'Not authorized to access this newsletter' }, { status: 403 });
      }
    }
    
    // Get members
    const { data: members, error: membersError } = await supabase
      .from('newsletter_users')
      .select('user_id, role')
      .eq('newsletter_id', newsletterId);
      
    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
    
    // Add owner to the members list
    const allMembers = [
      {
        user_id: newsletter.owner_id,
        role: 'owner',
      },
      ...(members || []),
    ];
    
    // Get user details from Clerk
    const userIds = allMembers.map(member => member.user_id);
    
    try {
      const userList = await clerkClient.users.getUserList({
        userId: userIds,
      });
      
      const membersWithDetails = allMembers.map(member => {
        const userDetails = userList.find((u: any) => u.id === member.user_id);
        return {
          id: member.user_id,
          role: member.role,
          email: userDetails?.emailAddresses[0]?.emailAddress || '',
          name: userDetails?.firstName || '',
        };
      });
      
      return NextResponse.json(membersWithDetails);
    } catch (clerkError) {
      console.error('Error fetching user details:', clerkError);
      return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Get the authenticated user
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const newsletterId = params.id;
  
  try {
    const supabase = createAdminClient();
    
    // Check if user is the owner of the newsletter
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('owner_id')
      .eq('id', newsletterId)
      .single();
      
    if (newsletterError || !newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }
    
    if (newsletter.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to remove members from this newsletter' }, { status: 403 });
    }
    
    // Get the member to remove
    const url = new URL(request.url);
    const memberId = url.searchParams.get('memberId');
    
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }
    
    // Cannot remove the owner
    if (memberId === newsletter.owner_id) {
      return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 400 });
    }
    
    // Remove the member
    const { error: deleteError } = await supabase
      .from('newsletter_users')
      .delete()
      .eq('newsletter_id', newsletterId)
      .eq('user_id', memberId);
      
    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 