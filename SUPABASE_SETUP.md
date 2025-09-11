# Supabase Setup Guide

This guide will help you set up Supabase integration for the Website & Game Management System.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is sufficient)

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in
2. Create a new project
3. Choose a database password and region
4. Wait for the project to be created (usually takes 2-3 minutes)

## Step 2: Get Your Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://your-project-ref.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`) - **Keep this secret!**

## Step 3: Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Step 4: Set Up the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` and paste it into the SQL editor
3. Click **Run** to execute the schema

This will create:
- All required tables (websites, games, cloudflare_accounts, etc.)
- Proper indexes for performance
- Row Level Security (RLS) policies
- Storage buckets for file uploads
- Sample data for testing

## Step 5: Configure Authentication

### Email/Password Authentication (Enabled by default)

1. Go to **Authentication** → **Settings**
2. Ensure **Enable email confirmations** is turned OFF for development
3. Set **Site URL** to `http://localhost:3000`
4. Add `http://localhost:3000/**` to **Redirect URLs**

### Create Your First Admin User

You can create users in two ways:

#### Option A: Through Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. In **User Metadata**, add:
   ```json
   {
     "role": "admin",
     "name": "Admin User"
   }
   ```

#### Option B: Through SQL
```sql
-- Insert a new user (replace with your details)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com', -- Replace with your email
  crypt('yourpassword123', gen_salt('bf')), -- Replace with your password
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin","name":"Admin User"}', -- Admin role metadata
  now(),
  now(),
  '',
  '',
  '',
  ''
);
```

## Step 6: Configure Storage

The schema automatically creates three storage buckets:
- `games` - For game assets (icons, thumbnails, etc.) - **Public**
- `avatars` - For user avatars - **Public**
- `documents` - For documents and files - **Private**

Storage policies are automatically configured based on user roles.

## Step 7: Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`
3. Log in with the admin credentials you created
4. You should be redirected to the admin dashboard

## User Roles

The system supports three user roles:

- **admin**: Full access to all features including user management and Cloudflare accounts
- **editor**: Can create, read, and update content but cannot delete or manage sensitive settings
- **viewer**: Read-only access to content

Roles are stored in the user's metadata and enforced through RLS policies.

## API Endpoints

The following API endpoints are now available:

### Public APIs (No authentication required)
- `GET /api/public/backlinks?domain=example.com` - Get textlinks for a domain
- `GET /api/websites` - List websites (with filtering)
- `GET /api/games` - List games (with filtering)

### Admin APIs (Authentication required)
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `POST /api/websites` - Create website
- `PUT /api/websites/[id]` - Update website
- `DELETE /api/websites/[id]` - Delete website (admin only)
- `POST /api/games` - Create game
- `PUT /api/games/[id]` - Update game
- `DELETE /api/games/[id]` - Delete game (admin only)
- `POST /api/upload` - Upload files to storage

### Rate Limiting
Public APIs include basic rate limiting (60 requests per minute per IP).

## Development Tips

1. **Database Changes**: If you need to modify the schema, use Supabase migrations or update the SQL file and re-run it.

2. **Storage Setup**: Make sure your storage buckets have the correct policies. Check the **Storage** → **Policies** section in Supabase.

3. **RLS Debugging**: If you're having permission issues, check the RLS policies in **Database** → **Tables** → select table → **RLS** tab.

4. **User Role Issues**: Ensure user metadata includes the correct role. You can check/update this in **Authentication** → **Users** → select user → **Raw User Meta Data**.

## Production Deployment

For production deployment:

1. Update environment variables with production Supabase credentials
2. Set proper site URLs and redirect URLs in Supabase Auth settings
3. Enable email confirmations if desired
4. Consider setting up custom SMTP for emails
5. Review and adjust RLS policies as needed
6. Set up monitoring and logging

## Troubleshooting

### "Invalid JWT" Errors
- Check that your environment variables are correct
- Ensure the Supabase URL doesn't have a trailing slash
- Verify the anon key is copied correctly

### Permission Denied Errors
- Check RLS policies are enabled and configured correctly
- Verify user has the correct role in metadata
- Check if the user is authenticated

### Storage Upload Errors
- Verify storage buckets exist
- Check storage policies allow the operation
- Ensure file size and type restrictions are met

### Authentication Issues
- Check site URL and redirect URLs in Supabase settings
- Verify email confirmation settings match your setup
- Check browser console for specific error messages

## Next Steps

With Supabase integration complete, you can now:

1. Implement the remaining admin pages (Cloudflare, Textlinks)
2. Add real data to replace mock data
3. Implement file upload functionality for games
4. Add user management features
5. Set up production deployment

The foundation is now in place for a fully functional CMS with authentication, database operations, and file storage.