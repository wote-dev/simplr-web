// Script to run the user profiles RLS migration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('Service Key:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runRLSMigration() {
  try {
    console.log('Running user profiles RLS migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '007_update_user_profiles_rls.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Migration SQL loaded successfully');
    console.log('\n--- Migration Content ---');
    console.log(migrationSQL);
    console.log('--- End Migration Content ---\n');
    
    // Note: Direct SQL execution requires service role key
    console.log('⚠️  This migration needs to be run manually in Supabase Dashboard');
    console.log('Please copy the SQL above and run it in your Supabase SQL Editor.');
    console.log('\nAlternatively, if you have the Supabase CLI installed, run:');
    console.log('supabase db reset --linked');
    console.log('or');
    console.log('supabase migration up');
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runRLSMigration();