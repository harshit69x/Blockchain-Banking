/**
 * IoT API Routes
 * Handles RFID card transactions and device communication
 */

import express from 'express';
import rfidCardDB from '../models/RFIDCard.js';
import blockchainService from '../utils/blockchain.js';

const router = express.Router();

/**
 * Pending transactions storage (in-memory)
 * Maps transactionId -> { amount, merchantAddress, customerAddress, status, result }
 */
const pendingTransactions = new Map();

/**
 * Middleware: Verify device API key
 */
const verifyDeviceAuth = (req, res, next) => {
  const apiKey = req.headers['x-device-api-key'];
  const validKey = process.env.IOT_DEVICE_API_KEY;

  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized device'
    });
  }

  next();
};

/**
 * POST /api/iot/transaction
 * Process IoT transaction from ESP8266
 */
router.post('/transaction', verifyDeviceAuth, async (req, res) => {
  try {
    const { cardToken, cardUID, deviceId, transactionType, amount, toAddress } = req.body;
    const cardIdentifier = cardUID || cardToken; // Support both UID and token

    // Validate request
    if (!cardIdentifier || !deviceId || !transactionType) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: cardUID (or cardToken), deviceId, transactionType'
      });
    }

    // Look up RFID card
    const card = rfidCardDB.getCard(cardIdentifier);
    if (!card) {
      return res.status(404).json({
        status: 'error',
        message: 'Card UID not registered. Please register in bank dashboard first.',
        cardUID: cardIdentifier
      });
    }

    // Check if card is active
    if (!card.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Card is deactivated',
        cardToken
      });
    }

    // Verify VC validity
    const isValid = await blockchainService.isValidVC(card.vcTokenId);
    if (!isValid) {
      return res.status(403).json({
        status: 'error',
        message: 'VC is not valid or has been revoked',
        vcTokenId: card.vcTokenId
      });
    }

    // Check for pending transactions for this wallet
    let pendingTx = null;
    for (const [txId, tx] of pendingTransactions.entries()) {
      if (tx.customerAddress && 
          tx.customerAddress.toLowerCase() === card.walletAddress.toLowerCase() && 
          tx.status === 'pending') {
        pendingTx = { id: txId, ...tx };
        console.log(`🔗 Found pending transaction ${pendingTx.id}: ${tx.amount} ETH → ${tx.merchantAddress}`);
        break;
      }
    }

    // Override transaction parameters if pending transaction exists
    let effectiveTransactionType = transactionType;
    let effectiveAmount = amount;
    let effectiveToAddress = toAddress;

    if (pendingTx) {
      effectiveTransactionType = 'TRANSFER';
      effectiveAmount = pendingTx.amount;
      effectiveToAddress = pendingTx.merchantAddress;
      console.log(`⚠️  OVERRIDING transaction type: ${transactionType} → TRANSFER (${effectiveAmount} ETH → ${effectiveToAddress})`);
    } else {
      console.log(`📋 No pending transaction for ${card.walletAddress}, processing as ${transactionType}`);
    }

    // Process transaction based on type
    let result;
    const userAddress = card.walletAddress;

    switch (effectiveTransactionType.toUpperCase()) {
      case 'DEPOSIT':
        if (!effectiveAmount || effectiveAmount <= 0) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid deposit amount'
          });
        }
        result = await blockchainService.processDeposit(userAddress, effectiveAmount);
        break;

      case 'WITHDRAW':
        if (!effectiveAmount || effectiveAmount <= 0) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid withdrawal amount'
          });
        }
        result = await blockchainService.processWithdrawal(userAddress, effectiveAmount);
        break;

      case 'TRANSFER':
        if (!effectiveAmount || effectiveAmount <= 0 || !effectiveToAddress) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid transfer parameters'
          });
        }
        result = await blockchainService.processTransfer(userAddress, effectiveToAddress, effectiveAmount);
        break;

      case 'VERIFY':
        result = await blockchainService.verifyAccess(userAddress, card.vcTokenId);
        break;

      default:
        return res.status(400).json({
          status: 'error',
          message: 'Invalid transaction type. Use DEPOSIT, WITHDRAW, TRANSFER, or VERIFY'
        });
    }

    // Update card last used
    rfidCardDB.updateLastUsed(cardIdentifier);

    // Get updated balance
    const balance = await blockchainService.getBalance(userAddress);

    // If this was a pending transaction, mark it as completed
    if (pendingTx) {
      pendingTransactions.set(pendingTx.id, {
        ...pendingTx,
        status: 'completed',
        result: {
          status: 'success',
          txHash: result.txHash,
          amount: effectiveAmount,
          balance,
          timestamp: new Date().toISOString()
        }
      });
      console.log(`✅ Pending transaction ${pendingTx.id} completed`);
    }

    // Return response
    if (result.success) {
      return res.json({
        status: 'success',
        transactionType: effectiveTransactionType,
        txHash: result.txHash,
        userAddress,
        vcTokenId: card.vcTokenId,
        balance,
        amount: effectiveAmount,
        timestamp: new Date().toISOString(),
        wasPending: !!pendingTx
      });
    } else {
      // If transaction failed and was pending, mark as failed
      if (pendingTx) {
        pendingTransactions.set(pendingTx.id, {
          ...pendingTx,
          status: 'failed',
          result: {
            status: 'error',
            message: result.error || 'Transaction failed'
          }
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: result.error || 'Transaction failed',
        transactionType: effectiveTransactionType
      });
    }

  } catch (error) {
    console.error('IoT transaction error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/iot/register-card
 * Register a new RFID card
 */
router.post('/register-card', async (req, res) => {
  try {
    const { cardToken, cardUID, walletAddress, vcTokenId, deviceId } = req.body;
    const cardIdentifier = cardUID || cardToken; // Support both UID and token

    if (!cardIdentifier || !walletAddress || vcTokenId === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: cardUID (or cardToken), walletAddress, vcTokenId'
      });
    }

    // Check if card already exists
    const existingCard = rfidCardDB.getCard(cardIdentifier);
    if (existingCard) {
      return res.status(409).json({
        status: 'error',
        message: 'Card UID already registered',
        cardUID: cardIdentifier
      });
    }

    // Verify VC exists and is valid
    const isValid = await blockchainService.isValidVC(vcTokenId);
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid VC token ID'
      });
    }

    // Register card
    const cardData = rfidCardDB.registerCard(cardIdentifier, walletAddress, vcTokenId, deviceId);

    return res.status(201).json({
      status: 'success',
      message: 'RFID card UID registered successfully',
      cardUID: cardIdentifier,
      card: cardData
    });

  } catch (error) {
    console.error('Card registration error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * GET /api/iot/card/:cardToken
 * Get card details
 */
router.get('/card/:cardToken', async (req, res) => {
  try {
    const { cardToken } = req.params;
    const card = rfidCardDB.getCard(cardToken);

    if (!card) {
      return res.status(404).json({
        status: 'error',
        message: 'Card not found'
      });
    }

    // Get current balance
    const balance = await blockchainService.getBalance(card.walletAddress);
    const isValid = await blockchainService.isValidVC(card.vcTokenId);

    return res.json({
      status: 'success',
      card: {
        ...card,
        balance,
        vcValid: isValid
      }
    });

  } catch (error) {
    console.error('Error fetching card:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/iot/card/:cardToken
 * Deactivate a card
 */
router.delete('/card/:cardToken', async (req, res) => {
  try {
    const { cardToken } = req.params;
    const card = rfidCardDB.getCard(cardToken);

    if (!card) {
      return res.status(404).json({
        status: 'error',
        message: 'Card not found'
      });
    }

    rfidCardDB.deactivateCard(cardToken);

    return res.json({
      status: 'success',
      message: 'Card deactivated successfully',
      cardToken
    });

  } catch (error) {
    console.error('Error deactivating card:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * GET /api/iot/cards/wallet/:address
 * Get all cards for a wallet
 */
router.get('/cards/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const cards = rfidCardDB.getCardsByWallet(address);

    return res.json({
      status: 'success',
      count: cards.length,
      cards
    });

  } catch (error) {
    console.error('Error fetching cards:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * POST /api/iot/pending-transaction
 * Initiate a pending transaction from frontend
 */
router.post('/pending-transaction', async (req, res) => {
  try {
    const { transactionId, amount, merchantAddress, customerAddress } = req.body;

    if (!transactionId || !amount || !merchantAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }

    // Store pending transaction
    pendingTransactions.set(transactionId, {
      amount,
      merchantAddress,
      customerAddress,
      status: 'pending',
      createdAt: new Date()
    });

    // Auto-expire after 60 seconds
    setTimeout(() => {
      if (pendingTransactions.has(transactionId)) {
        pendingTransactions.delete(transactionId);
      }
    }, 60000);

    return res.json({
      status: 'success',
      transactionId
    });

  } catch (error) {
    console.error('Error creating pending transaction:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * GET /api/iot/transaction-status/:transactionId
 * Check status of a pending transaction
 */
router.get('/transaction-status/:transactionId', (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = pendingTransactions.get(transactionId);

    if (!transaction) {
      return res.json({
        status: 'not_found'
      });
    }

    return res.json({
      status: transaction.status,
      result: transaction.result || null
    });

  } catch (error) {
    console.error('Error checking transaction status:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * GET /api/iot/pending-transaction/:walletAddress
 * Get pending transaction for a wallet (for ESP8266)
 */
router.get('/pending-transaction/:walletAddress', (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Find pending transaction for this wallet
    for (const [txId, tx] of pendingTransactions.entries()) {
      if (tx.customerAddress && tx.customerAddress.toLowerCase() === walletAddress.toLowerCase() && tx.status === 'pending') {
        return res.json({
          status: 'found',
          transactionId: txId,
          amount: tx.amount,
          merchantAddress: tx.merchantAddress
        });
      }
    }

    return res.json({
      status: 'not_found'
    });

  } catch (error) {
    console.error('Error fetching pending transaction:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * GET /api/iot/debug/pending-transactions
 * Debug: Show all pending transactions
 */
router.get('/debug/pending-transactions', (req, res) => {
  const pending = [];
  for (const [txId, tx] of pendingTransactions.entries()) {
    pending.push({ id: txId, ...tx });
  }
  return res.json({
    count: pending.length,
    transactions: pending
  });
});

/**
 * DELETE /api/iot/debug/clear-pending
 * Debug: Clear all pending transactions
 */
router.delete('/debug/clear-pending', (req, res) => {
  const count = pendingTransactions.size;
  pendingTransactions.clear();
  return res.json({
    status: 'success',
    message: `Cleared ${count} pending transaction(s)`
  });
});

export default router;
