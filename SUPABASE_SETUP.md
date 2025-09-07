# Supabase OAuth Setup Guide

This guide will help you connect your React app to Supabase with Google OAuth authentication.

## 1. Get Your Supabase Project Details

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 2. Update Environment Variables

Update your `.env` file in `simplr-front-end/simplr-react/` with your actual Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Development URL (used for OAuth redirect)
VITE_APP_URL=http://localhost:5173
```

## 3. Configure OAuth Providers in Supabase

### Google OAuth Setup

1. In your Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click **Configure**
3. Enable Google authentication
4. Add your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret

### Apple OAuth Setup (Optional)

1. In the same **Providers** section, find **Apple**
2. Enable Apple authentication
3. Add your Apple OAuth credentials:
   - **Client ID**: Your Apple Service ID
   - **Client Secret**: Your Apple Client Secret (JWT)

## 4. Configure Redirect URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add the following URLs to **Redirect URLs**:
   - `http://localhost:5173/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

## 5. Test the Integration

1. Save your `.env` file
2. Restart your development server:
   ```bash
   cd simplr-front-end/simplr-react
   npm run dev
   ```
3. Try signing in with Google - you should be redirected to Google's OAuth flow
4. After successful authentication, you'll be redirected back to your app

## 6. Production Deployment

When deploying to production:

1. Update your environment variables with production Supabase URL
2. Add your production domain to the Redirect URLs in Supabase
3. Update `VITE_APP_URL` to your production domain

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URL"**: Make sure your redirect URL is added to Supabase's allowed URLs
2. **"OAuth provider not configured"**: Ensure Google/Apple OAuth is enabled and configured in Supabase
3. **Environment variables not loading**: Restart your development server after updating `.env`

### Debug Steps:

1. Check browser console for any error messages
2. Verify your Supabase project URL and anon key are correct
3. Ensure OAuth providers are properly configured in Supabase Dashboard

## What Changed

The authentication system has been updated to use Supabase instead of direct OAuth SDKs:

- ✅ **Supabase Client**: Added `@supabase/supabase-js` for authentication
- ✅ **OAuth Flow**: Now uses Supabase's `signInWithOAuth()` method
- ✅ **Session Management**: Automatic session handling with Supabase
- ✅ **Auth Callback**: Handles OAuth redirects properly
- ✅ **Anonymous Auth**: Guest mode now uses Supabase anonymous authentication

Your existing UI and user experience remain the same - only the backend authentication provider has changed!