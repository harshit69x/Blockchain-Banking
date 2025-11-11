import { useState, useEffect } from 'react';

function UserDashboard({ web3, account, contract, showToast }) {
  const [vcStatus, setVcStatus] = useState(null); // 'none', 'pending', 'approved', 'has-vc'
  const [vcTokenId, setVcTokenId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [kycData, setKycData] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (contract && account) {
      loadUserData();
      const interval = setInterval(loadUserData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [contract, account]);

  const loadUserData = async () => {
    try {
      await Promise.all([
        loadVCStatus(),
        loadBalance(),
        loadMyRequests(),
        loadMyTransactions()
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadVCStatus = async () => {
    try {
      // First check if user has a VC token ID stored
      const tokenId = await contract.methods.userToTokenId(account).call();
      
      console.log(`=== VC Status Check ===`);
      console.log(`Account: ${account}`);
      console.log(`TokenId from contract: ${tokenId}`);
      
      if (tokenId && tokenId !== '0') {
        // User has been assigned a token ID
        // Check if token is valid (not revoked and exists)
        const isValid = await contract.methods.isValidVC(tokenId).call();
        const isTokenRevoked = await contract.methods.revoked(tokenId).call();
        
        console.log(`Token ID: ${tokenId}`);
        console.log(`isValid: ${isValid}`);
        console.log(`isTokenRevoked: ${isTokenRevoked}`);
        
        // Only show as revoked if the bank explicitly revoked it
        if (isTokenRevoked === true) {
          console.log(`Setting status to REVOKED`);
          setVcStatus('revoked');
          setVcTokenId(null);
        } else if (isValid === true) {
          // Token exists and is not revoked
          console.log(`Setting status to HAS-VC`);
          setVcStatus('has-vc');
          setVcTokenId(tokenId);
        } else {
          // Token exists but is not valid for some reason
          console.log(`Setting status to NONE (not valid)`);
          setVcStatus('none');
          setVcTokenId(null);
        }
      } else {
        // No token ID assigned yet, check if user has pending requests
        const requestIds = await contract.methods.getUserRequests(account).call();
        
        console.log(`No tokenId, checking requests. Request count: ${requestIds ? requestIds.length : 0}`);
        
        if (requestIds && requestIds.length > 0) {
          const lastRequestId = requestIds[requestIds.length - 1];
          const request = await contract.methods.vcRequests(lastRequestId).call();
          
          console.log(`Last request ID: ${lastRequestId}`);
          console.log(`Last request status - isPending: ${request.isPending}, isApproved: ${request.isApproved}`);
          
          if (request.isPending) {
            console.log(`Setting status to PENDING`);
            setVcStatus('pending');
            setVcTokenId(null);
          } else if (request.isApproved) {
            // Request was approved - should have tokenId above, but just in case
            console.log(`Setting status to APPROVED`);
            setVcStatus('approved');
            setVcTokenId(null);
          } else {
            console.log(`Setting status to REJECTED`);
            setVcStatus('rejected');
            setVcTokenId(null);
          }
        } else {
          console.log(`Setting status to NONE (no requests)`);
          setVcStatus('none');
          setVcTokenId(null);
        }
      }
    } catch (error) {
      console.error('Error loading VC status:', error);
      setVcStatus('none');
      setVcTokenId(null);
    }
  };

  const loadBalance = async () => {
    try {
      const bal = await contract.methods.balance(account).call();
      setBalance(web3.utils.fromWei(bal, 'ether'));
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadMyRequests = async () => {
    try {
      const requestIds = await contract.methods.getUserRequests(account).call();
      const requests = [];

      for (let id of requestIds) {
        const request = await contract.methods.vcRequests(id).call();
        requests.push({
          id,
          kycData: request.kycData,
          requestedAt: new Date(parseInt(request.requestedAt) * 1000),
          isPending: request.isPending,
          isApproved: request.isApproved
        });
      }

      setMyRequests(requests.reverse());
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const loadMyTransactions = async () => {
    try {
      const currentBlock = await web3.eth.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);

      const [deposits, withdrawals, transfersSent, transfersReceived] = await Promise.all([
        contract.getPastEvents('Deposit', {
          filter: { user: account },
          fromBlock,
          toBlock: 'latest'
        }),
        contract.getPastEvents('Withdraw', {
          filter: { user: account },
          fromBlock,
          toBlock: 'latest'
        }),
        contract.getPastEvents('Transfer', {
          filter: { from: account },
          fromBlock,
          toBlock: 'latest'
        }),
        contract.getPastEvents('Transfer', {
          filter: { to: account },
          fromBlock,
          toBlock: 'latest'
        })
      ]);

      const transactions = [];

      for (let event of deposits) {
        const block = await web3.eth.getBlock(event.blockNumber);
        transactions.push({
          type: 'Deposit',
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          timestamp: new Date(block.timestamp * 1000),
          hash: event.transactionHash
        });
      }

      for (let event of withdrawals) {
        const block = await web3.eth.getBlock(event.blockNumber);
        transactions.push({
          type: 'Withdrawal',
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          timestamp: new Date(block.timestamp * 1000),
          hash: event.transactionHash
        });
      }

      for (let event of transfersSent) {
        const block = await web3.eth.getBlock(event.blockNumber);
        transactions.push({
          type: 'Sent',
          to: event.returnValues.to,
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          timestamp: new Date(block.timestamp * 1000),
          hash: event.transactionHash
        });
      }

      for (let event of transfersReceived) {
        const block = await web3.eth.getBlock(event.blockNumber);
        transactions.push({
          type: 'Received',
          from: event.returnValues.from,
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          timestamp: new Date(block.timestamp * 1000),
          hash: event.transactionHash
        });
      }

      setMyTransactions(transactions.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleRequestVC = async () => {
    if (!kycData) {
      showToast('error', 'Please enter your KYC data');
      return;
    }

    try {
      setLoading(true);
      await contract.methods.requestVC(kycData)
        .send({ from: account });
      
      showToast('success', 'VC request submitted! Waiting for bank approval...');
      setKycData('');
      await loadUserData();
    } catch (error) {
      console.error('Error requesting VC:', error);
      showToast('error', error.message || 'Failed to request VC');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      showToast('error', 'Please enter a valid deposit amount');
      return;
    }

    try {
      setLoading(true);
      const amountWei = web3.utils.toWei(depositAmount, 'ether');
      await contract.methods.deposit()
        .send({ from: account, value: amountWei });
      
      showToast('success', `Deposited ${depositAmount} ETH successfully!`);
      setDepositAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Error depositing:', error);
      showToast('error', error.message || 'Failed to deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showToast('error', 'Please enter a valid withdrawal amount');
      return;
    }

    if (parseFloat(withdrawAmount) > parseFloat(balance)) {
      showToast('error', 'Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      const amountWei = web3.utils.toWei(withdrawAmount, 'ether');
      await contract.methods.withdraw(amountWei)
        .send({ from: account });
      
      showToast('success', `Withdrawn ${withdrawAmount} ETH successfully!`);
      setWithdrawAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Error withdrawing:', error);
      showToast('error', error.message || 'Failed to withdraw');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferTo || !web3.utils.isAddress(transferTo)) {
      showToast('error', 'Please enter a valid recipient address');
      return;
    }

    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      showToast('error', 'Please enter a valid transfer amount');
      return;
    }

    if (parseFloat(transferAmount) > parseFloat(balance)) {
      showToast('error', 'Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      const amountWei = web3.utils.toWei(transferAmount, 'ether');
      await contract.methods.transferBalance(transferTo, amountWei)
        .send({ from: account });
      
      showToast('success', `Transferred ${transferAmount} ETH successfully!`);
      setTransferTo('');
      setTransferAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Error transferring:', error);
      showToast('error', error.message || 'Failed to transfer');
    } finally {
      setLoading(false);
    }
  };

  const getVCStatusBadge = () => {
    switch (vcStatus) {
      case 'has-vc':
        return <div className="status-badge status-active">✅ VC Active (ID: #{vcTokenId})</div>;
      case 'pending':
        return <div className="status-badge status-pending">⏳ VC Request Pending</div>;
      case 'rejected':
        return <div className="status-badge status-rejected">❌ VC Request Rejected</div>;
      case 'revoked':
        return <div className="status-badge status-revoked">⛔ VC Revoked</div>;
      default:
        return <div className="status-badge status-none">⚪ No VC</div>;
    }
  };

  return (
    <div className="user-dashboard">
      {/* Status Overview */}
      <div className="status-section">
        <div className="balance-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-label">Internal Balance</div>
            <div className="card-value">{balance} ETH</div>
          </div>
        </div>

        <div className="vc-status-card">
          <div className="card-icon">🎫</div>
          <div className="card-content">
            <div className="card-label">Verification Status</div>
            {getVCStatusBadge()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'vc' ? 'active' : ''}`}
          onClick={() => setActiveTab('vc')}
        >
          🎫 Verification
        </button>
        <button 
          className={`tab ${activeTab === 'banking' ? 'active' : ''}`}
          onClick={() => setActiveTab('banking')}
        >
          💳 Banking
        </button>
        <button 
          className={`tab ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          🔄 Transfer
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 History
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h2>Welcome to Your Dashboard</h2>
            <p>Manage your verification credentials and banking operations</p>

            <div className="quick-stats">
              <div className="quick-stat">
                <span>Total Transactions</span>
                <strong>{myTransactions.length}</strong>
              </div>
              <div className="quick-stat">
                <span>VC Requests</span>
                <strong>{myRequests.length}</strong>
              </div>
            </div>

            {vcStatus === 'none' && (
              <div className="info-box">
                <strong>🎯 Get Started</strong>
                <p>Request a Verifiable Credential to start using banking services!</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('vc')}>
                  Request VC Now
                </button>
              </div>
            )}

            {vcStatus === 'has-vc' && (
              <div className="info-box success">
                <strong>✅ You're All Set!</strong>
                <p>You can now deposit, withdraw, and transfer funds.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vc' && (
          <div className="vc-tab">
            <h2>Verifiable Credential</h2>

            {vcStatus === 'none' || vcStatus === 'rejected' ? (
              <div className="request-form">
                <h3>Request Verification</h3>
                <p>Submit your KYC data to request a Verifiable Credential</p>
                
                <textarea
                  value={kycData}
                  onChange={(e) => setKycData(e.target.value)}
                  placeholder="Enter your KYC data (JSON format recommended)&#10;Example:&#10;{&#10;  &quot;name&quot;: &quot;John Doe&quot;,&#10;  &quot;email&quot;: &quot;john@example.com&quot;,&#10;  &quot;dob&quot;: &quot;1990-01-01&quot;,&#10;  &quot;address&quot;: &quot;123 Main St&quot;&#10;}"
                  rows="8"
                  className="textarea"
                />

                <button 
                  onClick={handleRequestVC}
                  disabled={loading || !kycData}
                  className="btn btn-primary"
                >
                  {loading ? 'Submitting...' : '📤 Submit VC Request'}
                </button>
              </div>
            ) : vcStatus === 'pending' ? (
              <div className="pending-message">
                <div className="pending-icon">⏳</div>
                <h3>Request Pending</h3>
                <p>Your VC request is being reviewed by the bank.</p>
                <p>Please wait for approval...</p>
              </div>
            ) : vcStatus === 'has-vc' ? (
              <div className="vc-active">
                <div className="vc-icon">✅</div>
                <h3>Verification Complete!</h3>
                <p>Your Verifiable Credential is active</p>
                <div className="vc-details">
                  <strong>Token ID:</strong> #{vcTokenId}
                </div>
              </div>
            ) : vcStatus === 'revoked' ? (
              <div className="revoked-message">
                <div className="revoked-icon">⛔</div>
                <h3>VC Revoked</h3>
                <p>Your Verifiable Credential has been revoked by the bank.</p>
                <p>Please contact the bank for more information.</p>
              </div>
            ) : null}

            {/* Request History */}
            {myRequests.length > 0 && (
              <div className="request-history">
                <h3>Request History</h3>
                <div className="requests-list">
                  {myRequests.map((req) => (
                    <div key={req.id} className="request-item">
                      <div className="request-info">
                        <strong>Request #{req.id}</strong>
                        <span className={`status-label status-${req.isPending ? 'pending' : req.isApproved ? 'approved' : 'rejected'}`}>
                          {req.isPending ? 'Pending' : req.isApproved ? 'Approved' : 'Rejected'}
                        </span>
                      </div>
                      <div className="request-date">{req.requestedAt.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'banking' && (
          <div className="banking-tab">
            <div className="banking-actions">
              {/* Deposit */}
              <div className="action-card">
                <h3>💰 Deposit</h3>
                <p>Deposit ETH into your internal balance</p>
                <input
                  type="number"
                  step="0.001"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount in ETH"
                  className="input"
                  disabled={vcStatus !== 'has-vc'}
                />
                <button 
                  onClick={handleDeposit}
                  disabled={loading || !depositAmount || vcStatus !== 'has-vc'}
                  className="btn btn-primary"
                >
                  {loading ? 'Processing...' : 'Deposit'}
                </button>
                {vcStatus !== 'has-vc' && (
                  <div className="warning">⚠️ You need an active VC to deposit</div>
                )}
              </div>

              {/* Withdraw */}
              <div className="action-card">
                <h3>💸 Withdraw</h3>
                <p>Withdraw ETH from your internal balance</p>
                <div className="balance-info">Available: {balance} ETH</div>
                <input
                  type="number"
                  step="0.001"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount in ETH"
                  className="input"
                  disabled={vcStatus !== 'has-vc'}
                />
                <button 
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount || vcStatus !== 'has-vc' || parseFloat(balance) === 0}
                  className="btn btn-primary"
                >
                  {loading ? 'Processing...' : 'Withdraw'}
                </button>
                {vcStatus !== 'has-vc' && (
                  <div className="warning">⚠️ You need an active VC to withdraw</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="transfer-tab">
            <h2>Transfer to Another User</h2>
            <p>Send funds to another verified user</p>

            {vcStatus === 'has-vc' ? (
              <div className="transfer-form">
                <div className="balance-info">Available: {balance} ETH</div>
                
                <input
                  type="text"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder="Recipient Address (0x...)"
                  className="input"
                />

                <input
                  type="number"
                  step="0.001"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Amount in ETH"
                  className="input"
                />

                <button 
                  onClick={handleTransfer}
                  disabled={loading || !transferTo || !transferAmount || parseFloat(balance) === 0}
                  className="btn btn-primary"
                >
                  {loading ? 'Processing...' : '🔄 Transfer'}
                </button>

                <div className="info-message">
                  ℹ️ Both sender and recipient must have valid VCs
                </div>
              </div>
            ) : (
              <div className="warning-box">
                <div className="warning-icon">⚠️</div>
                <p>You need an active Verifiable Credential to transfer funds</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('vc')}>
                  Request VC
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            <h2>Transaction History</h2>

            {myTransactions.length === 0 ? (
              <div className="empty-message">No transactions yet</div>
            ) : (
              <div className="transactions-list">
                {myTransactions.map((tx, idx) => (
                  <div key={idx} className="transaction-item">
                    <div className="tx-icon">
                      {tx.type === 'Deposit' && '📥'}
                      {tx.type === 'Withdrawal' && '📤'}
                      {tx.type === 'Sent' && '➡️'}
                      {tx.type === 'Received' && '⬅️'}
                    </div>
                    <div className="tx-details">
                      <div className="tx-type">{tx.type}</div>
                      {tx.to && <div className="tx-address">To: {tx.to}</div>}
                      {tx.from && <div className="tx-address">From: {tx.from}</div>}
                      <div className="tx-date">{tx.timestamp.toLocaleString()}</div>
                    </div>
                    <div className={`tx-amount ${tx.type === 'Received' ? 'positive' : 'negative'}`}>
                      {tx.type === 'Received' ? '+' : '-'}{tx.amount} ETH
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
