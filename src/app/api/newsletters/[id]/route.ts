import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase';

export async function PATCH(
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
      return NextResponse.json({ error: 'Not authorized to update this newsletter' }, { status: 403 });
    }
    
    // Get the request data
    const requestData = await request.json();
    const { name, description, drive_folder_id } = requestData;
    
    // Basic validation
    if (!name || !drive_folder_id) {
      return NextResponse.json({ error: 'Name and Drive folder ID are required' }, { status: 400 });
    }
    
    // Update the newsletter
    const { error: updateError } = await supabase
      .from('newsletters')
      .update({
        name,
        description,
        drive_folder_id,
      })
      .eq('id', newsletterId);
      
    if (updateError) {
      console.error('Error updating newsletter:', updateError);
      return NextResponse.json({ error: 'Failed to update newsletter' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating newsletter:', error);
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
    
    // Get the newsletter
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', newsletterId)
      .single();
      
    if (newsletterError || !newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }
    
    // Check if user has access
    if (newsletter.owner_id !== user.id) {
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
      
      return NextResponse.json({ ...newsletter, role: membership.role });
    }
    
    return NextResponse.json({ ...newsletter, role: 'owner' });
  } catch (error) {
    console.error('Error fetching newsletter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 