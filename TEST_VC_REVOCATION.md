# Testing VC Revocation - Step by Step

## Setup
Ensure both frontends are running:
- Bank Admin: http://localhost:3001
- User Panel: http://localhost:3002

## Test Scenario: Revoke One User's VC

### Step 1: Create Two Users with VCs
**User #1:**
1. Open http://localhost:3002
2. Connect with Account #2
3. Go to "Verification" tab
4. Request VC with KYC data
5. Wait for bank approval
6. Status should show "Active ✅"

**User #2:**
1. Open http://localhost:3002 in different browser/incognito
2. Connect with Account #3
3. Go to "Verification" tab
4. Request VC with KYC data
5. Wait for bank approval
6. Status should show "Active ✅"

### Step 2: Verify Both VCs in Bank Dashboard
1. Open http://localhost:3001
2. Connect with Account #1 (deployer)
3. Scroll down to "Issued VCs Management"
4. You should see 2 VCs:
   - VC #1: User #2 - Status: "✅ Active"
   - VC #2: User #3 - Status: "✅ Active"

### Step 3: Revoke User #1's VC (Account #2)
1. In Bank Dashboard, find the VC for Account #2
2. Click the "Revoke" button
3. Confirm transaction in MetaMask
4. Wait for transaction to complete

### Step 4: Verify Revocation
**In Bank Dashboard:**
- VC #1 (User #2): Should now show "❌ Revoked"
- VC #2 (User #3): Should still show "✅ Active"

**In User #1 Panel (Account #2):**
- Status should show "⛔ VC Revoked"
- Cannot perform transactions

**In User #2 Panel (Account #3):**
- Status should show "✅ VC Active (ID: #...)"
- CAN perform transactions

### Step 5: Verify User #2 Can Still Transact
1. Go to User #2 panel (Account #3)
2. Go to "Banking" tab
3. Deposit 1 ETH - should work ✅
4. Go to "Transfer" tab
5. Try to transfer to another user with VC - should work ✅

### Step 6: Verify User #1 Cannot Transact
1. Go to User #1 panel (Account #2)
2. Go to "Banking" tab
3. Deposit 1 ETH - should fail ❌
4. Go to "Transfer" tab
5. Try to transfer - should fail ❌
6. Should see message: "You need an active VC to transfer"

## Expected Results

| Check | Expected | Status |
|-------|----------|--------|
| Revoke one VC doesn't affect others | User #1 revoked, User #2 active | ✓ |
| Bank Dashboard shows correct status | Only User #1 shows revoked | ✓ |
| User #1 Panel shows revoked | Shows "⛔ VC Revoked" | ✓ |
| User #2 Panel shows active | Shows "✅ VC Active" | ✓ |
| User #1 cannot deposit | Transaction fails | ✓ |
| User #1 cannot transfer | Transaction fails | ✓ |
| User #2 can deposit | Transaction succeeds | ✓ |
| User #2 can transfer | Transaction succeeds | ✓ |

## Troubleshooting

### Issue: Still showing all VCs as revoked
**Solution:** 
1. Hard refresh browser: Ctrl+Shift+R
2. Check browser console for errors
3. Verify contract is deployed
4. Restart frontends:
   ```powershell
   Get-Process node | Stop-Process -Force
   cd frontend-bank; npm run dev
   cd frontend-user; npm run dev
   ```

### Issue: VCs showing as active when they should be revoked
**Solution:**
1. Check Ganache is running
2. Verify you're revoking the correct token
3. Check browser console for "Error loading issued VCs"
4. Verify Bank Admin Dashboard is using correct contract address

### Issue: Revoke button not working
**Solution:**
1. Make sure you're logged in as Account #1 (has BANK_ROLE)
2. Make sure you have ETH to pay for gas
3. Check MetaMask for transaction errors
4. Check browser console for JavaScript errors

## Console Debugging

Open browser DevTools (F12) and check console for:

```javascript
// User Panel - VC Status Check
=== VC Status Check ===
Account: 0x...
TokenId from contract: 1
Token ID: 1
isValid: true
isTokenRevoked: false
Setting status to HAS-VC

// Bank Dashboard - Issued VCs
// Should show isValid: true or false (not owner comparison)
```

## Quick Reference

**To Revoke a VC:**
1. Bank Admin Dashboard
2. Scroll to "Issued VCs Management"
3. Find the VC to revoke
4. Click "Revoke" button
5. Confirm transaction

**To Request a VC:**
1. User Panel
2. Go to "Verification" tab
3. Enter KYC data
4. Click "Request VC"
5. Wait for bank approval

**To Check VC Status:**
1. User Panel - Overview tab shows status
2. Bank Dashboard - "Issued VCs Management" section shows all VCs
