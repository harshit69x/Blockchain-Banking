# 📋 DEPLOYMENT CHECKLIST

## Pre-Deployment

### Environment Setup
- [ ] Node.js v16+ installed
- [ ] Truffle installed globally (`npm install -g truffle`)
- [ ] Ganache UI installed
- [ ] MetaMask extension installed
- [ ] Git installed (optional)

### Project Setup
- [ ] Dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Contracts compile successfully (`npm run compile`)
- [ ] All tests pass (`npm test`)

---

## Ganache Configuration

- [ ] Ganache UI opened
- [ ] RPC Server: http://127.0.0.1:8545
- [ ] Network ID: 5777 or 1337
- [ ] Gas Limit: 6721975
- [ ] Accounts generated (10+ accounts)
- [ ] First account noted (Bank account)
- [ ] Private keys copied for MetaMask import

---

## Smart Contract Deployment

- [ ] Ganache is running
- [ ] Run: `npm run migrate`
- [ ] Deployment successful
- [ ] Contract address noted
- [ ] BANK_ROLE assigned to deployer
- [ ] Transaction hash saved
- [ ] No errors in console

### Verify Deployment
- [ ] Check `build/contracts/BankVC.json` exists
- [ ] Contract address in networks section
- [ ] ABI generated correctly

---

## MetaMask Configuration

### Add Network
- [ ] Click Networks → Add Network
- [ ] Network Name: `Ganache Local`
- [ ] RPC URL: `http://127.0.0.1:8545`
- [ ] Chain ID: `1337` (or `5777`)
- [ ] Currency Symbol: `ETH`
- [ ] Save network

### Import Accounts
- [ ] Import Account 0 (Bank) - Label as "Bank"
- [ ] Import Account 1 (User 1) - Label as "User 1"
- [ ] Import Account 2 (User 2) - Label as "User 2"
- [ ] Verify ETH balance (~100 ETH each)

---

## Frontend Configuration

- [ ] Build artifacts exist in `build/contracts/`
- [ ] Frontend can find contract ABI
- [ ] Vite config correct (port 3000)
- [ ] No compilation errors

### Start Frontend
- [ ] Run: `npm run dev`
- [ ] Frontend accessible at http://localhost:3000
- [ ] No console errors
- [ ] UI loads properly

---

## Initial Testing

### Test 1: Wallet Connection
- [ ] Open http://localhost:3000
- [ ] Click "Connect Wallet"
- [ ] MetaMask popup appears
- [ ] Select Bank account
- [ ] Connection successful
- [ ] Role badge shows "BANK"
- [ ] Address displayed correctly

### Test 2: Mint VC
- [ ] Navigate to "Mint VC" tab
- [ ] Enter User 1 address from Ganache
- [ ] Paste sample KYC from `examples/sample-kyc.json`
- [ ] Click "Upload to IPFS"
- [ ] IPFS CID generated
- [ ] Click "Mint VC NFT"
- [ ] MetaMask confirms transaction
- [ ] Success toast appears
- [ ] Token ID displayed

### Test 3: User View VC
- [ ] Disconnect wallet
- [ ] Connect with User 1 account
- [ ] Role badge shows "USER"
- [ ] VC appears in "Your Verifiable Credentials"
- [ ] Status shows "✓ Valid"
- [ ] Token URI displayed

### Test 4: Deposit
- [ ] User 1 still connected
- [ ] Enter amount: 0.01 ETH
- [ ] Click "Deposit"
- [ ] MetaMask confirms
- [ ] Balance updates to 0.01 ETH
- [ ] Transaction appears in history

### Test 5: Withdraw
- [ ] Enter amount: 0.005 ETH
- [ ] Click "Withdraw"
- [ ] MetaMask confirms
- [ ] Balance updates to 0.005 ETH
- [ ] ETH transferred to wallet
- [ ] Transaction in history

### Test 6: Revoke VC
- [ ] Disconnect, connect as Bank
- [ ] Navigate to "Revoke VC" tab
- [ ] Enter Token ID: 1
- [ ] Click "Revoke VC"
- [ ] Success confirmation
- [ ] Event appears in Monitor

### Test 7: Blocked Deposit
- [ ] Disconnect, connect as User 1
- [ ] Check VC status (should show Revoked)
- [ ] Try to deposit
- [ ] Transaction fails or button disabled
- [ ] Error message: "No valid VC found"

### Test 8: Event Monitoring
- [ ] Connect as Bank
- [ ] Navigate to "Monitor Events" tab
- [ ] All events visible
- [ ] Test each filter button
- [ ] Refresh works

---

## Automated Tests

- [ ] Run: `npm test`
- [ ] All 24 tests pass
- [ ] No warnings or errors
- [ ] Coverage report generated

### Test Categories Passing
- [ ] Deployment tests (3)
- [ ] Minting tests (4)
- [ ] Revoking tests (3)
- [ ] Deposit tests (5)
- [ ] Withdrawal tests (4)
- [ ] User VC tests (2)
- [ ] Pause/Unpause tests (2)
- [ ] E2E flow test (1)

---

## Demo Script

- [ ] Run: `truffle exec scripts/demo.js`
- [ ] Demo completes successfully
- [ ] All steps execute
- [ ] Final statistics correct

---

## Security Verification

### Smart Contract
- [ ] ReentrancyGuard on deposit/withdraw
- [ ] AccessControl roles configured
- [ ] Pausable functionality works
- [ ] Input validation present
- [ ] Events emitted correctly
- [ ] No compiler warnings

### Frontend
- [ ] MetaMask signature required for transactions
- [ ] No private keys in code
- [ ] RPC URL configurable
- [ ] Error handling implemented
- [ ] Transaction confirmation required

---

## Documentation

- [ ] README.md complete
- [ ] SETUP.md available
- [ ] TESTING.md comprehensive
- [ ] Sample KYC data provided
- [ ] Code comments adequate
- [ ] License file present

---

## Performance

- [ ] Frontend loads < 3 seconds
- [ ] Transactions confirm < 10 seconds
- [ ] No memory leaks
- [ ] Responsive UI
- [ ] Events load quickly

---

## Browser Compatibility

- [ ] Chrome/Brave (with MetaMask)
- [ ] Firefox (with MetaMask)
- [ ] Edge (with MetaMask)
- [ ] Mobile responsive

---

## Final Verification

### Smart Contract Checklist
- [ ] Contract deployed successfully
- [ ] All functions accessible
- [ ] Events emitting correctly
- [ ] Access control working
- [ ] Tests passing

### Frontend Checklist
- [ ] Wallet connection works
- [ ] Bank view functional
- [ ] User view functional
- [ ] UI responsive
- [ ] Toast notifications working

### Integration Checklist
- [ ] Frontend connects to contract
- [ ] Transactions execute
- [ ] Events display
- [ ] Balance updates
- [ ] Role detection works

---

## Optional Enhancements

- [ ] Real IPFS integration configured
- [ ] Backend event indexer running
- [ ] Database for events (if applicable)
- [ ] Production build tested
- [ ] Deployment to testnet (Goerli/Sepolia)

---

## Troubleshooting Log

| Issue | Solution Applied | Status |
|-------|-----------------|--------|
| | | |
| | | |
| | | |

---

## Sign-Off

- [ ] All critical tests passed
- [ ] Demo flow completed successfully
- [ ] Documentation reviewed
- [ ] Code reviewed
- [ ] Security checklist completed
- [ ] Ready for demo/presentation

**Deployment Date**: _______________

**Deployed By**: _______________

**Contract Address**: _______________

**Network ID**: _______________

**Status**: ⬜ Development | ⬜ Testing | ⬜ Production

---

## Post-Deployment

- [ ] Contract address documented
- [ ] Transaction hashes saved
- [ ] Ganache snapshot created (optional)
- [ ] Git repository committed
- [ ] Team notified
- [ ] Demo scheduled

---

**✅ Checklist Complete = Ready to Demo! 🚀**
