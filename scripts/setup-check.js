#!/usr/bin/env node

// Simple setup checker for Masonic Traveler
const fs = require('fs');
const path = require('path');

console.log('🔧 Masonic Traveler Setup Checker\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

console.log(`📄 Environment file (.env.local): ${envExists ? '✅ Found' : '❌ Missing'}`);

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for required variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE'
  ];
  
  console.log('\n🔑 Environment Variables:');
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(varName + '=') && !envContent.includes(varName + '=your_');
    console.log(`   ${varName}: ${hasVar ? '✅ Set' : '❌ Not configured'}`);
  });
}

// Check if node_modules exists
const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
console.log(`\n📦 Dependencies: ${nodeModulesExists ? '✅ Installed' : '❌ Run npm install'}`);

// Check if git is set up
const gitExists = fs.existsSync(path.join(process.cwd(), '.git'));
console.log(`🔗 Git repository: ${gitExists ? '✅ Initialized' : '❌ Not initialized'}`);

console.log('\n📋 Next Steps:');

if (!envExists) {
  console.log('1. Copy env.example to .env.local');
}

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('your_supabase_')) {
    console.log('1. Set up Supabase project and update .env.local');
  }
}

if (nodeModulesExists) {
  console.log('2. Run: npm run dev');
} else {
  console.log('2. Run: npm install');
}

console.log('3. Set up Supabase database (see SETUP.md)');
console.log('4. Deploy to Vercel (see SETUP.md)');

console.log('\n📚 For detailed instructions, see SETUP.md');
console.log('🌐 GitHub: https://github.com/imfulltime/masonic-traveler');
