#!/usr/bin/env node

/**
 * Create Auth Users Script
 * Creates test users in Supabase Auth for development
 */

const { createClient } = require('@supabase/supabase-js');

// Test users to create
const testUsers = [
  { email: 'secretary.sf@example.com', password: 'masonic123', name: 'Robert' },
  { email: 'brother1@example.com', password: 'masonic123', name: 'Thomas' },
  { email: 'newbro1@example.com', password: 'masonic123', name: 'Matthew' },
  { email: 'admin@masonictraveler.com', password: 'masonic123', name: 'Admin' }
];

async function createAuthUsers() {
  // Check environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE');
    console.error('\nPlease set these in your .env.local file');
    process.exit(1);
  }

  // Create admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔐 Creating test auth users...\n');

  const createdUsers = [];

  for (const user of testUsers) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true // Auto-confirm email
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`   ✅ User already exists: ${user.email}`);
          
          // Get existing user
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === user.email);
          
          if (existingUser) {
            createdUsers.push({
              email: user.email,
              id: existingUser.id,
              name: user.name
            });
          }
        } else {
          console.error(`   ❌ Error creating ${user.email}:`, error.message);
        }
      } else {
        console.log(`   ✅ Created: ${user.email} (ID: ${data.user.id})`);
        createdUsers.push({
          email: user.email,
          id: data.user.id,
          name: user.name
        });
      }
    } catch (err) {
      console.error(`   ❌ Error creating ${user.email}:`, err.message);
    }
  }

  console.log('\n📋 Summary of created users:');
  console.log('Copy these UUIDs to update your seed.sql file:\n');
  
  createdUsers.forEach(user => {
    console.log(`-- ${user.name} (${user.email})`);
    console.log(`'${user.id}',`);
    console.log('');
  });

  console.log('🎉 Auth users creation complete!');
  console.log('\nNext steps:');
  console.log('1. Update seed.sql with the UUIDs above');
  console.log('2. Run: npm run setup:supabase');
  console.log('3. Test login with any of the created accounts');

  return createdUsers;
}

// Run if called directly
if (require.main === module) {
  createAuthUsers().catch(console.error);
}

module.exports = { createAuthUsers, testUsers };
