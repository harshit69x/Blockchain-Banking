# IoT + RFID + ESP8266 Architecture Documentation

Complete guide for the Blockchain Banking IoT system with RFID card transactions.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Hardware Requirements](#hardware-requirements)
4. [Software Requirements](#software-requirements)
5. [Installation & Setup](#installation--setup)
6. [API Documentation](#api-documentation)
7. [Security Considerations](#security-considerations)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

The IoT extension allows users to perform blockchain transactions using physical RFID cards and ESP8266 devices. This creates a bridge between the physical world and the blockchain.

### Key Features:

- ✅ **RFID Card Authentication** - Use physical cards for transactions
- ✅ **Secure Token Mapping** - Cards store only random tokens, not sensitive data
- ✅ **Multiple Transaction Types** - DEPOSIT, WITHDRAW, TRANSFER, VERIFY
- ✅ **LED Feedback** - Visual indicators for success/failure
- ✅ **VC Verification** - Automatic verification of Verifiable Credentials
- ✅ **Backend-Signed Transactions** - Private keys never leave the server
- ✅ **Device Authentication** - API key protection for IoT devices

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ RFID Card   │ ───> │  ESP8266     │ ───> │   Backend    │ ───> │  Blockchain  │
│             │      │  Device      │      │   Server     │      │  (Ganache)   │
│ cardToken   │      │              │      │              │      │              │
│ (CRD10349)  │      │ WiFi Client  │      │ ethers.js    │      │ BankVC.sol   │
└─────────────┘      └──────────────┘      └──────────────┘      └──────────────┘
                             │
                             ▼
                     ┌──────────────┐
                     │  LEDs        │
                     │  Green / Red │
                     └──────────────┘
```

### Data Flow:

1. **User taps RFID card** on ESP8266 reader
2. **ESP8266 reads** `cardToken` from card (e.g., "CRD103492")
3. **ESP8266 sends** HTTP POST to backend with cardToken
4. **Backend looks up** user's wallet address using cardToken
5. **Backend verifies** VC validity on blockchain
6. **Backend signs** and sends blockchain transaction
7. **Backend responds** to ESP8266 with success/failure
8. **ESP8266 shows** LED feedback (green = success, red = error)

---

## 🔧 Hardware Requirements

### ESP8266 Module
- NodeMCU, Wemos D1 Mini, or compatible
- WiFi capability required
- Minimum 4MB flash

### MFRC522 RFID Reader
- Operating frequency: 13.56 MHz
- SPI interface
- Compatible with Mifare Classic 1K cards

### RFID Cards
- Mifare Classic 1K (1024 bytes)
- ISO 14443A compatible
- Writable blocks required

### LEDs & Components
- 1x Green LED
- 1x Red LED  
- 2x 220Ω resistors
- Breadboard and jumper wires

### Pin Connections

```
MFRC522 → ESP8266
─────────────────
SDA     → D8 (GPIO15)
SCK     → D5 (GPIO14)
MOSI    → D7 (GPIO13)
MISO    → D6 (GPIO12)
IRQ     → (not connected)
GND     → GND
RST     → D3 (GPIO0)
3.3V    → 3.3V

LEDs → ESP8266
──────────────
Green LED (+) → D1 (GPIO5) → 220Ω → GND
Red LED (+)   → D2 (GPIO4) → 220Ω → GND
```

---

## 💻 Software Requirements

### Backend Server
- Node.js v18+
- npm or yarn
- Dependencies:
  - `express` - Web server
  - `ethers` - Blockchain interaction
  - `dotenv` - Environment variables
  - `cors` - Cross-origin requests

### ESP8266 Firmware
- Arduino IDE 1.8.19 or 2.x
- ESP8266 Board Package v3.x
- Libraries:
  - `MFRC522` by GithubCommunity
  - `ArduinoJson` by Benoit Blanchon (v6.x)
  - `ESP8266WiFi` (included)
  - `ESP8266HTTPClient` (included)

---

## 🚀 Installation & Setup

### Step 1: Backend Setup

```bash
cd backend

# Install dependencies
npm install ethers@6.9.0

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

**Configure `.env`:**

```bash
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Bank Private Key (from Ganache)
BANK_PRIVATE_KEY=0xYourBankPrivateKeyHere

# IoT Device Security
IOT_DEVICE_API_KEY=your-secure-random-key-here

# Server
PORT=5000
```

**Start Backend:**

```bash
npm start
```

### Step 2: Program RFID Cards

1. Open `iot/rfid_card_writer/rfid_card_writer.ino` in Arduino IDE
2. Upload to ESP8266
3. Open Serial Monitor (115200 baud)
4. Place card on reader
5. Enter card token (e.g., `CRD103492`)
6. Card will be written and verified

### Step 3: Register Card in System

**Method 1: API Call**

```bash
curl -X POST http://localhost:5000/api/iot/register-card \
  -H "Content-Type: application/json" \
  -d '{
    "cardToken": "CRD103492",
    "walletAddress": "0xUserWalletAddress",
    "vcTokenId": 1
  }'
```

**Method 2: Via Frontend** (create admin interface - optional)

### Step 4: Upload ESP8266 Transaction Firmware

1. Open `iot/esp8266_rfid_transaction/esp8266_rfid_transaction.ino`
2. Configure WiFi:
   ```cpp
   const char* WIFI_SSID = "YourWiFiName";
   const char* WIFI_PASSWORD = "YourWiFiPassword";
   ```
3. Configure backend:
   ```cpp
   const char* API_URL = "http://192.168.1.100:5000/api/iot/transaction";
   const char* DEVICE_API_KEY = "your-secure-random-key-here";
   ```
4. Upload to ESP8266
5. Open Serial Monitor to see logs

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api/iot
```

### Authentication
All requests require device API key in header:
```
x-device-api-key: your-secure-random-key-here
```

---

### POST `/transaction`

Process an IoT transaction using RFID card.

**Request:**
```json
{
  "cardToken": "CRD103492",
  "deviceId": "esp8266-device-01",
  "transactionType": "DEPOSIT",
  "amount": 100
}
```

**Transaction Types:**
- `DEPOSIT` - Add funds to user account
- `WITHDRAW` - Remove funds from user account
- `TRANSFER` - Transfer funds to another address (requires `toAddress`)
- `VERIFY` - Verify VC validity and access

**Success Response:**
```json
{
  "status": "success",
  "transactionType": "DEPOSIT",
  "txHash": "0x1234567890abcdef...",
  "userAddress": "0xUserAddress...",
  "vcTokenId": 1,
  "balance": "1.5",
  "timestamp": "2025-11-30T10:30:00.000Z"
}
```

**Error Responses:**

```json
// Card not registered
{
  "status": "error",
  "message": "Card not registered",
  "cardToken": "CRD103492"
}

// Card deactivated
{
  "status": "error",
  "message": "Card is deactivated",
  "cardToken": "CRD103492"
}

// VC invalid
{
  "status": "error",
  "message": "VC is not valid or has been revoked",
  "vcTokenId": 1
}
```

---

### POST `/register-card`

Register a new RFID card in the system.

**Request:**
```json
{
  "cardToken": "CRD103492",
  "walletAddress": "0x1234567890abcdef...",
  "vcTokenId": 1,
  "deviceId": "esp8266-device-01"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "RFID card registered successfully",
  "card": {
    "cardToken": "CRD103492",
    "walletAddress": "0x1234...",
    "vcTokenId": 1,
    "deviceId": "esp8266-device-01",
    "registeredAt": "2025-11-30T10:00:00.000Z",
    "isActive": true,
    "lastUsed": null,
    "transactionCount": 0
  }
}
```

---

### GET `/card/:cardToken`

Get card details and current balance.

**Response:**
```json
{
  "status": "success",
  "card": {
    "cardToken": "CRD103492",
    "walletAddress": "0x1234...",
    "vcTokenId": 1,
    "balance": "2.5",
    "vcValid": true,
    "transactionCount": 15,
    "lastUsed": "2025-11-30T10:30:00.000Z"
  }
}
```

---

### DELETE `/card/:cardToken`

Deactivate a card (security measure).

**Response:**
```json
{
  "status": "success",
  "message": "Card deactivated successfully",
  "cardToken": "CRD103492"
}
```

---

### GET `/cards/wallet/:address`

Get all cards registered to a wallet address.

**Response:**
```json
{
  "status": "success",
  "count": 2,
  "cards": [
    {
      "cardToken": "CRD103492",
      "walletAddress": "0x1234...",
      "vcTokenId": 1,
      "isActive": true
    },
    {
      "cardToken": "CRD103493",
      "walletAddress": "0x1234...",
      "vcTokenId": 1,
      "isActive": false
    }
  ]
}
```

---

## 🔒 Security Considerations

### ✅ Implemented Security Measures

1. **No Sensitive Data on Card**
   - Cards store only random `cardToken`
   - No wallet addresses, private keys, or VC data on card

2. **Backend-Signed Transactions**
   - Private keys stored securely on backend
   - ESP8266 never handles private keys
   - Prevents key extraction attacks

3. **Device Authentication**
   - API key required for all IoT requests
   - Prevents unauthorized device access

4. **VC Verification**
   - Every transaction verifies VC validity
   - Prevents revoked credential usage

5. **Card Deactivation**
   - Cards can be instantly deactivated
   - Lost/stolen card protection

### ⚠️ Additional Recommendations

**For Production:**

1. **Use HTTPS** - Enable TLS for API communication
2. **Rotate API Keys** - Change device API keys periodically
3. **Hardware Security Module (HSM)** - Store private keys in HSM
4. **Rate Limiting** - Prevent transaction spam
5. **Audit Logging** - Log all transactions for forensics
6. **Card Encryption** - Encrypt card token blocks (AES)
7. **Two-Factor Auth** - Require PIN entry on device
8. **Network Isolation** - Separate IoT network from main network

---

## 🧪 Testing Guide

### Test 1: Card Registration

```bash
# 1. Write token to card
# Use rfid_card_writer.ino

# 2. Register in backend
curl -X POST http://localhost:5000/api/iot/register-card \
  -H "Content-Type: application/json" \
  -d '{
    "cardToken": "TEST001",
    "walletAddress": "0xYourGanacheAddress",
    "vcTokenId": 1
  }'

# Expected: "RFID card registered successfully"
```

### Test 2: Verify Transaction

```bash
# Tap card on ESP8266
# Check Serial Monitor for:
# ✅ Transaction successful!
# Tx Hash: 0x...
# Balance: X.X ETH
```

### Test 3: Deposit Transaction

```cpp
// In ESP8266 code, change:
#define DEFAULT_TRANSACTION_TYPE "DEPOSIT"
#define DEFAULT_AMOUNT 100

// Re-upload and test
```

### Test 4: Card Deactivation

```bash
curl -X DELETE http://localhost:5000/api/iot/card/TEST001

# Try to use card - should show "Card is deactivated"
```

---

## 🐛 Troubleshooting

### ESP8266 Won't Connect to WiFi

**Symptoms:** WiFi connection failed, no IP address

**Solutions:**
1. Check SSID and password
2. Ensure 2.4GHz WiFi (ESP8266 doesn't support 5GHz)
3. Check router firewall settings
4. Verify signal strength

### RFID Read Fails

**Symptoms:** "RFID read failed" error

**Solutions:**
1. Check pin connections (SDA, SCK, MOSI, MISO, RST)
2. Ensure 3.3V power supply (not 5V)
3. Try different card (some cards are defective)
4. Check SPI bus initialization

### HTTP POST Fails

**Symptoms:** "HTTP POST Failed" or 401/403 errors

**Solutions:**
1. Verify backend is running (`http://localhost:5000/health`)
2. Check `DEVICE_API_KEY` matches `.env` file
3. Ensure backend IP address is correct
4. Check firewall rules

### Transaction Fails

**Symptoms:** Backend returns error status

**Solutions:**
1. Check if card is registered: `GET /api/iot/card/:cardToken`
2. Verify VC is valid (not revoked)
3. Ensure wallet has enough balance (for withdrawals)
4. Check Ganache is running
5. Verify `CONTRACT_ADDRESS` in `.env`

### Card Not Found

**Symptoms:** "Card not registered" error

**Solutions:**
1. Register card via API
2. Check card token spelling
3. Verify card was written correctly (use card writer)

---

## 📊 Database Schema (In-Memory)

```javascript
{
  cardToken: "CRD103492",           // Unique card identifier
  walletAddress: "0x1234...",       // User's Ethereum address
  vcTokenId: 1,                      // VC NFT token ID
  deviceId: "esp8266-device-01",    // Optional device restriction
  registeredAt: "2025-11-30...",    // Registration timestamp
  isActive: true,                    // Card status
  lastUsed: "2025-11-30...",        // Last transaction time
  transactionCount: 15               // Usage counter
}
```

**Note:** Current implementation uses in-memory Map. For production, migrate to MongoDB or PostgreSQL.

---

## 🎓 Example Use Cases

### Use Case 1: Bank ATM

- Customer taps RFID card
- ESP8266 verifies VC
- User deposits cash
- Backend processes blockchain deposit
- LED shows success

### Use Case 2: Access Control

- Employee taps card at door
- ESP8266 sends VERIFY transaction
- Backend checks VC validity
- Door unlocks on success
- LED shows access granted

### Use Case 3: Retail Payment

- Customer taps card at checkout
- ESP8266 sends TRANSFER transaction
- Backend transfers funds to merchant
- Receipt printer activated
- LED confirms payment

---

## 📝 Next Steps

1. **MongoDB Integration** - Replace in-memory storage
2. **Admin Dashboard** - Web UI for card management
3. **Mobile App** - NFC card reading on smartphones
4. **Multi-Device Support** - Support multiple ESP8266 nodes
5. **Transaction History** - Store and display transaction logs
6. **Webhooks** - Real-time notifications for transactions

---

## 🤝 Support

For issues or questions:
1. Check this documentation
2. Review Serial Monitor logs
3. Check backend server logs
4. Verify blockchain transactions on Ganache
5. Test with `curl` commands first

---

**System Status:** ✅ Ready for Testing
**Last Updated:** November 30, 2025
