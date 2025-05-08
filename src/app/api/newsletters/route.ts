import { createAdminClient } from '@/lib/supabase';
import { Newsletter } from '@/types/supabase';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// GET - List all newsletters the current user has access to
export async function GET() {
  try {
    const authState = await auth();
    const { userId } = authState;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get newsletters where the user is the owner or a member
    const { data: ownedNewsletters, error: ownedError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('owner_id', userId);

    if (ownedError) {
      console.error('Error fetching owned newsletters:', ownedError);
      return NextResponse.json({ error: ownedError.message }, { status: 500 });
    }

    // Get newsletters where the user is a member (not the owner)
    const { data: memberNewsletters, error: memberError } = await supabase
      .from('newsletter_users')
      .select('newsletter_id, role, newsletters(*)')
      .eq('user_id', userId);

    if (memberError) {
      console.error('Error fetching member newsletters:', memberError);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // Combine and format the results
    const memberNewslettersFormatted = memberNewsletters.map(item => ({
      ...item.newsletters,
      role: item.role
    }));

    const ownedNewslettersWithRole = ownedNewsletters.map(newsletter => ({
      ...newsletter,
      role: 'owner' as const
    }));

    const allNewsletters = [...ownedNewslettersWithRole, ...memberNewslettersFormatted];

    return NextResponse.json({ newsletters: allNewsletters });
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create a new newsletter
export async function POST(req: Request) {
  try {
    console.log("API Route POST: Attempting to get auth state...");
    const authState = await auth();
    console.log("API Route POST: Auth object received (after await):", authState); 
    try {
      console.log("API Route POST: Auth object (JSON.stringify after await):", JSON.stringify(authState, null, 2));
    } catch (e) {
      console.error("API Route POST: Could not stringify authState (after await). Logging keys:", Object.keys(authState));
    }

    const userId = authState.userId;
    console.log("API Route POST: Extracted userId (after await):", userId);

    if (!userId) {
      console.error("API Route POST: Unauthorized - userId is missing (after await).");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, drive_folder_id } = body;

    // Validate required fields
    if (!name || !drive_folder_id) {
      return NextResponse.json(
        { error: 'Name and Drive folder ID are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if the user exists in the database first
    console.log(`API Route POST: Checking if user ${userId} exists in database`);
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
      console.error(`API Route POST: Error checking user existence: ${userCheckError.message}`);
      return NextResponse.json({ error: `Error checking user existence: ${userCheckError.message}` }, { status: 500 });
    }

    // If user doesn't exist, create it first
    if (!existingUser) {
      console.log(`API Route POST: User ${userId} not found in database, creating...`);
      const { error: userCreateError } = await supabase
        .from('users')
        .insert({ id: userId });

      if (userCreateError) {
        console.error(`API Route POST: Failed to create user ${userId}: ${userCreateError.message}`);
        return NextResponse.json({ error: `Failed to create user: ${userCreateError.message}` }, { status: 500 });
      }
      console.log(`API Route POST: Successfully created user ${userId}`);
    } else {
      console.log(`API Route POST: User ${userId} already exists in database`);
    }

    // Now create the newsletter
    console.log(`API Route POST: Creating newsletter for user ${userId}`);
    const { data, error } = await supabase
      .from('newsletters')
      .insert({
        owner_id: userId,
        name,
        description,
        drive_folder_id,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('API Route POST: Error creating newsletter:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`API Route POST: Newsletter created successfully with ID ${data.id}`);
    return NextResponse.json({ newsletter: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating newsletter:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 