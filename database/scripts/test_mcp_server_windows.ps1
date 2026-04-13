# PowerShell script to test MCP Server endpoints
# Compatible with Windows systems

Write-Host "MCP Server Test Script (Windows PowerShell)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$SERVER_URL = "http://localhost:3001"
$testResults = @()

Write-Host "Testing MCP Server at $SERVER_URL" -ForegroundColor Yellow
Write-Host ""

# Function to test endpoint and format output
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    Write-Host "Testing $Name..." -ForegroundColor Green
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $content = $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
        
        Write-Host "Status: SUCCESS" -ForegroundColor Green
        Write-Host "Response:" -ForegroundColor White
        Write-Host $content -ForegroundColor Gray
        
        $testResults += @{
            Name = $Name
            Status = "SUCCESS"
            Response = $content
        }
    }
    catch {
        Write-Host "Status: FAILED" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        
        $testResults += @{
            Name = $Name
            Status = "FAILED"
            Error = $_.ToString()
        }
    }
    
    Write-Host ""
}

# Test 1: Health Endpoint
Test-Endpoint -Name "Health Endpoint" -Url "$SERVER_URL/health"

# Test 2: Configuration Endpoint
Test-Endpoint -Name "Configuration Endpoint" -Url "$SERVER_URL/api/config"

# Test 3: Database Connection
Test-Endpoint -Name "Database Connection" -Url "$SERVER_URL/api/database/test"

# Test 4: JIRA Cloud Test (if configured)
Write-Host "Testing JIRA Endpoints..." -ForegroundColor Green
Write-Host "Note: JIRA endpoints require proper configuration in .env file" -ForegroundColor Yellow

# Check if JIRA is configured
$configResponse = Invoke-WebRequest -Uri "$SERVER_URL/api/config" -UseBasicParsing -ErrorAction SilentlyContinue
if ($configResponse) {
    $config = $configResponse.Content | ConvertFrom-Json
    
    if ($config.data.jiraCloudConfigured) {
        Test-Endpoint -Name "JIRA Cloud User Info" -Url "$SERVER_URL/api/jira/myself?instance=cloud"
    } else {
        Write-Host "JIRA Cloud not configured" -ForegroundColor Yellow
    }
    
    if ($config.data.jiraDcConfigured) {
        Test-Endpoint -Name "JIRA Data Center User Info" -Url "$SERVER_URL/api/jira/myself?instance=datacenter"
    } else {
        Write-Host "JIRA Data Center not configured" -ForegroundColor Yellow
    }
}

Write-Host ""

# Summary
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "============" -ForegroundColor Cyan

$successCount = ($testResults | Where-Object { $_.Status -eq "SUCCESS" }).Count
$failedCount = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count

Write-Host "Total Tests: $($testResults.Count)" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failedCount" -ForegroundColor Red

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")