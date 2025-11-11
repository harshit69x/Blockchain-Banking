# ⚡ QUICK REFERENCE

## 🚀 Essential Commands

```powershell
# Setup & Installation
.\setup.ps1                          # Automated setup
npm install                          # Install dependencies
cd frontend; npm install; cd ..      # Install frontend deps

# Smart Contracts
npm run compile                      # Compile contracts
npm run migrate                      # Deploy to Ganache
npm test                            # Run all tests
truffle console                      # Interactive console

# Frontend
npm run dev                         # Start dev server (port 3000)
cd frontend; npm run build          # Build for production

# Scripts
truffle exec scripts/demo.js        # Run end-to-end demo
node scripts/indexEvents.js         # Index all events
```

---

## 🔧 Configuration

### Ganache UI
```
RPC Server: http://127.0.0.1:8545
Network ID: 5777 or 1337
Gas Limit: 6721975
```

### MetaMask Network
```
Network Name: Ganache Local
RPC URL: http://127.0.0.1:8545
Chain ID: 1337 (or 5777)
Currency: ETH
```

---

## 📋 Contract Functions

### Bank Functions
```javascript
// Mint VC
mintVC(address to, string ipfsCID)

// Revoke VC
revokeVC(uint256 tokenId)

// Contract Control
pause()
unpause()
```

### User Functions
```javascript
// Banking
deposit() payable
withdraw(uint256 amount)

// View
getUserVCs(address user)
isValidVC(uint256 tokenId)
balance(address user)
```

---

## 🎯 Quick Testing

### In Truffle Console
```javascript
// Get contract
const bank = await BankVC.deployed()

// Mint VC
await bank.mintVC(accounts[1], "QmTest123", {from: accounts[0]})

// Deposit
await bank.deposit({from: accounts[1], value: web3.utils.toWei("0.01", "ether")})

// Check balance
const bal = await bank.balance(accounts[1])
web3.utils.fromWei(bal, "ether")

// Revoke
await bank.revokeVC(1, {from: accounts[0]})

// Check validity
await bank.isValidVC(1)
```

---

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| Contract not found | Run `npm run migrate` |
| Port 8545 refused | Start Ganache UI |
| MetaMask connection | Reset account in settings |
| Transaction failed | Check gas, balance, VC status |
| Frontend blank | Check contract deployment |

---

## 📁 Key Files

```
contracts/BankVC.sol              # Smart contract
migrations/1_deploy_contracts.js  # Deployment
test/BankVC.test.js              # Tests
frontend/src/App.jsx             # Main app
frontend/src/pages/BankView.jsx  # Bank UI
frontend/src/pages/UserView.jsx  # User UI
```

---

## 🎬 Demo Flow

1. Start Ganache (port 8545)
2. `npm run migrate`
3. Configure MetaMask
4. `npm run dev`
5. Connect wallet (Bank account)
6. Mint VC for user
7. Switch to user account
8. Deposit → Withdraw
9. Switch to bank
10. Revoke VC
11. Switch to user
12. Try deposit (blocked!)

---

## 📊 Test Coverage

```
24 Tests Total ✅
├─ Deployment (3)
├─ Minting (4)
├─ Revoking (3)
├─ Deposits (5)
├─ Withdrawals (4)
├─ User VCs (2)
├─ Pause/Unpause (2)
└─ E2E Flow (1)
```

---

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Ganache**: http://127.0.0.1:8545
- **IPFS Gateway**: https://ipfs.io/ipfs/

---

## 💡 Tips

- Use first Ganache account as Bank
- Import 3+ accounts to MetaMask
- Keep Ganache running during development
- Check browser console for errors
- Reset MetaMask if transactions stuck
- Clear cache if frontend issues

---

## 🔐 Security Checklist

- [x] ReentrancyGuard
- [x] AccessControl
- [x] Pausable
- [x] Input validation
- [x] Overflow protection
- [x] Event logging

---

## 📖 Documentation

- [README.md](README.md) - Full docs
- [SETUP.md](SETUP.md) - Setup guide
- [TESTING.md](TESTING.md) - Test guide
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Overview

---

**Need help? Check the documentation! 📚**
