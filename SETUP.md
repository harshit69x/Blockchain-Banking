# 🚀 Quick Setup Guide

Follow these steps to get the Blockchain Banking system running in minutes!

## ✅ Prerequisites Checklist

- [ ] Node.js v16+ installed
- [ ] Ganache UI installed and running on port 8545
- [ ] MetaMask browser extension installed
- [ ] Truffle installed globally (`npm install -g truffle`)

## 📝 Step-by-Step Setup

### 1. Start Ganache UI

```
1. Open Ganache UI
2. Click "New Workspace" or "Quickstart"
3. Verify RPC Server: HTTP://127.0.0.1:8545
4. Note the first account address (this becomes the BANK account)
5. Copy some private keys for MetaMask import
```

### 2. Install Project Dependencies

Open PowerShell in the project directory:

```powershell
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Compile Smart Contracts

```powershell
npm run compile
```

Expected output:
```
Compiling your contracts...
✓ Compiled successfully using solc 0.8.20
```

### 4. Deploy to Ganache

```powershell
npm run migrate
```

**IMPORTANT**: Copy the deployed contract address from the output:
```
BankVC deployed at: 0x1234567890abcdef...
```

### 5. Configure MetaMask

#### Add Ganache Network:
```
Network Name: Ganache Local
New RPC URL: http://127.0.0.1:8545
Chain ID: 1337
Currency Symbol: ETH
```

#### Import Accounts:
```
1. Click MetaMask profile icon
2. Select "Import Account"
3. Paste private key from Ganache
4. Repeat for 2-3 accounts (Bank + Users)
```

### 6. Frontend Configuration (Already Set)

The contract address is already configured in `frontend/src/App.jsx`:

```javascript
// Deployed BankVC contract address on Ganache
const CONTRACT_ADDRESS = '0xb9696d8b73F56F110a8fb29be3730094Bbea8Ca0';
```

No changes needed - the frontend is ready to use!

### 7. Run the Application

```powershell
# From root directory
npm run dev
```

This will start the frontend at: **http://localhost:3000**

### 8. Connect & Test

1. Open **http://localhost:3000** in your browser
2. Click **"Connect Wallet"**
3. Select the Bank account (first Ganache account)
4. You should see **BANK** role badge
5. Try minting a VC for another account!

## 🧪 Run Tests

Verify everything works:

```powershell
npm test
```

Expected: All tests should pass ✅

## 🎯 Quick Demo

Run the automated demo:

```powershell
truffle exec scripts/demo.js
```

This demonstrates the full flow:
- Bank mints VC
- User deposits ETH
- User withdraws ETH
- Bank revokes VC
- User blocked from depositing

## 🐛 Troubleshooting

### "Contract not found"
```powershell
# Redeploy contracts
npm run migrate
```

### "Cannot connect to Ganache"
```
1. Check Ganache is running
2. Verify port 8545
3. Restart Ganache
```

### "Transaction failed"
```
1. Reset MetaMask account
2. Check sufficient ETH balance
3. Verify contract not paused
```

### Port 3000 already in use
```powershell
# Edit frontend/vite.config.js
# Change port to 3001 or any available port
```

## 📊 Test Accounts Setup

For best testing experience, import 3 accounts:

1. **Account 0** (Bank) - Can mint/revoke VCs
2. **Account 1** (User 1) - Regular user
3. **Account 2** (User 2) - Regular user

## 🎉 Success Indicators

You've successfully set up when:

- ✅ Contract deploys without errors
- ✅ All tests pass
- ✅ Frontend loads and shows "Connect Wallet"
- ✅ MetaMask connects successfully
- ✅ Bank can mint VCs
- ✅ Users can deposit/withdraw

## 📚 Next Steps

1. Read the main [README.md](README.md) for full documentation
2. Explore the Bank Dashboard features
3. Test the User Dashboard with deposits/withdrawals
4. Check the event monitoring system
5. Try the pause/unpause functionality

## 🆘 Need Help?

- Check the main README.md troubleshooting section
- Review Ganache console for transaction details
- Check browser console for errors
- Verify MetaMask network settings

---

**Happy Building! 🏗️**
