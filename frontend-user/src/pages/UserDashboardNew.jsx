import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, CreditCard, Send, ArrowDownRight, ArrowUpRight, 
  Shield, CheckCircle, XCircle, Clock, AlertCircle, FileText,
  TrendingUp, Activity, Plus, Minus, ArrowRight, Copy, ExternalLink,
  Award, Sparkles, Lock, Unlock, RefreshCw, Eye, EyeOff, Zap
} from 'lucide-react';
import KYCForm from '../components/KYCForm';
import IoTTestPanel from '../components/IoTTestPanel';

function UserDashboardNew({ web3, account, contract, showToast }) {
  const [vcStatus, setVcStatus] = useState(null);
  const [vcTokenId, setVcTokenId] = useState(null);
  const [vcTokenURI, setVcTokenURI] = useState(null);
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
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    if (contract && account) {
      loadUserData();
      const interval = setInterval(loadUserData, 5000);
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
      const tokenId = await contract.methods.userToTokenId(account).call();
      
      if (tokenId && tokenId !== '0') {
        const isValid = await contract.methods.isValidVC(tokenId).call();
        const isTokenRevoked = await contract.methods.revoked(tokenId).call();
        
        if (isTokenRevoked === true) {
          setVcStatus('revoked');
          setVcTokenId(null);
          setVcTokenURI(null);
        } else if (isValid === true) {
          setVcStatus('has-vc');
          setVcTokenId(tokenId);
          
          // Load token URI for IPFS link
          try {
            const uri = await contract.methods.tokenURI(tokenId).call();
            setVcTokenURI(uri);
          } catch (e) {
            console.error('Error loading token URI:', e);
          }
        } else {
          setVcStatus('none');
          setVcTokenId(null);
          setVcTokenURI(null);
        }
      } else {
        const requestIds = await contract.methods.getUserRequests(account).call();
        
        if (requestIds && requestIds.length > 0) {
          const lastRequestId = requestIds[requestIds.length - 1];
          const request = await contract.methods.vcRequests(lastRequestId).call();
          
          if (request.isPending) {
            setVcStatus('pending');
          } else if (request.isApproved) {
            setVcStatus('approved');
          } else if (request.isRejected) {
            setVcStatus('rejected');
          } else {
            setVcStatus('none');
          }
        } else {
          setVcStatus('none');
        }
      }
    } catch (error) {
      console.error('Error loading VC status:', error);
      setVcStatus('none');
    }
  };

  const loadBalance = async () => {
    try {
      // balance is a public mapping, access it directly
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
          isPending: request.isPending,
          isApproved: request.isApproved,
          isRejected: request.isRejected,
          requestedAt: new Date(parseInt(request.requestedAt) * 1000)
        });
      }

      setMyRequests(requests.sort((a, b) => b.requestedAt - a.requestedAt));
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
          type: 'Transfer Sent',
          to: event.returnValues.to,
          amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
          timestamp: new Date(block.timestamp * 1000),
          hash: event.transactionHash
        });
      }

      for (let event of transfersReceived) {
        if (event.returnValues.from === account) continue;
        const block = await web3.eth.getBlock(event.blockNumber);
        transactions.push({
          type: 'Transfer Received',
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

  const handleRequestVC = async (formData) => {
    // formData comes from KYCForm component as an object
    setLoading(true);
    try {
      // Convert form data object to JSON string for smart contract
      const kycDataString = JSON.stringify(formData);
      
      await contract.methods.requestVC(kycDataString).send({ from: account });
      showToast('VC request submitted successfully!', 'success');
      await loadUserData();
    } catch (error) {
      console.error('Error requesting VC:', error);
      showToast('Failed to request VC', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      showToast('Invalid deposit amount', 'error');
      return;
    }

    setLoading(true);
    try {
      const weiAmount = web3.utils.toWei(depositAmount, 'ether');
      await contract.methods.deposit().send({
        from: account,
        value: weiAmount
      });
      showToast('Deposit successful!', 'success');
      setDepositAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Error depositing:', error);
      showToast('Failed to deposit', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showToast('Invalid withdrawal amount', 'error');
      return;
    }

    setLoading(true);
    try {
      const weiAmount = web3.utils.toWei(withdrawAmount, 'ether');
      await contract.methods.withdraw(weiAmount).send({ from: account });
      showToast('Withdrawal successful!', 'success');
      setWithdrawAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Error withdrawing:', error);
      showToast('Failed to withdraw', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferTo || !web3.utils.isAddress(transferTo)) {
      showToast('Invalid recipient address', 'error');
      return;
    }

    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      showToast('Invalid transfer amount', 'error');
      return;
    }

    setLoading(true);
    try {
      const weiAmount = web3.utils.toWei(transferAmount, 'ether');
      await contract.methods.transferBalance(transferTo, weiAmount).send({ from: account });
      showToast('Transfer successful!', 'success');
      setTransferTo('');
      setTransferAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Error transferring:', error);
      showToast('Failed to transfer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    showToast('Address copied!', 'success');
  };

  const getVCStatusInfo = () => {
    switch (vcStatus) {
      case 'has-vc':
        return { icon: Shield, color: 'from-green-500 to-emerald-600', text: 'Verified', bg: 'bg-green-50', textColor: 'text-green-700' };
      case 'pending':
        return { icon: Clock, color: 'from-orange-500 to-orange-600', text: 'Pending', bg: 'bg-orange-50', textColor: 'text-orange-700' };
      case 'revoked':
        return { icon: XCircle, color: 'from-red-500 to-red-600', text: 'Revoked', bg: 'bg-red-50', textColor: 'text-red-700' };
      case 'rejected':
        return { icon: AlertCircle, color: 'from-red-500 to-red-600', text: 'Rejected', bg: 'bg-red-50', textColor: 'text-red-700' };
      default:
        return { icon: Shield, color: 'from-gray-400 to-gray-500', text: 'No VC', bg: 'bg-gray-50', textColor: 'text-gray-700' };
    }
  };

  const vcInfo = getVCStatusInfo();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                My Wallet
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Manage your credentials and finances
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadUserData()}
                disabled={loading}
                className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg">
                <Wallet className="w-4 h-4" />
                <span className="font-mono text-sm">
                  {account?.substring(0, 6)}...{account?.substring(38)}
                </span>
                <button onClick={copyAddress} className="hover:scale-110 transition-transform">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Balance & VC Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-6 h-6" />
                  <p className="text-purple-100">Available Balance</p>
                </div>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              
              <h2 className="text-5xl font-bold mb-6">
                {showBalance ? `${parseFloat(balance).toFixed(4)} ETH` : '••••••'}
              </h2>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('banking')}
                  className="flex-1 px-4 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Deposit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('banking')}
                  className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  Withdraw
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* VC Status Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`bg-gradient-to-br ${vcInfo.color} rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <vcInfo.icon className="w-8 h-8" />
                <p className="text-white/90">Credential Status</p>
              </div>
              
              <h2 className="text-4xl font-bold mb-2">{vcInfo.text}</h2>
              {vcTokenId && (
                <p className="text-white/80 text-sm mb-4">Token ID: #{vcTokenId}</p>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('vc')}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
              >
                {vcStatus === 'none' ? (
                  <>
                    <Plus className="w-4 h-4" />
                    Request VC
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    View Details
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'vc', label: 'Credentials', icon: Shield },
              { id: 'banking', label: 'Banking', icon: Wallet },
              { id: 'transfer', label: 'Transfer', icon: Send },
              { id: 'history', label: 'History', icon: FileText },
              { id: 'iot', label: 'IoT Testing', icon: Zap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-green-600">+12%</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">Total Transactions</p>
                  <h3 className="text-3xl font-bold text-gray-900">{myTransactions.length}</h3>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <ArrowDownRight className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">Total Deposits</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {myTransactions.filter(t => t.type === 'Deposit').length}
                  </h3>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">VC Requests</p>
                  <h3 className="text-3xl font-bold text-gray-900">{myRequests.length}</h3>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Welcome to Blockchain Banking!
                </h3>
                <p className="text-purple-100 mb-6">
                  Secure, transparent, and decentralized financial services powered by blockchain technology.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Shield className="w-8 h-8 mb-2" />
                    <h4 className="font-semibold mb-1">Secure Credentials</h4>
                    <p className="text-sm text-purple-100">Your identity protected on-chain</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Wallet className="w-8 h-8 mb-2" />
                    <h4 className="font-semibold mb-1">Digital Wallet</h4>
                    <p className="text-sm text-purple-100">Manage your funds securely</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <Send className="w-8 h-8 mb-2" />
                    <h4 className="font-semibold mb-1">Instant Transfers</h4>
                    <p className="text-sm text-purple-100">Send money instantly</p>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-500" />
                  Recent Activity
                </h3>
                {myTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTransactions.slice(0, 5).map((tx, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            tx.type === 'Deposit' ? 'bg-green-100' :
                            tx.type === 'Withdrawal' ? 'bg-red-100' :
                            'bg-blue-100'
                          }`}>
                            {tx.type === 'Deposit' ? (
                              <ArrowDownRight className="w-5 h-5 text-green-600" />
                            ) : tx.type === 'Withdrawal' ? (
                              <ArrowUpRight className="w-5 h-5 text-red-600" />
                            ) : (
                              <Send className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{tx.type}</p>
                            <p className="text-sm text-gray-500">
                              {tx.timestamp.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            tx.type === 'Deposit' || tx.type === 'Transfer Received' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tx.type === 'Deposit' || tx.type === 'Transfer Received' ? '+' : '-'}{tx.amount} ETH
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'vc' && (
            <motion.div
              key="vc"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-500" />
                Verifiable Credentials
              </h3>

              {vcStatus === 'none' && (
                <div>
                  <div className={`${vcInfo.bg} border-2 border-purple-200 rounded-2xl p-8 mb-6`}>
                    <Shield className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-gray-900 text-center mb-2">
                      Request Your Credential
                    </h4>
                    <p className="text-gray-600 text-center mb-6">
                      Complete the secure KYC form to get verified and access banking services
                    </p>
                  </div>
                  
                  <div className="max-w-4xl mx-auto">
                    <KYCForm onSubmit={handleRequestVC} loading={loading} />
                  </div>
                </div>
              )}

              {vcStatus === 'pending' && (
                <div className="text-center py-12">
                  <div className="relative inline-block mb-6">
                    <Clock className="w-24 h-24 text-orange-500 mx-auto animate-pulse" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Request Pending</h4>
                  <p className="text-gray-600 mb-6">
                    Your VC request is being reviewed by the bank admin
                  </p>
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-orange-50 text-orange-700 rounded-xl font-semibold">
                    <Clock className="w-5 h-5" />
                    Awaiting Approval
                  </div>
                </div>
              )}

              {vcStatus === 'has-vc' && (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-12 text-white mb-6 shadow-2xl">
                    <CheckCircle className="w-24 h-24 mx-auto mb-6 animate-pulse" />
                    <h4 className="text-3xl font-bold mb-2">Verified!</h4>
                    <p className="text-green-100 mb-6">
                      You have an active verifiable credential
                    </p>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 inline-block mb-4">
                      <p className="text-sm text-green-100 mb-1">Token ID</p>
                      <p className="text-2xl font-bold">#{vcTokenId}</p>
                    </div>
                    {vcTokenURI && (
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${vcTokenURI.replace('ipfs://', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View on IPFS
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <Unlock className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">Full Access</p>
                      <p className="text-sm text-gray-600">All banking features</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">Protected</p>
                      <p className="text-sm text-gray-600">On-chain verification</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <CheckCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900">Verified</p>
                      <p className="text-sm text-gray-600">KYC approved</p>
                    </div>
                  </div>
                </div>
              )}

              {vcStatus === 'revoked' && (
                <div className="text-center py-12">
                  <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Credential Revoked</h4>
                  <p className="text-gray-600 mb-6">
                    Your VC has been revoked. Please contact the bank for more information.
                  </p>
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-xl font-semibold">
                    <Lock className="w-5 h-5" />
                    Access Restricted
                  </div>
                </div>
              )}

              {vcStatus === 'rejected' && (
                <div className="text-center py-12">
                  <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Request Rejected</h4>
                  <p className="text-gray-600 mb-6">
                    Your VC request was not approved. You can submit a new request.
                  </p>
                  <button
                    onClick={() => setVcStatus('none')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all font-semibold"
                  >
                    Submit New Request
                  </button>
                </div>
              )}

              {/* Request History */}
              {myRequests.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Request History</h4>
                  <div className="space-y-3">
                    {myRequests.map((req, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-semibold text-gray-900">Request #{req.id}</p>
                          <p className="text-sm text-gray-500">
                            {req.requestedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          req.isPending ? 'bg-orange-100 text-orange-700' :
                          req.isApproved ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {req.isPending ? 'Pending' : req.isApproved ? 'Approved' : 'Rejected'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'banking' && (
            <motion.div
              key="banking"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Deposit Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Plus className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Deposit Funds</h3>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                  <p className="text-3xl font-bold text-green-600">{parseFloat(balance).toFixed(4)} ETH</p>
                </div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount (ETH):
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={vcStatus !== 'has-vc' || loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none text-lg mb-4 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />

                {vcStatus !== 'has-vc' && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-700">
                      You need a valid VC to make deposits
                    </p>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeposit}
                  disabled={loading || vcStatus !== 'has-vc'}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Deposit Now
                </motion.button>
              </div>

              {/* Withdraw Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <Minus className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Withdraw Funds</h3>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Available to Withdraw</p>
                  <p className="text-3xl font-bold text-red-600">{parseFloat(balance).toFixed(4)} ETH</p>
                </div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount (ETH):
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={vcStatus !== 'has-vc' || loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-lg mb-4 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />

                {vcStatus !== 'has-vc' && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-700">
                      You need a valid VC to make withdrawals
                    </p>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWithdraw}
                  disabled={loading || vcStatus !== 'has-vc'}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all disabled:opacity-50 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Minus className="w-5 h-5" />
                  Withdraw Now
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'transfer' && (
            <motion.div
              key="transfer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-2xl shadow-lg p-6 md:p-8 max-w-3xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Send Transfer</h3>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-8">
                <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-blue-600">{parseFloat(balance).toFixed(4)} ETH</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recipient Address:
                  </label>
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    placeholder="0x..."
                    disabled={vcStatus !== 'has-vc' || loading}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount (ETH):
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={vcStatus !== 'has-vc' || loading}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {vcStatus !== 'has-vc' && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-700">
                      You need a valid VC to transfer funds
                    </p>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTransfer}
                  disabled={loading || vcStatus !== 'has-vc'}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Transfer
                </motion.button>
              </div>

              <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Transfer Information
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Both sender and recipient must have valid VCs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>Transfers are instant and secure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>All transactions are recorded on the blockchain</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          )}

          {activeTab === 'iot' && (
            <motion.div
              key="iot"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <IoTTestPanel account={account} contract={contract} showToast={showToast} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-500" />
                Transaction History ({myTransactions.length})
              </h3>

              {myTransactions.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No transactions yet</p>
                  <p className="text-gray-400 text-sm mt-2">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {myTransactions.map((tx, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border-2 border-gray-100 hover:border-purple-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-4 rounded-xl ${
                            tx.type.includes('Deposit') || tx.type.includes('Received') ? 'bg-green-100' :
                            tx.type.includes('Withdrawal') || tx.type.includes('Sent') ? 'bg-red-100' :
                            'bg-blue-100'
                          }`}>
                            {tx.type.includes('Deposit') || tx.type.includes('Received') ? (
                              <ArrowDownRight className="w-6 h-6 text-green-600" />
                            ) : tx.type.includes('Withdrawal') || tx.type.includes('Sent') ? (
                              <ArrowUpRight className="w-6 h-6 text-red-600" />
                            ) : (
                              <Send className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-lg">{tx.type}</p>
                            {(tx.to || tx.from) && (
                              <p className="text-sm text-gray-600 font-mono mt-1">
                                {tx.type.includes('Sent') ? `To: ${tx.to?.substring(0, 10)}...` :
                                 tx.type.includes('Received') ? `From: ${tx.from?.substring(0, 10)}...` :
                                 ''}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <p className="text-xs text-gray-500">
                                {tx.timestamp.toLocaleString()}
                              </p>
                              <a
                                href={`https://etherscan.io/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            tx.type.includes('Deposit') || tx.type.includes('Received') ? 'text-green-600' :
                            'text-red-600'
                          }`}>
                            {tx.type.includes('Deposit') || tx.type.includes('Received') ? '+' : '-'}
                            {tx.amount} ETH
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default UserDashboardNew;
