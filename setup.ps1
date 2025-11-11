# Write-Host with colors for better visibility
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Blockchain Banking - Setup Script" -ForegroundColor Cyan
Write-Host "  SSI & Verifiable Credentials Platform" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js v16+" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm $npmVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check Truffle
Write-Host "Checking Truffle installation..." -ForegroundColor Yellow
try {
    $truffleVersion = truffle version 2>$null | Select-String "Truffle"
    if ($truffleVersion) {
        Write-Host "✓ Truffle found" -ForegroundColor Green
    } else {
        throw "Not found"
    }
} catch {
    Write-Host "✗ Truffle not found. Installing globally..." -ForegroundColor Yellow
    npm install -g truffle
    Write-Host "✓ Truffle installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Installing Dependencies" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Root dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Compiling Smart Contracts" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Compile contracts
Write-Host "Compiling contracts..." -ForegroundColor Yellow
npm run compile
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Contracts compiled successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to compile contracts" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start Ganache UI on port 8545" -ForegroundColor White
Write-Host "2. Run: npm run migrate" -ForegroundColor White
Write-Host "3. Configure MetaMask with Ganache network" -ForegroundColor White
Write-Host "4. Import Ganache accounts to MetaMask" -ForegroundColor White
Write-Host "5. Run: npm run dev" -ForegroundColor White
Write-Host "6. Open http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see SETUP.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy Building!" -ForegroundColor Green
