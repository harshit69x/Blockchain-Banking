import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, CheckCircle, XCircle, Users, Activity, Trash2, Copy } from 'lucide-react';

function CardManagement({ showToast }) {
  const [cards, setCards] = useState([]);
  const [formData, setFormData] = useState({
    cardUID: '',
    walletAddress: '',
    vcTokenId: '',
    cardName: ''
  });
  const [loading, setLoading] = useState(false);
  const [registeredUID, setRegisteredUID] = useState(null);

  const handleRegisterCard = async (e) => {
    e.preventDefault();
    
    if (!formData.cardUID || !formData.walletAddress || !formData.vcTokenId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Registering card UID:', { uid: formData.cardUID, wallet: formData.walletAddress, vcId: formData.vcTokenId });
      
      const response = await fetch('http://localhost:5000/api/iot/register-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardUID: formData.cardUID.toUpperCase(),
          walletAddress: formData.walletAddress,
          vcTokenId: parseInt(formData.vcTokenId),
          deviceId: formData.cardName || `Card-${formData.cardUID}`
        })
      });

      const data = await response.json();
      console.log('Backend response:', data);
      
      if (data.status === 'success') {
        setRegisteredUID(formData.cardUID.toUpperCase());
        showToast(`✅ Card UID Registered: ${formData.cardUID.toUpperCase()}`, 'success');
        setFormData({ cardUID: '', walletAddress: '', vcTokenId: '', cardName: '' });
      } else {
        showToast(data.message || 'Failed to register card', 'error');
        console.error('Registration failed:', data);
      }
    } catch (error) {
      console.error('Error registering card:', error);
      showToast(`❌ Backend error: ${error.message}. Make sure backend is running on port 5000!`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCards = async () => {
    try {
      // In production, you'd have an endpoint to list all cards
      // For now, we'll show a message
      showToast('Card registered successfully! Use the card token on your IoT device.', 'info');
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const handleDeactivateCard = async (cardToken) => {
    if (!confirm(`Deactivate card ${cardToken}?`)) return;

    try {
      const response = await fetch(`http://localhost:5000/api/iot/card/${cardToken}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        showToast('Card deactivated', 'success');
        loadCards();
      } else {
        showToast(data.message || 'Failed to deactivate card', 'error');
      }
    } catch (error) {
      console.error('Error deactivating card:', error);
      showToast('Failed to deactivate card', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Register Card Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-purple-600" />
          Register New RFID Card
        </h3>

        <form onSubmit={handleRegisterCard} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Card UID *
            </label>
            <input
              type="text"
              value={formData.cardUID}
              onChange={(e) => setFormData({ ...formData, cardUID: e.target.value })}
              placeholder="3A5F8B2C (read from RFID scanner)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all font-mono"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              📇 The unique ID from your RFID card (tap card on reader to get UID from Serial Monitor)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              User Wallet Address *
            </label>
            <input
              type="text"
              value={formData.walletAddress}
              onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
              placeholder="0x..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The user's Ethereum wallet address that will be linked to this card
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              VC Token ID *
            </label>
            <input
              type="number"
              value={formData.vcTokenId}
              onChange={(e) => setFormData({ ...formData, vcTokenId: e.target.value })}
              placeholder="1"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The user's Verifiable Credential token ID (must be valid and not revoked)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Card Name (Optional)
            </label>
            <input
              type="text"
              value={formData.cardName}
              onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
              placeholder="e.g., John's Card"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Activity className="w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Generate & Register Card
              </>
            )}
          </button>
        </form>

        {/* Registered UID Display */}
        {registeredUID && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-green-900 text-lg mb-2">✅ Card UID Registered!</h4>
                <p className="text-sm text-green-800 mb-3">This card is now linked to the user's wallet:</p>
                <div className="bg-white p-4 rounded-lg border-2 border-green-400">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Card UID:</span>
                      <code className="text-lg font-bold text-purple-600">{registeredUID}</code>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-3">
                  ✅ User can now tap this card on the ESP8266 device to make transactions!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>📋 Complete Workflow (UID-Based):</strong>
          </p>
          <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
            <li>Upload <code className="bg-white px-1 rounded">esp8266_rfid_uid_reader.ino</code> to get card UID from Serial Monitor</li>
            <li>Copy the UID (e.g., 3A5F8B2C) and register it here with user's wallet</li>
            <li>Upload <code className="bg-white px-1 rounded">esp8266_rfid_transaction.ino</code> (uses UID automatically)</li>
            <li>User taps card → ESP8266 reads UID → Backend processes → Transaction appears in History</li>
          </ol>
        </div>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-200"
      >
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600" />
          How UID-Based RFID System Works
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p><strong>Read-Only:</strong> Uses card's built-in UID (e.g., 3A5F8B2C) - no writing needed!</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p><strong>Backend Mapping:</strong> Backend maps cardUID → walletAddress → vcTokenId</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p><strong>Transaction Types:</strong> VERIFY (access control), DEPOSIT, WITHDRAW, TRANSFER</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p><strong>VC Validation:</strong> Every transaction verifies the user's VC is valid and not revoked</p>
          </div>
        </div>
      </motion.div>

      {/* Hardware Setup Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200"
      >
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-600" />
          🔧 ESP8266 Configuration
        </h4>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="bg-white p-3 rounded-lg border border-yellow-200">
            <p className="font-semibold mb-1">⚙️ Current Backend Settings:</p>
            <code className="text-xs bg-gray-100 p-2 rounded block">
              API_URL = "http://192.168.137.1:5000/api/iot/transaction"<br/>
              WIFI_SSID = "Slayerr"<br/>
              DEVICE_API_KEY = "blockchain-banking-iot-secure-key-2025"
            </code>
          </div>
          <div className="bg-white p-3 rounded-lg border border-yellow-200">
            <p className="font-semibold mb-1">📡 Transaction Types (configurable):</p>
            <ul className="text-xs space-y-1 ml-4 list-disc">
              <li><code>VERIFY</code> - Check VC validity (default)</li>
              <li><code>DEPOSIT</code> - Add funds (set DEFAULT_AMOUNT)</li>
              <li><code>WITHDRAW</code> - Remove funds</li>
              <li><code>TRANSFER</code> - Send to another address</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default CardManagement;
