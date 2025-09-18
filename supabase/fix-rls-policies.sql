-- Fix RLS Policies Migration
-- This script removes the problematic recursive policies and replaces them with safe ones

-- Drop all existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Verified users can view other verified users" ON users;
DROP POLICY IF EXISTS "Verified users can view approved member events" ON events;
DROP POLICY IF EXISTS "Verified users can view nearby presence" ON presence;
DROP POLICY IF EXISTS "Users can view other users' counters" ON counters;
DROP POLICY IF EXISTS "Users can view other users' badges" ON user_badges;
DROP POLICY IF EXISTS "Verified users can view global leaderboard" ON leaderboard_global;
DROP POLICY IF EXISTS "Verified users can view GL leaderboard" ON leaderboard_by_gl;
DROP POLICY IF EXISTS "Verified users can view district leaderboard" ON leaderboard_by_district;
DROP POLICY IF EXISTS "Admins can manage businesses" ON businesses;

-- Create new safe policies without recursive references

-- Users policies (safe versions)
CREATE POLICY "Service role can read users" ON users
    FOR SELECT USING (auth.role() = 'service_role');

-- Events policies
CREATE POLICY "Authenticated users can view approved member events" ON events
    FOR SELECT USING (
        status = 'approved' 
        AND visibility = 'members'
    );

-- Presence policies
CREATE POLICY "Authenticated users can view presence" ON presence
    FOR SELECT TO authenticated USING (true);

-- Counters policies
CREATE POLICY "Authenticated users can view counters" ON counters
    FOR SELECT TO authenticated USING (true);

-- User badges policies
CREATE POLICY "Authenticated users can view user badges" ON user_badges
    FOR SELECT TO authenticated USING (true);

-- Leaderboard policies
CREATE POLICY "Authenticated users can view global leaderboard" ON leaderboard_global
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view GL leaderboard" ON leaderboard_by_gl
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view district leaderboard" ON leaderboard_by_district
    FOR SELECT TO authenticated USING (true);

-- Business policies
CREATE POLICY "Service role can manage businesses" ON businesses
    FOR ALL USING (auth.role() = 'service_role');
