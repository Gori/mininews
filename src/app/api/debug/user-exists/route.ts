import { createAdminClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // Get userId parameter from query string
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    // Use authenticated user if no userId provided
    let userIdToCheck = userId;
    if (!userIdToCheck) {
      const authState = await auth();
      userIdToCheck = authState.userId;
      
      if (!userIdToCheck) {
        return NextResponse.json({ 
          error: 'No userId provided and no authenticated user found' 
        }, { status: 400 });
      }
    }

    // Check if the user exists in the database
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, created_at')
      .eq('id', userIdToCheck)
      .single();

    if (error) {
      console.error('Error checking user existence:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      // User doesn't exist, create them
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert({ id: userIdToCheck })
        .select('id, created_at')
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.json({
          exists: false,
          created: false,
          error: insertError.message,
          userId: userIdToCheck
        }, { status: 500 });
      }

      return NextResponse.json({
        exists: false,
        created: true,
        user: insertedUser,
        userId: userIdToCheck
      });
    }

    // User exists
    return NextResponse.json({
      exists: true,
      user: data,
      userId: userIdToCheck
    });
  } catch (error) {
    console.error('Error in user-exists API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 