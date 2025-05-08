import { createAdminClient } from '@/lib/supabase';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log("Clerk webhook received");
    
    // Get the webhook payload
    const payload = await req.json();
    const event = payload as WebhookEvent;
    
    console.log(`Clerk webhook type: ${event.type}`);
    
    // Connect to Supabase
    const supabase = createAdminClient();

    // Handle user creation
    if (event.type === 'user.created') {
      const { id } = event.data;
      console.log(`Clerk webhook user.created for userId: ${id}`);
      console.log(`User data:`, JSON.stringify(event.data, null, 2));
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
        console.error(`Error checking for existing user ${id}:`, checkError);
        return NextResponse.json({ success: false, error: checkError.message }, { status: 500 });
      }

      if (existingUser) {
        console.log(`User ${id} already exists in Supabase, skipping creation`);
      } else {
        console.log(`User ${id} does not exist in Supabase, creating...`);
        // Insert the new user
        const { error: insertError } = await supabase
          .from('users')
          .insert({ id });
        
        if (insertError) {
          console.error(`Error creating user ${id} in Supabase:`, insertError);
          return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }
        
        console.log(`User ${id} successfully created in Supabase`);
      }
    } else {
      console.log(`Ignoring webhook event type: ${event.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 