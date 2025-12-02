/**
 * RFID Card Data Model
 * Maps RFID cardToken to wallet address and VC token ID
 */

class RFIDCard {
  constructor() {
    // In-memory storage (replace with MongoDB in production)
    this.cards = new Map();
  }

  /**
   * Register a new RFID card
   * @param {string} cardToken - Unique card identifier (e.g., "CRD103492")
   * @param {string} walletAddress - User's Ethereum wallet address
   * @param {number} vcTokenId - VC NFT token ID
   * @param {string} deviceId - Optional ESP8266 device ID
   */
  registerCard(cardToken, walletAddress, vcTokenId, deviceId = null) {
    if (!cardToken || !walletAddress || vcTokenId === undefined) {
      throw new Error('Missing required parameters');
    }

    const cardData = {
      cardToken,
      walletAddress,
      vcTokenId,
      deviceId,
      registeredAt: new Date().toISOString(),
      isActive: true,
      lastUsed: null,
      transactionCount: 0
    };

    this.cards.set(cardToken, cardData);
    return cardData;
  }

  /**
   * Get card data by token
   * @param {string} cardToken
   */
  getCard(cardToken) {
    return this.cards.get(cardToken) || null;
  }

  /**
   * Update last used timestamp
   * @param {string} cardToken
   */
  updateLastUsed(cardToken) {
    const card = this.cards.get(cardToken);
    if (card) {
      card.lastUsed = new Date().toISOString();
      card.transactionCount++;
      this.cards.set(cardToken, card);
    }
  }

  /**
   * Deactivate a card
   * @param {string} cardToken
   */
  deactivateCard(cardToken) {
    const card = this.cards.get(cardToken);
    if (card) {
      card.isActive = false;
      this.cards.set(cardToken, card);
    }
  }

  /**
   * Get all cards for a wallet
   * @param {string} walletAddress
   */
  getCardsByWallet(walletAddress) {
    return Array.from(this.cards.values())
      .filter(card => card.walletAddress.toLowerCase() === walletAddress.toLowerCase());
  }

  /**
   * Get all registered cards
   */
  getAllCards() {
    return Array.from(this.cards.values());
  }
}

// Singleton instance
const rfidCardDB = new RFIDCard();

export default rfidCardDB;
