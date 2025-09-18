# 🚀 Manual Setup Instructions

## Current Status
✅ Environment variables configured  
✅ Supabase project exists: https://cvyoupksreeyjcafjyyi.supabase.co  
❌ Database schema needs to be applied manually  
❌ Auth users need to be created  

## Step 1: Apply Database Schema

1. **Go to your Supabase dashboard**: https://cvyoupksreeyjcafjyyi.supabase.co/project/default/sql
2. **Click "New Query"**
3. **Copy and paste** the entire contents of `supabase/schema.sql`
4. **Click "Run"** - this will create all tables and policies

## Step 2: Create Authentication Users

1. **Go to Authentication**: https://cvyoupksreeyjcafjyyi.supabase.co/project/default/auth/users
2. **Click "Add user"** and create these accounts:

| Email | Password | Role |
|-------|----------|------|
| `secretary.sf@example.com` | `masonic123` | Secretary (pre-verified) |
| `brother1@example.com` | `masonic123` | Brother (pre-verified) |
| `newbro1@example.com` | `masonic123` | Brother (needs verification) |
| `admin@masonictraveler.com` | `masonic123` | Admin |

3. **Copy the User IDs** that Supabase generates for each user

## Step 3: Apply Seed Data

1. **Go back to SQL Editor**: https://cvyoupksreeyjcafjyyi.supabase.co/project/default/sql
2. **Update seed.sql** with the actual User IDs from step 2
3. **Copy and paste** the contents of `supabase/seed.sql`
4. **Click "Run"**

## Step 4: Test the Application

```bash
npm run dev
```

Go to http://localhost:3000/auth/login and try:
- Email: `secretary.sf@example.com`
- Password: `masonic123`

Should redirect to `/dashboard` if everything is working!

## ⚠️ Alternative: Quick Setup Script

If you want to try the automated approach:

```bash
# In a new terminal, run:
source .env.local
npm run setup:auth-users
```

This will create the auth users automatically and give you the UUIDs to update the seed data.
