@echo off
REM Batch script to run all PostgreSQL migrations
REM Requires PostgreSQL to be installed and in PATH

echo PostgreSQL Migration Runner
echo ==========================
echo.

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: psql command not found!
    echo Please ensure PostgreSQL is installed and added to PATH
    exit /b 1
)

REM Set database connection parameters
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=program_planner
set PGUSER=postgres

REM Prompt for password if not set
if "%PGPASSWORD%"=="" (
    set /p PGPASSWORD=Enter PostgreSQL password for user 'postgres': 
)

echo.
echo Connecting to database...
psql -c "SELECT version();" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to connect to database!
    echo Please check your connection settings and password
    exit /b 1
)

echo Connection successful!
echo.
echo Running migrations...
echo.

REM Run each migration file
for %%f in (..\migrations\*.sql) do (
    if not "%%~nf"=="*" (
        echo Running: %%~nf.sql
        psql -f "%%f"
        if %ERRORLEVEL% NEQ 0 (
            echo ERROR: Migration failed!
            exit /b 1
        )
        echo Done!
        echo.
    )
)

echo All migrations completed successfully!
echo.
echo Listing tables:
psql -c "\dt"

pause