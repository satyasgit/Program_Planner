# PostgreSQL Installation Script for Windows
# Run as Administrator

# Script configuration
$PostgreSQLVersion = "14"
$PostgreSQLPassword = "postgres"
$InstallPath = "C:\Program Files\PostgreSQL\$PostgreSQLVersion"
$DataPath = "$InstallPath\data"
$Port = 5432

Write-Host "PostgreSQL Installation Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script must be run as Administrator. Exiting..." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is already installed
if (Test-Path $InstallPath) {
    Write-Host "PostgreSQL appears to be already installed at $InstallPath" -ForegroundColor Yellow
    $response = Read-Host "Do you want to continue anyway? (y/n)"
    if ($response -ne 'y') {
        exit 0
    }
}

# Download PostgreSQL installer
Write-Host "Downloading PostgreSQL installer..." -ForegroundColor Yellow
$url = "https://get.enterprisedb.com/postgresql/postgresql-$PostgreSQLVersion.11-1-windows-x64.exe"
$installerPath = "$env:TEMP\postgresql-installer.exe"

try {
    Invoke-WebRequest -Uri $url -OutFile $installerPath -UseBasicParsing
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "Failed to download PostgreSQL installer" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download manually from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Install PostgreSQL
Write-Host "Installing PostgreSQL..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

$arguments = @(
    "--mode", "unattended",
    "--unattendedmodeui", "minimal",
    "--prefix", $InstallPath,
    "--datadir", $DataPath,
    "--superpassword", $PostgreSQLPassword,
    "--serverport", $Port,
    "--locale", "C",
    "--enable_acledit", "1"
)

try {
    Start-Process -FilePath $installerPath -ArgumentList $arguments -Wait -NoNewWindow
    Write-Host "PostgreSQL installation complete!" -ForegroundColor Green
} catch {
    Write-Host "Failed to install PostgreSQL" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Add PostgreSQL to PATH
Write-Host "Adding PostgreSQL to PATH..." -ForegroundColor Yellow
$binPath = "$InstallPath\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)

if ($currentPath -notlike "*$binPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$binPath", [EnvironmentVariableTarget]::Machine)
    Write-Host "PostgreSQL added to PATH" -ForegroundColor Green
    
    # Update current session PATH
    $env:Path += ";$binPath"
} else {
    Write-Host "PostgreSQL already in PATH" -ForegroundColor Yellow
}

# Create databases
Write-Host ""
Write-Host "Creating databases..." -ForegroundColor Yellow

# Wait for PostgreSQL service to start
Start-Sleep -Seconds 5

# Set PGPASSWORD for psql commands
$env:PGPASSWORD = $PostgreSQLPassword

try {
    # Create program_planner database
    & "$binPath\psql.exe" -U postgres -c "CREATE DATABASE program_planner;"
    Write-Host "Created database: program_planner" -ForegroundColor Green
    
    # Create program_planner_test database
    & "$binPath\psql.exe" -U postgres -c "CREATE DATABASE program_planner_test;"
    Write-Host "Created database: program_planner_test" -ForegroundColor Green
} catch {
    Write-Host "Note: Databases may already exist or you may need to create them manually" -ForegroundColor Yellow
}

# Clean up
Remove-Item $installerPath -Force -ErrorAction SilentlyContinue

# Display summary
Write-Host ""
Write-Host "Installation Summary" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host "PostgreSQL Version: $PostgreSQLVersion"
Write-Host "Installation Path: $InstallPath"
Write-Host "Data Directory: $DataPath"
Write-Host "Port: $Port"
Write-Host "Superuser: postgres"
Write-Host "Password: $PostgreSQLPassword"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open a new terminal to use the updated PATH"
Write-Host "2. Test connection: psql -U postgres -d program_planner"
Write-Host "3. Run migrations: node database/run-migrations.js"
Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green