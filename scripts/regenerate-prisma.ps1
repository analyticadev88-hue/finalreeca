#!/usr/bin/env pwsh
Write-Host "This script runs Prisma migrate dev and generates the Prisma client. Run from the project root in PowerShell."

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  Write-Host "npx not found in PATH. Ensure Node.js is installed." -ForegroundColor Red
  exit 1
}

Write-Host "Running: npx prisma migrate dev --name add-seat-reservations"
npx prisma migrate dev --name add-seat-reservations
$LASTEXITCODE | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "prisma migrate failed" -ForegroundColor Red; exit $LASTEXITCODE }

Write-Host "Running: npx prisma generate"
npx prisma generate
$LASTEXITCODE | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "prisma generate failed" -ForegroundColor Red; exit $LASTEXITCODE }

Write-Host "Prisma migrate + generate completed. You can now run the replace script to swap temporary casts if desired."
