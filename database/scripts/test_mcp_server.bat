@echo off
REM Batch script to test MCP Server endpoints

echo MCP Server Test Script
echo =====================
echo.

set SERVER_URL=http://localhost:3001

echo Testing MCP Server at %SERVER_URL%
echo.

REM Check if curl is available
where curl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: curl command not found!
    echo Please install curl or use PowerShell Invoke-WebRequest
    exit /b 1
)

echo 1. Testing Health Endpoint...
curl -s %SERVER_URL%/health | python -m json.tool
echo.
echo.

echo 2. Testing Configuration Endpoint...
curl -s %SERVER_URL%/api/config | python -m json.tool
echo.
echo.

echo 3. Testing Database Connection...
curl -s %SERVER_URL%/api/database/test | python -m json.tool
echo.
echo.

echo 4. Testing JIRA Endpoints (requires configuration)...
echo    - To test JIRA, ensure your .env file has JIRA credentials
echo    - Example: curl %SERVER_URL%/api/jira/myself?instance=cloud
echo.

echo Test complete!
pause