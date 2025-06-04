#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Ensure that dotenv is loaded if available
try {
  require('dotenv').config();
} catch (error) {
  console.log('dotenv not installed, using environment variables directly');
}

// Function to run the SQL file using the Supabase CLI
function runSQLMigration() {
  console.log('Running SQL migration to fix foreign key relationship...');
  
  try {
    const sqlFilePath = path.join(process.cwd(), 'fix_foreign_key.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('SQL file not found:', sqlFilePath);
      process.exit(1);
    }
    
    // Check if we have the Supabase CLI installed
    try {
      execSync('supabase -v', { stdio: 'ignore' });
      console.log('Supabase CLI found, running migration...');
      
      // Run the SQL using the Supabase CLI
      execSync(`supabase db execute --file ${sqlFilePath}`, { 
        stdio: 'inherit',
        env: process.env
      });
      
      console.log('Migration completed successfully!');
    } catch (error) {
      console.log('Supabase CLI not available, please run the SQL file manually:');
      console.log(`1. Install the Supabase CLI: npm install -g supabase`);
      console.log(`2. Run: supabase db execute --file ${sqlFilePath}`);
      console.log('\nAlternatively, you can run the SQL directly in the Supabase dashboard:');
      console.log('1. Go to your Supabase project');
      console.log('2. Go to SQL Editor');
      console.log(`3. Copy and paste the contents of ${sqlFilePath}`);
      console.log('4. Run the SQL');
    }
  } catch (error) {
    console.error('Error running migration:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log('Starting database fix...');
  
  // Run the SQL migration
  runSQLMigration();
  
  console.log('\nDone! You should now be able to use the relationship between order_items and products.');
  console.log('If you continue to see errors, you might need to restart your application.');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 