const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('ORGANIZATION FEATURE MIGRATIONS');
console.log('='.repeat(80));
console.log();
console.log('Please run these migrations in your Supabase SQL Editor in order:');
console.log();

// Migration files to process
const migrations = [
  '005_add_organizations.sql',
  '006_extend_tasks_for_organizations.sql', 
  '007_update_user_profiles_rls.sql'
];

migrations.forEach((filename, index) => {
  const filePath = path.join(__dirname, 'supabase', 'migrations', filename);
  
  console.log(`${index + 1}. ${filename}`);
  console.log('-'.repeat(60));
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(content);
  } catch (error) {
    console.log(`❌ Error reading ${filename}: ${error.message}`);
  }
  
  console.log();
  console.log('='.repeat(80));
  console.log();
});

console.log('After running these migrations, your organization features will be ready!');
console.log('You can then test them at: http://localhost:5173/test-organizations');