#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🧪 Testing login with verified user...\n');

  // Test credentials from seed data
  const testUsers = [
    { email: 'secretary.sf@example.com', verified: true, role: 'secretary' },
    { email: 'brother1@example.com', verified: true, role: 'brother' },
    { email: 'newbro1@example.com', verified: false, role: 'brother' },
    { email: 'admin@masonictraveler.com', verified: true, role: 'admin' }
  ];

  console.log('📋 Available test accounts:');
  testUsers.forEach(user => {
    console.log(`  📧 ${user.email} (${user.role}, ${user.verified ? 'verified' : 'unverified'})`);
  });
  console.log('  🔑 Password for all: masonic123\n');

  // Try logging in with a verified user
  const testEmail = 'brother1@example.com';
  const testPassword = 'masonic123';

  console.log(`🔐 Attempting login with ${testEmail}...`);

  try {
    // Step 1: Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Authentication successful');
    console.log('📍 User ID:', authData.user.id);

    // Step 2: Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        lodge:lodge_id (
          id,
          name,
          number,
          grand_lodge,
          district
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('❌ User profile error:', userError.message);
      return;
    }

    console.log('✅ User profile loaded');
    console.log('👤 Name:', userData.first_name);
    console.log('🏛️ Lodge:', userData.lodge?.name || 'None');
    console.log('👑 Role:', userData.role);
    console.log('✅ Verified:', userData.is_verified);

    if (userData.is_verified) {
      console.log('\n🎉 SUCCESS: User should redirect to /dashboard');
    } else {
      console.log('\n⚠️  User should redirect to /verification/required');
    }

    // Clean up
    await supabase.auth.signOut();
    console.log('🔓 Signed out');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testLogin().catch(console.error);
