/**
 * Backend Server for Blockchain Banking IPFS Operations
 * 
 * This Express server provides secure endpoints for Pinata IPFS operations,
 * keeping API keys secure on the server side.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import {
  uploadJSONToPinata,
  uploadFileToPinata,
  uploadKYCMetadata,
  fetchFromIPFS,
  unpinFromPinata,
  getPinnedList,
  testAuthentication
} from './pinata.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:3002'];

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Blockchain Banking IPFS Service'
  });
});

/**
 * POST /api/upload/json
 * Upload JSON data to Pinata IPFS
 * 
 * Body:
 * {
 *   "data": { ... },
 *   "name": "optional-name"
 * }
 */
app.post('/api/upload/json', async (req, res) => {
  try {
    const { data, name } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'JSON data is required'
      });
    }

    const result = await uploadJSONToPinata(data, name);
    
    res.json(result);

  } catch (error) {
    console.error('Error in /api/upload/json:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/upload/file
 * Upload file to Pinata IPFS
 * 
 * Form data:
 * - file: File to upload
 * - name: Optional custom name
 */
app.post('/api/upload/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'File is required'
      });
    }

    const result = await uploadFileToPinata(
      req.file.buffer,
      req.file.originalname,
      req.body.name
    );
    
    res.json(result);

  } catch (error) {
    console.error('Error in /api/upload/file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/upload/kyc
 * Upload KYC metadata with proper VC structure
 * 
 * Body:
 * {
 *   "kycData": { ... },
 *   "userAddress": "0x..."
 * }
 */
app.post('/api/upload/kyc', async (req, res) => {
  try {
    const { kycData, userAddress } = req.body;

    if (!kycData || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'KYC data and user address are required'
      });
    }

    const result = await uploadKYCMetadata(kycData, userAddress);
    
    res.json(result);

  } catch (error) {
    console.error('Error in /api/upload/kyc:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/fetch/:cid
 * Fetch data from IPFS by CID
 */
app.get('/api/fetch/:cid', async (req, res) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      return res.status(400).json({
        success: false,
        error: 'CID is required'
      });
    }

    const data = await fetchFromIPFS(cid);
    
    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error in /api/fetch:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/unpin/:cid
 * Unpin content from Pinata (admin only)
 */
app.delete('/api/unpin/:cid', async (req, res) => {
  try {
    const { cid } = req.params;

    if (!cid) {
      return res.status(400).json({
        success: false,
        error: 'CID is required'
      });
    }

    const result = await unpinFromPinata(cid);
    
    res.json(result);

  } catch (error) {
    console.error('Error in /api/unpin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pinned
 * Get list of pinned items
 * 
 * Query params:
 * - status: 'pinned' | 'unpinned'
 * - pageLimit: number
 * - pageOffset: number
 */
app.get('/api/pinned', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      pageLimit: req.query.pageLimit ? parseInt(req.query.pageLimit) : 10,
      pageOffset: req.query.pageOffset ? parseInt(req.query.pageOffset) : 0
    };

    const result = await getPinnedList(filters);
    
    res.json(result);

  } catch (error) {
    console.error('Error in /api/pinned:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/test
 * Test Pinata authentication
 */
app.get('/api/test', async (req, res) => {
  try {
    const isAuthenticated = await testAuthentication();
    
    res.json({
      success: true,
      authenticated: isAuthenticated,
      message: isAuthenticated ? 'Pinata connection successful' : 'Pinata authentication failed'
    });

  } catch (error) {
    console.error('Error in /api/test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Blockchain Banking IPFS Server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test Pinata connection on startup
  testAuthentication()
    .then(isAuth => {
      if (isAuth) {
        console.log('✅ Pinata connection verified');
      } else {
        console.log('⚠️  Pinata authentication failed - check your credentials');
      }
    })
    .catch(err => {
      console.error('❌ Error testing Pinata connection:', err.message);
    });
});

export default app;
