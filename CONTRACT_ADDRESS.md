# Deployed Contract Information

## BankVC Contract

**Network**: Ganache (Local Development)  
**Address**: `0xb9696d8b73F56F110a8fb29be3730094Bbea8Ca0`  
**Network ID**: 5777  
**Deployed On**: November 5, 2025  

### Connection Details

- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 1337 (or 5777)
- **Symbol**: ETH
- **Block Explorer**: N/A (Local)

### Contract Features

- ✅ ERC721 Verifiable Credentials (NFTs)
- ✅ Access Control (BANK_ROLE)
- ✅ Internal Balance System
- ✅ Deposit & Withdrawal Functions
- ✅ VC Revocation
- ✅ Pausable
- ✅ ReentrancyGuard

### Usage in Frontend

The contract address is hardcoded in `frontend/src/App.jsx`:

```javascript
const CONTRACT_ADDRESS = '0xb9696d8b73F56F110a8fb29be3730094Bbea8Ca0';
```

### ABI Location

The contract ABI can be found at:
```
build/contracts/BankVC.json
```

### Quick Commands

```bash
# Verify deployment
truffle console
> BankVC.deployed().then(i => i.address)

# Check contract on Ganache
# Open Ganache UI and look for contract at the address above
```

### Important Notes

⚠️ **This is a local development deployment**
- The contract will reset if Ganache is restarted (unless using persistence)
- Make sure Ganache is running on port 8545
- Use the same accounts imported into MetaMask

### Redeployment

If you need to redeploy:

```bash
# This will create a new contract address
npm run migrate

# Update the CONTRACT_ADDRESS in:
# - frontend/src/App.jsx
# - This file
```
