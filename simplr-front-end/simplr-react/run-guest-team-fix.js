// Script to fix RLS policy for guest users creating teams
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
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runGuestTeamFix() {
  try {
    console.log('Applying RLS policy fix for guest users creating teams...');
    
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '005_fix_guest_team_creation.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('Migration SQL:');
    console.log(migrationSQL);
    console.log('\n--- Executing migration ---');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Error executing migration:', error);
      console.log('\nPlease run the following SQL manually in your Supabase SQL Editor:');
      console.log('\n--- Copy and paste this SQL into Supabase Dashboard ---');
      console.log(migrationSQL);
      console.log('--- End of SQL ---\n');
    } else {
      console.log('Migration executed successfully!');
      console.log('Guest users should now be able to create teams.');
    }
    
    // Test the fix by checking if the policy exists
    console.log('\nTesting the fix...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'teams')
      .eq('policyname', 'Users can create teams');
    
    if (policyError) {
      console.log('Could not verify policy (this is normal if using RPC)');
    } else if (policies && policies.length > 0) {
      console.log('✅ New policy "Users can create teams" is active');
    } else {
      console.log('⚠️  Could not find the new policy - please verify manually');
    }
    
  } catch (error) {
    console.error('Error running migration:', error);
    console.log('\nIf the automatic migration failed, please run this SQL manually in your Supabase SQL Editor:');
    
    const migrationPath = join(__dirname, 'supabase', 'migrations', '005_fix_guest_team_creation.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('\n--- Copy and paste this SQL into Supabase Dashboard ---');
    console.log(migrationSQL);
    console.log('--- End of SQL ---\n');
  }
}

runGuestTeamFix();