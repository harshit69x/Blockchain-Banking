/**
 * Utility functions for hashing sensitive documents and data
 * Uses SHA-256 for secure one-way hashing
 */

/**
 * Hash a file using SHA-256
 * @param {File} file - The file to hash
 * @returns {Promise<string>} - Hex string of the hash
 */
export const hashFile = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Error hashing file:', error);
    throw new Error('Failed to hash file');
  }
};

/**
 * Hash a string using SHA-256
 * @param {string} text - The text to hash
 * @returns {Promise<string>} - Hex string of the hash
 */
export const hashString = async (text) => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Error hashing string:', error);
    throw new Error('Failed to hash string');
  }
};

/**
 * Hash an ID number (PAN, Aadhar, etc.) with salt
 * @param {string} idNumber - The ID number to hash
 * @param {string} idType - Type of ID (PAN, AADHAR, PASSPORT, etc.)
 * @returns {Promise<Object>} - Object with hash and metadata
 */
export const hashIDNumber = async (idNumber, idType) => {
  try {
    // Add salt based on ID type for additional security
    const salt = `${idType}_BANKING_VC`;
    const saltedID = `${salt}_${idNumber}`;
    const hash = await hashString(saltedID);
    
    return {
      idType,
      hash,
      timestamp: new Date().toISOString(),
      algorithm: 'SHA-256'
    };
  } catch (error) {
    console.error('Error hashing ID:', error);
    throw new Error('Failed to hash ID number');
  }
};

/**
 * Verify if a plain ID matches a hash
 * @param {string} plainID - The plain text ID
 * @param {string} idType - Type of ID
 * @param {string} storedHash - The stored hash to compare
 * @returns {Promise<boolean>} - True if matches
 */
export const verifyIDHash = async (plainID, idType, storedHash) => {
  try {
    const { hash } = await hashIDNumber(plainID, idType);
    return hash === storedHash;
  } catch (error) {
    console.error('Error verifying hash:', error);
    return false;
  }
};

/**
 * Extract file metadata without storing the file
 * @param {File} file - The file
 * @returns {Object} - Metadata object
 */
export const getFileMetadata = (file) => {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString()
  };
};

export default {
  hashFile,
  hashString,
  hashIDNumber,
  verifyIDHash,
  getFileMetadata
};
