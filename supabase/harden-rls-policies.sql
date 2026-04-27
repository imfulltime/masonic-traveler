-- ============================================================
-- Masonic Traveler — RLS Hardening Migration
-- Run this in Supabase SQL Editor BEFORE production deployment
-- ============================================================

-- 1. NOTIFICATIONS: Restrict INSERT to own user_id only
--    Previously: WITH CHECK (true) — anyone could create notifications for anyone
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "Users can only insert their own notifications"
  ON notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Also allow service role (for secretary confirmations, badge awards, etc.)
-- The service role bypasses RLS automatically, so this policy covers
-- regular users while server-side code uses the service role key.


-- 2. USERS: Prevent self-role-change via UPDATE
--    Previously: UPDATE allowed changing any column including 'role'
--    Fix: Users can update their own row but NOT the 'role' or 'is_verified' columns
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM users WHERE id = auth.uid())
    AND is_verified = (SELECT is_verified FROM users WHERE id = auth.uid())
  );

-- Admin can update any user (role changes, verification, etc.)
-- This requires using the service_role key from the server side.


-- 3. LODGE_SECRETARIES: Prevent self-insertion
--    Previously: No INSERT policy — anyone could add themselves as secretary
DROP POLICY IF EXISTS "Anyone can insert lodge_secretaries" ON lodge_secretaries;
DROP POLICY IF EXISTS "Lodge secretaries can be inserted" ON lodge_secretaries;

-- Only service role (admin operations) can insert into lodge_secretaries
-- Regular users cannot self-promote. The service_role key bypasses RLS,
-- so we block all regular user inserts:
CREATE POLICY "No direct insert to lodge_secretaries"
  ON lodge_secretaries FOR INSERT
  WITH CHECK (false);


-- 4. EVENTS: Enforce visibility at the database level
--    Previously: member-only events were filtered in app code only
--    Fix: Users can only see 'public' events OR events from their own lodge
DROP POLICY IF EXISTS "Anyone can view approved events" ON events;
DROP POLICY IF EXISTS "Users can view events" ON events;

CREATE POLICY "Users can view approved events respecting visibility"
  ON events FOR SELECT
  USING (
    -- Always allow if the user created this event
    created_by = auth.uid()
    -- Always allow approved public events
    OR (status = 'approved' AND visibility = 'public')
    -- Allow approved member-only events if user belongs to the same lodge
    OR (
      status = 'approved'
      AND visibility = 'members'
      AND lodge_id IN (
        SELECT lodge_id FROM users WHERE id = auth.uid()
      )
    )
    -- Secretaries can see all events for their lodges (any status)
    OR lodge_id IN (
      SELECT lodge_id FROM lodge_secretaries WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- VERIFICATION: Run these checks after applying the migration
-- ============================================================
-- 1. Log in as brother1@example.com → should NOT be able to:
--    - Change own role via: UPDATE users SET role='admin' WHERE id=auth.uid()
--    - Insert into lodge_secretaries
--    - Create notifications for other users
-- 2. Log in as secretary.sf@example.com → should see all lodge events
-- 3. Log in as admin@masonictraveler.com → use service role for admin ops
-- ============================================================
