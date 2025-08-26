# 🚀 Easy Setup Guide for Masonic Traveler

Your project is now connected to GitHub! Here's what you need to do next:

## ✅ Already Done
- ✅ GitHub repository: https://github.com/imfulltime/masonic-traveler
- ✅ All code is pushed to GitHub
- ✅ Dependencies are installed

## 🔗 Next Steps

### 1. 🗄️ Set Up Supabase (Database)

1. **Go to [supabase.com](https://supabase.com) and sign up**
2. **Create a new project**:
   - Project name: `masonic-traveler`
   - Generate a strong database password (save it!)
   - Choose a region close to you
   - Wait 2-3 minutes for setup

3. **Set up the database**:
   - Go to "SQL Editor" in the left sidebar
   - Click "New query"
   - Copy and paste the entire contents from `supabase/schema.sql`
   - Click "Run"

4. **Add test data (recommended)**:
   - Create another new query
   - Copy and paste contents from `supabase/seed.sql`
   - Click "Run"

5. **Get your API keys**:
   - Go to "Settings" > "API"
   - Copy these three values:
     - **Project URL**: `https://your-project-id.supabase.co`
     - **anon public key**: The long string
     - **service_role key**: Click "Reveal" to see it

### 2. ⚙️ Configure Environment Variables

Edit the `.env.local` file in your project and update these values:

```env
# Replace with your actual Supabase values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE=your_service_role_key_here

# Keep these as they are
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
LEADERBOARD_SCORE_VISIT_WEIGHT=1
LEADERBOARD_SCORE_CHARITY_WEIGHT=2
FUZZ_MIN_METERS=250
FUZZ_MAX_METERS=500
DEFAULT_RADIUS_KM=10
```

### 3. 🧪 Test Locally

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the Masonic Traveler landing page!

### 4. 🚀 Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign up with GitHub**
2. **Import your project**:
   - Click "New Project"
   - Select `imfulltime/masonic-traveler`
   - Click "Import"

3. **Add environment variables** (before deploying):
   - Click "Environment Variables"
   - Add all the variables from your `.env.local` file
   - Change `NEXT_PUBLIC_APP_URL` to your Vercel URL (you'll get this after deployment)

4. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - You'll get a live URL!

5. **Update Supabase settings**:
   - Copy your Vercel URL
   - Go to Supabase > Authentication > Settings
   - Update **Site URL** to your Vercel URL
   - Add `your-vercel-url.vercel.app/auth/callback` to **Redirect URLs**

## 🎯 Quick Test Checklist

After setup, test these features:

- [ ] Landing page loads
- [ ] User registration works
- [ ] Email verification works
- [ ] Login works
- [ ] Dashboard shows (after verification)

## 🆘 Need Help?

If you run into issues:

1. **Check the console** for error messages
2. **Verify environment variables** are set correctly
3. **Check Supabase dashboard** for database connectivity
4. **Look at Vercel logs** for deployment issues

## 🔧 Useful Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Check code quality
npm run test         # Run tests

# Git commands
git add .            # Stage all changes
git commit -m "message"  # Commit changes
git push origin main # Push to GitHub (auto-deploys to Vercel)
```

## 🔗 Important URLs

- **GitHub**: https://github.com/imfulltime/masonic-traveler
- **Supabase**: Will be provided after you create the project
- **Vercel**: Will be provided after deployment

---

**You're all set! The hardest part is done. Now just follow the steps above to get your Masonic Traveler PWA live! 🎉**
