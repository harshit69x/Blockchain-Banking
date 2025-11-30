# 📌 Pinata IPFS Integration Guide

## 🎯 Overview

This guide covers the complete Pinata IPFS integration for the Blockchain Banking project. The integration enables secure, decentralized storage of KYC metadata and Verifiable Credentials.

---

## 📦 What's Included

### Frontend (Bank Admin)
- `frontend-bank/src/utils/pinataUpload.js` - Complete Pinata upload utilities
- `frontend-bank/.env` - Pinata API credentials

### Backend (Optional - For Enhanced Security)
- `backend/pinata.js` - Server-side Pinata operations
- `backend/server.js` - Express REST API for IPFS operations
- `backend/package.json` - Backend dependencies
- `backend/.env` - Backend configuration

### Configuration
- `.env.example` - Template for environment variables

---

## 🚀 Quick Start

### Option 1: Frontend-Only (Simpler)

#### 1. Environment Setup
The `.env` file in `frontend-bank/` is already configured with your Pinata credentials:

```env
VITE_PINATA_JWT=your_jwt_token_here
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud
```

#### 2. Use in Bank Dashboard
The integration is ready to use. Just import and use:

```javascript
import { uploadKYCMetadata } from '../utils/pinataUpload';

// In your VC approval handler
const handleApproveRequest = async (request) => {
  try {
    // Parse KYC data
    const kycData = JSON.parse(request.kycData);
    
    // Upload to IPFS via Pinata
    const ipfsCID = await uploadKYCMetadata(kycData, request.requester);
    
    // Approve VC with the CID
    await contract.methods
      .approveVCRequest(request.id, ipfsCID)
      .send({ from: account });
    
    console.log('VC issued with IPFS CID:', ipfsCID);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Option 2: Backend API (More Secure)

#### 1. Install Backend Dependencies
```powershell
cd backend
npm install
```

#### 2. Start Backend Server
```powershell
cd backend
npm start
```

Server will run on `http://localhost:5000`

#### 3. Use Backend API from Frontend
```javascript
// Upload via backend API
const uploadToIPFS = async (kycData, userAddress) => {
  const response = await fetch('http://localhost:5000/api/upload/kyc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kycData, userAddress })
  });
  
  const result = await response.json();
  return result.IpfsHash;
};
```

---

## 📚 Available Functions

### Frontend (`pinataUpload.js`)

#### `uploadKYCMetadata(kycData, userAddress)`
Upload KYC metadata with proper VC structure.

```javascript
const cid = await uploadKYCMetadata(
  { name: "John Doe", dob: "1990-01-01" },
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
);
// Returns: "QmXxxx..."
```

#### `uploadJSONToPinata(jsonData, name)`
Upload any JSON data to IPFS.

```javascript
const result = await uploadJSONToPinata(
  { key: "value" },
  "my-data"
);
// Returns: { IpfsHash, PinSize, Timestamp, url }
```

#### `uploadFileToPinata(file, name)`
Upload files (images, PDFs, etc.) to IPFS.

```javascript
const result = await uploadFileToPinata(fileObject, "kyc-document");
```

#### `fetchFromIPFS(cid)`
Retrieve data from IPFS.

```javascript
const data = await fetchFromIPFS("QmXxxx...");
```

#### `testPinataConnection()`
Test if Pinata is configured correctly.

```javascript
const isConfigured = await testPinataConnection();
console.log('Pinata ready:', isConfigured);
```

### Backend API Endpoints

#### `POST /api/upload/json`
```javascript
fetch('http://localhost:5000/api/upload/json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: { key: "value" },
    name: "optional-name"
  })
});
```

#### `POST /api/upload/kyc`
```javascript
fetch('http://localhost:5000/api/upload/kyc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    kycData: { name: "John" },
    userAddress: "0x..."
  })
});
```

#### `GET /api/fetch/:cid`
```javascript
fetch('http://localhost:5000/api/fetch/QmXxxx...');
```

#### `GET /api/test`
```javascript
fetch('http://localhost:5000/api/test');
```

---

## 🔧 Integration with Existing Dashboard

### Update `DashboardNew.jsx` (Bank Admin)

Replace the hardcoded IPFS CID input with actual Pinata upload:

```javascript
import { uploadKYCMetadata, testPinataConnection } from '../utils/pinataUpload';
import { useEffect, useState } from 'react';

function DashboardNew({ web3, account, contract, showToast }) {
  const [pinataReady, setPinataReady] = useState(false);
  
  // Test Pinata on load
  useEffect(() => {
    testPinataConnection().then(setPinataReady);
  }, []);
  
  const handleApproveRequest = async (request) => {
    if (!pinataReady) {
      showToast('Pinata IPFS not configured', 'error');
      return;
    }
    
    setLoading(true);
    try {
      // Parse KYC data
      const kycData = JSON.parse(request.kycData);
      
      // Upload to IPFS via Pinata
      showToast('Uploading to IPFS...', 'info');
      const ipfsCID = await uploadKYCMetadata(kycData, request.requester);
      
      showToast(`Uploaded to IPFS: ${ipfsCID.substring(0, 10)}...`, 'success');
      
      // Approve VC with the CID
      await contract.methods
        .approveVCRequest(request.id, ipfsCID)
        .send({ from: account });
      
      showToast('VC Request approved successfully!', 'success');
      setSelectedRequest(null);
      await loadDashboardData();
      
    } catch (error) {
      console.error('Error approving request:', error);
      showToast('Failed to approve request', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Remove the ipfsCID state and input field
  // The CID is now generated automatically
}
```

### Remove Manual CID Input

In your VC approval UI, **remove** this:
```javascript
const [ipfsCID, setIpfsCID] = useState('');

// Remove this input:
<input
  type="text"
  value={ipfsCID}
  onChange={(e) => setIpfsCID(e.target.value)}
  placeholder="QmXxxx..."
/>
```

The system now automatically uploads to IPFS and gets the CID!

---

## 🎨 Enhanced UI with IPFS Status

Add visual feedback for IPFS operations:

```javascript
{pinataReady ? (
  <div className="flex items-center gap-2 text-green-600">
    <CheckCircle className="w-4 h-4" />
    IPFS Ready
  </div>
) : (
  <div className="flex items-center gap-2 text-orange-600">
    <AlertCircle className="w-4 h-4" />
    IPFS Not Configured
  </div>
)}
```

---

## 📋 Complete Workflow Example

### 1. User Requests VC
```javascript
// User submits KYC data
const kycData = {
  name: "John Doe",
  dob: "1990-01-01",
  address: "123 Main St",
  ssn: "XXX-XX-1234"
};

await contract.methods
  .requestVC(JSON.stringify(kycData))
  .send({ from: userAddress });
```

### 2. Bank Reviews and Approves
```javascript
// Bank admin approves
const request = await contract.methods.vcRequests(requestId).call();
const kycData = JSON.parse(request.kycData);

// Upload to IPFS automatically
const ipfsCID = await uploadKYCMetadata(kycData, request.requester);

// Mint VC NFT with IPFS CID
await contract.methods
  .approveVCRequest(requestId, ipfsCID)
  .send({ from: bankAddress });
```

### 3. User Receives VC
```javascript
// User can now access their VC
const tokenId = await contract.methods.userToTokenId(userAddress).call();
const tokenURI = await contract.methods.tokenURI(tokenId).call();

// Fetch metadata from IPFS
const metadata = await fetchFromIPFS(tokenURI);
console.log('My VC:', metadata);
```

---

## 🔒 Security Best Practices

### Frontend-Only Approach
✅ **Pros**: Simple setup, no backend needed
⚠️ **Cons**: API keys exposed in frontend

**Recommendation**: Fine for development and testing.

### Backend API Approach
✅ **Pros**: API keys secure on server
✅ **Pros**: Better for production
⚠️ **Cons**: Requires running backend server

**Recommendation**: Use for production deployment.

### Environment Variables
- ✅ Never commit `.env` files to Git
- ✅ Use different credentials for dev/prod
- ✅ Rotate API keys periodically
- ✅ Monitor Pinata usage limits

---

## 🧪 Testing

### Test Pinata Connection
```powershell
cd backend
npm start
```

Then visit: `http://localhost:5000/api/test`

Expected response:
```json
{
  "success": true,
  "authenticated": true,
  "message": "Pinata connection successful"
}
```

### Test JSON Upload
```javascript
import { uploadJSONToPinata } from './utils/pinataUpload';

const testUpload = async () => {
  const result = await uploadJSONToPinata(
    { test: "data" },
    "test-upload"
  );
  console.log('CID:', result.IpfsHash);
  console.log('URL:', result.url);
};

testUpload();
```

### Test with Real VC Flow
1. Start Ganache
2. Deploy contract
3. Start frontend: `npm run dev`
4. Request VC as user
5. Approve VC as bank (will upload to IPFS automatically)
6. Check console for IPFS CID
7. Verify on Pinata dashboard: https://app.pinata.cloud/pinmanager

---

## 📊 Pinata Dashboard

Monitor your uploads:
- **URL**: https://app.pinata.cloud
- **Pin Manager**: View all uploaded files
- **Gateway**: Access files via `https://gateway.pinata.cloud/ipfs/[CID]`
- **Analytics**: Track usage and bandwidth

---

## 🛠️ Troubleshooting

### Error: "Pinata JWT not configured"
- Check `.env` file exists in `frontend-bank/`
- Verify `VITE_PINATA_JWT` is set
- Restart dev server after changing `.env`

### Error: "Failed to upload to IPFS"
- Test Pinata connection: Call `testPinataConnection()`
- Check API keys are valid
- Verify you haven't exceeded Pinata limits
- Check network connectivity

### Error: "Failed to fetch from IPFS"
- CID might be incorrect
- Gateway might be temporarily down
- Try alternate gateway: `https://ipfs.io/ipfs/[CID]`

### CORS Errors (Backend)
- Check `ALLOWED_ORIGINS` in backend `.env`
- Ensure frontend URL is in allowed origins
- Restart backend server

---

## 📈 Performance Tips

### 1. Caching
Cache fetched IPFS data to avoid repeated requests:
```javascript
const ipfsCache = new Map();

const fetchFromIPFSCached = async (cid) => {
  if (ipfsCache.has(cid)) {
    return ipfsCache.get(cid);
  }
  const data = await fetchFromIPFS(cid);
  ipfsCache.set(cid, data);
  return data;
};
```

### 2. Batch Uploads
Upload multiple files efficiently:
```javascript
const uploadBatch = async (files) => {
  return Promise.all(
    files.map(file => uploadFileToPinata(file))
  );
};
```

### 3. Use Pinata Gateway
Always use Pinata's dedicated gateway for faster access:
```
https://gateway.pinata.cloud/ipfs/[CID]
```

---

## 🎓 Next Steps

1. ✅ **Test Integration**: Upload a test VC and verify on Pinata
2. ✅ **Update Dashboard**: Replace manual CID input with automatic upload
3. ✅ **Monitor Usage**: Check Pinata dashboard for uploads
4. 🔜 **Add File Uploads**: Allow users to upload KYC documents
5. 🔜 **Implement Caching**: Add IPFS data caching
6. 🔜 **Error Handling**: Add retry logic for failed uploads
7. 🔜 **Production Setup**: Use backend API for production

---

## 📞 Support

### Pinata Resources
- Documentation: https://docs.pinata.cloud
- API Reference: https://docs.pinata.cloud/api-reference
- Support: support@pinata.cloud

### Project Issues
- Check console for error messages
- Verify environment variables
- Test Pinata connection first
- Review this documentation

---

**🎉 You're all set! The Pinata IPFS integration is ready to use.**

Start approving VCs and they'll automatically be stored on IPFS! 🚀
