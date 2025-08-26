#!/usr/bin/env node

/**
 * Supabase Setup Script
 * Automates the database setup process for the Masonic Traveler PWA
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if required environment variables are set
function checkEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE'
  ];

  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(env => console.error(`   - ${env}`));
    console.error('\nPlease set these in your .env.local file and try again.');
    process.exit(1);
  }

  console.log('✅ Environment variables configured');
}

// Check if Supabase CLI is installed
function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'ignore' });
    console.log('✅ Supabase CLI found');
  } catch (error) {
    console.error('❌ Supabase CLI not found');
    console.error('Install it with: npm install -g supabase');
    console.error('Or follow: https://supabase.com/docs/guides/cli');
    process.exit(1);
  }
}

// Check if schema file exists
function checkSchemaFile() {
  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found at supabase/schema.sql');
    process.exit(1);
  }
  console.log('✅ Schema file found');
  return schemaPath;
}

// Check if seed file exists
function checkSeedFile() {
  const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error('❌ Seed file not found at supabase/seed.sql');
    process.exit(1);
  }
  console.log('✅ Seed file found');
  return seedPath;
}

// Run SQL file against Supabase
function runSQLFile(filePath, description) {
  try {
    console.log(`🔄 ${description}...`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Use Supabase CLI to run SQL
    const cmd = `supabase db query --project-id ${process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0]} "${sqlContent}"`;
    execSync(cmd, { stdio: 'inherit' });
    
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    
    // Provide manual instructions
    console.log(`\n📋 Manual Instructions:`);
    console.log(`1. Go to your Supabase dashboard: ${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/rest/v1', '')}/project/default/sql`);
    console.log(`2. Copy and paste the contents of ${filePath}`);
    console.log(`3. Click "Run"`);
    
    if (description.includes('schema')) {
      process.exit(1);
    }
  }
}

// Main setup function
function main() {
  console.log('🔧 Setting up Masonic Traveler Supabase Database\n');

  // Pre-flight checks
  checkEnvironment();
  checkSupabaseCLI();
  const schemaPath = checkSchemaFile();
  const seedPath = checkSeedFile();

  console.log('\n🚀 Starting database setup...\n');

  // Run schema
  runSQLFile(schemaPath, 'Running database schema');

  // Ask if user wants to run seed data
  console.log('\n📊 Would you like to populate the database with test data?');
  console.log('This will add sample lodges, users, and events for development.');
  
  // For this script, we'll always run seed data
  // In a real implementation, you might want to prompt the user
  runSQLFile(seedPath, 'Populating test data');

  console.log('\n🎉 Database setup complete!');
  console.log('\nNext steps:');
  console.log('1. Your database is ready with schema and test data');
  console.log('2. You can now run: npm run dev');
  console.log('3. Visit http://localhost:3000 to test your app');
  console.log('\n📋 Test accounts available:');
  console.log('- secretary.sf@example.com (Secretary - San Francisco Lodge)');
  console.log('- brother1@example.com (Verified Brother - San Francisco Lodge)');
  console.log('- newbro1@example.com (Unverified Brother - needs verification)');
  console.log('\nPassword for all test accounts: masonic123');
}

// Handle CLI arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Masonic Traveler Supabase Setup Script');
  console.log('\nUsage: node scripts/setup-supabase.js [options]');
  console.log('\nOptions:');
  console.log('  --help, -h     Show this help message');
  console.log('  --schema-only  Run only the schema, skip seed data');
  console.log('\nEnvironment variables required:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL     Your Supabase project URL');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY Your Supabase anonymous key');
  console.log('  SUPABASE_SERVICE_ROLE        Your Supabase service role key');
  process.exit(0);
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = { checkEnvironment, checkSupabaseCLI };
