import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { newsletter_id, email, first_name, last_name } = requestData;
    
    // Basic validation
    if (!newsletter_id || !email) {
      return NextResponse.json({ error: 'Newsletter ID and email are required' }, { status: 400 });
    }
    
    const supabase = createAdminClient();
    
    // Check if the newsletter exists
    const { data: newsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('id')
      .eq('id', newsletter_id)
      .single();
      
    if (newsletterError || !newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }
    
    // Check if the contact already exists
    const { data: existingContact, error: existingError } = await supabase
      .from('contacts')
      .select('id, unsubscribes(contact_id)')
      .eq('newsletter_id', newsletter_id)
      .eq('email', email)
      .single();
    
    // If contact exists and is not unsubscribed, return success (idempotent)
    if (existingContact) {
      // If the contact was previously unsubscribed, resubscribe them
      if (existingContact.unsubscribes) {
        const { error: unsubscribeError } = await supabase
          .from('unsubscribes')
          .delete()
          .eq('contact_id', existingContact.id);
          
        if (unsubscribeError) {
          console.error('Error resubscribing contact:', unsubscribeError);
          return NextResponse.json({ error: 'Failed to resubscribe contact' }, { status: 500 });
        }
      }
      
      return NextResponse.json({ success: true, message: 'Already subscribed' });
    }
    
    // Add new contact
    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        newsletter_id,
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
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 