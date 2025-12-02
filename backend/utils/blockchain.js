/**
 * Blockchain interaction utilities using ethers.js
 * Handles smart contract calls for IoT transactions
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract ABI
const contractABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../build/contracts/BankVC.json'), 'utf8')
).abi;

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.bankWallet = null;
  }

  /**
   * Initialize blockchain connection
   */
  async initialize() {
    try {
      // Connect to Ganache/Hardhat local network
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Initialize bank wallet with private key
      const bankPrivateKey = process.env.BANK_PRIVATE_KEY;
      if (!bankPrivateKey) {
        throw new Error('BANK_PRIVATE_KEY not found in environment variables');
      }
      this.bankWallet = new ethers.Wallet(bankPrivateKey, this.provider);

      // Initialize contract
      const contractAddress = process.env.CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('CONTRACT_ADDRESS not found in environment variables');
      }
      this.contract = new ethers.Contract(contractAddress, contractABI, this.bankWallet);

      console.log('✅ Blockchain service initialized');
      console.log('   Bank Address:', this.bankWallet.address);
      console.log('   Contract:', contractAddress);

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error.message);
      throw error;
    }
  }

  /**
   * Check if a VC is valid
   * @param {number} vcTokenId
   */
  async isValidVC(vcTokenId) {
    try {
      const isValid = await this.contract.isValidVC(vcTokenId);
      return isValid;
    } catch (error) {
      console.error('Error checking VC validity:', error);
      return false;
    }
  }

  /**
   * Get VC token owner
   * @param {number} vcTokenId
   */
  async getVCOwner(vcTokenId) {
    try {
      const owner = await this.contract.ownerOf(vcTokenId);
      return owner;
    } catch (error) {
      console.error('Error getting VC owner:', error);
      return null;
    }
  }

  /**
   * Get user balance
   * @param {string} userAddress
   */
  async getBalance(userAddress) {
    try {
      const balance = await this.contract.balance(userAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  /**
   * Process IoT deposit
   * Note: For deposits, the user must send ETH directly to the contract.
   * The bank cannot deposit on behalf of the user.
   * @param {string} userAddress
   * @param {number} amount - Amount in ETH
   */
  async processDeposit(userAddress, amount) {
    try {
      return {
        success: false,
        error: 'Deposits require user to sign transaction directly. Use frontend for deposits.'
      };
    } catch (error) {
      console.error('Deposit transaction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process IoT withdrawal
   * Note: For withdrawals, the user must sign transaction directly.
   * The bank cannot withdraw on behalf of the user (security measure).
   * @param {string} userAddress
   * @param {number} amount - Amount in ETH
   */
  async processWithdrawal(userAddress, amount) {
    try {
      return {
        success: false,
        error: 'Withdrawals require user to sign transaction directly. Use frontend for withdrawals.'
      };
    } catch (error) {
      console.error('Withdrawal transaction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process IoT transfer (Bank-authorized)
   * Bank acts as trusted intermediary for RFID card transactions
   * @param {string} fromAddress - User's wallet address
   * @param {string} toAddress - Merchant's address
   * @param {number} amount - Amount in ETH
   */
  async processTransfer(fromAddress, toAddress, amount) {
    try {
      const amountWei = ethers.parseEther(amount.toString());
      
      // Call bankAuthorizedTransfer - bank signs on behalf of verified cardholder
      const tx = await this.contract.bankAuthorizedTransfer(fromAddress, toAddress, amountWei, {
        gasLimit: 300000
      });

      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Transfer transaction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify access for IoT device
   * @param {string} userAddress
   * @param {number} vcTokenId
   */
  async verifyAccess(userAddress, vcTokenId) {
    try {
      // Check if VC is valid
      const isValid = await this.isValidVC(vcTokenId);
      if (!isValid) {
        return {
          success: false,
          message: 'VC is not valid or has been revoked'
        };
      }

      // Check if user owns the VC
      const owner = await this.getVCOwner(vcTokenId);
      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        return {
          success: false,
          message: 'User does not own this VC'
        };
      }

      // Get user balance
      const balance = await this.getBalance(userAddress);

      return {
        success: true,
        message: 'Access granted - VC is valid',
        userAddress,
        vcTokenId,
        balance
      };
    } catch (error) {
      console.error('Access verification failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;
