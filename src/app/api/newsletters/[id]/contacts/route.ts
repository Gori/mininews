import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase';

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
    
    // Get contacts with unsubscribe status
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*, unsubscribes(unsubscribed_at)')
      .eq('newsletter_id', newsletterId)
      .order('email');
      
    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }
    
    // Format contacts with subscription status
    const formattedContacts = contacts.map(contact => ({
      ...contact,
      isSubscribed: contact.unsubscribes === null,
      unsubscribed_at: contact.unsubscribes?.unsubscribed_at || null,
    }));
    
    return NextResponse.json(formattedContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    
    // Get the request data
    const requestData = await request.json();
    const { email, first_name, last_name } = requestData;
    
    // Basic validation
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Check if contact already exists
    const { data: existingContact, error: existingError } = await supabase
      .from('contacts')
      .select('id')
      .eq('newsletter_id', newsletterId)
      .eq('email', email)
      .single();
      
    if (existingContact) {
      return NextResponse.json({ error: 'Contact with this email already exists' }, { status: 400 });
    }
    
    // Add new contact
    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        newsletter_id: newsletterId,
        email,
        first_name,
        last_name,
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Error adding contact:', insertError);
      return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
    }
    
    return NextResponse.json(newContact);
  } catch (error) {
    console.error('Error adding contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 