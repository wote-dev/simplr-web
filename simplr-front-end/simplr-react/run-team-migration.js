// Script to run the team creation fix migration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTeamMigration() {
  try {
    console.log('🚀 Running team creation fix migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/006_fix_team_creation_issues.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('⚠️  Note: This migration needs to be run manually in Supabase Dashboard');
    console.log('📋 Please copy and paste the following SQL into your Supabase SQL Editor:\n');
    
    console.log('--- COPY FROM HERE ---');
    console.log(migrationSQL);
    console.log('--- COPY TO HERE ---\n');
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase
      .from('teams')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('❌ Database connection failed:', error.message);
    } else {
      console.log('✅ Database connection successful');
    }
    
    // Test if we can create a team (this will help identify the current issue)
    console.log('🧪 Testing team creation capability...');
    try {
      const testTeamData = {
        name: 'Test Team ' + Date.now(),
        description: 'Test team for migration validation',
        join_code: 'TEST' + Math.random().toString(36).substring(2, 4).toUpperCase(),
        max_members: 10,
        created_by: null, // Simulating guest user
        status: 'active'
      };
      
      const { data: testTeam, error: createError } = await supabase
        .from('teams')
        .insert(testTeamData)
        .select()
        .single();
        
      if (createError) {
        console.log('❌ Team creation test failed:', createError.message);
        console.log('🔧 This confirms the migration is needed');
      } else {
        console.log('✅ Team creation test passed - cleaning up test team');
        // Clean up the test team
        await supabase.from('teams').delete().eq('id', testTeam.id);
      }
    } catch (testError) {
      console.log('❌ Team creation test error:', testError.message);
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Copy the SQL migration above');
    console.log('2. Go to your Supabase Dashboard > SQL Editor');
    console.log('3. Paste and run the migration');
    console.log('4. Test team creation in your app');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

runTeamMigration();