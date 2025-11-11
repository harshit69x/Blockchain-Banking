# Blockchain Banking - Launch Both Frontends
# This script starts both the Bank Admin Panel and User Panel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Blockchain Banking - Dual Frontend  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Ganache is accessible
Write-Host "Checking Ganache connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8545" -Method POST -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -ContentType "application/json" -UseBasicParsing -TimeoutSec 3
    Write-Host "✓ Ganache is running!" -ForegroundColor Green
} catch {
    Write-Host "✗ Warning: Cannot connect to Ganache at http://127.0.0.1:8545" -ForegroundColor Red
    Write-Host "  Please start Ganache before continuing." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit
    }
}

Write-Host ""
Write-Host "Starting frontends..." -ForegroundColor Yellow
Write-Host ""

# Launch Bank Admin Panel in new PowerShell window
Write-Host "🏦 Launching Bank Admin Panel (Port 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Blockchain Banking\frontend-bank'; Write-Host '🏦 Bank Admin Panel' -ForegroundColor Cyan; Write-Host 'Port: 3001' -ForegroundColor Green; Write-Host ''; npm run dev"

# Wait a moment
Start-Sleep -Seconds 2

# Launch User Panel in new PowerShell window
Write-Host "👤 Launching User Panel (Port 3002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Blockchain Banking\frontend-user'; Write-Host '👤 User Panel' -ForegroundColor Cyan; Write-Host 'Port: 3002' -ForegroundColor Green; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Both frontends are starting!      " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the applications at:" -ForegroundColor Yellow
Write-Host "  🏦 Bank Admin Panel: " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:3001" -ForegroundColor White
Write-Host "  👤 User Panel:       " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "Contract Address: " -NoNewline -ForegroundColor Yellow
Write-Host "0xdB5Ac67B909d77F52086fC6876688Ebd3e41B2CD" -ForegroundColor White
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "  • Use Account #1 (deployer) for Bank Admin" -ForegroundColor Gray
Write-Host "  • Use any account for User Panel" -ForegroundColor Gray
Write-Host "  • Users must request VC before banking operations" -ForegroundColor Gray
Write-Host "  • Both sender and receiver need VCs to transfer" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
