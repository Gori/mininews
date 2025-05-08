import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  // Get the authenticated user
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id: newsletterId, contactId } = params;
  
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
    
    // Check if contact exists and belongs to this newsletter
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('newsletter_id', newsletterId)
      .single();
      
    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    // Delete contact
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);
      
    if (deleteError) {
      console.error('Error deleting contact:', deleteError);
      return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 