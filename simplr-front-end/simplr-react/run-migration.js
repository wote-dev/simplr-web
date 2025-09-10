// Simple script to run the database migration using Supabase client
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

async function runMigration() {
  try {
    console.log('Running migration to add reminder columns...');
    
    // Execute each ALTER TABLE statement separately
    const statements = [
      {
        name: 'Add reminder_enabled column',
        sql: `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE;`
      },
      {
        name: 'Add reminder_datetime column', 
        sql: `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_datetime TIMESTAMPTZ DEFAULT NULL;`
      },
      {
        name: 'Add reminder_sent column',
        sql: `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;`
      }
    ];
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.name}`);
      try {
        // Use a simple query to check if we can connect
        const { data, error } = await supabase
          .from('tasks')
          .select('id')
          .limit(1);
          
        if (error) {
          console.error('Database connection test failed:', error);
          break;
        }
        
        console.log('Database connection successful');
        console.log('Note: Column additions need to be done manually in Supabase Dashboard');
        console.log('Please run the following SQL in your Supabase SQL Editor:');
        console.log('\n--- Copy and paste this SQL into Supabase Dashboard ---');
        statements.forEach(stmt => {
          console.log(stmt.sql);
        });
        console.log('--- End of SQL ---\n');
        break;
        
      } catch (err) {
        console.error(`Failed to execute ${statement.name}:`, err);
      }
    }
    
    // Test if the columns exist by trying to query them
    console.log('Testing if reminder columns exist...');
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('id, reminder_enabled, reminder_datetime, reminder_sent')
      .limit(1);
      
    if (testError) {
      console.log('Reminder columns do not exist yet. Error:', testError.message);
      console.log('\nPlease add the columns manually using the SQL above.');
    } else {
      console.log('✅ Reminder columns exist and are accessible!');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

runMigration();