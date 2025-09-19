import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 COMPLETE DATABASE SETUP FROM SCRATCH');
console.log('==========================================');

// Read all necessary migration files
const simpleSchemaPath = path.join(__dirname, 'supabase/migrations/003_simple_schema.sql');
const teamsSchemaPath = path.join(__dirname, 'supabase/migrations/004_teams_schema.sql');
const guestFixPath = path.join(__dirname, 'supabase/migrations/005_fix_guest_team_creation.sql');
const teamFixPath = path.join(__dirname, 'supabase/migrations/006_fix_team_creation_issues.sql');

let simpleSchema = '';
let teamsSchema = '';
let guestFix = '';
let teamFix = '';

try {
  simpleSchema = fs.readFileSync(simpleSchemaPath, 'utf8');
  console.log('✅ Basic schema (tasks table) loaded');
} catch (error) {
  console.error('❌ Failed to read basic schema:', error.message);
  process.exit(1);
}

try {
  teamsSchema = fs.readFileSync(teamsSchemaPath, 'utf8');
  console.log('✅ Teams schema migration loaded');
} catch (error) {
  console.error('❌ Failed to read teams schema migration:', error.message);
  process.exit(1);
}

try {
  guestFix = fs.readFileSync(guestFixPath, 'utf8');
  console.log('✅ Guest user fix migration loaded');
} catch (error) {
  console.error('❌ Failed to read guest user fix migration:', error.message);
  process.exit(1);
}

try {
  teamFix = fs.readFileSync(teamFixPath, 'utf8');
  console.log('✅ Team creation fix migration loaded');
} catch (error) {
  console.error('❌ Failed to read team creation fix migration:', error.message);
  process.exit(1);
}

console.log('\n📋 COMPLETE SQL TO EXECUTE IN SUPABASE DASHBOARD:');
console.log('==================================================');
console.log('Copy and paste the following SQL into your Supabase SQL Editor:\n');

console.log('-- ========================================');
console.log('-- COMPLETE DATABASE SETUP FROM SCRATCH');
console.log('-- ========================================\n');

console.log('-- ========================================');
console.log('-- 1. BASIC SCHEMA (TASKS TABLE)');
console.log('-- ========================================\n');
console.log(simpleSchema);

console.log('\n-- ========================================');
console.log('-- 2. TEAMS SCHEMA');
console.log('-- ========================================\n');
console.log(teamsSchema);

console.log('\n-- ========================================');
console.log('-- 3. GUEST USER RLS POLICY FIX');
console.log('-- ========================================\n');
console.log(guestFix);

console.log('\n-- ========================================');
console.log('-- 4. TEAM CREATION FIXES (JOIN_CODE COLUMN)');
console.log('-- ========================================\n');
console.log(teamFix);

console.log('\n🎯 INSTRUCTIONS:');
console.log('================');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste ALL the SQL above');
console.log('4. Click "Run" to execute');
console.log('5. This will create EVERYTHING from scratch:');
console.log('   - Tasks table and user profiles');
console.log('   - Teams functionality with join_code column');
console.log('   - Guest user support');
console.log('   - Fixed team creation triggers and functions');
console.log('\n✨ After running this SQL, your team creation should work perfectly!');