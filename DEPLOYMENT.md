# Deployment Guide

## Environment Variables Setup

The application requires certain environment variables to be properly set up for deployment. The following environment variables must be configured in your deployment platform:

### Required Environment Variables

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### How to Configure Environment Variables

Depending on your deployment platform, you'll need to set these environment variables differently:

#### Vercel

1. Go to your project settings in the Vercel dashboard
2. Navigate to the "Environment Variables" section
3. Add each variable and its value
4. Redeploy your application

#### Netlify

1. Go to your site settings in the Netlify dashboard
2. Navigate to "Build & deploy" > "Environment"
3. Add each variable and its value
4. Trigger a new deployment

## Troubleshooting

If you encounter the error:

```
[Error: Failed to collect configuration] {
  [cause]: Error: Missing Supabase environment variables
}
```

This indicates that the required Supabase environment variables are not accessible during the build process. Make sure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correctly set in your deployment environment.

## Local Development

For local development, create a `.env.local` file in the root directory with these variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Important**: Never commit your actual environment variable values to version control. 