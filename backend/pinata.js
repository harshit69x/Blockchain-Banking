/**
 * Pinata IPFS Backend Service
 * 
 * This module provides secure server-side operations for Pinata IPFS.
 * Keeps API keys secure on the backend and provides REST endpoints.
 */

import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';

/**
 * Upload JSON to Pinata IPFS (server-side)
 * 
 * @param {Object} jsonData - JSON data to upload
 * @param {string} name - Name for the pinned content
 * @returns {Promise<Object>} - Pinata response with IpfsHash
 */
export const uploadJSONToPinata = async (jsonData, name = 'VC-Metadata') => {
  try {
    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    
    const data = {
      pinataContent: jsonData,
      pinataMetadata: {
        name: name,
        keyvalues: {
          type: 'vc-metadata',
          timestamp: new Date().toISOString()
        }
      },
      pinataOptions: {
        cidVersion: 1
      }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    console.log('✅ JSON uploaded to Pinata:', response.data.IpfsHash);

    return {
      success: true,
      IpfsHash: response.data.IpfsHash,
      PinSize: response.data.PinSize,
      Timestamp: response.data.Timestamp,
      url: `${PINATA_GATEWAY}/ipfs/${response.data.IpfsHash}`
    };

  } catch (error) {
    console.error('❌ Error uploading JSON to Pinata:', error.response?.data || error.message);
    throw new Error(`Pinata upload failed: ${error.response?.data?.error || error.message}`);
  }
};

/**
 * Upload file to Pinata IPFS (server-side)
 * 
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original filename
 * @param {string} name - Name for the pinned content
 * @returns {Promise<Object>} - Pinata response with IpfsHash
 */
export const uploadFileToPinata = async (fileBuffer, fileName, name = null) => {
  try {
    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    
    const formData = new FormData();
    formData.append('file', fileBuffer, fileName);

    const metadata = JSON.stringify({
      name: name || fileName,
      keyvalues: {
        type: 'vc-attachment',
        originalName: fileName,
        timestamp: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      maxBodyLength: Infinity
    });

    console.log('✅ File uploaded to Pinata:', response.data.IpfsHash);

    return {
      success: true,
      IpfsHash: response.data.IpfsHash,
      PinSize: response.data.PinSize,
      Timestamp: response.data.Timestamp,
      url: `${PINATA_GATEWAY}/ipfs/${response.data.IpfsHash}`
    };

  } catch (error) {
    console.error('❌ Error uploading file to Pinata:', error.response?.data || error.message);
    throw new Error(`Pinata file upload failed: ${error.response?.data?.error || error.message}`);
  }
};

/**
 * Upload KYC metadata with proper structure
 * 
 * @param {Object} kycData - KYC data object
 * @param {string} userAddress - User's Ethereum address
 * @returns {Promise<Object>} - Pinata response
 */
export const uploadKYCMetadata = async (kycData, userAddress) => {
  try {
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

    const result = await uploadJSONToPinata(
      metadata,
      `VC-${userAddress.substring(0, 10)}-${Date.now()}`
    );

    return result;

  } catch (error) {
    console.error('❌ Error uploading KYC metadata:', error);
    throw error;
  }
};

/**
 * Fetch data from IPFS
 * 
 * @param {string} cid - IPFS CID
 * @returns {Promise<Object>} - IPFS data
 */
export const fetchFromIPFS = async (cid) => {
  try {
    const url = `${PINATA_GATEWAY}/ipfs/${cid}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    // Try public gateway as fallback
    try {
      const fallbackUrl = `https://ipfs.io/ipfs/${cid}`;
      const fallbackResponse = await axios.get(fallbackUrl);
      return fallbackResponse.data;
    } catch (fallbackError) {
      console.error('❌ Error fetching from IPFS:', error.message);
      throw new Error('Failed to fetch from IPFS');
    }
  }
};

/**
 * Unpin content from Pinata
 * 
 * @param {string} cid - IPFS CID to unpin
 * @returns {Promise<Object>} - Success response
 */
export const unpinFromPinata = async (cid) => {
  try {
    const url = `https://api.pinata.cloud/pinning/unpin/${cid}`;
    
    await axios.delete(url, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    console.log('✅ Unpinned from Pinata:', cid);

    return {
      success: true,
      message: 'Successfully unpinned',
      cid
    };

  } catch (error) {
    console.error('❌ Error unpinning from Pinata:', error.response?.data || error.message);
    throw new Error(`Unpin failed: ${error.response?.data?.error || error.message}`);
  }
};

/**
 * Get list of pinned items
 * 
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} - List of pinned items
 */
export const getPinnedList = async (filters = {}) => {
  try {
    const url = 'https://api.pinata.cloud/data/pinList';
    
    const params = {
      status: filters.status || 'pinned',
      pageLimit: filters.pageLimit || 10,
      pageOffset: filters.pageOffset || 0,
      ...filters
    };

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      params
    });

    return {
      success: true,
      count: response.data.count,
      rows: response.data.rows
    };

  } catch (error) {
    console.error('❌ Error getting pinned list:', error.response?.data || error.message);
    throw new Error(`Failed to get pinned list: ${error.response?.data?.error || error.message}`);
  }
};

/**
 * Test Pinata authentication
 * 
 * @returns {Promise<boolean>} - Authentication status
 */
export const testAuthentication = async () => {
  try {
    const url = 'https://api.pinata.cloud/data/testAuthentication';
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    console.log('✅ Pinata authentication successful:', response.data.message);
    return true;

  } catch (error) {
    console.error('❌ Pinata authentication failed:', error.response?.data || error.message);
    return false;
  }
};

export default {
  uploadJSONToPinata,
  uploadFileToPinata,
  uploadKYCMetadata,
  fetchFromIPFS,
  unpinFromPinata,
  getPinnedList,
  testAuthentication
};
