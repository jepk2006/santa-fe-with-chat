#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

try {
  require('dotenv').config();
} catch (error) {
  // Silently continue if dotenv not found
}

function runSQLMigration() {
  const sqlFilePath = path.join(process.cwd(), 'fix_foreign_key.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    process.exit(1);
  }
  
  try {
    execSync('supabase -v', { stdio: 'ignore' });
    
    execSync(`supabase db execute --file ${sqlFilePath}`, { 
      stdio: 'inherit',
      env: process.env
    });
  } catch (error) {

  }
}

async function main() {
  runSQLMigration();
}

main().catch(error => {
  process.exit(1);
});