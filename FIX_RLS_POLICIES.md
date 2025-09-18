# 🔧 Fix RLS Policies - Step by Step Guide

## ❌ Problem
You're getting this error when running the schema:
```
ERROR: 42710: policy "Verified users can view other verified users" for table "users" already exists
```

This happens because the old recursive policies still exist in your Supabase database.

## ✅ Solution

### **Step 1: Run the Migration Script**

1. **Go to your Supabase SQL Editor**:
   - Visit: https://cvyoupksreeyjcafjyyi.supabase.co/project/default/sql

2. **Copy and run the migration script**:
   - Copy the contents of `supabase/fix-rls-policies.sql`
   - Paste into SQL Editor
   - Click **"Run"**

This script will:
- ✅ Drop all problematic recursive policies
- ✅ Create new safe policies without recursion
- ✅ Resolve the infinite recursion issue

### **Step 2: Test Login**

After running the migration:

1. **Try logging in** with:
   - Email: `brother1@example.com`
   - Password: `masonic123`

2. **Expected behavior**:
   - ✅ Login succeeds without errors
   - ✅ Redirects to `/dashboard`
   - ✅ No infinite recursion in console
   - ✅ Dashboard loads properly

### **Step 3: Verify Fix**

Check browser console for:
- ✅ No "infinite recursion detected" errors
- ✅ Successful user data loading
- ✅ Clean authentication flow

## 🎯 What the Migration Does

### **Policies Removed** (Caused Infinite Recursion):
- `"Verified users can view other verified users"` on `users`
- `"Verified users can view approved member events"` on `events`
- `"Verified users can view nearby presence"` on `presence`
- `"Users can view other users' counters"` on `counters`
- `"Users can view other users' badges"` on `user_badges`
- `"Verified users can view global leaderboard"` on `leaderboard_global`
- `"Verified users can view GL leaderboard"` on `leaderboard_by_gl`
- `"Verified users can view district leaderboard"` on `leaderboard_by_district`
- `"Admins can manage businesses"` on `businesses`

### **Policies Added** (Safe, Non-Recursive):
- `"Service role can read users"` on `users`
- `"Authenticated users can view approved member events"` on `events`
- `"Authenticated users can view presence"` on `presence`
- `"Authenticated users can view counters"` on `counters`
- `"Authenticated users can view user badges"` on `user_badges`
- `"Authenticated users can view global leaderboard"` on `leaderboard_global`
- `"Authenticated users can view GL leaderboard"` on `leaderboard_by_gl`
- `"Authenticated users can view district leaderboard"` on `leaderboard_by_district`
- `"Service role can manage businesses"` on `businesses`

## 📋 Architecture Change

| **Before** | **After** |
|------------|-----------|
| ❌ RLS policies check user verification by querying users table | ✅ RLS policies check basic authentication only |
| ❌ Circular dependencies cause infinite recursion | ✅ Linear policy structure |
| ❌ Complex business logic in database policies | ✅ Business logic in application code |
| ❌ Nested SELECT queries in policies | ✅ Simple auth-based checks |

## ⚠️ Important Notes

1. **Verification Logic**: User verification is now handled in the application code, not RLS policies
2. **Security**: Basic authentication is still enforced at the RLS level
3. **Performance**: Eliminates expensive recursive queries
4. **Maintainability**: Simpler policy structure is easier to debug

## 🚀 After Migration

Your application will:
- ✅ **Login successfully** without infinite recursion
- ✅ **Load user data** properly from the database
- ✅ **Handle verification** at the application level
- ✅ **Perform efficiently** without recursive policy checks

Run the migration script now and test your login! 🎉
