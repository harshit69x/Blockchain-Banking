import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CreditCard, CheckCircle, Activity, ArrowRight, ShoppingCart, XCircle, Clock } from 'lucide-react';

function IoTTestPanel({ account, showToast, contract }) {
  const MERCHANT_ADDRESS = '0x8e51625f9DD7eABF14422332d9a35aFa273a4F38';
  
  const [amount, setAmount] = useState('');
  const [waitingForTap, setWaitingForTap] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [merchantBalance, setMerchantBalance] = useState('0');

  // Fetch merchant balance
  useEffect(() => {
    const fetchMerchantBalance = async () => {
      if (!contract) {
        console.log('Contract not available yet');
        return;
      }
      
      try {
        console.log('Fetching merchant balance for:', MERCHANT_ADDRESS);
        const balanceWei = await contract.methods.balance(MERCHANT_ADDRESS).call();
        console.log('Merchant balance (wei):', balanceWei);
        const balanceEth = (Number(balanceWei) / 1e18).toFixed(4);
        console.log('Merchant balance (ETH):', balanceEth);
        setMerchantBalance(balanceEth);
      } catch (error) {
        console.error('Error fetching merchant balance:', error);
      }
    };

    fetchMerchantBalance();
    // Refresh every 5 seconds
    const interval = setInterval(fetchMerchantBalance, 5000);
    return () => clearInterval(interval);
  }, [contract, lastResult]);

  // Countdown timer
  useEffect(() => {
    if (waitingForTap && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setWaitingForTap(false);
      showToast('⏱️ Transaction timeout - please try again', 'error');
      setCountdown(30);
    }
  }, [waitingForTap, countdown]);

  // Poll for transaction completion
  useEffect(() => {
    if (!waitingForTap || !transactionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/iot/transaction-status/${transactionId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
          setWaitingForTap(false);
          setLastResult(data.result);
          showToast('✅ Payment completed!', 'success');
          setCountdown(30);
          setAmount('');
        }
      } catch (error) {
        console.error('Error polling:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [waitingForTap, transactionId]);

  const handleInitiatePayment = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (!window.ethereum) {
      showToast('❌ MetaMask not installed', 'error');
      return;
    }

    try {
      // Generate transaction ID
      const txId = 'TX-' + Date.now();
      setTransactionId(txId);
      
      // Create pending transaction in backend
      const response = await fetch('http://localhost:5000/api/iot/pending-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: txId,
          amount: parseFloat(amount),
          merchantAddress: MERCHANT_ADDRESS,
          customerAddress: account
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create pending transaction');
      }

      // Now wait for card tap
      setWaitingForTap(true);
      setCountdown(30);
      setLastResult(null);
      showToast('💳 Tap your RFID card on the device to complete payment', 'info');

    } catch (error) {
      console.error('Error initiating payment:', error);
      showToast(`❌ Error: ${error.message}`, 'error');
      setWaitingForTap(false);
    }
  };

  const handleCancelPayment = () => {
    setWaitingForTap(false);
    setTransactionId(null);
    setCountdown(30);
    showToast('Payment cancelled', 'info');
  };

  return (
    <div className="space-y-6">
      {/* POS Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-300"
      >
        <div className="flex items-start gap-3">
          <ShoppingCart className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-gray-900 mb-2">🏪 IoT Point of Sale (POS) System</h3>
            <p className="text-sm text-gray-700">
              Enter payment amount, then tap your RFID card to complete the transaction. 
              Funds will be transferred to the merchant address automatically.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Payment Form */}
      {!waitingForTap ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Initiate Payment
          </h3>

          <form onSubmit={handleInitiatePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Amount (ETH) *
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1.0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-lg font-semibold"
                required
                disabled={waitingForTap}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Merchant Address:</span>
                  <code className="text-xs text-purple-600 font-mono">{MERCHANT_ADDRESS.substring(0, 12)}...</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Merchant Balance:</span>
                  <span className="text-purple-700 font-bold">{merchantBalance} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Wallet:</span>
                  <code className="text-xs text-blue-600 font-mono">{account?.substring(0, 12)}...</code>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              Proceed to Card Payment
            </button>
          </form>
        </motion.div>
      ) : (
        /* Waiting for Tap */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-yellow-300"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="inline-block mb-4"
            >
              <CreditCard className="w-16 h-16 text-orange-600" />
            </motion.div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              💳 Tap Your Card Now
            </h3>
            
            <p className="text-lg text-gray-700 mb-4">
              Place your RFID card on the ESP8266 reader
            </p>

            <div className="bg-white p-6 rounded-xl border-2 border-yellow-400 mb-4">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {amount} ETH
              </div>
              <div className="text-sm text-gray-600">
                Payment Amount
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-orange-700 mb-4">
              <Clock className="w-5 h-5" />
              <span className="text-lg font-semibold">
                {countdown} seconds remaining
              </span>
            </div>

            <button
              onClick={handleCancelPayment}
              className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-semibold"
            >
              Cancel Payment
            </button>
          </div>
        </motion.div>
      )}

      {/* Transaction Result */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-2xl p-6 border-2 ${
              lastResult.status === 'success'
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {lastResult.status === 'success' ? (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h4 className={`font-bold text-lg mb-2 ${
                  lastResult.status === 'success' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {lastResult.status === 'success' ? '✅ Payment Successful!' : '❌ Payment Failed'}
                </h4>
                
                {lastResult.status === 'success' ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-green-200">
                      <span className="text-green-700 font-semibold">Amount Paid:</span>
                      <span className="text-green-900 font-bold text-lg">{lastResult.amount} ETH</span>
                    </div>
                    {lastResult.txHash && (
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="text-green-700 font-semibold">Transaction Hash:</span>
                        <code className="text-green-900 font-mono text-xs">{lastResult.txHash.substring(0, 20)}...</code>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-green-200">
                      <span className="text-green-700 font-semibold">Merchant:</span>
                      <code className="text-green-900 font-mono text-xs">{MERCHANT_ADDRESS.substring(0, 12)}...</code>
                    </div>
                    {lastResult.balance && (
                      <div className="flex justify-between py-2">
                        <span className="text-green-700 font-semibold">Your New Balance:</span>
                        <span className="text-green-900 font-bold">{lastResult.balance} ETH</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-700 text-sm">
                    {lastResult.message || 'Unknown error occurred'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200"
      >
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          How POS Transactions Work
        </h4>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p><strong>Step 1:</strong> Enter payment amount and click "Proceed to Card Payment"</p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p><strong>Step 2:</strong> Tap your registered RFID card on the ESP8266 device</p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p><strong>Step 3:</strong> ESP8266 reads your card UID and sends payment request</p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p><strong>Step 4:</strong> Backend verifies your VC and transfers funds to merchant</p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p><strong>Step 5:</strong> Green LED blinks on device + confirmation shows here!</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default IoTTestPanel;
