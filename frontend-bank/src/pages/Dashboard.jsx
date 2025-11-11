import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

function Dashboard({ web3, account, contract, showToast }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [issuedVCs, setIssuedVCs] = useState([]);
  const [stats, setStats] = useState({
    totalVCs: 0,
    pendingRequests: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0
  });
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [ipfsCID, setIpfsCID] = useState('');

  useEffect(() => {
    if (contract) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [contract, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadPendingRequests(),
        loadTransactions(),
        loadStats(),
        loadIssuedVCs()
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const requestIds = await contract.methods.getPendingRequests().call();
      const requests = [];

      for (let id of requestIds) {
        const request = await contract.methods.vcRequests(id).call();
        if (request.isPending) {
          requests.push({
            id,
            requester: request.requester,
            kycData: request.kycData,
            requestedAt: new Date(parseInt(request.requestedAt) * 1000)
          });
        }
      }

      setPendingRequests(requests.sort((a, b) => b.requestedAt - a.requestedAt));
      setStats(prev => ({ ...prev, pendingRequests: requests.length }));
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const currentBlock = await web3.eth.getBlockNumber();
      const fromBlock = getFromBlock(selectedPeriod, currentBlock);

      const [deposits, withdrawals, transfers, vcIssued] = await Promise.all([
        contract.getPastEvents('Deposit', { fromBlock, toBlock: 'latest' }),
        contract.getPastEvents('Withdraw', { fromBlock, toBlock: 'latest' }),
        contract.getPastEvents('Transfer', { fromBlock, toBlock: 'latest' }),
        contract.getPastEvents('VCIssued', { fromBlock, toBlock: 'latest' })
      ]);

      const transactions = [];

      for (let event of deposits) {
        const block = await web3.eth.getBlock(event.blockNumber);
        transactions.push({
          type: 'Deposit',
          user: event.returnValues.user,
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          timestamp: new Date(block.timestamp * 1000),
          hash: event.transactionHash
        });
      }

      for (let event of withdrawals) {
        const block = await web3.eth.getBlock(event.blockNumber);
        transactions.push({
          type: 'Withdrawal',
          user: event.returnValues.user,
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          timestamp: new Date(block.timestamp * 1000),
          hash: event.transactionHash
        });
      }

      for (let event of transfers) {
        const block = await web3.eth.getBlock(event.blockNumber);
        transactions.push({
          type: 'Transfer',
          from: event.returnValues.from,
          to: event.returnValues.to,
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          timestamp: new Date(block.timestamp * 1000),
          hash: event.transactionHash
        });
      }

      setAllTransactions(transactions.sort((a, b) => b.timestamp - a.timestamp));
      setStats(prev => ({
        ...prev,
        totalDeposits: deposits.length,
        totalWithdrawals: withdrawals.length,
        totalTransfers: transfers.length,
        totalVCs: vcIssued.length
      }));
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadStats = async () => {
    try {
      const nextTokenId = await contract.methods.nextTokenId().call();
      setStats(prev => ({ ...prev, totalVCs: parseInt(nextTokenId) - 1 }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadIssuedVCs = async () => {
    try {
      // Get all VCIssued events to find users with VCs
      const vcIssuedEvents = await contract.getPastEvents('VCIssued', { fromBlock: 0, toBlock: 'latest' });
      const vcsMap = new Map();

      for (let event of vcIssuedEvents) {
        const tokenId = event.returnValues.tokenId;
        const user = event.returnValues.user;
        const block = await web3.eth.getBlock(event.blockNumber);
        
        // Check if VC is valid using the contract's isValidVC function
        try {
          const isValid = await contract.methods.isValidVC(tokenId).call();
          vcsMap.set(tokenId, {
            tokenId,
            user,
            issuedAt: new Date(block.timestamp * 1000),
            ipfsCID: event.returnValues.ipfsCID,
            isValid: isValid
          });
        } catch (e) {
          // If there's any error checking validity, mark as invalid
          console.error(`Error checking validity of token ${tokenId}:`, e);
          vcsMap.set(tokenId, {
            tokenId,
            user,
            issuedAt: new Date(block.timestamp * 1000),
            ipfsCID: event.returnValues.ipfsCID,
            isValid: false
          });
        }
      }

      setIssuedVCs(Array.from(vcsMap.values()).sort((a, b) => b.issuedAt - a.issuedAt));
    } catch (error) {
      console.error('Error loading issued VCs:', error);
    }
  };

  const getFromBlock = (period, currentBlock) => {
    const blocksPerDay = Math.floor((24 * 60 * 60) / 15); // Assuming 15 sec block time
    switch (period) {
      case 'today':
        return Math.max(0, currentBlock - blocksPerDay);
      case 'week':
        return Math.max(0, currentBlock - blocksPerDay * 7);
      case 'month':
        return Math.max(0, currentBlock - blocksPerDay * 30);
      case 'year':
        return Math.max(0, currentBlock - blocksPerDay * 365);
      default:
        return 0;
    }
  };

  const handleApprove = async (requestId) => {
    if (!ipfsCID) {
      showToast('error', 'Please enter IPFS CID');
      return;
    }

    try {
      setLoading(true);
      await contract.methods.approveVCRequest(requestId, ipfsCID)
        .send({ from: account });
      
      showToast('success', 'VC Request approved successfully!');
      setSelectedRequest(null);
      setIpfsCID('');
      await loadDashboardData();
    } catch (error) {
      console.error('Error approving request:', error);
      showToast('error', error.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setLoading(true);
      await contract.methods.rejectVCRequest(requestId)
        .send({ from: account });
      
      showToast('success', 'VC Request rejected');
      setSelectedRequest(null);
      await loadDashboardData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast('error', error.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeVC = async (tokenId) => {
    if (!window.confirm('Are you sure you want to revoke this VC?')) return;

    try {
      setLoading(true);
      await contract.methods.revokeVC(tokenId)
        .send({ from: account });
      
      showToast('success', 'VC revoked successfully');
      await loadDashboardData();
    } catch (error) {
      console.error('Error revoking VC:', error);
      showToast('error', error.message || 'Failed to revoke VC');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionChartData = () => {
    const grouped = {};
    
    allTransactions.forEach(tx => {
      const date = tx.timestamp.toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = { date, deposits: 0, withdrawals: 0, transfers: 0 };
      }
      if (tx.type === 'Deposit') grouped[date].deposits++;
      if (tx.type === 'Withdrawal') grouped[date].withdrawals++;
      if (tx.type === 'Transfer') grouped[date].transfers++;
    });

    return Object.values(grouped).slice(-7); // Last 7 days
  };

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <div className="stat-label">Total VCs Issued</div>
            <div className="stat-value">{stats.totalVCs}</div>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Pending Requests</div>
            <div className="stat-value">{stats.pendingRequests}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📥</div>
          <div className="stat-content">
            <div className="stat-label">Total Deposits</div>
            <div className="stat-value">{stats.totalDeposits}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📤</div>
          <div className="stat-content">
            <div className="stat-label">Total Withdrawals</div>
            <div className="stat-value">{stats.totalWithdrawals}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-label">Total Transfers</div>
            <div className="stat-value">{stats.totalTransfers}</div>
          </div>
        </div>
      </div>

      {/* Pending VC Requests */}
      <div className="section">
        <h2>📋 Pending VC Requests</h2>
        {pendingRequests.length === 0 ? (
          <div className="empty-message">No pending requests</div>
        ) : (
          <div className="requests-list">
            {pendingRequests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div>
                    <strong>Request #{request.id}</strong>
                    <div className="request-address">{request.requester}</div>
                  </div>
                  <div className="request-time">
                    {request.requestedAt.toLocaleString()}
                  </div>
                </div>

                <div className="request-body">
                  <div className="kyc-data">
                    <strong>KYC Data:</strong>
                    <pre>{request.kycData}</pre>
                  </div>
                </div>

                {selectedRequest === request.id ? (
                  <div className="approve-form">
                    <input
                      type="text"
                      placeholder="IPFS CID (e.g., QmHash...)"
                      value={ipfsCID}
                      onChange={(e) => setIpfsCID(e.target.value)}
                      className="input"
                    />
                    <div className="button-group">
                      <button 
                        onClick={() => handleApprove(request.id)}
                        disabled={loading || !ipfsCID}
                        className="btn btn-success"
                      >
                        ✅ Approve & Issue VC
                      </button>
                      <button 
                        onClick={() => handleReject(request.id)}
                        disabled={loading}
                        className="btn btn-danger"
                      >
                        ❌ Reject
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedRequest(null);
                          setIpfsCID('');
                        }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="request-actions">
                    <button 
                      onClick={() => setSelectedRequest(request.id)}
                      className="btn btn-primary"
                    >
                      Process Request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issued VCs Management */}
      <div className="section">
        <h2>🎫 Issued VCs Management</h2>
        {issuedVCs.length === 0 ? (
          <div className="empty-message">No VCs issued yet</div>
        ) : (
          <div className="vcs-list">
            {issuedVCs.map(vc => (
              <div key={vc.tokenId} className={`vc-card ${!vc.isValid ? 'revoked' : ''}`}>
                <div className="vc-header">
                  <div>
                    <strong>VC #{vc.tokenId}</strong>
                    <div className="vc-address">{vc.user}</div>
                    <div className="vc-ipfs">IPFS: {vc.ipfsCID}</div>
                  </div>
                  <div className="vc-status">
                    <span className={`status-badge ${vc.isValid ? 'valid' : 'revoked'}`}>
                      {vc.isValid ? '✅ Active' : '❌ Revoked'}
                    </span>
                  </div>
                </div>

                <div className="vc-footer">
                  <small className="vc-date">Issued: {vc.issuedAt.toLocaleString()}</small>
                  {vc.isValid && (
                    <button 
                      onClick={() => handleRevokeVC(vc.tokenId)}
                      disabled={loading}
                      className="btn btn-danger btn-small"
                    >
                      🚫 Revoke VC
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Analytics */}
      <div className="section">
        <div className="section-header">
          <h2>📊 Transaction Analytics</h2>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {allTransactions.length > 0 && (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTransactionChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deposits" fill="#4CAF50" name="Deposits" />
                <Bar dataKey="withdrawals" fill="#FF9800" name="Withdrawals" />
                <Bar dataKey="transfers" fill="#2196F3" name="Transfers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="section">
        <h2>💳 Recent Transactions</h2>
        {allTransactions.length === 0 ? (
          <div className="empty-message">No transactions yet</div>
        ) : (
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>User/From</th>
                  <th>To</th>
                  <th>Amount (ETH)</th>
                  <th>Time</th>
                  <th>Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.slice(0, 20).map((tx, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className={`tx-type tx-${tx.type.toLowerCase()}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="address-cell">
                      {tx.user || tx.from}
                    </td>
                    <td className="address-cell">
                      {tx.to || '-'}
                    </td>
                    <td>{tx.amount}</td>
                    <td>{tx.timestamp.toLocaleString()}</td>
                    <td className="hash-cell">
                      {tx.hash.substring(0, 10)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
