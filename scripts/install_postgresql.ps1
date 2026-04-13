# PostgreSQL Installation Script for Windows
# Week 2 - Day 1 Alternative Implementation

Write-Host "PostgreSQL Installation Guide" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nStep 1: Download PostgreSQL" -ForegroundColor Yellow
Write-Host "Please download PostgreSQL 14+ from: https://www.postgresql.org/download/windows/"
Write-Host "Choose the Windows x86-64 installer`n"

$continue = Read-Host "Have you downloaded PostgreSQL installer? (y/n)"
if ($continue -ne 'y') {
    Write-Host "Please download PostgreSQL first and run this script again." -ForegroundColor Yellow
    exit
}

Write-Host "`nStep 2: Installation Instructions" -ForegroundColor Yellow
Write-Host "During installation, please:"
Write-Host "1. Set password for postgres user (remember this!)"
Write-Host "2. Keep default port 5432"
Write-Host "3. Install Stack Builder (optional)"
Write-Host "4. Set locale to 'English, United States'`n"

$installed = Read-Host "Have you completed PostgreSQL installation? (y/n)"
if ($installed -ne 'y') {
    Write-Host "Please complete installation and run this script again." -ForegroundColor Yellow
    exit
}

# Test PostgreSQL installation
Write-Host "`nStep 3: Testing PostgreSQL Installation" -ForegroundColor Yellow
try {
    $pgVersion = & "C:\Program Files\PostgreSQL\14\bin\psql.exe" --version 2>$null
    if ($pgVersion) {
        Write-Host "PostgreSQL installed successfully: $pgVersion" -ForegroundColor Green
    } else {
        Write-Host "PostgreSQL not found in default location" -ForegroundColor Red
        $customPath = Read-Host "Enter PostgreSQL bin directory path"
        $env:Path += ";$customPath"
    }
} catch {
    Write-Host "Error checking PostgreSQL installation" -ForegroundColor Red
}

# Create databases
Write-Host "`nStep 4: Creating Databases" -ForegroundColor Yellow
$password = Read-Host "Enter postgres user password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$pgPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$env:PGPASSWORD = $pgPassword

Write-Host "Creating development database..." -ForegroundColor Cyan
& "C:\Program Files\PostgreSQL\14\bin\createdb.exe" -U postgres program_planner_dev

Write-Host "Creating test database..." -ForegroundColor Cyan
& "C:\Program Files\PostgreSQL\14\bin\createdb.exe" -U postgres program_planner_test

Write-Host "Creating production database..." -ForegroundColor Cyan
& "C:\Program Files\PostgreSQL\14\bin\createdb.exe" -U postgres program_planner_prod

# Clear password from environment
$env:PGPASSWORD = ""

Write-Host "`nStep 5: Database Connection Info" -ForegroundColor Yellow
Write-Host "Host: localhost"
Write-Host "Port: 5435"
Write-Host "Username: postgres"
Write-Host "Databases created:"
Write-Host "  - program_planner_dev"
Write-Host "  - program_planner_test"
Write-Host "  - program_planner_prod"

Write-Host "`nPostgreSQL setup completed!" -ForegroundColor Green
Write-Host "Next: Run database migrations" -ForegroundColor Yellow