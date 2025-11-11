# 🚀 Quick Start Guide - Blockchain Banking

## Prerequisites
✅ Ganache running on http://127.0.0.1:8545
✅ Contract deployed at: `0x7d703A8Ff1abb11FE60F2810B0dA5f1E819Dc7a8`
✅ MetaMask connected to Ganache network

## Installation Complete ✅
Both frontends have all dependencies installed and are ready to run!

## Starting the Applications

### Option 1: Run Both Frontends Simultaneously

**Terminal 1 - Bank Admin Panel:**
```powershell
cd "D:\Blockchain Banking\frontend-bank"
npm run dev
```
Access at: **http://localhost:3001**

**Terminal 2 - User Panel:**
```powershell
cd "D:\Blockchain Banking\frontend-user"
npm run dev
```
Access at: **http://localhost:3002**

### Option 2: Quick Launch Script

Create this PowerShell script to launch both at once:

**launch-both.ps1:**
```powershell
# Launch Bank Admin
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Blockchain Banking\frontend-bank'; npm run dev"

# Wait a moment
Start-Sleep -Seconds 2

# Launch User Panel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\Blockchain Banking\frontend-user'; npm run dev"

Write-Host "✅ Both frontends are starting!"
Write-Host "🏦 Bank Admin: http://localhost:3001"
Write-Host "👤 User Panel: http://localhost:3002"
```

Run it:
```powershell
.\launch-both.ps1
```

## How to Use

### 🏦 Bank Admin Panel (Port 3001)

**Access Requirements:**
- Must have BANK_ROLE in the smart contract
- Use the deployer account (first Ganache account)

**Features:**
1. **Dashboard Stats** - See total VCs, pending requests, transactions
2. **Pending Requests** - View all VC requests from users
3. **Approve/Reject** - Process VC requests with IPFS CID
4. **Analytics** - View transaction charts by period
5. **Recent Transactions** - Monitor all blockchain activity

**Workflow:**
1. Connect with bank account (deployer address)
2. View dashboard statistics
3. Check pending VC requests
4. Approve request → Enter IPFS CID → Confirm
5. User receives VC and can start banking

---

### 👤 User Panel (Port 3002)

**Access Requirements:**
- Any MetaMask account
- No special roles needed

**Features:**
1. **Overview** - See your balance and VC status
2. **Verification Tab** - Request VC with KYC data
3. **Banking Tab** - Deposit/Withdraw ETH
4. **Transfer Tab** - Send money to other users
5. **History Tab** - View all your transactions

**Workflow:**
1. Connect with any account
2. **Request VC** → Go to Verification tab → Submit KYC data
3. **Wait for Approval** → Status shows "Pending"
4. **Bank Approves** → Status changes to "Active"
5. **Start Banking:**
   - Deposit ETH
   - Withdraw ETH
   - Transfer to other users (they also need VC)
6. **View History** → See all transactions

---

## Testing the Complete Flow

### Step-by-Step Test:

**1. Setup (Do this first):**
```powershell
# Make sure Ganache is running
# Make sure contract is deployed at: 0x7d703A8Ff1abb11FE60F2810B0dA5f1E819Dc7a8
```

**2. Start Both Frontends:**
```powershell
# Terminal 1
cd "D:\Blockchain Banking\frontend-bank"
npm run dev

# Terminal 2
cd "D:\Blockchain Banking\frontend-user"
npm run dev
```

**3. Bank Admin Setup:**
- Open: http://localhost:3001
- Connect MetaMask with Account #1 (deployer - has BANK_ROLE)
- You should see the admin dashboard

**4. User Requests VC:**
- Open: http://localhost:3002 (in a different browser or incognito)
- Connect MetaMask with Account #2 (any user account)
- Go to "Verification" tab
- Fill in KYC data:
  ```
  Name: John Doe
  ID: ABC123
  Address: 123 Main St
  ```
- Click "Request VC"
- Status should show "Pending"

**5. Bank Approves VC:**
- Switch to bank admin (http://localhost:3001)
- You should see 1 pending request
- Click "Approve"
- Enter IPFS CID (test: `QmTest123abc`)
- Confirm transaction
- Request should disappear from pending list

**6. User Receives VC:**
- Switch back to user panel (http://localhost:3002)
- Status should now show "Active ✅"
- All tabs (Banking, Transfer) are now enabled

**7. User Deposits Money:**
- Go to "Banking" tab
- Enter amount: `1` ETH
- Click "Deposit"
- Balance increases by 1 ETH

**8. User Transfers to Another User:**
- Create a second VC for Account #3
- Go to "Transfer" tab on Account #2
- Enter Account #3 address
- Enter amount: `0.5`
- Click "Transfer"
- Both users see updated balances

**9. View Analytics:**
- Switch to bank admin
- View transaction charts
- Filter by period (Today/Week/Month/Year)
- See deposits, withdrawals, transfers

---

## Troubleshooting

### Issue: "Access Denied" on Bank Admin
**Solution:** Make sure you're using the deployer account (first Ganache account)

### Issue: "Cannot transfer" between users
**Solution:** Both users MUST have active VCs. Request and approve VCs for both accounts first.

### Issue: MetaMask transaction fails
**Solution:** 
1. Make sure Ganache is running
2. Check you have enough ETH in your account
3. Reset MetaMask account nonce (Settings → Advanced → Reset Account)

### Issue: Port already in use
**Solution:**
```powershell
# Kill process on port 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process

# Kill process on port 3002
Get-Process -Id (Get-NetTCPConnection -LocalPort 3002).OwningProcess | Stop-Process
```

---

## Important Notes

### Contract Address
Both frontends are configured to use:
```
0x7d703A8Ff1abb11FE60F2810B0dA5f1E819Dc7a8
```

If you redeploy the contract, update this address in:
- `frontend-bank/src/App.jsx` (line ~13)
- `frontend-user/src/App.jsx` (line ~13)

### User Transfers Require VCs
⚠️ **Important:** Both sender AND receiver must have valid (non-revoked) VCs to transfer money.

### Bank Can Revoke VCs
The bank can revoke a user's VC from the dashboard, which will:
- Prevent the user from making new transfers
- Not affect the user's existing balance
- User can still view their transaction history

---

## File Structure

```
D:\Blockchain Banking\
├── frontend-bank/          # Bank Admin Panel (Port 3001)
│   ├── src/
│   │   ├── App.jsx        # Main app with role check
│   │   ├── pages/
│   │   │   └── Dashboard.jsx  # Admin dashboard
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── frontend-user/          # User Panel (Port 3002)
│   ├── src/
│   │   ├── App.jsx        # Main app
│   │   ├── pages/
│   │   │   └── UserDashboard.jsx  # User dashboard
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── contracts/
    └── BankVC.sol         # Enhanced contract
```

---

## Next Steps

1. ✅ Both frontends are installed and ready
2. 🚀 Start both applications
3. 🧪 Test the complete VC request/approval workflow
4. 🎨 Customize styling if needed
5. 📱 Deploy to production when ready

---

## Support

If you encounter any issues:
1. Check Ganache is running
2. Verify contract address matches
3. Ensure MetaMask is on correct network
4. Check browser console for errors
5. Verify you have enough test ETH

**Everything is set up and ready to go! 🎉**
