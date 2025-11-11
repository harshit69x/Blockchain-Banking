import { useState, useEffect } from 'react';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import BankView from './pages/BankView';
import UserView from './pages/UserView';
import AddressBadge from './components/AddressBadge';
import TxStatusToast from './components/TxStatusToast';
import BankVCArtifact from '../../../build/contracts/BankVC.json';

// Deployed contract address on Ganache
const CONTRACT_ADDRESS = '0xb9696d8b73F56F110a8fb29be3730094Bbea8Ca0';

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [isBank, setIsBank] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [networkId, setNetworkId] = useState(null);

  // Initialize Web3Modal
  const web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions: {}
  });

  // Connect Wallet
  const connectWallet = async () => {
    try {
      setLoading(true);
      const provider = await web3Modal.connect();
      const web3Instance = new Web3(provider);
      setWeb3(web3Instance);

      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);

      const netId = await web3Instance.eth.net.getId();
      setNetworkId(netId);

      // Load contract with hardcoded address
      const contractInstance = new web3Instance.eth.Contract(
        BankVCArtifact.abi,
        CONTRACT_ADDRESS
      );
      setContract(contractInstance);

      // Check if user has BANK_ROLE
      const bankRole = await contractInstance.methods.BANK_ROLE().call();
      const hasBankRole = await contractInstance.methods.hasRole(bankRole, accounts[0]).call();
      setIsBank(hasBankRole);

      // Subscribe to account changes
      provider.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
        window.location.reload();
      });

      provider.on('chainChanged', () => {
        window.location.reload();
      });

      showToast('success', 'Wallet connected successfully');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showToast('error', 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect Wallet
  const disconnectWallet = async () => {
    web3Modal.clearCachedProvider();
    setWeb3(null);
    setAccount('');
    setContract(null);
    setIsBank(false);
    showToast('success', 'Wallet disconnected');
  };

  // Show toast notification
  const showToast = (type, message, hash = null) => {
    setToast({ type, message, hash });
    setTimeout(() => setToast(null), 5000);
  };

  // Auto-connect if previously connected
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
  }, []);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🏦 Blockchain Banking</h1>
          <p>SSI & Verifiable Credentials Platform</p>
          
          {contract && (
            <div style={{ 
              fontSize: '0.85rem', 
              color: '#666', 
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <span>📜 Contract:</span>
              <code style={{ 
                background: '#f0f0f0', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}>
                {CONTRACT_ADDRESS}
              </code>
            </div>
          )}
          
          <div className="wallet-section">
            <div>
              {account && (
                <>
                  <AddressBadge address={account} />
                  {isBank && <span className="role-badge bank">BANK</span>}
                  {!isBank && <span className="role-badge user">USER</span>}
                </>
              )}
            </div>
            <div>
              {!account ? (
                <button 
                  className="btn btn-primary" 
                  onClick={connectWallet}
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : '🔐 Connect Wallet'}
                </button>
              ) : (
                <button 
                  className="btn btn-secondary" 
                  onClick={disconnectWallet}
                >
                  🚪 Disconnect
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          {!account ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔌</div>
              <div className="empty-state-text">
                Please connect your wallet to continue
              </div>
            </div>
          ) : !contract ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚠️</div>
              <div className="empty-state-text">
                Contract not found. Please deploy the contract first.
              </div>
            </div>
          ) : isBank ? (
            <BankView 
              web3={web3} 
              account={account} 
              contract={contract} 
              showToast={showToast}
            />
          ) : (
            <UserView 
              web3={web3} 
              account={account} 
              contract={contract} 
              showToast={showToast}
            />
          )}
        </main>

        {toast && <TxStatusToast {...toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}

export default App;
