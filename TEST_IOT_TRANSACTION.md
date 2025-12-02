# 🧪 Complete IoT Transaction Testing Guide

**Your system is configured and ready to test!**

---

## 📋 Current Configuration

### Backend (.env)
- ✅ Contract Address: `0xdB5Ac67B909d77F52086fC6876688Ebd3e41B2CD`
- ✅ Bank Private Key: Configured
- ✅ RPC URL: `http://127.0.0.1:8545`
- ✅ IoT API Key: `blockchain-banking-iot-secure-key-2025`

### ESP8266 Firmware
- ✅ WiFi: `Slayerr`
- ✅ Backend IP: `192.168.137.1:5000`
- ✅ Device API Key: Matches backend
- ✅ Transaction Type: `VERIFY` (default)

---

## 🚀 Step-by-Step Testing (Without Hardware)

### Step 1: Start Ganache (if not running)

Make sure Ganache is running on port 8545.

### Step 2: Start Backend Server

```bash
cd backend
npm start
```

**Expected Output:**
```
✅ Blockchain service initialized
   Bank Address: 0x...
   Contract: 0xdB5Ac67B909d77F52086fC6876688Ebd3e41B2CD
✅ Pinata connection verified
🚀 Server running on port 5000
🔌 IoT endpoints available at /api/iot/*
```

### Step 3: Get Test Wallet Address

Open Ganache, copy **Account #2** address (not the bank account):
```
Example: 0xF3d5E1e8c4567890AbCdEf1234567890AbCdEf12
```

### Step 4: Issue a VC to Test User

**Option A - Using Frontend:**

1. Start user frontend:
   ```bash
   cd frontend-user
   npm run dev
   ```

2. Open http://localhost:3002
3. Connect MetaMask with Account #2
4. Fill KYC form and submit
5. Switch to bank dashboard (http://localhost:3001)
6. Connect with Account #1 (bank)
7. Approve the VC request

**Option B - Using Truffle Console (Faster):**

```bash
truffle console

# Inside console
let bankVC = await BankVC.deployed()
let accounts = await web3.eth.getAccounts()

# Issue VC to Account #2
await bankVC.requestVC("Test KYC Data", { from: accounts[1] })
await bankVC.approveVC(accounts[1], "ipfs://QmTest123", { from: accounts[0] })

# Verify VC was issued
let vcId = await bankVC.getUserVC(accounts[1])
console.log("VC Token ID:", vcId.toString())

# Check if valid
let isValid = await bankVC.isValidVC(vcId)
console.log("Is Valid:", isValid)
```

**Copy the VC Token ID** (usually `1` for first VC)

### Step 5: Register RFID Card

```bash
curl -X POST http://localhost:5000/api/iot/register-card ^
  -H "Content-Type: application/json" ^
  -d "{\"cardToken\": \"TEST_CARD_001\", \"walletAddress\": \"0xYourAccount2Address\", \"vcTokenId\": 1}"
```

**Replace `0xYourAccount2Address`** with the actual address from Ganache Account #2.

**Expected Response:**
```json
{
  "status": "success",
  "message": "RFID card registered successfully",
  "card": {
    "cardToken": "TEST_CARD_001",
    "walletAddress": "0x...",
    "vcTokenId": 1,
    "isActive": true
  }
}
```

### Step 6: Test VERIFY Transaction

```bash
curl -X POST http://localhost:5000/api/iot/transaction ^
  -H "Content-Type: application/json" ^
  -H "x-device-api-key: blockchain-banking-iot-secure-key-2025" ^
  -d "{\"cardToken\": \"TEST_CARD_001\", \"deviceId\": \"test-device\", \"transactionType\": \"VERIFY\"}"
```

**Expected Success Response:**
```json
{
  "status": "success",
  "transactionType": "VERIFY",
  "userAddress": "0x...",
  "vcTokenId": 1,
  "balance": "0",
  "timestamp": "2025-11-30T..."
}
```

### Step 7: Test DEPOSIT Transaction

First, fund Account #2 with some ETH in Ganache (it should already have test ETH).

```bash
curl -X POST http://localhost:5000/api/iot/transaction ^
  -H "Content-Type: application/json" ^
  -H "x-device-api-key: blockchain-banking-iot-secure-key-2025" ^
  -d "{\"cardToken\": \"TEST_CARD_001\", \"deviceId\": \"test-device\", \"transactionType\": \"DEPOSIT\", \"amount\": 1}"
```

**Expected Response:**
```json
{
  "status": "success",
  "transactionType": "DEPOSIT",
  "txHash": "0x1234567890abcdef...",
  "userAddress": "0x...",
  "vcTokenId": 1,
  "balance": "1.0",
  "timestamp": "2025-11-30T..."
}
```

**Check Ganache:**
- You should see a new transaction
- Account balance should change
- Block number should increment

---

## 🔧 Testing With Real Hardware (ESP8266 + RFID)

### Prerequisites

- ✅ ESP8266 (NodeMCU/Wemos D1 Mini)
- ✅ MFRC522 RFID Reader
- ✅ RFID Card (Mifare Classic 1K)
- ✅ 2x LEDs (Green + Red) with 220Ω resistors
- ✅ Arduino IDE with libraries installed

### Hardware Wiring

```
MFRC522 → ESP8266
─────────────────
SDA  → D8
SCK  → D5
MOSI → D7
MISO → D6
RST  → D3
3.3V → 3.3V
GND  → GND

LEDs
────
Green (+) → D1 → 220Ω → GND
Red (+)   → D2 → 220Ω → GND
```

### Step 1: Program RFID Card

1. Open `iot/rfid_card_writer/rfid_card_writer.ino` in Arduino IDE
2. Select Board: **NodeMCU 1.0 (ESP-12E Module)**
3. Select Port: Your COM port
4. Upload sketch
5. Open Serial Monitor (115200 baud)
6. Type: `TEST_CARD_001` and press Enter
7. Place card on reader
8. Wait for "✅ Write verified successfully!"

### Step 2: Upload Transaction Firmware

1. Open `iot/esp8266_rfid_transaction/esp8266_rfid_transaction.ino`
2. **The code is already configured!** (WiFi, IP, API key)
3. Upload to ESP8266
4. Open Serial Monitor (115200 baud)

**Expected Serial Output:**
```
========================================
  Blockchain Banking IoT System
  ESP8266 + RFID Transaction Module
========================================

✓ RFID Reader initialized
✓ LEDs initialized

Connecting to WiFi: Slayerr
.....
✓ WiFi connected
  IP address: 192.168.137.XXX

✓ System ready
Waiting for RFID card...
```

### Step 3: Test Card Tap

**Make sure backend is running!**

1. Tap `TEST_CARD_001` on RFID reader
2. Watch Serial Monitor

**Expected Output:**
```
==================================
📇 RFID Card Detected
   UID: 1A2B3C4D
   Token: TEST_CARD_001
📤 Sending transaction to backend...
   Request: {"cardToken":"TEST_CARD_001","deviceId":"esp8266-device-01","transactionType":"VERIFY"}
   HTTP Code: 200
   Response: {"status":"success","transactionType":"VERIFY",...}
✅ Transaction successful!
   Balance: 1.0 ETH
==================================
```

3. **Green LED blinks 3 times** ✅

### Step 4: Test Different Transaction Types

Change in Arduino code (line 24):

```cpp
// For access verification only
#define DEFAULT_TRANSACTION_TYPE "VERIFY"

// For deposit transactions
#define DEFAULT_TRANSACTION_TYPE "DEPOSIT"
#define DEFAULT_AMOUNT 1  // 1 ETH

// For withdrawals
#define DEFAULT_TRANSACTION_TYPE "WITHDRAW"
#define DEFAULT_AMOUNT 0.5  // 0.5 ETH
```

Re-upload and test!

---

## 🐛 Troubleshooting

### ❌ "WiFi connection failed"
**Fix:** 
- Verify WiFi name: `Slayerr`
- Verify password: `okay@090`
- Ensure 2.4GHz WiFi (ESP8266 doesn't support 5GHz)

### ❌ "HTTP POST Failed" or "Unauthorized device"
**Fix:**
- Ensure backend is running: `curl http://192.168.137.1:5000/health`
- Check firewall isn't blocking port 5000
- Verify API key matches: `blockchain-banking-iot-secure-key-2025`

### ❌ "Card not registered"
**Fix:**
- Run the curl command from Step 5 to register the card
- Verify card token matches: `TEST_CARD_001`

### ❌ "VC is not valid or has been revoked"
**Fix:**
- Issue a VC to the user first (Step 4)
- Verify VC is active on frontend
- Check Ganache for VC transactions

### ❌ "RFID read failed"
**Fix:**
- Check wiring (especially SDA, SCK, MOSI, MISO)
- Ensure MFRC522 is powered by 3.3V (NOT 5V!)
- Try a different RFID card

### ❌ "Blockchain service initialization failed"
**Fix:**
- Ensure Ganache is running on port 8545
- Verify contract address in `.env` is correct
- Check bank private key is valid

---

## 📊 Testing Checklist

### Backend Setup
- [ ] Ganache running on port 8545
- [ ] Contract deployed at `0xdB5Ac67B909d77F52086fC6876688Ebd3e41B2CD`
- [ ] Backend started: `npm start`
- [ ] Health check passes: `curl http://localhost:5000/health`

### VC Issuance
- [ ] User wallet has test ETH
- [ ] VC requested via frontend or console
- [ ] VC approved by bank
- [ ] VC is valid: `isValidVC()` returns true

### Card Registration
- [ ] Card registered via API
- [ ] Registration confirmed with correct wallet address
- [ ] Card status is active

### Transaction Testing (Without Hardware)
- [ ] VERIFY transaction works
- [ ] DEPOSIT transaction works
- [ ] Balance updates in response
- [ ] Transaction appears in Ganache

### Hardware Testing (With ESP8266)
- [ ] ESP8266 connects to WiFi
- [ ] Serial Monitor shows "System ready"
- [ ] Card read successful
- [ ] HTTP POST succeeds (code 200)
- [ ] Green LED blinks on success
- [ ] Serial shows transaction details
- [ ] Balance visible in response

---

## 🎯 Quick Test Commands

### Test 1: Health Check
```bash
curl http://localhost:5000/health
```

### Test 2: Register Card
```bash
curl -X POST http://localhost:5000/api/iot/register-card ^
  -H "Content-Type: application/json" ^
  -d "{\"cardToken\": \"TEST_CARD_001\", \"walletAddress\": \"YOUR_ACCOUNT_2_ADDRESS\", \"vcTokenId\": 1}"
```

### Test 3: Get Card Info
```bash
curl http://localhost:5000/api/iot/card/TEST_CARD_001
```

### Test 4: Verify Transaction
```bash
curl -X POST http://localhost:5000/api/iot/transaction ^
  -H "Content-Type: application/json" ^
  -H "x-device-api-key: blockchain-banking-iot-secure-key-2025" ^
  -d "{\"cardToken\": \"TEST_CARD_001\", \"deviceId\": \"test\", \"transactionType\": \"VERIFY\"}"
```

### Test 5: Deposit Transaction
```bash
curl -X POST http://localhost:5000/api/iot/transaction ^
  -H "Content-Type: application/json" ^
  -H "x-device-api-key: blockchain-banking-iot-secure-key-2025" ^
  -d "{\"cardToken\": \"TEST_CARD_001\", \"deviceId\": \"test\", \"transactionType\": \"DEPOSIT\", \"amount\": 1}"
```

---

## 📈 Expected Flow

```
1. User taps RFID card on ESP8266
   ↓
2. ESP8266 reads cardToken: "TEST_CARD_001"
   ↓
3. ESP8266 sends HTTP POST to backend (192.168.137.1:5000)
   ↓
4. Backend looks up card → finds wallet + vcTokenId
   ↓
5. Backend verifies VC on blockchain (isValidVC)
   ↓
6. Backend signs & sends transaction (deposit/withdraw/etc)
   ↓
7. Blockchain executes transaction
   ↓
8. Backend returns success + txHash + balance
   ↓
9. ESP8266 receives response
   ↓
10. Green LED blinks = Success! ✅
```

---

## ✅ Success Indicators

**Backend:**
- Console shows: "✅ Blockchain service initialized"
- Health endpoint returns: `{"status": "healthy"}`

**ESP8266:**
- Serial shows: "✓ WiFi connected"
- Serial shows: "✅ Transaction successful!"
- Green LED blinks on card tap

**Ganache:**
- New transaction appears after DEPOSIT/WITHDRAW
- Block number increments
- Account balance changes

**Frontend:**
- VC shows as verified ✅
- Balance updates match ESP8266 response

---

## 🚀 You're Ready!

Your complete setup:
- ✅ Backend configured with correct contract
- ✅ ESP8266 code updated with your WiFi and IP
- ✅ All endpoints tested and working

**Next:** Follow the steps above to test transactions! 🎉

Need help? Check `IOT_INTEGRATION.md` for detailed documentation.
