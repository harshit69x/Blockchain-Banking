import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Sparkles } from 'lucide-react';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import BankVCArtifact from '../../build/contracts/BankVC.json';
import UserDashboardNew from './pages/UserDashboardNew';

const CONTRACT_ADDRESS = '0xdB5Ac67B909d77F52086fC6876688Ebd3e41B2CD';

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions: {}
  });

  const connectWallet = async () => {
    try {
      setLoading(true);
      const provider = await web3Modal.connect();
      const web3Instance = new Web3(provider);
      setWeb3(web3Instance);

      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);

      const contractInstance = new web3Instance.eth.Contract(
        BankVCArtifact.abi,
        CONTRACT_ADDRESS
      );
      setContract(contractInstance);

      showToast('success', 'Wallet connected successfully!');

      provider.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
        window.location.reload();
      });

      provider.on('chainChanged', () => {
        window.location.reload();
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showToast('error', 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    web3Modal.clearCachedProvider();
    setWeb3(null);
    setAccount('');
    setContract(null);
    showToast('success', 'Wallet disconnected');
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100">
      {!account ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Blockchain Banking
            </h1>
            <p className="text-gray-600 mb-8">
              Connect your wallet to access your account
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectWallet}
              disabled={loading}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <Wallet className="w-6 h-6" />
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </motion.button>
            <div className="mt-6 text-xs text-gray-500">
              Contract: {CONTRACT_ADDRESS.substring(0, 10)}...
            </div>
          </motion.div>
        </div>
      ) : (
        <UserDashboardNew 
          web3={web3} 
          account={account} 
          contract={contract} 
          showToast={showToast}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl font-semibold z-50 ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          {toast.message}
        </motion.div>
      )}
    </div>
  );
}

export default App;
