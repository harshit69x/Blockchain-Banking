import { useState, useEffect } from 'react';
import TokenCard from '../components/TokenCard';

function UserView({ web3, account, contract, showToast }) {
  const [loading, setLoading] = useState(false);
  const [userVCs, setUserVCs] = useState([]);
  const [balance, setBalance] = useState('0');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [userEvents, setUserEvents] = useState([]);
  const [contractBalance, setContractBalance] = useState('0');

  // Load user VCs
  const loadUserVCs = async () => {
    try {
      const tokenIds = await contract.methods.getUserVCs(account).call();
      
      const vcs = await Promise.all(tokenIds.map(async (tokenId) => {
        const tokenURI = await contract.methods.tokenURI(tokenId).call();
        const isValid = await contract.methods.isValidVC(tokenId).call();
        const isRevoked = await contract.methods.revoked(tokenId).call();
        
        return {
          tokenId: tokenId.toString(),
          tokenURI,
          isValid,
          isRevoked
        };
      }));
      
      setUserVCs(vcs);
    } catch (error) {
      console.error('Error loading VCs:', error);
    }
  };

  // Load user balance
  const loadBalance = async () => {
    try {
      const bal = await contract.methods.balance(account).call();
      setBalance(web3.utils.fromWei(bal, 'ether'));
      
      const contractBal = await contract.methods.getContractBalance().call();
      setContractBalance(web3.utils.fromWei(contractBal, 'ether'));
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  // Load user events
  const loadUserEvents = async () => {
    try {
      const allEvents = [];
      
      // Get user's deposits
      const depositEvents = await contract.getPastEvents('Deposit', {
        filter: { user: account },
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      depositEvents.forEach(event => {
        allEvents.push({
          type: 'Deposit',
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          balanceAfter: web3.utils.fromWei(event.returnValues.balanceAfter, 'ether'),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
      });
      
      // Get user's withdrawals
      const withdrawEvents = await contract.getPastEvents('Withdraw', {
        filter: { user: account },
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      withdrawEvents.forEach(event => {
        allEvents.push({
          type: 'Withdraw',
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          balanceAfter: web3.utils.fromWei(event.returnValues.balanceAfter, 'ether'),
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
      });
      
      // Get VCs issued to user
      const vcIssuedEvents = await contract.getPastEvents('VCIssued', {
        filter: { to: account },
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      vcIssuedEvents.forEach(event => {
        allEvents.push({
          type: 'VCIssued',
          tokenId: event.returnValues.tokenId,
          ipfsCID: event.returnValues.ipfsCID,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
      });
      
      // Sort by block number (descending)
      allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      setUserEvents(allEvents);
      
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Deposit ETH
  const handleDeposit = async () => {
    try {
      setLoading(true);
      
      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        showToast('error', 'Please enter a valid amount');
        return;
      }

      const amountWei = web3.utils.toWei(depositAmount, 'ether');
      
      showToast('pending', 'Processing deposit...');
      
      const tx = await contract.methods.deposit().send({ 
        from: account,
        value: amountWei,
        gas: 300000
      });
      
      showToast('success', `Successfully deposited ${depositAmount} ETH`, tx.transactionHash);
      
      setDepositAmount('');
      loadBalance();
      loadUserEvents();
      
    } catch (error) {
      console.error('Error depositing:', error);
      showToast('error', error.message || 'Failed to deposit');
    } finally {
      setLoading(false);
    }
  };

  // Withdraw ETH
  const handleWithdraw = async () => {
    try {
      setLoading(true);
      
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
        showToast('error', 'Please enter a valid amount');
        return;
      }

      const amountWei = web3.utils.toWei(withdrawAmount, 'ether');
      
      showToast('pending', 'Processing withdrawal...');
      
      const tx = await contract.methods.withdraw(amountWei).send({ 
        from: account,
        gas: 300000
      });
      
      showToast('success', `Successfully withdrew ${withdrawAmount} ETH`, tx.transactionHash);
      
      setWithdrawAmount('');
      loadBalance();
      loadUserEvents();
      
    } catch (error) {
      console.error('Error withdrawing:', error);
      showToast('error', error.message || 'Failed to withdraw');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and account change
  useEffect(() => {
    if (contract && account) {
      loadUserVCs();
      loadBalance();
      loadUserEvents();
    }
  }, [contract, account]);

  const hasValidVC = userVCs.some(vc => vc.isValid);

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>👤 User Dashboard</h2>
      
      {/* Balance Display */}
      <div className="card">
        <h3 className="card-title">Your Balance</h3>
        <div className="balance-display">{balance} ETH</div>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          Contract Total: {contractBalance} ETH
        </div>
      </div>

      {/* Verifiable Credentials */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Verifiable Credentials</h3>
          <button className="btn btn-secondary" onClick={loadUserVCs}>
            🔄 Refresh
          </button>
        </div>
        
        {userVCs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎫</div>
            <div className="empty-state-text">No Verifiable Credentials found</div>
          </div>
        ) : (
          <div className="grid">
            {userVCs.map((vc) => (
              <TokenCard key={vc.tokenId} vc={vc} />
            ))}
          </div>
        )}
      </div>

      {/* Deposit/Withdraw Section */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Deposit */}
        <div className="card">
          <h3 className="card-title">💰 Deposit ETH</h3>
          
          {!hasValidVC && (
            <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '8px', marginBottom: '15px' }}>
              <strong>⚠️ Warning:</strong> You need a valid VC to deposit
            </div>
          )}
          
          <div className="form-group">
            <label>Amount (ETH)</label>
            <input
              type="number"
              step="0.001"
              placeholder="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={!hasValidVC}
            />
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleDeposit}
            disabled={loading || !depositAmount || !hasValidVC}
          >
            📥 Deposit
          </button>
        </div>

        {/* Withdraw */}
        <div className="card">
          <h3 className="card-title">💸 Withdraw ETH</h3>
          
          <div className="form-group">
            <label>Amount (ETH)</label>
            <input
              type="number"
              step="0.001"
              placeholder="0.01"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-success" 
            onClick={handleWithdraw}
            disabled={loading || !withdrawAmount || parseFloat(balance) === 0}
          >
            📤 Withdraw
          </button>
          
          <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
            Available: {balance} ETH
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Transaction History</h3>
          <button className="btn btn-secondary" onClick={loadUserEvents}>
            🔄 Refresh
          </button>
        </div>

        <div className="transaction-list">
          {userEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <div className="empty-state-text">No transactions yet</div>
            </div>
          ) : (
            userEvents.map((event, index) => (
              <div key={index} className="transaction-item">
                <div className="type">
                  {event.type === 'Deposit' && '📥 Deposit'}
                  {event.type === 'Withdraw' && '📤 Withdrawal'}
                  {event.type === 'VCIssued' && '🎫 VC Issued'}
                </div>
                <div className="details">
                  {event.type === 'VCIssued' ? (
                    <>
                      <div>Token ID: #{event.tokenId}</div>
                      <div>IPFS CID: {event.ipfsCID}</div>
                    </>
                  ) : (
                    <>
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
  );
}

export default UserView;
