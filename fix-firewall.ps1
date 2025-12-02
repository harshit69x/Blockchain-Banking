# Run this as Administrator in PowerShell

# Allow port 5000 for Node.js backend
New-NetFirewallRule -DisplayName "Blockchain Banking Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow

Write-Host "✅ Firewall rule added for port 5000" -ForegroundColor Green
Write-Host "ESP8266 should now be able to connect!" -ForegroundColor Cyan
