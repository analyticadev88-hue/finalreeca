#!/usr/bin/env pwsh
Write-Host "This script replaces occurrences of '(prisma as any).seatReservation' with 'prisma.seatReservation' across the repo and creates .bak backups. Run after prisma generate."

$files = Get-ChildItem -Path . -Include *.ts,*.tsx,*.js,*.jsx -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules|.git" }
foreach ($file in $files) {
  $text = Get-Content $file.FullName -Raw
  if ($text -match "\(prisma as any\)\.seatReservation") {
    Copy-Item $file.FullName "$($file.FullName).bak" -Force
    $new = $text -replace "\(prisma as any\)\.seatReservation", "prisma.seatReservation"
    Set-Content -Path $file.FullName -Value $new -Force
    Write-Host "Replaced in: $($file.FullName)"
  }
}
Write-Host "Replacement completed. Review .bak files if you need to revert."
