# Supabase Setup Guide

This guide will help you set up Supabase for your CMS project.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `cms-project` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose the closest region to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Sentry for error tracking
# SENTRY_DSN=your_sentry_dsn
```

**Important**: Never commit the `.env.local` file to version control!

## 4. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-schema.sql` and paste it into the SQL editor
4. Click **Run** to execute the schema

This will create:

- All required tables (websites, games, cloudflare_accounts, cloudflare_purge_logs, textlinks)
- Indexes for performance
- Row Level Security (RLS) policies
- Storage buckets for file uploads
- Sample data

## 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure your site URL:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`

For production, update these URLs to your actual domain.

## 6. Set Up User Roles

The system uses role-based access control with three roles:

- **admin**: Full access to everything
- **editor**: Can create/edit content, but cannot delete accounts/logs
- **viewer**: Read-only access

To assign roles to users:

1. Go to **Authentication** → **Users**
2. Click on a user
3. In the **User Metadata** section, add:
   ```json
   {
     "role": "admin"
   }
   ```

## 7. Configure Storage

The schema automatically creates storage buckets:

- `games`: For game files
- `games-icons`: For game icons
- `games-thumbs`: For game thumbnails
- `avatars`: For user avatars
- `documents`: For private documents

Storage policies are automatically configured based on user roles.

## 8. Test Your Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Try to access the admin panel at `http://localhost:3000/admin`
3. You should be redirected to the login page
4. Create a test user account
5. Assign the "admin" role to your user in Supabase dashboard
6. Try logging in and accessing the admin panel

## 9. Production Deployment

When deploying to production:

1. Update your environment variables in your hosting platform (Vercel, etc.)
2. Update the **Site URL** and **Redirect URLs** in Supabase Authentication settings
3. Consider setting up custom domains for your Supabase project

## 10. Security Checklist

- [ ] Environment variables are properly set
- [ ] RLS policies are enabled on all tables
- [ ] Service role key is only used server-side
- [ ] User roles are properly assigned
- [ ] Storage policies are configured
- [ ] CORS is properly configured for public APIs

## Troubleshooting

### Common Issues

1. **"Missing environment variable" error**

   - Make sure your `.env.local` file exists and has the correct variable names
   - Restart your development server after adding environment variables

2. **Authentication not working**

   - Check that your Site URL and Redirect URLs are correctly configured
   - Verify that your user has a role assigned in the user metadata

3. **Database access denied**

   - Ensure RLS policies are properly configured
   - Check that your user has the correct role assigned

4. **Storage uploads failing**
   - Verify storage buckets exist
   - Check storage policies are configured correctly
   - Ensure user has appropriate role (admin/editor)

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Join the [Supabase Discord](https://discord.supabase.com)
- Review the project's `req.md` file for detailed requirements

## Next Steps

After completing this setup:

1. Test all CRUD operations for websites, games, and textlinks
2. Test Cloudflare integration
3. Test public APIs
4. Set up monitoring and logging
5. Deploy to production
