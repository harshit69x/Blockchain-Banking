# 🎯 Complete RFID Hardware Setup Guide

## 📋 Overview
This guide explains how to use the **real ESP8266 + RFID hardware** with your blockchain banking system frontend.

---

## 🔧 Hardware Required
- **ESP8266** (NodeMCU, Wemos D1 Mini)
- **MFRC522 RFID Reader** (13.56MHz)
- **Mifare Classic 1K RFID Cards**
- **2x LEDs** (Green + Red)
- **2x 220Ω Resistors**
- **Breadboard + Jumper Wires**

---

## 🚀 Complete Workflow (Frontend + Hardware)

### **Step 1: Register RFID Card (Bank Dashboard)**

1. **Open Bank Frontend:**
   ```
   http://localhost:3001
   ```

2. **Login as Bank Admin** (connect with bank wallet)

3. **Navigate to "RFID Cards" tab**

4. **Fill the form:**
   - **User Wallet Address:** `0x1234...` (the user's actual wallet)
   - **VC Token ID:** `1` (user's verified credential ID)
   - **Card Name:** `John's Card` (optional)

5. **Click "Generate & Register Card"**

6. **Copy the generated token** (e.g., `CRD-A3F9B2`)
   - ⚠️ **IMPORTANT:** Save this token - you'll need it to program the physical card!

---

### **Step 2: Program Physical RFID Card**

#### **A. Upload Card Writer Firmware**

1. **Open Arduino IDE**

2. **Load the sketch:**
   ```
   File → Open → iot/rfid_card_writer/rfid_card_writer.ino
   ```

3. **Select board & port:**
   - Board: `NodeMCU 1.0 (ESP-12E Module)`
   - Port: Your ESP8266's COM port

4. **Upload the sketch** (Ctrl+U)

#### **B. Write Token to Card**

1. **Open Serial Monitor** (Ctrl+Shift+M)
   - Baud rate: `115200`

2. **You'll see:**
   ```
   ========================================
     RFID Card Writer Utility
   ========================================
   
   ✓ RFID Reader initialized
   
   Place card on reader and enter token...
   ```

3. **Type the card token** (e.g., `CRD-A3F9B2`) and press **Enter**

4. **Place your RFID card on the reader**

5. **Wait for confirmation:**
   ```
   Token to write: CRD-A3F9B2
   Card UID: 3A5F8B2C
   ✓ Token written successfully
   ✓ Verification: CRD-A3F9B2
   ✅ Write verified successfully!
   ```

6. **Remove the card** - it's now programmed!

---

### **Step 3: Upload Main Transaction Firmware**

1. **Open the transaction sketch:**
   ```
   File → Open → iot/esp8266_rfid_transaction/esp8266_rfid_transaction.ino
   ```

2. **Verify WiFi settings** (already configured for you):
   ```cpp
   const char* WIFI_SSID = "Slayerr";
   const char* WIFI_PASSWORD = "okay@090";
   const char* API_URL = "http://192.168.137.1:5000/api/iot/transaction";
   ```

3. **Upload to ESP8266**

4. **Open Serial Monitor** (115200 baud)

5. **You should see:**
   ```
   ========================================
     Blockchain Banking IoT System
     ESP8266 + RFID Transaction Module
   ========================================
   
   ✓ RFID Reader initialized
   ✓ LEDs initialized
   Connecting to WiFi: Slayerr
   ✓ WiFi connected
     IP address: 192.168.x.x
   
   ✓ System ready
   Waiting for RFID card...
   ```

6. **LEDs will blink** (green + red together) = System ready!

---

### **Step 4: Use Your RFID Card**

#### **A. Make Sure Backend is Running**

```powershell
cd backend
npm start
```

You should see:
```
✅ Blockchain service initialized
   Bank Address: 0x63b7acCBeE71A6a026A0BdC3a0734D74384eD15C
   Contract: 0xdB5Ac67B909d77F52086fC6876688Ebd3e41B2CD
✅ Blockchain service ready
🚀 Server running on port 5000
🔌 IoT endpoints available at /api/iot/*
```

#### **B. Tap Your Card**

1. **Place your programmed RFID card** on the MFRC522 reader

2. **Serial Monitor will show:**
   ```
   ==================================
   📇 RFID Card Detected
      UID: 3A5F8B2C
      Token: CRD-A3F9B2
   📤 Sending transaction to backend...
      Request: {"cardToken":"CRD-A3F9B2","deviceId":"esp8266-device-01","transactionType":"VERIFY"}
      HTTP Code: 200
      Response: {"status":"success","transactionType":"VERIFY","userAddress":"0x1234..."}
   ✅ Transaction successful!
      Balance: 0 ETH
   ==================================
   ```

3. **LED Feedback:**
   - ✅ **Green LED blinks 3 times** = Success
   - ❌ **Red LED blinks 3 times** = Error

#### **C. Check Frontend**

1. **Open User Dashboard:**
   ```
   http://localhost:3002
   ```

2. **Navigate to "History" tab**

3. **You'll see your RFID transaction:**
   - Transaction type: `VERIFY`
   - Timestamp: Just now
   - Blockchain hash: `0xabc123...`

---

## ⚙️ Changing Transaction Type

By default, the device performs **VERIFY** transactions (checks VC validity). To change:

1. **Edit the Arduino code:**
   ```cpp
   #define DEFAULT_TRANSACTION_TYPE "DEPOSIT"  // Options: VERIFY, DEPOSIT, WITHDRAW, TRANSFER
   #define DEFAULT_AMOUNT 100  // For DEPOSIT/WITHDRAW (in Wei or ETH)
   ```

2. **Upload the modified code**

3. **Now when you tap the card:**
   - `DEPOSIT` → Adds funds to your account
   - `WITHDRAW` → Removes funds from your account
   - `VERIFY` → Just checks VC validity (access control)
   - `TRANSFER` → Sends to another address (requires additional config)

---

## 🔍 Troubleshooting

### ❌ "WiFi connection failed"
- **Check SSID/Password** in the code
- **Ensure your PC hotspot** "Slayerr" is active
- **Verify IP address** with `ipconfig` (should be `192.168.137.1`)

### ❌ "Authentication failed" (RFID)
- **Card might be locked** - try a new card
- **Wrong key** - code uses factory default `0xFF` (should work for new cards)

### ❌ "HTTP request failed"
- **Backend not running** - Start with `cd backend && npm start`
- **Wrong IP address** - Update `API_URL` in Arduino code
- **Firewall blocking** - Allow port 5000 in Windows Firewall

### ❌ "Card token not found"
- **Card not programmed** - Re-run card writer
- **Wrong block** - Code reads Block 4 (default sector 1)

### ❌ "VC not valid or revoked"
- **User's VC was revoked** - Check bank dashboard
- **Wrong VC Token ID** - Re-register the card with correct ID

---

## 📊 Frontend Features Overview

### **Bank Dashboard** (`http://localhost:3001`)
| Tab | Function |
|-----|----------|
| **Overview** | System statistics |
| **VC Requests** | Approve/reject KYC |
| **Issued VCs** | View all credentials |
| **Transactions** | All blockchain activity |
| **RFID Cards** ✨ | Register cards, view workflow guide |

### **User Dashboard** (`http://localhost:3002`)
| Tab | Function |
|-----|----------|
| **Overview** | Account summary |
| **Credentials** | Request/view VC |
| **Banking** | Deposit ETH |
| **Transfer** | Send to others |
| **History** | Transaction log |
| **IoT Testing** ✨ | Hardware setup guide, refresh transactions |

---

## 🎯 Complete Transaction Flow

```
1. User → Bank (Credentials Tab)
   "Request VC with KYC data"
   
2. Bank → Dashboard (VC Requests Tab)
   "Approve request" → Mints NFT-based VC
   
3. Bank → RFID Cards Tab
   "Register user's wallet + VC Token ID" → Generates CRD-A3F9B2
   
4. User → Card Writer
   "Program CRD-A3F9B2 onto physical RFID card"
   
5. User → ESP8266 Device
   "Upload transaction firmware"
   
6. User → Tap Card
   ESP8266 reads CRD-A3F9B2 → Sends to backend
   
7. Backend → Blockchain
   Looks up wallet → Verifies VC → Executes transaction
   
8. User → History Tab
   "Sees transaction with blockchain hash"
```

---

## 🔐 Security Features

- ✅ **Card Token != Wallet Address** (random token only)
- ✅ **Backend API Key Required** (`x-device-api-key` header)
- ✅ **VC Validation** on every transaction
- ✅ **Blockchain Signed Transactions** (bank's private key)
- ✅ **Device ID Tracking** (audit trail)

---

## 🚀 Quick Start Checklist

- [ ] Backend running (`http://localhost:5000`)
- [ ] Bank frontend running (`http://localhost:3001`)
- [ ] User frontend running (`http://localhost:3002`)
- [ ] Ganache running (`http://localhost:8545`)
- [ ] BankVC contract deployed
- [ ] User has valid VC (approved by bank)
- [ ] RFID card registered in "RFID Cards" tab
- [ ] Card programmed with token (using card writer)
- [ ] ESP8266 firmware uploaded
- [ ] WiFi connected (green+red blink)
- [ ] Backend IP correct in Arduino code

**Now tap your card and watch the magic! 🎉**

---

## 📞 Support

If issues persist:
1. Check Serial Monitor for exact error messages
2. Verify backend logs (`console` in terminal)
3. Test with curl first (see `IOT_INTEGRATION.md`)
4. Check Ganache for transaction history

**Happy IoT Banking! 🏦⚡**
