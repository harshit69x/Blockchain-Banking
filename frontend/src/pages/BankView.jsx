import { useState, useEffect } from 'react';
import axios from 'axios';
import TokenCard from '../components/TokenCard';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

function BankView({ web3, account, contract, showToast }) {
  const [activeTab, setActiveTab] = useState('mint');
  const [loading, setLoading] = useState(false);
  
  // Mint VC state
  const [mintAddress, setMintAddress] = useState('');
  const [kycData, setKycData] = useState('');
  const [ipfsCID, setIpfsCID] = useState('');
  
  // Revoke VC state
  const [revokeTokenId, setRevokeTokenId] = useState('');
  
  // Events state
  const [events, setEvents] = useState([]);
  const [filterType, setFilterType] = useState('all');
  
  // Stats
  const [stats, setStats] = useState({
    totalVCs: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    revokedVCs: 0
  });

  // Upload KYC to IPFS (simulated)
  const uploadToIPFS = async () => {
    try {
      setLoading(true);
      
      if (!kycData.trim()) {
        showToast('error', 'Please enter KYC data');
        return;
      }

      // Parse JSON to validate
      JSON.parse(kycData);
      
      // Simulate IPFS upload (in production, use actual IPFS service like Pinata or Infura)
      const blob = new Blob([kycData], { type: 'application/json' });
      const mockCID = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      setIpfsCID(mockCID);
      showToast('success', `KYC uploaded to IPFS: ${mockCID}`);
      
      // In production, use actual IPFS upload:
      // const formData = new FormData();
      // formData.append('file', blob);
      // const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      //   headers: { 'pinata_api_key': 'YOUR_KEY', 'pinata_secret_api_key': 'YOUR_SECRET' }
      // });
      // setIpfsCID(response.data.IpfsHash);
      
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      showToast('error', 'Invalid JSON format or upload failed');
    } finally {
      setLoading(false);
    }
  };

  // Mint VC NFT
  const mintVC = async () => {
    try {
      setLoading(true);
      
      if (!web3.utils.isAddress(mintAddress)) {
        showToast('error', 'Invalid Ethereum address');
        return;
      }
      
      if (!ipfsCID) {
        showToast('error', 'Please upload KYC to IPFS first');
        return;
      }

      showToast('pending', 'Minting VC NFT...');
      
      const tx = await contract.methods.mintVC(mintAddress, ipfsCID).send({ 
        from: account,
        gas: 500000
      });
      
      const event = tx.events.VCIssued;
      const tokenId = event.returnValues.tokenId;
      
      showToast('success', `VC NFT minted successfully! Token ID: ${tokenId}`, tx.transactionHash);
      
      // Reset form
      setMintAddress('');
      setKycData('');
      setIpfsCID('');
      
      // Refresh events
      loadEvents();
      
    } catch (error) {
      console.error('Error minting VC:', error);
      showToast('error', error.message || 'Failed to mint VC');
    } finally {
      setLoading(false);
    }
  };

  // Revoke VC
  const revokeVC = async () => {
    try {
      setLoading(true);
      
      if (!revokeTokenId || isNaN(revokeTokenId)) {
        showToast('error', 'Please enter a valid token ID');
        return;
      }

      showToast('pending', 'Revoking VC...');
      
      const tx = await contract.methods.revokeVC(revokeTokenId).send({ 
        from: account,
        gas: 300000
      });
      
      showToast('success', `VC #${revokeTokenId} revoked successfully`, tx.transactionHash);
      
      setRevokeTokenId('');
      loadEvents();
      
    } catch (error) {
      console.error('Error revoking VC:', error);
      showToast('error', error.message || 'Failed to revoke VC');
    } finally {
      setLoading(false);
    }
  };

  // Pause contract
  const pauseContract = async () => {
    try {
      setLoading(true);
      showToast('pending', 'Pausing contract...');
      
      const tx = await contract.methods.pause().send({ 
        from: account,
        gas: 100000
      });
      
      showToast('success', 'Contract paused successfully', tx.transactionHash);
    } catch (error) {
      console.error('Error pausing:', error);
      showToast('error', error.message || 'Failed to pause contract');
    } finally {
      setLoading(false);
    }
  };

  // Unpause contract
  const unpauseContract = async () => {
    try {
      setLoading(true);
      showToast('pending', 'Unpausing contract...');
      
      const tx = await contract.methods.unpause().send({ 
        from: account,
        gas: 100000
      });
      
      showToast('success', 'Contract unpaused successfully', tx.transactionHash);
    } catch (error) {
      console.error('Error unpausing:', error);
      showToast('error', error.message || 'Failed to unpause contract');
    } finally {
      setLoading(false);
    }
  };

  // Load all events
  const loadEvents = async () => {
    try {
      const allEvents = [];
      
      // Get VCIssued events
      const vcIssuedEvents = await contract.getPastEvents('VCIssued', {
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      vcIssuedEvents.forEach(event => {
        allEvents.push({
          type: 'VCIssued',
          tokenId: event.returnValues.tokenId,
          address: event.returnValues.to,
          ipfsCID: event.returnValues.ipfsCID,
          timestamp: event.returnValues.issuedAt,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
      });
      
      // Get VCRevoked events
      const vcRevokedEvents = await contract.getPastEvents('VCRevoked', {
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      vcRevokedEvents.forEach(event => {
        allEvents.push({
          type: 'VCRevoked',
          tokenId: event.returnValues.tokenId,
          address: event.returnValues.revokedBy,
          timestamp: event.returnValues.revokedAt,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
      });
      
      // Get Deposit events
      const depositEvents = await contract.getPastEvents('Deposit', {
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      depositEvents.forEach(event => {
        allEvents.push({
          type: 'Deposit',
          address: event.returnValues.user,
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          balanceAfter: web3.utils.fromWei(event.returnValues.balanceAfter, 'ether'),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
      });
      
      // Get Withdraw events
      const withdrawEvents = await contract.getPastEvents('Withdraw', {
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      withdrawEvents.forEach(event => {
        allEvents.push({
          type: 'Withdraw',
          address: event.returnValues.user,
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          balanceAfter: web3.utils.fromWei(event.returnValues.balanceAfter, 'ether'),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
      });
      
      // Sort by block number (descending)
      allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      setEvents(allEvents);
      
      // Calculate stats
      setStats({
        totalVCs: vcIssuedEvents.length,
        totalDeposits: depositEvents.length,
        totalWithdrawals: withdrawEvents.length,
        revokedVCs: vcRevokedEvents.length
      });
      
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Filter events
  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(e => e.type === filterType);

  // Load events on mount
  useEffect(() => {
    if (contract) {
      loadEvents();
    }
  }, [contract]);

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>🏦 Bank Management Dashboard</h2>
      
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalVCs}</div>
          <div className="stat-label">Total VCs Issued</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.revokedVCs}</div>
          <div className="stat-label">Revoked VCs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalDeposits}</div>
          <div className="stat-label">Total Deposits</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalWithdrawals}</div>
          <div className="stat-label">Total Withdrawals</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'mint' ? 'active' : ''}`}
          onClick={() => setActiveTab('mint')}
        >
          Mint VC
        </button>
        <button 
          className={`tab ${activeTab === 'revoke' ? 'active' : ''}`}
          onClick={() => setActiveTab('revoke')}
        >
          Revoke VC
        </button>
        <button 
          className={`tab ${activeTab === 'monitor' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitor')}
        >
          Monitor Events
        </button>
        <button 
          className={`tab ${activeTab === 'control' ? 'active' : ''}`}
          onClick={() => setActiveTab('control')}
        >
          Contract Control
        </button>
      </div>

      {/* Mint VC Tab */}
      {activeTab === 'mint' && (
        <div className="card">
          <h3 className="card-title">Issue New Verifiable Credential</h3>
          
          <div className="form-group">
            <label>User Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>KYC Data (JSON)</label>
            <textarea
              placeholder='{"name": "John Doe", "dateOfBirth": "1990-01-01", "nationality": "US", ...}'
              value={kycData}
              onChange={(e) => setKycData(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={uploadToIPFS}
            disabled={loading || !kycData}
          >
            📤 Upload to IPFS
          </button>

          {ipfsCID && (
            <div style={{ marginTop: '15px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
              <strong>IPFS CID:</strong> {ipfsCID}
              <br />
              <a href={`${IPFS_GATEWAY}${ipfsCID}`} target="_blank" rel="noopener noreferrer">
                View on IPFS
              </a>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn btn-primary" 
              onClick={mintVC}
              disabled={loading || !mintAddress || !ipfsCID}
            >
              🎫 Mint VC NFT
            </button>
          </div>
        </div>
      )}

      {/* Revoke VC Tab */}
      {activeTab === 'revoke' && (
        <div className="card">
          <h3 className="card-title">Revoke Verifiable Credential</h3>
          
          <div className="form-group">
            <label>Token ID</label>
            <input
              type="number"
              placeholder="Enter token ID to revoke"
              value={revokeTokenId}
              onChange={(e) => setRevokeTokenId(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-danger" 
            onClick={revokeVC}
            disabled={loading || !revokeTokenId}
          >
            🚫 Revoke VC
          </button>
        </div>
      )}

      {/* Monitor Events Tab */}
      {activeTab === 'monitor' && (
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Transaction & Event Monitoring</h3>
              <button className="btn btn-secondary" onClick={loadEvents}>
                🔄 Refresh
              </button>
            </div>

            <div className="filter-section">
              <button 
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All Events
              </button>
              <button 
                className={`filter-btn ${filterType === 'VCIssued' ? 'active' : ''}`}
                onClick={() => setFilterType('VCIssued')}
              >
                VC Issued
              </button>
              <button 
                className={`filter-btn ${filterType === 'VCRevoked' ? 'active' : ''}`}
                onClick={() => setFilterType('VCRevoked')}
              >
                VC Revoked
              </button>
              <button 
                className={`filter-btn ${filterType === 'Deposit' ? 'active' : ''}`}
                onClick={() => setFilterType('Deposit')}
              >
                Deposits
              </button>
              <button 
                className={`filter-btn ${filterType === 'Withdraw' ? 'active' : ''}`}
                onClick={() => setFilterType('Withdraw')}
              >
                Withdrawals
              </button>
            </div>

            <div className="transaction-list">
              {filteredEvents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-text">No events found</div>
                </div>
              ) : (
                filteredEvents.map((event, index) => (
                  <div key={index} className="transaction-item">
                    <div className="type">{event.type}</div>
                    <div className="details">
                      {event.type === 'VCIssued' && (
                        <>
                          <div>Token ID: #{event.tokenId}</div>
                          <div>To: {event.address}</div>
                          <div>IPFS CID: {event.ipfsCID}</div>
                        </>
                      )}
                      {event.type === 'VCRevoked' && (
                        <>
                          <div>Token ID: #{event.tokenId}</div>
                          <div>Revoked By: {event.address}</div>
                        </>
                      )}
                      {(event.type === 'Deposit' || event.type === 'Withdraw') && (
                        <>
                          <div>User: {event.address}</div>
                          <div>Amount: {event.amount} ETH</div>
                          <div>Balance After: {event.balanceAfter} ETH</div>
                        </>
                      )}
                      <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                        Block: {event.blockNumber} | TX: {event.txHash?.substring(0, 10)}...
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Control Tab */}
      {activeTab === 'control' && (
        <div className="card">
          <h3 className="card-title">Contract Controls</h3>
          
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button 
              className="btn btn-danger" 
              onClick={pauseContract}
              disabled={loading}
            >
              ⏸️ Pause Contract
            </button>
            <button 
              className="btn btn-success" 
              onClick={unpauseContract}
              disabled={loading}
            >
              ▶️ Unpause Contract
            </button>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
            <strong>⚠️ Warning:</strong> Pausing the contract will prevent all deposits and withdrawals until unpaused.
          </div>
        </div>
      )}
    </div>
  );
}

export default BankView;
