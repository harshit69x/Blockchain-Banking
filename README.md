# 🏦 Blockchain Banking with SSI & Verifiable Credentials

A complete decentralized banking system using Self-Sovereign Identity (SSI) and Verifiable Credentials (VC) implemented as NFTs on Ethereum.

## 🎯 Features

- **Bank-side KYC Flow**: Upload KYC data → Store on IPFS → Mint VC NFT
- **User-side Banking**: Activate account via VC NFT → Deposit/Withdraw ETH
- **Credential Revocation**: Bank can revoke VCs, blocking further deposits
- **Event Monitoring**: Track all transactions and credential activities
- **Role-Based Access**: Bank and User roles with distinct permissions
- **Security**: ReentrancyGuard, AccessControl, Pausable contract

## 🛠️ Tech Stack

### Smart Contracts
- Solidity ^0.8.20
- OpenZeppelin (ERC721URIStorage, AccessControl, ReentrancyGuard, Pausable)
- Truffle Framework
- Ganache UI (localhost:8545)

### Frontend
- React 18 + Vite
- Web3.js + Web3Modal
- MetaMask Integration
- Responsive UI with modern design

### Storage
- IPFS (simulated in v0, ready for Pinata/Infura integration)

## 📋 Prerequisites

Before you begin, ensure you have:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Ganache UI](https://trufflesuite.com/ganache/) running on port 8545
- [MetaMask](https://metamask.io/) browser extension
- [Truffle](https://trufflesuite.com/truffle/) installed globally

```bash
npm install -g truffle
```

## 🚀 Quick Start

### 1. Start Ganache UI

1. Open Ganache UI
2. Create a new workspace or quickstart
3. Ensure it's running on `HTTP://127.0.0.1:8545`
4. Note the first account address (this will be the Bank account)

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Compile & Deploy Smart Contracts

```bash
# Compile contracts
npm run compile

# Deploy to Ganache
npm run migrate
```

**Important**: After deployment, note the contract address from the console output.

### 4. Frontend Configuration (Already Done)

The contract address is already configured in `frontend/src/App.jsx`:

```javascript
const CONTRACT_ADDRESS = '0xb9696d8b73F56F110a8fb29be3730094Bbea8Ca0';
```

This is the deployed BankVC contract on your local Ganache blockchain.

### 5. Configure MetaMask

1. Open MetaMask
2. Add a new network:
   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337` (or `5777` depending on your Ganache config)
   - Currency Symbol: `ETH`
3. Import accounts from Ganache using private keys

### 6. Run the Frontend

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📖 Usage Guide

### Bank Operations

1. **Connect Wallet** with the bank account (first Ganache account)
2. **Mint VC**:
   - Enter user's Ethereum address
   - Add KYC data in JSON format:
   ```json
   {
     "name": "John Doe",
     "dateOfBirth": "1990-01-01",
     "nationality": "US",
     "documentNumber": "P1234567",
     "verified": true
   }
   ```
   - Click "Upload to IPFS" (simulated)
   - Click "Mint VC NFT"
3. **Revoke VC**: Enter token ID and revoke
4. **Monitor Events**: View all system events with filters
5. **Contract Control**: Pause/Unpause the contract

### User Operations

1. **Connect Wallet** with a user account
2. **View VCs**: See all your Verifiable Credentials
3. **Check Status**: Verify if VCs are valid or revoked
4. **Deposit ETH**: 
   - Requires a valid VC
   - Enter amount and deposit
5. **Withdraw ETH**: 
   - Enter amount to withdraw
   - Must have sufficient balance
6. **View History**: See all your transactions

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

### Test Coverage

- ✅ Contract deployment and role assignment
- ✅ VC minting by bank
- ✅ VC revocation
- ✅ Access control (non-bank cannot mint/revoke)
- ✅ Deposit with valid VC
- ✅ Deposit fails without VC
- ✅ Deposit fails with revoked VC
- ✅ Withdrawal functionality
- ✅ Balance updates
- ✅ Pause/Unpause functionality
- ✅ Reentrancy protection
- ✅ End-to-end flow

## 🔒 Security Features

1. **ReentrancyGuard**: Prevents reentrancy attacks on deposits/withdrawals
2. **AccessControl**: Role-based permissions (BANK_ROLE)
3. **Pausable**: Emergency stop mechanism
4. **Solidity 0.8+**: Built-in overflow protection
5. **Input Validation**: Address and amount validation

## 📁 Project Structure

```
blockchain-banking/
├── contracts/
│   └── BankVC.sol              # Main smart contract
├── migrations/
│   └── 1_deploy_contracts.js   # Deployment script
├── test/
│   └── BankVC.test.js          # Contract tests
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── BankView.jsx    # Bank dashboard
│   │   │   └── UserView.jsx    # User dashboard
│   │   ├── components/
│   │   │   ├── AddressBadge.jsx
│   │   │   ├── TokenCard.jsx
│   │   │   └── TxStatusToast.jsx
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── truffle-config.js           # Truffle configuration
├── package.json
└── README.md
```

## 🎬 End-to-End Flow Example

1. **Bank uploads KYC** for user `0xUser...`
   - KYC data stored on IPFS → CID: `QmXXX...`

2. **Bank mints VC NFT**
   - VC Token #1 minted to `0xUser...`
   - Token URI: `ipfs://QmXXX...`

3. **User activates account**
   - Connects wallet
   - Views VC Token #1 (Valid ✓)

4. **User deposits 0.01 ETH**
   - Internal balance: 0.01 ETH
   - Event logged

5. **User withdraws 0.005 ETH**
   - Internal balance: 0.005 ETH
   - ETH transferred to wallet

6. **Bank revokes VC #1**
   - VC status: Revoked ✗

7. **User attempts to deposit** → ❌ **BLOCKED**
   - Error: "No valid VC found"

## 🔄 Smart Contract Functions

### Bank Functions
- `mintVC(address to, string ipfsCID)` - Issue new VC
- `revokeVC(uint256 tokenId)` - Revoke VC
- `pause()` / `unpause()` - Emergency controls

### User Functions
- `deposit()` - Deposit ETH (requires valid VC)
- `withdraw(uint256 amount)` - Withdraw ETH
- `getUserVCs(address user)` - Get all VCs
- `isValidVC(uint256 tokenId)` - Check VC status

### View Functions
- `balance(address user)` - Get user's internal balance
- `revoked(uint256 tokenId)` - Check if VC is revoked
- `getContractBalance()` - Get contract's ETH balance

## 🌐 IPFS Integration

Current implementation uses simulated IPFS for v0. To integrate real IPFS:

### Option 1: Pinata

1. Sign up at [Pinata](https://pinata.cloud/)
2. Get API keys
3. Update `BankView.jsx`:

```javascript
const response = await axios.post(
  'https://api.pinata.cloud/pinning/pinFileToIPFS',
  formData,
  {
    headers: {
      'pinata_api_key': 'YOUR_API_KEY',
      'pinata_secret_api_key': 'YOUR_SECRET_KEY'
    }
  }
);
setIpfsCID(response.data.IpfsHash);
```

### Option 2: Infura IPFS

1. Sign up at [Infura](https://infura.io/)
2. Create IPFS project
3. Use Infura IPFS endpoint

## 🐛 Troubleshooting

### Contract not found
- Ensure Ganache is running on port 8545
- Run `npm run migrate` to deploy contracts
- Check contract address in `build/contracts/BankVC.json`

### MetaMask connection issues
- Verify network settings (RPC URL, Chain ID)
- Reset MetaMask account (Settings → Advanced → Reset Account)
- Clear browser cache

### Transaction failures
- Ensure sufficient ETH for gas fees
- Check if contract is paused
- Verify you have a valid VC (for deposits)

## 📝 License

MIT License

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📧 Support

For issues and questions, please open a GitHub issue.

## 🎯 Future Enhancements

- [ ] Real IPFS integration (Pinata/Infura)
- [ ] Backend event indexing service
- [ ] Multiple VC types (KYC levels)
- [ ] VC metadata enrichment
- [ ] Multi-signature bank operations
- [ ] Compliance reporting dashboard
- [ ] Mobile app integration
- [ ] Layer 2 deployment (Polygon, Optimism)

---

**Built with ❤️ using Ethereum, React, and IPFS**
