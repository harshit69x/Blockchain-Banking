# 🧪 Testing Guide

Complete testing documentation for the Blockchain Banking SSI Platform.

## 📋 Test Scenarios

### Scenario 1: Contract Deployment ✅

**Goal**: Verify contract deploys correctly with proper roles

**Steps**:
```powershell
npm run migrate
```

**Expected Results**:
- ✅ Contract compiles without errors
- ✅ Contract deploys successfully
- ✅ BANK_ROLE assigned to deployer
- ✅ Contract address displayed

---

### Scenario 2: VC Minting (Bank) 🎫

**Goal**: Bank successfully mints VC NFT for user

**Prerequisites**: 
- Ganache running
- Contract deployed
- MetaMask connected with Bank account

**Steps**:
1. Connect wallet (Bank account)
2. Navigate to "Mint VC" tab
3. Enter user address (from Ganache)
4. Paste KYC data from `examples/sample-kyc.json`
5. Click "Upload to IPFS"
6. Wait for IPFS CID
7. Click "Mint VC NFT"

**Expected Results**:
- ✅ IPFS CID generated
- ✅ Transaction succeeds
- ✅ Toast shows "VC NFT minted successfully! Token ID: 1"
- ✅ Event appears in Monitor tab

**Test Data**:
```
User Address: [Second Ganache account]
KYC Data: See examples/sample-kyc.json
```

---

### Scenario 3: VC Validation (User) ✓

**Goal**: User can view their VC and check validity

**Prerequisites**:
- VC minted for user

**Steps**:
1. Disconnect wallet
2. Connect with User account
3. Check "Your Verifiable Credentials" section

**Expected Results**:
- ✅ VC Token card displays
- ✅ Status badge shows "✓ Valid"
- ✅ Token URI shows ipfs:// link
- ✅ "Active and valid" message displayed

---

### Scenario 4: Deposit ETH (User) 💰

**Goal**: User with valid VC can deposit ETH

**Prerequisites**:
- User has valid VC

**Steps**:
1. Connected as User
2. Go to "Deposit ETH" section
3. Enter amount: `0.01`
4. Click "Deposit"
5. Confirm MetaMask transaction

**Expected Results**:
- ✅ Transaction succeeds
- ✅ Balance updates to 0.01 ETH
- ✅ Toast shows success message
- ✅ Transaction appears in history

**Verify**:
```javascript
// In browser console
await contract.methods.balance(userAddress).call()
// Should return: 10000000000000000 (wei)
```

---

### Scenario 5: Withdraw ETH (User) 💸

**Goal**: User can withdraw from internal balance

**Prerequisites**:
- User has deposited ETH

**Steps**:
1. Connected as User
2. Go to "Withdraw ETH" section
3. Enter amount: `0.005`
4. Click "Withdraw"
5. Confirm MetaMask transaction

**Expected Results**:
- ✅ Transaction succeeds
- ✅ Balance decreases to 0.005 ETH
- ✅ ETH transferred to wallet
- ✅ Transaction in history

---

### Scenario 6: VC Revocation (Bank) 🚫

**Goal**: Bank can revoke VC, blocking deposits

**Prerequisites**:
- VC minted and user deposited

**Steps**:
1. Connect as Bank
2. Navigate to "Revoke VC" tab
3. Enter Token ID: `1`
4. Click "Revoke VC"
5. Confirm transaction

**Expected Results**:
- ✅ Revocation succeeds
- ✅ Toast shows success
- ✅ Event logged in Monitor

---

### Scenario 7: Blocked Deposit After Revocation ⛔

**Goal**: User cannot deposit after VC revoked

**Prerequisites**:
- User's VC has been revoked

**Steps**:
1. Connect as User
2. Check VC status (should show "Revoked")
3. Try to deposit 0.01 ETH

**Expected Results**:
- ✅ VC badge shows "✗ Revoked"
- ✅ Warning message displays
- ✅ Deposit button disabled OR
- ✅ Transaction fails with "No valid VC found"

---

### Scenario 8: Multiple VCs 🎫🎫

**Goal**: User can have multiple VCs

**Steps**:
1. As Bank, mint VC #1 for User
2. Mint VC #2 for same User
3. Connect as User
4. Check VCs

**Expected Results**:
- ✅ User sees 2 VC tokens
- ✅ Both shown in "Your Verifiable Credentials"
- ✅ Can deposit if at least one is valid

---

### Scenario 9: Event Monitoring (Bank) 📊

**Goal**: Bank can monitor all system events

**Steps**:
1. Connect as Bank
2. Navigate to "Monitor Events" tab
3. Click each filter button

**Expected Results**:
- ✅ All events displayed by default
- ✅ Filters work correctly
- ✅ Shows: VCIssued, VCRevoked, Deposit, Withdraw
- ✅ Transaction hashes and block numbers shown

---

### Scenario 10: Pause/Unpause Contract ⏸️

**Goal**: Bank can pause contract, blocking operations

**Steps**:
1. Connect as Bank
2. Navigate to "Contract Control" tab
3. Click "Pause Contract"
4. Switch to User account
5. Try to deposit
6. Switch back to Bank
7. Click "Unpause Contract"

**Expected Results**:
- ✅ Pause succeeds
- ✅ User deposits fail with "Pausable: paused"
- ✅ Unpause succeeds
- ✅ User can deposit again

---

### Scenario 11: Access Control 🔒

**Goal**: Non-bank cannot perform bank operations

**Steps**:
1. Connect as User (non-bank account)
2. Try to access Bank functions via console

**Test in console**:
```javascript
// Should fail
await contract.methods.mintVC(userAddress, "QmTest").send({ from: account })
```

**Expected Results**:
- ✅ Transaction reverts
- ✅ Error message about missing role

---

### Scenario 12: Edge Cases 🧪

**Goal**: Test boundary conditions

**Test Cases**:

#### 12.1: Zero Deposit
```
Amount: 0
Expected: ❌ "Deposit amount must be greater than 0"
```

#### 12.2: Insufficient Withdrawal
```
Balance: 0.01 ETH
Withdraw: 1 ETH
Expected: ❌ "Insufficient balance"
```

#### 12.3: Invalid Address
```
Mint to: 0x000000000000000000000000000000000000000
Expected: ❌ "Cannot mint to zero address"
```

#### 12.4: Empty IPFS CID
```
IPFS CID: ""
Expected: ❌ "IPFS CID cannot be empty"
```

#### 12.5: Revoke Non-existent Token
```
Token ID: 999
Expected: ❌ "Token does not exist"
```

#### 12.6: Double Revocation
```
Revoke same token twice
Expected: ❌ "Token already revoked"
```

---

## 🤖 Automated Tests

### Run Full Test Suite
```powershell
npm test
```

### Expected Output
```
Contract: BankVC
  Deployment
    ✓ should deploy correctly with BANK_ROLE assigned
    ✓ should set the correct contract name and symbol
    ✓ should initialize nextTokenId to 1
  Minting VC
    ✓ should allow bank to mint VC
    ✓ should not allow non-bank to mint VC
    ✓ should not mint to zero address
    ✓ should increment token ID correctly
  Revoking VC
    ✓ should allow bank to revoke VC
    ✓ should not allow non-bank to revoke VC
    ✓ should not revoke already revoked VC
  Deposits
    ✓ should allow user with valid VC to deposit
    ✓ should fail if user lacks valid VC
    ✓ should fail if VC is revoked
    ✓ should accumulate multiple deposits correctly
    ✓ should fail when paused
  Withdrawals
    ✓ should allow user to withdraw with sufficient balance
    ✓ should fail with insufficient balance
    ✓ should update balances correctly
    ✓ should fail when paused
  Get User VCs
    ✓ should return empty array for user with no VCs
    ✓ should return all VCs owned by user
  Pause/Unpause
    ✓ should allow bank to pause and unpause
    ✓ should not allow non-bank to pause
  Reentrancy Protection
    ✓ should prevent reentrancy attacks on deposit
  End-to-End Flow
    ✓ should complete full banking flow

24 passing (2s)
```

---

## 🎬 Demo Script

Run automated demo:
```powershell
truffle exec scripts/demo.js
```

**Expected Flow**:
```
=== Blockchain Banking Demo ===

Step 1: Bank minting VC for user...
✅ VC minted! Token ID: 1

Step 2: Checking VC validity...
VC Valid: true

Step 3: User depositing 0.01 ETH...
✅ Deposit successful! Balance: 0.01 ETH

Step 4: User withdrawing 0.005 ETH...
✅ Withdrawal successful! Remaining balance: 0.005 ETH

Step 5: Bank revoking VC...
✅ VC revoked! Valid: false

Step 6: User attempting to deposit (should fail)...
✅ Expected: Deposit blocked - No valid VC found

=== Final Statistics ===
User VCs: 1
User Balance: 0.005 ETH
Contract Balance: 0.005 ETH

✅ Demo completed successfully!
```

---

## 🔍 Manual Verification

### Check Contract State
```javascript
// In Truffle console: truffle console
const bank = await BankVC.deployed()

// Check total VCs
const nextId = await bank.nextTokenId()
console.log('Total VCs minted:', nextId.toNumber() - 1)

// Check user VCs
const vcs = await bank.getUserVCs("0xUserAddress")
console.log('User VCs:', vcs.map(v => v.toString()))

// Check balance
const bal = await bank.balance("0xUserAddress")
console.log('Balance:', web3.utils.fromWei(bal, 'ether'), 'ETH')

// Check if VC is valid
const valid = await bank.isValidVC(1)
console.log('VC #1 valid:', valid)

// Check if revoked
const revoked = await bank.revoked(1)
console.log('VC #1 revoked:', revoked)
```

---

## 📊 Test Coverage Matrix

| Feature | Unit Test | Integration Test | Manual Test |
|---------|-----------|------------------|-------------|
| VC Minting | ✅ | ✅ | ✅ |
| VC Revocation | ✅ | ✅ | ✅ |
| Deposits | ✅ | ✅ | ✅ |
| Withdrawals | ✅ | ✅ | ✅ |
| Access Control | ✅ | ❌ | ✅ |
| Pause/Unpause | ✅ | ✅ | ✅ |
| Event Emission | ✅ | ✅ | ✅ |
| Frontend UI | ❌ | ❌ | ✅ |
| MetaMask Integration | ❌ | ❌ | ✅ |

---

## 🐛 Known Issues & Limitations

### v0 Limitations:
1. **IPFS**: Simulated, not real pinning
2. **getUserVCs**: O(n) complexity (linear scan)
3. **Event Indexing**: Client-side only
4. **No Backend**: Events not persisted

### Future Improvements:
- [ ] Real IPFS integration
- [ ] Efficient VC lookup (mapping)
- [ ] Backend event indexing
- [ ] GraphQL API
- [ ] Mobile wallet support

---

## ✅ Acceptance Criteria

Project is complete when:

- [x] All unit tests pass
- [x] Bank can mint VCs
- [x] User can deposit with valid VC
- [x] User can withdraw
- [x] Revoked VCs block deposits
- [x] Events are logged and viewable
- [x] Role-based access works
- [x] Pause/unpause functions
- [x] Frontend connects to contract
- [x] MetaMask integration works

---

**Happy Testing! 🧪**
