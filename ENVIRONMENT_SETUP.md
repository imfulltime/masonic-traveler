# 🔧 Environment Setup Guide

## Current Issue: Test Environment Detected

Your `.env.local` file is currently pointing to test/localhost values:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
```

This explains why:
- ❌ Login is not working
- ❌ Database queries return empty results
- ❌ TypeScript shows `never` types

## ✅ Fix Steps

### 1. Set Up Real Supabase Project

1. **Go to [supabase.com](https://supabase.com)**
2. **Create a new project**:
   - Project name: `masonic-traveler`
   - Choose a region close to you
   - Wait 2-3 minutes for setup

3. **Get your API keys** from Settings > API:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: The long string
   - **service_role key**: Click "Reveal" to see it

### 2. Update .env.local

Replace your current `.env.local` with:

```env
# Replace with your ACTUAL Supabase values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE=your_actual_service_role_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png

# Leaderboard Configuration
LEADERBOARD_SCORE_VISIT_WEIGHT=1
LEADERBOARD_SCORE_CHARITY_WEIGHT=2

# Location Privacy Configuration
FUZZ_MIN_METERS=250
FUZZ_MAX_METERS=500
DEFAULT_RADIUS_KM=10
```

### 3. Set Up Database

Run these commands in order:

```bash
# Set up database schema
npm run setup:supabase

# Create authentication users
npm run setup:auth-users
```

### 4. Test Login

1. **Start dev server**: `npm run dev`
2. **Go to**: http://localhost:3000/auth/login
3. **Try login with**:
   - Email: `secretary.sf@example.com`
   - Password: `masonic123`
4. **Should redirect to**: `/dashboard` or `/verification/required`

## 🔧 Verification System

**Yes, verification is required!** The app implements a real-world Masonic verification system:

- **New users** → Need secretary approval OR brother vouching
- **Unverified users** → Redirected to `/verification/required`
- **Verified users** → Full access to dashboard

**Test accounts (after setup):**
- `secretary.sf@example.com` → Pre-verified ✅
- `brother1@example.com` → Pre-verified ✅
- `newbro1@example.com` → Needs verification ❌

## 🚨 Troubleshooting

If login still fails:
1. Check browser console for errors
2. Verify Supabase credentials are correct
3. Ensure database schema was applied
4. Check that auth users were created

**The key issue is using real Supabase credentials instead of test values!**
