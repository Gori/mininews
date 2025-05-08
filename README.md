# MiniNews 📰

A minimal newsletter creation tool with Google Drive and Gmail integration.

## Features

- ✉️ Send newsletters from Google Docs through Gmail
- 📁 Connect to your Google Drive folders
- 👥 Manage subscribers with simple contact management
- 📊 Track delivery status and opens
- 🗓️ Schedule automatic sends based on document names

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Authentication**: Clerk (Google/Gmail sign-in)
- **Backend**: Next.js API routes, Supabase Edge Functions
- **Database**: Supabase (PostgreSQL)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Clerk account
- Google Developer account (for API access)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mininews.git
   cd mininews
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your API keys for Clerk, Supabase, and Google

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

See `supabase/README.md` for database setup instructions and schema information.

## Project Structure

- `src/app` - Next.js App Router pages and layouts
- `src/components` - Reusable UI components
- `src/lib` - Utility functions and shared logic
- `src/types` - TypeScript type definitions
- `supabase` - Database schema and migration files
- `docs` - Project documentation and planning

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Google Drive Integration

## Setting Up Google Drive Access

This application requires access to Google Drive to create newsletters. Follow these steps to set up Google Drive integration:

1. **Using Clerk OAuth with Google**:
   - Sign in to the application with your Google account through Clerk
   - Visit the [test page](/test-google-drive) to verify your connection
   - If you're experiencing issues, use the Direct Google Auth setup

2. **Direct Google Auth Setup**:
   - Visit the [Direct Google Auth Setup page](/test-google-drive/direct-auth)
   - Click "Connect to Google Drive"
   - Authorize the application in the Google consent screen
   - After successful authorization, you'll be redirected back
   - Your Google Drive access is now set up!

3. **Required Google Scopes**:
   - The application needs the following Google API scopes:
     - `https://www.googleapis.com/auth/drive.readonly` (for accessing Drive files)
     - `https://www.googleapis.com/auth/gmail.send` (for sending newsletters)

4. **Troubleshooting**:
   - If you encounter 401 Unauthorized errors, try the Direct Google Auth Setup
   - Ensure your Google account has the necessary permissions
   - Check that the OAuth credentials are properly configured in your environment
