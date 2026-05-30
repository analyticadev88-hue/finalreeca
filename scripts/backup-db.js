/**
 * Database Backup Script
 * Reads DIRECT_URL from .env and runs pg_dump
 * 
 * Usage: node scripts/backup-db.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const directUrlMatch = envContent.match(/DIRECT_URL="([^"]+)"/);
if (!directUrlMatch) {
  console.error('ERROR: DIRECT_URL not found in .env');
  process.exit(1);
}

const directUrl = directUrlMatch[1];

// Create backup directory
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupFile = path.join(backupDir, `db_backup_${timestamp}.sql`);

console.log('Starting backup...');
console.log('File:', backupFile);

try {
  execSync(`pg_dump "${directUrl}" --clean --if-exists --verbose --file "${backupFile}"`, {
    stdio: 'inherit',
    timeout: 300000, // 5 minutes
  });

  const stats = fs.statSync(backupFile);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log('\n✅ Backup completed successfully!');
  console.log(`📁 File: ${backupFile}`);
  console.log(`📊 Size: ${sizeMB} MB`);
} catch (error) {
  console.error('\n❌ Backup failed.');
  console.log('\nMake sure PostgreSQL client tools are installed:');
  console.log('  Windows: https://www.postgresql.org/download/windows/');
  console.log('  Or use pgAdmin which includes pg_dump');
  process.exit(1);
}
