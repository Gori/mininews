**Project Overview**

This project delivers a minimal newsletter‐creation tool with an ultra‑clean UI, leveraging Google Drive for content authoring and Gmail for distribution. Users sign in via Gmail (Clerk), create and manage one or more newsletters, import or collect contacts, and send newsletters manually or on a schedule. Basic open‑tracking is provided.

**Goals & Scope**

* **v1**: Manual and scheduled sends of one‑off Google Docs as HTML emails; multi‑user management; minimal signup page per newsletter; basic delivery status and open tracking.
* **v2+ (future)**: Doc templates, Doc→advanced‑HTML styling, click tracking, audit logs, billing, contact import from CSV/Google Contacts, expanded roles.

---

## Tech Stack & Architecture

* **Frontend**: Next.js (App Router), React, Tailwind CSS, Neobrutalism components)
* **Auth**: Clerk (Google/Gmail only)
* **Backend**: Next.js API routes (Node.js), Supabase Edge Functions (for scheduled jobs)
* **Database**: Supabase (PostgreSQL)
* **Hosting**: Vercel (Next.js), Supabase Cron/Edge Functions
* **Integrations**:

  * Google Drive API (list files in folder)
  * Gmail API (send emails)
  * OAuth2 (store refresh tokens)

---

## UI Component Guidelines (Neobrutalism)

This project uses Neobrutalism components provided by [neobrutalism.dev](https://www.neobrutalism.dev/docs).

**Consistency is key:** To maintain the intended Neobrutalist aesthetic, ALWAYS use these components instead of standard HTML elements (like `<button>`, `<input>`) or standard shadcn/ui components for UI elements.

**Installation:**

Components are added using the `shadcn/ui` CLI with the component's specific URL from the Neobrutalism website.

Example (adding the Button component):
```bash
npx shadcn@latest add https://neobrutalism.dev/r/button.json --overwrite --force
```
*(Use `--overwrite` if replacing an existing component file in `src/components/ui`)*

**Usage:**

Import components from `@/components/ui`:
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// etc.
```

Refer to the [Neobrutalism Components Documentation](https://www.neobrutalism.dev/docs) for available components and their props.

---

## Data Model

| Table                 | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| **users**             | Clerk users (by Gmail ID)                                     |
| **newsletters**       | Newsletter metadata (name, folder, owner, status, last\_sent) |
| **newsletter\_users** | M→M between newsletters & users (`owner` or `user` roles)     |
| **contacts**          | Subscribers per newsletter                                    |
| **unsubscribes**      | Tracks unsubscribed contacts                                  |
| **google\_tokens**    | Stored OAuth refresh tokens for Drive/Gmail                   |
| **send\_queue**       | Pending scheduled sends                                       |
| **send\_logs**        | Per‑recipient send result (success/error)                     |
| **open\_events**      | Tracks "open" events via pixel hits                           |

*Refer to Appendix for full SQL schema with types, constraints, and indexes.*

---

## Page-by-Page Overview & Flows

1. **Login**

   * Gmail‑only via Clerk.
   * Upon first sign‑in, request Drive & Gmail scopes; store refresh\_token.

2. **Dashboard**

   * Lists all newsletters the user owns or is a member of.
   * "New Newsletter" button.

3. **Newsletter Settings**

   * Edit name, description, Drive folder ID.
   * Manage members (owner can add/remove users).

4. **Contacts**

   * Manual add (email, first/last name).
   * View unsubscribes.
   * (v2) CSV import / Google Contacts.

5. **Send**

   * **Manual**: Browse Drive folder → select Doc → convert to HTML → preview → send now.
   * **Scheduled**: Detect docs named `YYYY-MM-DD` matching today; list upcoming; toggle enable/disable.

6. **Signup Page**

   * Public URL per newsletter (`/subscribe/[id]`).
   * Fields: email, first name, last name.
   * On submit: add to `contacts` (idempotent), record `subscribed_at`.

7. **Logs**

   * List recent sends (by date).
   * Filter by newsletter.
   * View per‑recipient status.

8. **Open‑Tracking Endpoint**

   * `/api/open?logId=<send_log_id>` returns a 1×1 pixel and logs to `open_events`.

---

## API & Integration Flows

1. **OAuth2**

   * Use Clerk or custom Google OAuth flow to obtain `refresh_token` with Drive & Gmail scopes.
   * Store in `google_tokens`.

2. **Drive File Listing**

   * API route reads `drive_folder_id` → fetch list of Docs via Drive API → return ID + name.

3. **Doc→HTML Conversion**

   * Use Google Docs export (`/export?format=html`) → sanitize minimal inline CSS.

4. **Email Send**

   * For each contact: call Gmail API `messages.send` with raw HTML.
   * Record in `send_logs` (`pending`→`sent`/`error`).

5. **Scheduling**

   * Supabase Cron job at 00:05 UTC daily: find docs named `YYYY-MM-DD` = today → enqueue in `send_queue`.
   * Worker function processes `send_queue` entries immediately after.

---

## Analytics (v1)

* **Delivery Status**: stored in `send_logs` (`sent` or `error`).
* **Open Tracking**: pixel endpoint logs to `open_events`.

---

## Environment & Deployment

**Environment Variables**

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CLERK_FRONTEND_API
CLERK_API_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

**Deployment**

* Frontend & API: Vercel.
* Database & scheduled jobs: Supabase (pg\_cron or Edge Functions).

---

## Appendix: Supabase SQL Schema

```sql
-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ENUM types
create type newsletter_status as enum ('draft','scheduled','sent');
create type send_status       as enum ('pending','sent','error');
create type user_role         as enum ('owner','user');

-- users table
create table users (
  id text primary key,
  created_at timestamptz not null default now()
);

-- newsletters
create table newsletters (
  id               uuid               primary key default gen_random_uuid(),
  owner_id         text               not null references users(id) on delete cascade,
  name             text               not null,
  description      text,
  drive_folder_id  text               not null,
  created_at       timestamptz        not null default now(),
  last_sent_at     timestamptz,
  status           newsletter_status  not null default 'draft'
);

-- newsletter_users (M2M)
create table newsletter_users (
  newsletter_id uuid        not null references newsletters(id) on delete cascade,
  user_id       text        not null references users(id) on delete cascade,
  role          user_role   not null default 'user',
  primary key(newsletter_id, user_id)
);

-- contacts
create table contacts (
  id             uuid        primary key default gen_random_uuid(),
  newsletter_id  uuid        not null references newsletters(id) on delete cascade,
  email          text        not null,
  first_name     text,
  last_name      text,
  subscribed_at  timestamptz not null default now(),
  unique(newsletter_id, email)
);

-- unsubscribes
create table unsubscribes (
  contact_id      uuid        primary key references contacts(id) on delete cascade,
  unsubscribed_at timestamptz not null default now()
);

-- OAuth tokens
create table google_tokens (
  user_id       text        primary key references users(id) on delete cascade,
  refresh_token text        not null,
  scope         text        not null,
  updated_at    timestamptz not null default now()
);

-- send_queue
create table send_queue (
  id              uuid        primary key default gen_random_uuid(),
  newsletter_id   uuid        not null references newsletters(id) on delete cascade,
  doc_id          text        not null,
  scheduled_for   date        not null,
  created_at      timestamptz not null default now(),
  unique(newsletter_id, doc_id, scheduled_for)
);

-- send_logs
create table send_logs (
  id           uuid        primary key default gen_random_uuid(),
  queue_id     uuid        not null references send_queue(id) on delete cascade,
  contact_id   uuid        not null references contacts(id) on delete cascade,
  status       send_status not null default 'pending',
  sent_at      timestamptz default now(),
  error_message text
);

-- open_events
create table open_events (
  id           uuid        primary key default gen_random_uuid(),
  send_log_id  uuid        not null references send_logs(id) on delete cascade,
  opened_at    timestamptz not null default now()
);

-- Indexes for performance
create index idx_newsletters_owner    on newsletters(owner_id);
create index idx_newsletter_users_uid on newsletter_users(user_id);
create index idx_contacts_newsletter  on contacts(newsletter_id);
create index idx_send_queue_date      on send_queue(scheduled_for);
create index idx_send_logs_queue      on send_logs(queue_id);
create index idx_send_logs_contact    on send_logs(contact_id);
create index idx_open_events_log      on open_events(send_log_id);
```

## Development Roadmap

### Phase 1: Environment & Scaffolding ✅

1. ✅ Initialize Git repository and configure remote (e.g., GitHub).
2. ✅ Scaffold Next.js project with App Router, TypeScript, and Tailwind CSS.
3. ✅ Install and configure shadcn/ui components.
4. ✅ Set up environment variables in Vercel and local `.env` for Clerk, Supabase, and Google OAuth.

### Phase 2: Authentication & Authorization

1. ✅ Integrate Clerk for Gmail-only sign-in.
2. ✅ Implement protected routes and session handling (in progress).
3. ✅ Create `users` table mapping Clerk user IDs (schema defined).

### Phase 3: Database & API Foundations

1. ✅ Provision Supabase project and enable pgcrypto & pg\_cron extensions.
2. ✅ Apply SQL schema via migration.
3. ✅ Build Next.js API routes for basic CRUD on `newsletters`.

### Phase 4: Newsletter Management UI

1. ✅ Develop Dashboard page listing newsletters.
2. ✅ Implement Create/Edit Newsletter settings page (UI only).
3. 🔄 Add multi-user invitation and role assignment.

### Phase 5: Contacts & Signup Page

1. 🔄 Build Contacts page for manual add/edit/delete.
2. 🔄 Create public signup page endpoint and form.
3. 🔄 Handle subscription logic and uniqueness.

### Phase 6: Google Drive & Doc Conversion

1. ✅ Implement OAuth flow to obtain and store Google refresh tokens.
2. ✅ Build API route to list Drive files in the newsletter folder.
3. ✅ Replace manual Google Drive Folder ID with visual folder picker.
4. 🔄 Fetch and sanitize HTML export of selected Google Docs.

### Phase 7: Email Sending & Scheduling

1. 🔄 Create Send page UI for manual sends with preview.
2. 🔄 Integrate Gmail API for sending HTML emails.
3. 🔄 Configure Supabase scheduled function to enqueue daily sends based on YYYY-MM-DD filenames.
4. 🔄 Build worker function to process `send_queue`.

### Phase 8: Delivery Status & Open-Tracking

1. 🔄 Record send results in `send_logs`.
2. 🔄 Embed tracking pixel endpoint for open events and log to `open_events`.
3. 🔄 Display delivery and open metrics on Logs page.

### Phase 9: Testing & QA

1. 🔄 Write unit tests for API routes and utilities.
2. 🔄 Perform integration tests for OAuth flows and email sends.
3. 🔄 Conduct end-to-end tests for user flows (sign-up, send, open-tracking).

### Phase 10: Final Deployment & Monitoring

1. 🔄 Deploy all services to Vercel and Supabase.
2. 🔄 Configure database backups and error logging (e.g., Sentry).
3. 🔄 Monitor scheduling and email queues.

# Implementation notes

## Phase 1 Implementation Notes

1. **Project Initialization**:
   - Next.js 15.3.1 with App Router was already set up
   - Using React 19 and Tailwind CSS v4
   - Added shadcn/ui component system for consistent UI
   
2. **Authentication**:
   - Using Clerk for authentication with Google/Gmail sign-in
   - Created middleware for protecting routes
   - Set up route groups with (authenticated) for protected routes
   
3. **Database**:
   - SQL schema stored in supabase/schema.sql
   - TypeScript types created to match database schema
   - Created simple Supabase client utilities
   
4. **UI Components**:
   - Implemented landing page with sign-in/sign-up buttons
   - Created authenticated layout with navigation
   - Set up dashboard, newsletter creation, and Google connect screens
   
5. **Environment**:
   - Defined necessary environment variables in .env.local (template)
   - Created documentation for Supabase setup

## Phase 2 Implementation Notes

1. **Authentication Setup**:
   - Configured Clerk to only allow Gmail/Google sign-in as specified in requirements
   - Removed email/password authentication options
   - Updated homepage to only show "Sign in with Gmail" button
   - This approach ensures users must have a Gmail account to use the application

2. **Route Protection**:
   - Set up middleware to protect authenticated routes
   - Created public routes for landing page and subscription endpoints
   - All dashboard and newsletter management features require authentication

3. **User Management**:
   - Implemented Clerk webhook handler to create users in Supabase
   - User ID from Clerk's Google authentication is used in Supabase tables
   - This enables linking newsletters, contacts, and other data to the authenticated user

## Phase 3 Implementation Notes

1. **Database Setup**:
   - Supabase project has been provisioned
   - SQL schema from supabase/schema.sql has been successfully applied
   - Database tables are now ready for use
   - Environment variables for Supabase connection have been configured in .env.local

2. **API Routes**:
   - Created a health check endpoint at /api/health to verify Supabase connection
   - Implemented Clerk webhook handler to create users in Supabase when they sign up with Clerk
   - Built API endpoints for newsletters at /api/newsletters with:
     - GET: Fetches all newsletters a user owns or is a member of
     - POST: Creates a new newsletter with validation for required fields
   - Integrated Clerk's currentUser() for authentication in API routes

3. **User Management**:
   - Users are automatically created in Supabase when they sign up through Clerk
   - User ID from Clerk is used as the primary key in the Supabase users table
   - This enables linking newsletters, contacts, and other data to the authenticated user

## Phase 4 Implementation Notes

1. **Newsletter Management UI**:
   - Dashboard now fetches and displays user's newsletters from Supabase
   - Created a newsletter creation form that saves to the database
   - Form includes validation for required fields
   - Integrated server actions for form submission
   - Added proper linking between pages

2. **Data Flow**:
   - Frontend components fetch data directly from Supabase in server components
   - Forms submit to API endpoints using server actions
   - Clerk authentication is used throughout to ensure data security
   - Users can only see newsletters they own or are members of

## Phase 6 Implementation Notes

1. **Google OAuth Integration**:
   - Implemented complete OAuth flow for Google Drive and Gmail access (though Gmail sending is still pending).
   - Leveraged Clerk's built-in Google OAuth for user sign-in and initial authentication.
   - To access Google Drive APIs on behalf of the user, the application now uses Clerk's server-side SDK (`@clerk/nextjs/server`).
   - The `clerkClient` is instantiated via `await clerkClient()` and the method `client.users.getUserOauthAccessToken(userId, 'google')` is used to retrieve the Google OAuth access token.
   - This SDK method correctly handles token management and refresh, abstracting the complexity from the application.
   - Initial attempts to use direct REST API calls to Clerk for the token proved unreliable; the SDK method is the correct and supported approach as indicated by Clerk's documentation and examples (e.g., their blog post on Google Calendar integration).
   - Ensured that the provider name is specified as `'google'` (without the `oauth_` prefix) in the `getUserOauthAccessToken` call to align with current Clerk SDK practices and avoid deprecation warnings.
   - API routes that require Google access (e.g., for Drive folder listing) now utilize a helper function (`getGoogleOAuthToken` in `src/lib/clerk.ts`) that encapsulates this SDK-based token retrieval logic.
   - Removed previous implementations that relied on manual refresh token storage in the `google_tokens` table for Clerk-authenticated users, as Clerk manages this when using their SDK.
   - Added detailed configuration validation with helpful error messages for OAuth setup.
   - Created comprehensive setup documentation in `GOOGLE_SETUP.md` (though this may need review to ensure it aligns with the SDK-only approach for Clerk users).

2. **Google Drive API Integration**:
   - Created API endpoints to list Google Drive folders (e.g., `/api/google/drive/folders/clerk-auth/route.ts`).
   - Implemented folder navigation functionality on the backend
   - Built recursive folder listing to enable browsing through folder hierarchy
   - Added proper error handling for authentication issues
   - Implemented OAuth token fallback mechanism for compatibility
   - Added graceful error handling for missing Google credentials

3. **Google Drive Folder Picker**:
   - Implemented GoogleDrivePicker component with folder browsing capability
   - Added visual folder navigation with breadcrumb support
   - Integrated picker into newsletter creation workflow
   - Replaced manual folder ID input with intuitive visual selection
   - Hidden the technical folder ID from users for improved UX
   - Added folder preview with proper name display in form
   - Added dual-mode authentication with Clerk OAuth and custom OAuth
   - Enhanced error handling with specific configuration error messages
   - Added links to setup documentation for easier troubleshooting

4. **Account Management**:
   - Developed Google account connection/reconnection page
   - Implemented token storage in Supabase with proper user association
   - Added connection status detection and error handling
   - Designed intuitive UI for account connection status and management
   - Added automatic authentication detection using Clerk OAuth tokens
   - Implemented seamless authorization by leveraging existing Clerk Google connections
   - Added configuration validation to prevent OAuth flow failures
   - Improved error messages for better user guidance

