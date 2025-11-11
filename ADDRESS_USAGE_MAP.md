# Contract Address Usage Map

## Deployed Contract Address
```
0xb9696d8b73F56F110a8fb29be3730094Bbea8Ca0
```

## Files Using This Address

### 1. Frontend Application
**File**: `frontend/src/App.jsx`

**Line 11** - Constant Definition:
```javascript
const CONTRACT_ADDRESS = '0xb9696d8b73F56F110a8fb29be3730094Bbea8Ca0';
```

**Line 45** - Contract Initialization:
```javascript
const contractInstance = new web3Instance.eth.Contract(
  BankVCArtifact.abi,
  CONTRACT_ADDRESS  // ← Used here
);
```

**Line 120** - UI Display:
```jsx
<code>
  {CONTRACT_ADDRESS}  // ← Displayed to user
</code>
```

### 2. Documentation Files

**README.md** - Lines 78-85:
- Updated to show the contract is already configured
- Displays the actual deployed address

**SETUP.md** - Lines 81-89:
- Shows the contract address is pre-configured
- No manual configuration needed

**CONTRACT_ADDRESS.md** - Complete reference:
- Full deployment details
- Connection information
- Usage instructions

**FRONTEND_CONFIG.md** - Configuration summary:
- All changes documented
- Testing instructions
- Update procedures

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  App.jsx (Line 11)                                      │
│  const CONTRACT_ADDRESS = '0xb969...8Ca0'               │
└────────────┬────────────────────────────────────────────┘
             │
             ├─────────────────────────────┐
             │                             │
             ▼                             ▼
┌────────────────────────┐    ┌──────────────────────────┐
│  Contract Init         │    │  UI Display              │
│  (Line 45)             │    │  (Line 120)              │
│                        │    │                          │
│  new Contract(         │    │  <code>                  │
│    abi,                │    │    {CONTRACT_ADDRESS}    │
│    CONTRACT_ADDRESS    │    │  </code>                 │
│  )                     │    │                          │
└────────┬───────────────┘    └──────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  Web3 Connection       │
│  to Ganache            │
│  http://127.0.0.1:8545 │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│  BankVC Contract       │
│  0xb969...8Ca0         │
│  on Ganache Network    │
└────────────────────────┘
```

## Component Props Flow

The contract instance (initialized with this address) is passed down to:

1. **BankView Component** (for bank users)
   - Props: `{ web3, account, contract, showToast }`
   - Uses contract for: mintVC, revokeVC, pause, unpause

2. **UserView Component** (for regular users)
   - Props: `{ web3, account, contract, showToast }`
   - Uses contract for: deposit, withdraw, getUserVCs

## Verification Checklist

- [x] Address defined in App.jsx
- [x] Address used for contract initialization
- [x] Address displayed in UI
- [x] Documentation updated
- [x] Reference files created
- [x] No dynamic address detection (removed)
- [x] No fallback to build artifacts

## Quick Test

To verify the address is working:

```bash
# 1. Start frontend
cd frontend && npm run dev

# 2. Open browser to http://localhost:3000

# 3. Connect MetaMask

# 4. Check header - you should see:
#    📜 Contract: 0xb9696d8b73F56F110a8fb29be3730094Bbea8Ca0

# 5. Open browser console and run:
window.ethereum && window.ethereum.request({
  method: 'eth_call',
  params: [{
    to: '0xb9696d8b73F56F110a8fb29be3730094Bbea8Ca0',
    data: '0x06fdde03' // name() function
  }, 'latest']
})
# Should return: "Bank Verifiable Credential"
```

## Maintenance

If you need to update this address in the future:

1. Deploy new contract: `npm run migrate`
2. Note the new address from console output
3. Update `frontend/src/App.jsx` line 11
4. Update this file and other documentation
5. Restart frontend: `npm run dev`
