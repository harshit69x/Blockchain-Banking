/**
 * Pinata IPFS Upload Utility
 * 
 * This module handles uploading JSON metadata and files to IPFS via Pinata.
 * It provides functions for both JSON and file uploads with proper error handling.
 */

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

/**
 * Upload JSON metadata to Pinata IPFS
 * 
 * @param {Object} jsonData - The JSON object to upload (KYC data, VC metadata, etc.)
 * @param {string} name - Optional name for the pinned content
 * @returns {Promise<Object>} - Returns { IpfsHash, PinSize, Timestamp }
 */
export const uploadJSONToPinata = async (jsonData, name = 'VC-Metadata') => {
  try {
    // Validate input
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Invalid JSON data provided');
    }

    // Check if Pinata credentials are configured
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT not configured. Please check your .env file');
    }

    // Prepare the request body
    const data = JSON.stringify({
      pinataContent: jsonData,
      pinataMetadata: {
        name: name,
        keyvalues: {
          type: 'vc-metadata',
          timestamp: new Date().toISOString()
        }
      },
      pinataOptions: {
        cidVersion: 1 // Use CIDv1 for better compatibility
      }
    });

    // Make the API request
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: data
    });

    // Check if request was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata API error: ${errorData.error || response.statusText}`);
    }

    // Parse and return the response
    const result = await response.json();
    
    console.log('✅ Successfully uploaded to Pinata IPFS:', result.IpfsHash);
    
    return {
      IpfsHash: result.IpfsHash,
      PinSize: result.PinSize,
      Timestamp: result.Timestamp,
      url: `${PINATA_GATEWAY}/ipfs/${result.IpfsHash}`
    };

  } catch (error) {
    console.error('❌ Error uploading JSON to Pinata:', error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
};

/**
 * Upload a file to Pinata IPFS
 * 
 * @param {File} file - The file object to upload
 * @param {string} name - Optional name for the pinned content
 * @returns {Promise<Object>} - Returns { IpfsHash, PinSize, Timestamp }
 */
export const uploadFileToPinata = async (file, name = null) => {
  try {
    // Validate input
    if (!file) {
      throw new Error('No file provided');
    }

    // Check if Pinata credentials are configured
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT not configured. Please check your .env file');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const metadata = JSON.stringify({
      name: name || file.name,
      keyvalues: {
        type: 'vc-attachment',
        originalName: file.name,
        timestamp: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Add options
    const options = JSON.stringify({
      cidVersion: 1
    });
    formData.append('pinataOptions', options);

    // Make the API request
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    });

    // Check if request was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata API error: ${errorData.error || response.statusText}`);
    }

    // Parse and return the response
    const result = await response.json();
    
    console.log('✅ Successfully uploaded file to Pinata IPFS:', result.IpfsHash);
    
    return {
      IpfsHash: result.IpfsHash,
      PinSize: result.PinSize,
      Timestamp: result.Timestamp,
      url: `${PINATA_GATEWAY}/ipfs/${result.IpfsHash}`
    };

  } catch (error) {
    console.error('❌ Error uploading file to Pinata:', error);
    throw new Error(`Failed to upload file to IPFS: ${error.message}`);
  }
};

/**
 * Upload KYC metadata (optimized for VC workflow)
 * 
 * @param {Object} kycData - The KYC data object
 * @param {string} userAddress - The user's Ethereum address
 * @returns {Promise<string>} - Returns the IPFS CID
 */
export const uploadKYCMetadata = async (kycData, userAddress) => {
  try {
    // Validate KYC data
    if (!kycData) {
      throw new Error('KYC data is required');
    }

    // Create metadata structure
    const metadata = {
      version: '1.0',
      type: 'VerifiableCredential',
      issuer: 'Blockchain Bank',
      issuedTo: userAddress,
      issuedAt: new Date().toISOString(),
      credentialSubject: kycData,
      proof: {
        type: 'EthereumEip712Signature2021',
        created: new Date().toISOString(),
        verificationMethod: userAddress
      }
    };

    // Upload to IPFS
    const result = await uploadJSONToPinata(
      metadata, 
      `VC-${userAddress.substring(0, 10)}-${Date.now()}`
    );

    // Return just the CID for contract interaction
    return result.IpfsHash;

  } catch (error) {
    console.error('❌ Error uploading KYC metadata:', error);
    throw error;
  }
};

/**
 * Fetch metadata from IPFS via Pinata Gateway
 * 
 * @param {string} cid - The IPFS CID to fetch
 * @returns {Promise<Object>} - Returns the parsed JSON data
 */
export const fetchFromIPFS = async (cid) => {
  try {
    if (!cid) {
      throw new Error('CID is required');
    }

    // Try Pinata gateway first
    let url = `${PINATA_GATEWAY}/ipfs/${cid}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      // Fallback to public gateway
      url = `https://ipfs.io/ipfs/${cid}`;
      const fallbackResponse = await fetch(url);
      
      if (!fallbackResponse.ok) {
        throw new Error('Failed to fetch from IPFS');
      }
      
      return await fallbackResponse.json();
    }

    return await response.json();

  } catch (error) {
    console.error('❌ Error fetching from IPFS:', error);
    throw new Error(`Failed to fetch metadata: ${error.message}`);
  }
};

/**
 * Unpin content from Pinata (admin only)
 * 
 * @param {string} cid - The IPFS CID to unpin
 * @returns {Promise<void>}
 */
export const unpinFromPinata = async (cid) => {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT not configured');
    }

    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to unpin from Pinata');
    }

    console.log('✅ Successfully unpinned:', cid);

  } catch (error) {
    console.error('❌ Error unpinning from Pinata:', error);
    throw error;
  }
};

/**
 * Get pinned content list from Pinata
 * 
 * @param {Object} filters - Optional filters (status, metadata, etc.)
 * @returns {Promise<Array>} - Returns array of pinned items
 */
export const getPinnedList = async (filters = {}) => {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT not configured');
    }

    // Build query parameters
    const params = new URLSearchParams({
      status: filters.status || 'pinned',
      pageLimit: filters.pageLimit || 10,
      ...filters
    });

    const response = await fetch(`https://api.pinata.cloud/data/pinList?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get pinned list');
    }

    const result = await response.json();
    return result.rows || [];

  } catch (error) {
    console.error('❌ Error getting pinned list:', error);
    throw error;
  }
};

/**
 * Check Pinata configuration status
 * 
 * @returns {boolean} - Returns true if configured correctly
 */
export const isPinataConfigured = () => {
  return !!(PINATA_API_KEY && PINATA_SECRET_KEY && PINATA_JWT);
};

/**
 * Test Pinata connection
 * 
 * @returns {Promise<boolean>} - Returns true if connection is successful
 */
export const testPinataConnection = async () => {
  try {
    if (!PINATA_JWT) {
      return false;
    }

    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    return response.ok;

  } catch (error) {
    console.error('❌ Pinata connection test failed:', error);
    return false;
  }
};

// Export all functions
export default {
  uploadJSONToPinata,
  uploadFileToPinata,
  uploadKYCMetadata,
  fetchFromIPFS,
  unpinFromPinata,
  getPinnedList,
  isPinataConfigured,
  testPinataConnection
};
