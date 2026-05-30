# PostgreSQL Backup Script for Finalreeca
# Run: .\scripts\backup-db.ps1

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups"
$backupFile = "$backupDir/db_backup_$timestamp.sql"

# Create backups directory if it doesn't exist
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Load connection string from .env
$envContent = Get-Content ".env" -Raw
$directUrl = if ($envContent -match 'DIRECT_URL="([^"]+)"') { $matches[1] } else { $null }

if (!$directUrl) {
    Write-Host "ERROR: DIRECT_URL not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "Starting backup..." -ForegroundColor Cyan
Write-Host "File: $backupFile" -ForegroundColor Gray

# Run pg_dump (requires PostgreSQL client tools installed)
try {
    pg_dump $directUrl --clean --if-exists --verbose --file "$backupFile"
    Write-Host "Backup completed successfully!" -ForegroundColor Green
    Write-Host "Size: $([math]::Round((Get-Item $backupFile).Length / 1MB, 2)) MB" -ForegroundColor Gray
} catch {
    Write-Host "Backup failed. Make sure pg_dump is installed." -ForegroundColor Red
    Write-Host "Download: https://www.postgresql.org/download/" -ForegroundColor Yellow
}
