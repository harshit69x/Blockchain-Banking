# 🎬 GETTING STARTED - Complete Walkthrough

Welcome! This guide will walk you through your first complete session with the Blockchain Banking SSI system.

---

## ⏱️ Time Required: 30 minutes

---

## 🎯 What You'll Accomplish

By the end of this guide, you will have:
- ✅ Deployed a working blockchain banking system
- ✅ Minted your first Verifiable Credential NFT
- ✅ Performed deposits and withdrawals
- ✅ Revoked a credential and seen it block deposits
- ✅ Monitored all events in the system

---

## 📚 Part 1: Initial Setup (10 minutes)

### Step 1: Open Ganache UI

1. Launch **Ganache** application
2. Click **"Quickstart"** (or create new workspace)
3. Verify the RPC Server shows: `HTTP://127.0.0.1:8545`
4. You should see 10 accounts with ~100 ETH each

**Screenshot moment**: You should see this:
```
ACCOUNTS
0x1234... 100.00 ETH
0x5678... 100.00 ETH
...
```

### Step 2: Install Project Dependencies

Open PowerShell in your project directory:

```powershell
# Navigate to project folder
cd "d:\Blockchain Banking"

# Run automated setup
.\setup.ps1
```

Wait for completion (2-3 minutes). You should see:
```
✓ Node.js found
✓ npm found
✓ Truffle found
✓ Root dependencies installed
✓ Frontend dependencies installed
✓ Contracts compiled successfully
```

### Step 3: Deploy Smart Contracts

```powershell
npm run migrate
```

**Look for this output**:
```
Deploying BankVC contract...
Bank address: 0x1234567890abcdef...
BankVC deployed at: 0xABCDEF1234567890...
BANK_ROLE hash: 0x...
Bank has BANK_ROLE: true
```

**🎯 IMPORTANT**: Copy the contract address (0xABCDEF...)

### Step 4: Configure MetaMask

#### A. Add Ganache Network

1. Open MetaMask
2. Click network dropdown (top)
3. Select **"Add Network"** → **"Add a network manually"**
4. Enter these details:

```
Network Name: Ganache Local
New RPC URL: http://127.0.0.1:8545
Chain ID: 1337
Currency Symbol: ETH
```

5. Click **"Save"**

#### B. Import Accounts

1. In Ganache, click the **key icon** next to the first account
2. Copy the **private key**
3. In MetaMask:
   - Click your profile icon
   - Select **"Import Account"**
   - Paste private key
   - Label it: **"Bank Account"**
4. Repeat for Account 2 and 3 (label them "User 1", "User 2")

**Verify**: You should now have 3 imported accounts in MetaMask, each with ~100 ETH

---

## 🖥️ Part 2: Launch Frontend (5 minutes)

### Step 5: Start the Application

```powershell
npm run dev
```

Wait for:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
```

### Step 6: Open in Browser

1. Open your browser (Chrome/Brave recommended)
2. Navigate to: **http://localhost:3000**
3. You should see the Blockchain Banking interface

**Screenshot moment**: Beautiful gradient background with header:
```
🏦 Blockchain Banking
SSI & Verifiable Credentials Platform
```

---

## 🏦 Part 3: Bank Operations (10 minutes)

### Step 7: Connect as Bank

1. Click **"🔐 Connect Wallet"** button
2. MetaMask popup appears
3. Select **"Bank Account"**
4. Click **"Connect"**
5. Verify you see **BANK** role badge

**Success indicator**: Address badge + BANK badge displayed

### Step 8: Mint Your First VC

Now you'll create a Verifiable Credential for User 1!

1. Make sure you're on the **"Mint VC"** tab
2. **User Address**: Go to Ganache, copy Account 1's address (0x...)
3. **KYC Data**: Open `examples/sample-kyc.json`, copy all contents
4. Paste into the KYC Data textarea
5. Click **"📤 Upload to IPFS"**

**Wait for**: IPFS CID displayed (QmTest...)

6. Click **"🎫 Mint VC NFT"**
7. MetaMask popup → Click **"Confirm"**

**Wait for**: 
- Transaction processing (few seconds)
- Success toast: "VC NFT minted successfully! Token ID: 1"

**🎉 Congratulations!** You just minted your first VC NFT!

### Step 9: Monitor the Event

1. Click **"Monitor Events"** tab
2. You should see the **VCIssued** event:

```
VCIssued
Token ID: #1
To: 0x... (Account 1)
IPFS CID: QmTest...
Block: 3 | TX: 0x1234...
```

---

## 👤 Part 4: User Operations (10 minutes)

### Step 10: Switch to User Account

1. Click **"🚪 Disconnect"** button
2. Click **"🔐 Connect Wallet"**
3. In MetaMask, select **"User 1"** (Account 1)
4. Click **"Connect"**
5. Verify you see **USER** role badge

### Step 11: View Your VC

Look at the **"Your Verifiable Credentials"** section.

You should see:

```
┌─────────────────────────┐
│ VC Token #1    ✓ Valid │
├─────────────────────────┤
│ Token URI: ipfs://Qm... │
│ Status: This credential │
│ is active and valid ✅  │
└─────────────────────────┘
```

**🎯 Perfect!** You now own a valid VC NFT.

### Step 12: Deposit ETH

Now let's bank some ETH!

1. Scroll to **"💰 Deposit ETH"** section
2. Enter amount: `0.01`
3. Click **"📥 Deposit"**
4. MetaMask popup → Click **"Confirm"**

**Wait for**:
- Transaction confirmation
- Success toast
- Balance updates to **0.01 ETH**

Check **"Transaction History"** - you should see:
```
📥 Deposit
Amount: 0.01 ETH
Balance After: 0.01 ETH
Block: 4 | TX: 0x...
```

### Step 13: Withdraw ETH

Let's withdraw some funds!

1. Go to **"💸 Withdraw ETH"** section
2. Enter amount: `0.005`
3. Click **"📤 Withdraw"**
4. MetaMask popup → Click **"Confirm"**

**Wait for**:
- Transaction confirmation
- Balance updates to **0.005 ETH**
- ETH returned to your wallet

**Verify**: Check MetaMask - your ETH balance should have increased slightly!

---

## 🚫 Part 5: Revocation Demo (5 minutes)

Now for the powerful part - credential revocation!

### Step 14: Switch Back to Bank

1. Disconnect wallet
2. Connect with **"Bank Account"**

### Step 15: Revoke the VC

1. Navigate to **"Revoke VC"** tab
2. Enter Token ID: `1`
3. Click **"🚫 Revoke VC"**
4. MetaMask → Confirm

**Wait for**: Success toast "VC #1 revoked successfully"

### Step 16: Verify Revocation

1. Go to **"Monitor Events"** tab
2. Click **"VC Revoked"** filter
3. You should see:

```
VCRevoked
Token ID: #1
Revoked By: 0x... (Bank)
Block: 6 | TX: 0x...
```

### Step 17: Test Blocked Deposit

Now the moment of truth - can the user still deposit?

1. Disconnect wallet
2. Connect with **"User 1"**
3. Check your VC status:

```
┌─────────────────────────┐
│ VC Token #1  ✗ Revoked │
├─────────────────────────┤
│ 🚫 This credential has  │
│ been revoked            │
└─────────────────────────┘
```

4. Try to deposit 0.01 ETH
5. Notice the **warning message** or **disabled button**
6. If button is enabled, transaction will fail with error

**🎉 Success!** The revocation is working! User cannot deposit anymore.

---

## 🎓 What You Just Learned

Congratulations! You've now:

✅ **Deployed** a blockchain banking smart contract
✅ **Minted** a Verifiable Credential NFT
✅ **Performed** decentralized banking operations
✅ **Revoked** credentials to enforce access control
✅ **Monitored** blockchain events in real-time

---

## 🔬 Part 6: Explore More (Optional)

### Advanced Testing

Try these scenarios:

#### Scenario A: Multiple Users
1. Mint VCs for User 2 and User 3
2. Have them deposit different amounts
3. Monitor events to see all activity

#### Scenario B: Pause Contract
1. As Bank, go to "Contract Control"
2. Click "⏸️ Pause Contract"
3. Switch to User
4. Try to deposit (should fail)
5. Switch to Bank, unpause
6. User can deposit again

#### Scenario C: Multiple VCs
1. Mint a second VC for User 1 (Token #2)
2. User now has 2 VCs
3. Revoke Token #1
4. User can still deposit with Token #2!

### Run Automated Tests

```powershell
# Test the contract
npm test

# Run the demo script
truffle exec scripts/demo.js

# Index all events
node scripts/indexEvents.js
```

---

## 🐛 Troubleshooting Common Issues

### Issue: "Contract not found"
**Solution**: 
```powershell
npm run migrate --reset
```

### Issue: "Cannot connect to Ganache"
**Solution**: 
- Ensure Ganache is running
- Check RPC Server is 127.0.0.1:8545
- Restart Ganache

### Issue: "Transaction failed"
**Solution**:
- Check you have enough ETH for gas
- Verify you have a valid VC (for deposits)
- Check contract isn't paused

### Issue: MetaMask shows wrong network
**Solution**:
- Switch to "Ganache Local" network
- If not listed, add it again with Chain ID 1337

### Issue: Frontend shows "0" balance but you deposited
**Solution**:
- Refresh the page
- Click the "🔄 Refresh" button
- Check you're connected with the correct account

---

## 📊 Verify Your Setup

Use this checklist:

- [ ] Ganache running with accounts
- [ ] Contract deployed successfully
- [ ] MetaMask connected to Ganache network
- [ ] 3+ accounts imported to MetaMask
- [ ] Frontend loads at localhost:3000
- [ ] Can connect wallet
- [ ] Bank role detected correctly
- [ ] Minted at least one VC
- [ ] Performed deposit
- [ ] Performed withdrawal
- [ ] Revoked a VC
- [ ] Saw events in monitor

**If all checked** ✅ → You're ready to go!

---

## 🚀 Next Steps

Now that you're up and running:

1. **Read the full docs**: Check `README.md` for advanced features
2. **Review the tests**: See `TESTING.md` for comprehensive scenarios
3. **Explore the code**: 
   - `contracts/BankVC.sol` - Smart contract
   - `frontend/src/pages/BankView.jsx` - Bank UI
   - `frontend/src/pages/UserView.jsx` - User UI
4. **Customize**: Try modifying the KYC data structure
5. **Extend**: Add new features to the contract

---

## 📚 Additional Resources

- **Architecture**: See `ARCHITECTURE.md` for system design
- **Testing**: See `TESTING.md` for test scenarios
- **Quick Reference**: See `QUICK_REFERENCE.md` for commands
- **Deployment**: See `DEPLOYMENT_CHECKLIST.md` for production

---

## 💡 Pro Tips

1. **Keep Ganache running** - Don't close it while developing
2. **Use Browser Console** - Check for errors if something doesn't work
3. **Reset MetaMask** - If transactions stuck, reset account in settings
4. **Clear Cache** - Refresh frontend with Ctrl+Shift+R if needed
5. **Save Private Keys** - Keep Ganache accounts for testing

---

## 🎉 You're All Set!

You now have a fully functional blockchain banking system with Self-Sovereign Identity!

**Happy Building!** 🏗️

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs in Ganache
3. Check browser console for errors
4. Verify MetaMask network settings
5. See main README.md for more details

**Remember**: This is a learning/development environment. For production, you'll need to deploy to a real network and integrate actual IPFS services!

---

**Built with ❤️ for decentralized banking**
