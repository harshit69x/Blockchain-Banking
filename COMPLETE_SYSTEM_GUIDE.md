# 🚀 Blockchain Banking + IoT System - Complete Setup Guide

## System Overview

**Blockchain Banking System** with **IoT RFID Card** integration for physical transactions.

---

## 📋 Quick Setup Steps

### 1️⃣ **Prerequisites** (5 min)

```bash
# Check installations
node --version        # v18+
npm --version         # v9+
truffle version       # v5+
ganache --version     # GUI or CLI

# Ganache should be running on http://127.0.0.1:7545
```

### 2️⃣ **Deploy Smart Contract** (2 min)

```bash
# From project root
truffle migrate --reset

# Copy output:
# - Contract address: 0x1234...
# - Deployer address (will be bank admin)
```

### 3️⃣ **Configure Backend** (3 min)

Edit `backend/.env`:

```bash
# Blockchain Configuration (REQUIRED FOR IoT)
CONTRACT_ADDRESS=0xPasteYourContractAddressHere
BANK_PRIVATE_KEY=0xPasteFromGanacheHere
IOT_DEVICE_API_KEY=blockchain-banking-iot-secure-key-2025

# Already configured (Pinata)
PINATA_JWT=eyJhbGciOi...
```

**Get values:**
- **CONTRACT_ADDRESS**: From truffle migrate output
- **BANK_PRIVATE_KEY**: Ganache → Click 🔑 icon next to first account → Copy

### 4️⃣ **Start Backend** (1 min)

```bash
cd backend
npm start

# Should see:
# ✅ Blockchain service initialized
# ✅ Pinata connection verified
# 🚀 Server running on port 5000
```

### 5️⃣ **Start Frontends** (2 min)

**Terminal 1 - Bank Dashboard:**
```bash
cd frontend-bank
npm run dev
# Opens on http://localhost:3001
```

**Terminal 2 - User Dashboard:**
```bash
cd frontend-user
npm run dev
# Opens on http://localhost:3002
```

### 6️⃣ **Test Complete System** (5 min)

1. **Bank Side** (http://localhost:3001):
   - Connect MetaMask to Ganache
   - Go to "VC Requests" tab
   - You should see 0 requests initially

2. **User Side** (http://localhost:3002):
   - Connect MetaMask (different account)
   - Go to "Request VC" tab
   - Fill KYC form (document upload optional)
   - Submit

3. **Bank Approves**:
   - Refresh bank dashboard
   - See pending request
   - Click "View Secure KYC Data"
   - Click "Approve VC"
   - Enter IPFS metadata (auto-uploaded)
   - Confirm transaction

4. **User Receives VC**:
   - Check "My VCs" tab
   - Should show verified VC badge ✅
   - Click "View on IPFS" to see data

---

## 🤖 IoT RFID Setup (Hardware Required)

### Hardware Needed:
- ESP8266 (NodeMCU / Wemos D1 Mini)
- MFRC522 RFID Reader Module
- RFID Cards (Mifare Classic 1K)
- 2x LEDs (Green + Red)
- 2x 220Ω Resistors
- Breadboard + Jumper Wires

### Software Needed:
- Arduino IDE
- ESP8266 Board Package
- Libraries: MFRC522, ArduinoJson

### Pin Connections:
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
Green → D1 → 220Ω → GND
Red   → D2 → 220Ω → GND
```

### Quick IoT Test (No Hardware):

```bash
# Test backend IoT API
cd backend
node test-iot.js

# Expected: All tests pass ✅
```

### Hardware Setup:

1. **Install Arduino Libraries**:
   - Tools → Manage Libraries
   - Install "MFRC522" by GithubCommunity
   - Install "ArduinoJson" v6.x (NOT 7.x)

2. **Program RFID Card**:
   - Open `iot/rfid_card_writer/rfid_card_writer.ino`
   - Upload to ESP8266
   - Serial Monitor (115200): Enter `CRD000001`
   - Card programmed ✅

3. **Register Card in Backend**:
```bash
curl -X POST http://localhost:5000/api/iot/register-card \
  -H "Content-Type: application/json" \
  -d '{
    "cardToken": "CRD000001",
    "walletAddress": "0xUserWalletFromGanache",
    "vcTokenId": 1
  }'
```

4. **Upload Transaction Firmware**:
   - Open `iot/esp8266_rfid_transaction/esp8266_rfid_transaction.ino`
   - Update WiFi SSID/password
   - Update API_URL with your PC IP (run `ipconfig` to find)
   - Upload to ESP8266

5. **Test**:
   - Tap card on reader
   - Green LED = Success ✅
   - Red LED = Error ❌

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project overview |
| `QUICK_START.md` | Basic setup guide |
| `PINATA_INTEGRATION.md` | IPFS documentation |
| `SECURE_KYC_SYSTEM.md` | KYC hashing guide |
| `IOT_INTEGRATION.md` | Full IoT documentation (500+ lines) |
| `IOT_QUICK_START.md` | IoT 5-min setup |
| `IOT_IMPLEMENTATION_SUMMARY.md` | What was built |
| `iot/ARDUINO_LIBRARIES.md` | Arduino setup |

---

## 🔧 Common Issues

### ❌ "Failed to connect to Ganache"
**Fix:** Ensure Ganache is running on port 7545

### ❌ "Contract not deployed"
**Fix:** Run `truffle migrate --reset`

### ❌ "MetaMask wrong network"
**Fix:** Add Ganache network:
- RPC: http://127.0.0.1:7545
- Chain ID: 1337
- Currency: ETH

### ❌ "Blockchain service initialization failed"
**Fix:** Update `CONTRACT_ADDRESS` and `BANK_PRIVATE_KEY` in `backend/.env`

### ❌ "KYC submission error"
**Fix:** Document upload is now optional, just fill form fields

### ❌ "WiFi connection failed" (ESP8266)
**Fix:** 
- Check SSID/password
- Ensure 2.4GHz WiFi (not 5GHz)
- ESP8266 doesn't support WPA3

### ❌ "Unauthorized device" (IoT)
**Fix:** Verify `IOT_DEVICE_API_KEY` matches in `.env` and Arduino code

---

## 🎯 System Features

### Blockchain Features:
- ✅ VC NFT issuance (ERC-721)
- ✅ VC revocation
- ✅ Deposit/Withdraw/Transfer
- ✅ Balance tracking
- ✅ Event logging

### Frontend Features:
- ✅ Form-based KYC (no manual JSON)
- ✅ SHA-256 document hashing
- ✅ Privacy-preserving storage
- ✅ Auto IPFS upload
- ✅ "View on IPFS" buttons
- ✅ Real-time balance updates
- ✅ Transaction history

### IoT Features:
- ✅ RFID card authentication
- ✅ Backend-signed transactions
- ✅ LED feedback
- ✅ 4 transaction types (DEPOSIT/WITHDRAW/TRANSFER/VERIFY)
- ✅ VC validation
- ✅ Card deactivation
- ✅ Device authentication

---

## 🔒 Security Highlights

1. **No sensitive data on RFID cards** - Only random tokens
2. **Private keys on backend only** - ESP8266 never sees keys
3. **SHA-256 hashing** - ID numbers and documents hashed
4. **VC verification** - Every transaction checks validity
5. **API key auth** - Devices must authenticate
6. **Card deactivation** - Instant revocation for lost cards

---

## 📊 API Endpoints

### IPFS Endpoints:
- `POST /api/upload/json` - Upload JSON to Pinata
- `POST /api/upload/kyc` - Upload KYC with structure
- `GET /api/fetch/:cid` - Fetch from IPFS
- `DELETE /api/unpin/:cid` - Unpin content

### IoT Endpoints:
- `POST /api/iot/transaction` - Process RFID transaction
- `POST /api/iot/register-card` - Register new card
- `GET /api/iot/card/:token` - Get card details
- `DELETE /api/iot/card/:token` - Deactivate card
- `GET /api/iot/cards/wallet/:address` - Get wallet cards

---

## 🧪 Testing Checklist

### Backend:
- [ ] `npm start` runs without errors
- [ ] Health check: `curl http://localhost:5000/health`
- [ ] IoT test: `node test-iot.js`

### Blockchain:
- [ ] Ganache shows deployed contract
- [ ] Can call contract methods from console
- [ ] Transactions appear in Ganache

### Frontend:
- [ ] Bank dashboard loads
- [ ] User dashboard loads
- [ ] MetaMask connects
- [ ] KYC form submits
- [ ] Bank can approve VCs
- [ ] IPFS links work

### IoT (if hardware available):
- [ ] ESP8266 connects to WiFi
- [ ] Card read successful
- [ ] Transaction processes
- [ ] LED feedback works
- [ ] Serial logs show details

---

## 🚀 Next Steps

### Immediate:
1. ✅ Deploy contract
2. ✅ Update `.env` with addresses
3. ✅ Test backend + frontends
4. ✅ Issue first VC
5. ✅ Verify on IPFS

### IoT Phase:
1. ⬜ Order hardware (if not available)
2. ⬜ Wire ESP8266 + MFRC522
3. ⬜ Program RFID cards
4. ⬜ Upload firmware
5. ⬜ Test transactions

### Production:
1. ⬜ Migrate to mainnet/testnet
2. ⬜ Add MongoDB for card storage
3. ⬜ Build admin dashboard
4. ⬜ Implement rate limiting
5. ⬜ Add audit logging
6. ⬜ Deploy to cloud (AWS/Azure)
7. ⬜ Enable HTTPS
8. ⬜ HSM for key storage

---

## 📞 Support Resources

- **IoT Full Guide**: `IOT_INTEGRATION.md`
- **IoT Quick Start**: `IOT_QUICK_START.md`
- **Arduino Setup**: `iot/ARDUINO_LIBRARIES.md`
- **KYC System**: `SECURE_KYC_SYSTEM.md`
- **IPFS Setup**: `PINATA_INTEGRATION.md`

---

## ✅ System Status

**Backend:** ✅ Ready (ethers.js installed)  
**Frontend:** ✅ Ready (both dashboards)  
**Smart Contract:** ✅ Ready (BankVC.sol)  
**IoT Backend:** ✅ Ready (routes + blockchain service)  
**IoT Firmware:** ✅ Ready (2 Arduino sketches)  
**Documentation:** ✅ Complete (7 guides)  

**Total Implementation:** 🎯 100% Complete

---

**Ready to launch!** 🚀

Follow steps 1-6 above to get started immediately.
