# IoT Integration Quick Start Guide

## Prerequisites

- ✅ Ganache running on `http://127.0.0.1:7545`
- ✅ BankVC contract deployed
- ✅ Backend server running
- ✅ ESP8266 with MFRC522 RFID reader
- ✅ RFID cards (Mifare Classic 1K)

---

## Step-by-Step Setup (5 Minutes)

### 1️⃣ Install Backend Dependencies

```bash
cd backend
npm install ethers@6.9.0
```

### 2️⃣ Configure Environment

Edit `backend/.env` and add:

```bash
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Bank Private Key (copy from Ganache account)
BANK_PRIVATE_KEY=0xYourPrivateKeyHere

# IoT Device API Key (generate random string)
IOT_DEVICE_API_KEY=my-super-secret-api-key-12345

PORT=5000
```

**How to get values:**
- `CONTRACT_ADDRESS`: Copy from Truffle migration output or Ganache contracts tab
- `BANK_PRIVATE_KEY`: Open Ganache → Click key icon next to first account → Copy private key

### 3️⃣ Start Backend Server

```bash
npm start
```

You should see:
```
✅ Blockchain service initialized
✅ Pinata connection verified
🚀 Server running on port 5000
```

### 4️⃣ Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# Should return: { "status": "healthy", ... }
```

### 5️⃣ Register a Test Card

```bash
curl -X POST http://localhost:5000/api/iot/register-card \
  -H "Content-Type: application/json" \
  -d '{
    "cardToken": "CRD000001",
    "walletAddress": "0xYourGanacheAccountAddress",
    "vcTokenId": 1
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "RFID card registered successfully",
  "card": {
    "cardToken": "CRD000001",
    "walletAddress": "0x...",
    "vcTokenId": 1,
    "isActive": true
  }
}
```

### 6️⃣ Test Transaction (Without Hardware)

```bash
curl -X POST http://localhost:5000/api/iot/transaction \
  -H "Content-Type: application/json" \
  -H "x-device-api-key: my-super-secret-api-key-12345" \
  -d '{
    "cardToken": "CRD000001",
    "deviceId": "test-device",
    "transactionType": "VERIFY"
  }'
```

**Expected Response:**
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

---

## Hardware Setup (ESP8266)

### 1️⃣ Install Arduino IDE

Download from: https://www.arduino.cc/en/software

### 2️⃣ Add ESP8266 Board Support

1. Open Arduino IDE
2. File → Preferences
3. Additional Board URLs: `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
4. Tools → Board → Boards Manager
5. Search "ESP8266" and install

### 3️⃣ Install Libraries

Tools → Manage Libraries, install:
- **MFRC522** by GithubCommunity
- **ArduinoJson** by Benoit Blanchon (v6.x)

### 4️⃣ Wire the Hardware

```
MFRC522 → ESP8266 (NodeMCU)
─────────────────────────────
SDA     → D8
SCK     → D5
MOSI    → D7
MISO    → D6
RST     → D3
3.3V    → 3.3V
GND     → GND

LEDs → ESP8266
──────────────
Green LED (+) → D1 → 220Ω → GND
Red LED (+)   → D2 → 220Ω → GND
```

### 5️⃣ Upload Card Writer Sketch

1. Open `iot/rfid_card_writer/rfid_card_writer.ino`
2. Tools → Board → NodeMCU 1.0
3. Tools → Port → Select your COM port
4. Click Upload ⬆️
5. Open Serial Monitor (115200 baud)
6. Place RFID card on reader
7. Type `CRD000001` and press Enter
8. Card will be programmed ✅

### 6️⃣ Upload Transaction Sketch

1. Open `iot/esp8266_rfid_transaction/esp8266_rfid_transaction.ino`
2. Edit WiFi credentials:
   ```cpp
   const char* WIFI_SSID = "YourWiFi";
   const char* WIFI_PASSWORD = "YourPassword";
   ```
3. Edit backend IP (find with `ipconfig` on Windows):
   ```cpp
   const char* API_URL = "http://192.168.1.100:5000/api/iot/transaction";
   const char* DEVICE_API_KEY = "my-super-secret-api-key-12345";
   ```
4. Upload to ESP8266
5. Open Serial Monitor

### 7️⃣ Test Full System

1. Ensure backend is running
2. Tap RFID card on reader
3. Serial Monitor should show:
   ```
   📇 RFID Card Detected
      UID: 1A2B3C4D
      Token: CRD000001
   📤 Sending transaction...
   ✅ Transaction successful!
      Balance: 0 ETH
   ```
4. Green LED blinks 3 times ✅

---

## Common Issues

### ❌ "WiFi connection failed"
**Fix:** Check SSID/password, ensure 2.4GHz WiFi

### ❌ "Unauthorized device"
**Fix:** Verify `DEVICE_API_KEY` matches `.env` file

### ❌ "Card not registered"
**Fix:** Run card registration curl command first

### ❌ "VC is not valid"
**Fix:** Ensure VC was approved by bank, check `vcTokenId` is correct

### ❌ "Blockchain service initialization failed"
**Fix:** Ensure Ganache is running, check `BLOCKCHAIN_RPC_URL`

---

## Transaction Types

Change in Arduino code:

```cpp
// For verification only (access control)
#define DEFAULT_TRANSACTION_TYPE "VERIFY"

// For deposits (add $100)
#define DEFAULT_TRANSACTION_TYPE "DEPOSIT"
#define DEFAULT_AMOUNT 100

// For withdrawals
#define DEFAULT_TRANSACTION_TYPE "WITHDRAW"
#define DEFAULT_AMOUNT 50
```

---

## Next Steps

✅ **Testing Complete** → Read `IOT_INTEGRATION.md` for full documentation  
✅ **Add More Cards** → Register multiple users  
✅ **Build Admin UI** → Web interface for card management  
✅ **Add MongoDB** → Persistent card storage  
✅ **Production Deploy** → Use HTTPS, HSM, proper key management  

---

**Need Help?** Check the main `IOT_INTEGRATION.md` documentation for detailed troubleshooting.
