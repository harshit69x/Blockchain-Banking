# Create Windows Hotspot (Run as Administrator)

# Stop any existing hotspot
netsh wlan stop hostednetwork

# Configure hotspot
netsh wlan set hostednetwork mode=allow ssid="ESP8266-Network" key="password123"

# Start hotspot
netsh wlan start hostednetwork

Write-Host "`n✅ Windows Hotspot Started!" -ForegroundColor Green
Write-Host "SSID: ESP8266-Network" -ForegroundColor Cyan
Write-Host "Password: password123" -ForegroundColor Cyan
Write-Host "`nConnect your ESP8266 to this network" -ForegroundColor Yellow

# Get the hotspot IP
$adapter = Get-NetAdapter | Where-Object {$_.Name -like "*Local Area Connection*" -or $_.InterfaceDescription -like "*Microsoft Wi-Fi Direct*"}
$ip = (Get-NetIPAddress -InterfaceIndex $adapter.ifIndex -AddressFamily IPv4).IPAddress
Write-Host "`nYour PC IP on hotspot: $ip" -ForegroundColor Green
Write-Host "Update Arduino code API_URL to: http://${ip}:5000/api/iot/transaction" -ForegroundColor Yellow
