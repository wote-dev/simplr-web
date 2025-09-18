// Script to check database state and apply necessary migrations
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseState() {
  console.log('🔍 Checking current database state...\n');
  
  // Check if teams table exists
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('count')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('❌ Teams table does not exist');
      return { teamsTableExists: false };
    } else if (error) {
      console.log('⚠️  Error checking teams table:', error.message);
      return { teamsTableExists: false };
    } else {
      console.log('✅ Teams table exists');
      return { teamsTableExists: true };
    }
  } catch (error) {
    console.log('❌ Teams table does not exist (caught error)');
    return { teamsTableExists: false };
  }
}

async function applyMigration(migrationFile, description) {
  console.log(`\n📄 Applying ${description}...`);
  
  try {
    const migrationPath = join(__dirname, 'supabase', 'migrations', migrationFile);
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log(`\n--- ${description} SQL ---`);
    console.log(migrationSQL);
    console.log('--- End of SQL ---\n');
    
    console.log('⚠️  Please copy and paste the above SQL into your Supabase SQL Editor:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Paste the SQL and click Run');
    console.log('5. Come back and run this script again to continue\n');
    
    return false; // Indicate manual intervention needed
  } catch (error) {
    console.error(`Error reading ${migrationFile}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Database Migration Checker\n');
  
  const state = await checkDatabaseState();
  
  if (!state.teamsTableExists) {
    console.log('\n📋 Required migrations:');
    console.log('1. Create teams table and related structures');
    console.log('2. Fix RLS policies for guest users\n');
    
    // Apply teams schema migration
    await applyMigration('004_teams_schema.sql', 'Teams Schema Migration');
    
    console.log('After applying the teams schema migration, run this script again to apply the guest user fix.');
  } else {
    console.log('\n✅ Teams table exists. Applying guest user RLS fix...');
    await applyMigration('005_fix_guest_team_creation.sql', 'Guest User RLS Policy Fix');
  }
}

main().catch(console.error);