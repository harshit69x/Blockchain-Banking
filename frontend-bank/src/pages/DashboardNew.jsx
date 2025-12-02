import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, FileCheck, TrendingUp, Clock, CheckCircle, XCircle,
  Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, Search, 
  Award, Shield, AlertCircle, BarChart3, Activity, Zap, CreditCard
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { uploadKYCMetadata, testPinataConnection } from '../utils/pinataUpload';
import KYCDataViewer from '../components/KYCDataViewer';
import CardManagement from '../components/CardManagement';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function DashboardNew({ web3, account, contract, showToast }) {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [pinataReady, setPinataReady] = useState(false);

  useEffect(() => {
    if (contract) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 10000);
      return () => clearInterval(interval);
    }
  }, [contract, selectedPeriod]);

  useEffect(() => {
    // Test Pinata connection on mount
    testPinataConnection().then(setPinataReady);
  }, []);

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

      const [deposits, withdrawals, transfers] = await Promise.all([
        contract.getPastEvents('Deposit', { fromBlock, toBlock: 'latest' }),
        contract.getPastEvents('Withdraw', { fromBlock, toBlock: 'latest' }),
        contract.getPastEvents('Transfer', { fromBlock, toBlock: 'latest' })
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
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadStats = async () => {
    try {
      const nextTokenId = await contract.methods.nextTokenId().call();
      const totalVCs = parseInt(nextTokenId) - 1; // nextTokenId is counter, so VCs = counter - 1
      const totalDeposits = allTransactions.filter(t => t.type === 'Deposit').length;
      const totalWithdrawals = allTransactions.filter(t => t.type === 'Withdrawal').length;
      const totalTransfers = allTransactions.filter(t => t.type === 'Transfer').length;

      setStats(prev => ({
        ...prev,
        totalVCs: totalVCs > 0 ? totalVCs : 0,
        totalDeposits,
        totalWithdrawals,
        totalTransfers
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadIssuedVCs = async () => {
    try {
      const currentBlock = await web3.eth.getBlockNumber();
      const events = await contract.getPastEvents('VCIssued', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      const vcs = [];
      for (let event of events) {
        const tokenId = event.returnValues.tokenId;
        const user = event.returnValues.user;
        
        try {
          const isValid = await contract.methods.isValidVC(tokenId).call();
          const tokenURI = await contract.methods.tokenURI(tokenId).call();
          const block = await web3.eth.getBlock(event.blockNumber);

          vcs.push({
            tokenId,
            user,
            isValid: isValid,
            tokenURI,
            issuedAt: new Date(block.timestamp * 1000)
          });
        } catch (error) {
          console.error(`Error loading VC ${tokenId}:`, error);
        }
      }

      setIssuedVCs(vcs.sort((a, b) => b.issuedAt - a.issuedAt));
    } catch (error) {
      console.error('Error loading issued VCs:', error);
    }
  };

  const getFromBlock = (period, currentBlock) => {
    const blocksPerDay = 6500;
    switch (period) {
      case 'today': return Math.max(0, currentBlock - blocksPerDay);
      case 'week': return Math.max(0, currentBlock - (blocksPerDay * 7));
      case 'month': return Math.max(0, currentBlock - (blocksPerDay * 30));
      case 'all': return 0;
      default: return Math.max(0, currentBlock - blocksPerDay);
    }
  };

  const handleApproveRequest = async (request) => {
    if (!pinataReady) {
      showToast('⚠️ Pinata IPFS not configured. Check .env file', 'error');
      return;
    }

    setLoading(true);
    try {
      // Parse KYC data
      let kycData;
      try {
        kycData = JSON.parse(request.kycData);
      } catch (e) {
        showToast('❌ Invalid KYC data format', 'error');
        setLoading(false);
        return;
      }

      // Upload to IPFS via Pinata
      showToast('📤 Uploading to IPFS...', 'info');
      const ipfsCID = await uploadKYCMetadata(kycData, request.requester);
      
      showToast(`✅ Uploaded to IPFS: ${ipfsCID.substring(0, 10)}...`, 'success');

      // Approve VC with the CID
      await contract.methods.approveVCRequest(request.id, ipfsCID).send({ from: account });
      
      showToast('🎉 VC Request approved successfully!', 'success');
      setSelectedRequest(null);
      await loadDashboardData();
    } catch (error) {
      console.error('Error approving request:', error);
      showToast(`❌ Failed: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setLoading(true);
    try {
      await contract.methods.rejectVCRequest(requestId).send({ from: account });
      showToast('VC Request rejected', 'success');
      await loadDashboardData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast('Failed to reject request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeVC = async (tokenId) => {
    if (!window.confirm('Are you sure you want to revoke this VC?')) return;

    setLoading(true);
    try {
      await contract.methods.revokeVC(tokenId).send({ from: account });
      showToast('VC revoked successfully', 'success');
      await loadDashboardData();
    } catch (error) {
      console.error('Error revoking VC:', error);
      showToast('Failed to revoke VC', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const data = {};
    allTransactions.forEach(tx => {
      const date = tx.timestamp.toLocaleDateString();
      if (!data[date]) {
        data[date] = { date, Deposits: 0, Withdrawals: 0, Transfers: 0 };
      }
      data[date][`${tx.type}s`] = (data[date][`${tx.type}s`] || 0) + 1;
    });
    return Object.values(data).slice(-7);
  };

  const getTransactionTypeData = () => [
    { name: 'Deposits', value: stats.totalDeposits },
    { name: 'Withdrawals', value: stats.totalWithdrawals },
    { name: 'Transfers', value: stats.totalTransfers }
  ];

  const filteredTransactions = allTransactions.filter(tx => 
    tx.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ icon: Icon, label, value, trend, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              {trend >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl bg-gradient-to-br ${color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-width: 1400px mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Bank Admin Dashboard
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Manage verifiable credentials and monitor transactions
              </p>
            </div>
            <div className="flex items-center gap-4">
              {pinataReady ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  IPFS Ready
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  IPFS Not Configured
                </div>
              )}
              <button
                onClick={() => loadDashboardData()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-mono text-sm">
                {account?.substring(0, 6)}...{account?.substring(38)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Award}
            label="Total VCs Issued"
            value={stats.totalVCs}
            color="from-blue-500 to-blue-600"
            delay={0}
          />
          <StatCard
            icon={Clock}
            label="Pending Requests"
            value={stats.pendingRequests}
            color="from-orange-500 to-orange-600"
            delay={0.1}
          />
          <StatCard
            icon={TrendingUp}
            label="Total Transactions"
            value={stats.totalDeposits + stats.totalWithdrawals + stats.totalTransfers}
            color="from-green-500 to-green-600"
            delay={0.2}
          />
          <StatCard
            icon={Activity}
            label="Active VCs"
            value={issuedVCs.filter(vc => vc.isValid).length}
            color="from-purple-500 to-purple-600"
            delay={0.3}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'requests', label: 'VC Requests', icon: FileCheck },
              { id: 'issued', label: 'Issued VCs', icon: Shield },
              { id: 'transactions', label: 'Transactions', icon: Activity },
              { id: 'cards', label: 'RFID Cards', icon: CreditCard }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
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
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Transaction Chart */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Transaction Activity (Last 7 Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#666" fontSize={12} />
                      <YAxis stroke="#666" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Bar dataKey="Deposits" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Withdrawals" fill="#ef4444" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Transfers" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Transaction Types Pie Chart */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Transaction Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getTransactionTypeData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getTransactionTypeData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all cursor-pointer">
                    <FileCheck className="w-8 h-8 mb-2" />
                    <h4 className="font-semibold mb-1">Pending Requests</h4>
                    <p className="text-sm text-blue-100">{stats.pendingRequests} requests waiting</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all cursor-pointer">
                    <Shield className="w-8 h-8 mb-2" />
                    <h4 className="font-semibold mb-1">Active VCs</h4>
                    <p className="text-sm text-blue-100">{issuedVCs.filter(vc => vc.isValid).length} credentials active</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all cursor-pointer">
                    <Activity className="w-8 h-8 mb-2" />
                    <h4 className="font-semibold mb-1">Recent Activity</h4>
                    <p className="text-sm text-blue-100">{allTransactions.length} total transactions</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-blue-500" />
                Pending VC Requests ({pendingRequests.length})
              </h3>

              {pendingRequests.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No pending requests</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-5 h-5 text-blue-500" />
                            <h4 className="font-bold text-gray-900">Request #{request.id}</h4>
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                              Pending
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Requester:</strong>{' '}
                            <span className="font-mono">{request.requester.substring(0, 10)}...{request.requester.substring(32)}</span>
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Requested:</strong> {request.requestedAt.toLocaleString()}
                          </p>
                          <details className="mt-3">
                            <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1">
                              <Shield className="w-4 h-4" />
                              View Secure KYC Data
                            </summary>
                            <div className="mt-3">
                              <KYCDataViewer kycData={request.kycData} />
                            </div>
                          </details>
                        </div>

                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => handleApproveRequest(request)}
                            disabled={loading || !pinataReady}
                            className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            title={!pinataReady ? "Pinata IPFS not configured" : "Upload to IPFS and approve"}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'issued' && (
            <motion.div
              key="issued"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-500" />
                Issued VCs Management ({issuedVCs.length})
              </h3>

              {issuedVCs.length === 0 ? (
                <div className="text-center py-16">
                  <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No VCs issued yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {issuedVCs.map((vc, index) => (
                    <motion.div
                      key={vc.tokenId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`rounded-xl p-6 shadow-lg border-2 transition-all duration-300 ${
                        vc.isValid
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-xl'
                          : 'bg-gray-100 border-gray-300 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Shield className={`w-5 h-5 ${vc.isValid ? 'text-blue-500' : 'text-gray-400'}`} />
                          <h4 className="font-bold text-gray-900">VC #{vc.tokenId}</h4>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          vc.isValid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {vc.isValid ? '✓ Active' : '✗ Revoked'}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-xs text-gray-600">
                          <strong>User:</strong>
                        </p>
                        <p className="font-mono text-xs text-gray-800 break-all bg-white p-2 rounded">
                          {vc.user}
                        </p>
                        <p className="text-xs text-gray-600 mt-3">
                          <strong>IPFS:</strong>
                        </p>
                        <p className="font-mono text-xs text-gray-800 break-all bg-white p-2 rounded">
                          {vc.tokenURI}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Issued: {vc.issuedAt.toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        {vc.tokenURI && (
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${vc.tokenURI.replace('ipfs://', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View on IPFS
                          </a>
                        )}
                        {vc.isValid && (
                          <button
                            onClick={() => handleRevokeVC(vc.tokenId)}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 font-semibold text-sm shadow-md hover:shadow-lg"
                          >
                            Revoke VC
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'cards' && (
            <motion.div
              key="cards"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <CardManagement showToast={showToast} />
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-500" />
                  Transaction History ({filteredTransactions.length})
                </h3>
                <div className="flex gap-3 items-center w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-64 pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  </div>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-16">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredTransactions.map((tx, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
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
                              <Wallet className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{tx.type}</p>
                            <p className="text-sm text-gray-600 font-mono">
                              {tx.type === 'Transfer' 
                                ? `${tx.from.substring(0, 8)}... → ${tx.to.substring(0, 8)}...`
                                : `${tx.user.substring(0, 10)}...${tx.user.substring(32)}`
                              }
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {tx.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            tx.type === 'Deposit' ? 'text-green-600' :
                            tx.type === 'Withdrawal' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {tx.type === 'Deposit' ? '+' : tx.type === 'Withdrawal' ? '-' : ''}{tx.amount} ETH
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {tx.hash.substring(0, 10)}...
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

export default DashboardNew;
