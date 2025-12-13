# Deployment Guide

This guide will help you deploy your Futsal Connect app to Vercel and make it publicly available.

## Prerequisites

1. **GitHub Account** - You'll need a GitHub account to host your repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier is sufficient)
3. **Supabase Project** - Your Supabase project should be set up with all tables and storage buckets

## Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Futsal Connect App"
   ```

2. **Create GitHub Repository**:
   - Go to [github.com](https://github.com) and create a new repository
   - Name it something like `futsal-connect` or `futsal-hub`
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Set Up Environment Variables in Vercel

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**:
   - Before deploying, click "Configure Project"
   - Go to "Environment Variables" section
   - Add the following variables:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - You can find these values in your Supabase project settings:
     - Go to Supabase Dashboard → Settings → API
     - Copy "Project URL" → `VITE_SUPABASE_URL`
     - Copy "anon public" key → `VITE_SUPABASE_ANON_KEY`

3. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)

## Step 3: Update Supabase Settings

1. **Update CORS Settings** (if needed):
   - Go to Supabase Dashboard → Settings → API
   - Add your Vercel domain to allowed origins
   - Format: `https://your-app-name.vercel.app`

2. **Update Storage Policies**:
   - Make sure your storage buckets have public read access
   - Go to Storage → Policies → Check public read policies

## Step 4: Test Your Deployment

1. **Visit Your App**:
   - Vercel will provide you with a URL like `https://your-app-name.vercel.app`
   - Visit the URL and test the following:
     - Sign up with a new account
     - Complete profile setup
     - Create a team or register as a player
     - Test matchmaking and other features

2. **Check Console for Errors**:
   - Open browser DevTools (F12)
   - Check Console tab for any errors
   - Check Network tab to ensure API calls are working

## Step 5: Custom Domain (Optional)

1. **Add Custom Domain in Vercel**:
   - Go to your project settings → Domains
   - Add your custom domain
   - Follow Vercel's instructions to configure DNS

2. **Update Supabase CORS**:
   - Add your custom domain to Supabase allowed origins

## Troubleshooting

### Build Fails
- Check Vercel build logs for errors
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### API Errors
- Check Supabase project is active
- Verify environment variables match your Supabase project
- Check Supabase logs for database errors

### Images Not Loading
- Verify storage buckets are public
- Check storage policies allow public read
- Ensure image URLs are correct

### Authentication Not Working
- Verify Supabase Auth is enabled
- Check email confirmation settings in Supabase
- Ensure redirect URLs are configured in Supabase Auth settings

## Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test profile completion
- [ ] Test team creation
- [ ] Test player registration
- [ ] Test matchmaking
- [ ] Test leaderboard
- [ ] Test tournaments
- [ ] Test file uploads (logos, photos)
- [ ] Test on mobile device
- [ ] Test PWA installation

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Check browser console for errors
4. Verify all environment variables are set correctly

---

**Your app is now live! 🎉**

Share your app URL with users and start building your futsal community!

