# Supabase Setup for MiniNews

This directory contains the database schema and setup instructions for the MiniNews Supabase backend.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in or create an account
2. Create a new project
3. Give your project a name (e.g., "mininews")
4. Choose a secure database password
5. Select a region closest to your target users
6. Click "Create new project"

### 2. Configure Environment Variables

Get the following values from your Supabase project:
- URL: Settings → API → Project URL
- Anon Key: Settings → API → `anon` `public` key
- Service Role Key: Settings → API → `service_role` key (keep this secret)

Add these to your `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Apply Database Schema

1. Open the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `schema.sql` into the editor
3. Click "Run" to execute the SQL and create all required tables

### 4. Enable Extensions

Make sure the `pgcrypto` extension is enabled:
1. Go to Database → Extensions
2. Search for "pgcrypto"
3. Toggle it to enabled if it's not already

### 5. Set Up Cron Job (Optional for Scheduled Sends)

For scheduled newsletter sends:
1. Go to Database → Functions
2. Follow the instructions to set up a cron job using pg_cron 
   (or use Supabase Edge Functions depending on implementation)

## Models Overview

- **users**: Clerk user IDs with timestamps
- **newsletters**: Newsletter metadata, linked to owner (user)
- **newsletter_users**: Many-to-many relationship between newsletters and users
- **contacts**: Newsletter subscribers with email and name
- **unsubscribes**: Tracks unsubscribed contacts
- **google_tokens**: OAuth refresh tokens for Google Drive/Gmail
- **send_queue**: Pending scheduled newsletter sends
- **send_logs**: Per-recipient send status
- **open_events**: Tracks email opens via tracking pixel 