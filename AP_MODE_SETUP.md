# ESP8266 AccessPoint Mode Setup Guide

## 🎯 What This Solves
Your mobile hotspot has **AP isolation** enabled, which blocks devices from communicating with each other. Instead of trying to disable it, we flip the solution: **NodeMCU becomes the WiFi network**, and your PC connects to it!

## 📡 How It Works

```
Traditional Setup (FAILED):
Mobile Hotspot "Slayerr" → [AP Isolation blocks] → ESP8266 ❌ PC

New AP Mode Setup (WORKS):
NodeMCU creates "NodeMCU-Banking" → PC connects → ✅ Direct communication
```

### Network Layout
- **ESP8266 IP**: `192.168.4.1` (gateway)
- **Your PC IP**: `192.168.4.2` (assigned by NodeMCU)
- **Backend**: Still runs on PC at `http://192.168.4.2:5000`
- **ESP8266 requests**: Go to PC's IP on this network

---

## 🚀 Setup Steps

### Step 1: Upload AP Mode Firmware

1. Open Arduino IDE
2. Load: `iot/esp8266_ap_mode_transaction/esp8266_ap_mode_transaction.ino`
3. Upload to NodeMCU
4. Open Serial Monitor (115200 baud)

You should see:
```
========================================
  Blockchain Banking IoT (AP Mode)
  NodeMCU Creates WiFi Network!
========================================

✓ RFID Reader initialized
✓ LEDs initialized

Starting AccessPoint Mode...
   Network: NodeMCU-Banking
   Password: banking123
✓ AccessPoint started
   ESP8266 IP: 192.168.4.1
   Your PC will get IP: 192.168.4.2 (typically)
```

### Step 2: Connect PC to NodeMCU WiFi

1. On your PC, open WiFi settings
2. Look for network: **NodeMCU-Banking**
3. Connect with password: **banking123**
4. Wait for connection to establish

### Step 3: Verify PC's IP Address

In PowerShell:
```powershell
ipconfig | Select-String "NodeMCU" -Context 5
```

Look for the **IPv4 Address** under the NodeMCU-Banking adapter. It should be `192.168.4.2`.

**If your IP is different** (e.g., `192.168.4.3`):
1. Edit Arduino code line 46: `const char* PC_IP = "192.168.4.3";`
2. Edit Arduino code line 50: `const char* API_URL = "http://192.168.4.3:5000/api/iot/transaction";`
3. Re-upload to ESP8266

### Step 4: Start Backend Server

**Important**: While connected to NodeMCU WiFi, you won't have internet access. Open a new PowerShell window first if you need to install packages.

```powershell
cd "d:\Blockchain Banking\backend"
node server.js
```

You should see:
```
Blockchain Banking Backend Running
Backend server: http://192.168.4.2:5000
```

### Step 5: Test Connection

In PowerShell (while backend is running):
```powershell
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"ok","message":"Blockchain Banking Backend Running"}
```

### Step 6: Test RFID Transaction

1. Make sure backend is running
2. Tap RFID card on reader
3. Watch Serial Monitor for transaction status

Expected output:
```
==================================
📇 RFID Card Detected
   UID: 7A53CA01
✓ 1 client(s) connected to AP
📤 Sending to backend...
   Backend URL: http://192.168.4.2:5000/api/iot/transaction
   Request: {"cardUID":"7A53CA01","deviceId":"esp8266-ap-mode-01","transactionType":"VERIFY"}
   HTTP Code: 200
   Response: {"status":"success","message":"Card verified",...}
✅ Transaction successful!
==================================
```

---

## 🔧 Troubleshooting

### ESP8266 Serial Monitor shows "No PC connected to NodeMCU WiFi"
- **Solution**: Make sure PC is connected to "NodeMCU-Banking" WiFi network
- Check WiFi icon in taskbar - should show "NodeMCU-Banking"

### HTTP Code: -1
**Possible causes:**

1. **Backend not running**
   ```powershell
   cd backend
   node server.js
   ```

2. **Wrong PC IP in Arduino code**
   - Run: `ipconfig | Select-String "NodeMCU" -Context 5`
   - Update `PC_IP` variable in Arduino code if different from `192.168.4.2`

3. **Firewall blocking (unlikely on local network, but check)**
   ```powershell
   .\fix-firewall.ps1
   ```

### Can't access internet while connected to NodeMCU WiFi
- **This is expected!** NodeMCU doesn't provide internet access.
- **Solution**: Use mobile hotspot for internet when not testing RFID system
- **Alternative**: Set up Internet Connection Sharing (advanced - not required)

### Backend won't start - "Address already in use"
- Another process is using port 5000
- **Solution**: Stop the other backend instance or change port

---

## 📋 Quick Reference

### Network Credentials
- **SSID**: `NodeMCU-Banking`
- **Password**: `banking123`
- **ESP8266 IP**: `192.168.4.1`
- **PC IP**: `192.168.4.2` (usually)

### API Configuration
- **Backend URL**: `http://192.168.4.2:5000`
- **Transaction Endpoint**: `/api/iot/transaction`
- **Device API Key**: `blockchain-banking-iot-secure-key-2025`

### Testing Workflow
1. Upload AP mode sketch to ESP8266
2. Connect PC to "NodeMCU-Banking"
3. Start backend: `node server.js`
4. Tap RFID card
5. Check Serial Monitor for success ✅

---

## 🎯 Advantages of AP Mode

✅ **No AP isolation issues** - NodeMCU controls the network  
✅ **No router configuration** - Direct device-to-device communication  
✅ **Portable** - Works anywhere, no existing WiFi needed  
✅ **Reliable** - Eliminates hotspot/firewall variables  

❌ **No internet access** - PC loses internet while connected (acceptable for testing)

---

## 🔄 Switching Back to Regular WiFi

After testing, to get internet back:
1. Disconnect from "NodeMCU-Banking"
2. Reconnect to your regular WiFi (e.g., "Slayerr")
3. Stop backend server (Ctrl+C)

To resume testing:
1. Connect to "NodeMCU-Banking"
2. Start backend: `cd backend ; node server.js`
3. Tap cards!

---

## 📚 Next Steps

Once this works:
1. Test POS payment flow (frontend → tap card → transaction)
2. Register multiple cards in bank dashboard
3. Test different transaction types (DEPOSIT, WITHDRAW)
4. Document any issues or improvements

---

## ⚡ Pro Tip

Create a PowerShell script to automate backend startup:

**`start-ap-backend.ps1`**:
```powershell
Write-Host "Starting Blockchain Banking Backend (AP Mode)" -ForegroundColor Green
Write-Host "Make sure you're connected to: NodeMCU-Banking" -ForegroundColor Yellow
Write-Host ""

$wifi = netsh wlan show interfaces | Select-String "NodeMCU-Banking"
if ($wifi) {
    Write-Host "✓ Connected to NodeMCU-Banking" -ForegroundColor Green
    cd "d:\Blockchain Banking\backend"
    node server.js
} else {
    Write-Host "❌ Not connected to NodeMCU-Banking WiFi" -ForegroundColor Red
    Write-Host "Please connect to NodeMCU-Banking and try again"
}
```

Run with: `.\start-ap-backend.ps1`
