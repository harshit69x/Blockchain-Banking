// Optional: Event Indexing Script for Backend
// This script demonstrates how to index blockchain events to a database
// Run with: node scripts/indexEvents.js

const Web3 = require('web3');
const BankVCArtifact = require('../build/contracts/BankVC.json');

// Configuration
const PROVIDER_URL = 'http://127.0.0.1:8545';
const NETWORK_ID = '5777'; // Update based on your Ganache network ID

async function indexEvents() {
  try {
    // Initialize Web3
    const web3 = new Web3(PROVIDER_URL);
    
    // Get contract address
    const networkData = BankVCArtifact.networks[NETWORK_ID];
    if (!networkData) {
      console.error('Contract not deployed on this network');
      return;
    }
    
    const contractAddress = networkData.address;
    const contract = new web3.eth.Contract(BankVCArtifact.abi, contractAddress);
    
    console.log('🔍 Indexing events from contract:', contractAddress);
    console.log('─────────────────────────────────────────────');
    
    // Get all events
    const events = {
      VCIssued: [],
      VCRevoked: [],
      Deposit: [],
      Withdraw: []
    };
    
    // Index VCIssued events
    const vcIssuedEvents = await contract.getPastEvents('VCIssued', {
      fromBlock: 0,
      toBlock: 'latest'
    });
    
    vcIssuedEvents.forEach(event => {
      events.VCIssued.push({
        tokenId: event.returnValues.tokenId,
        to: event.returnValues.to,
        ipfsCID: event.returnValues.ipfsCID,
        issuedAt: event.returnValues.issuedAt,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });
    
    // Index VCRevoked events
    const vcRevokedEvents = await contract.getPastEvents('VCRevoked', {
      fromBlock: 0,
      toBlock: 'latest'
    });
    
    vcRevokedEvents.forEach(event => {
      events.VCRevoked.push({
        tokenId: event.returnValues.tokenId,
        revokedBy: event.returnValues.revokedBy,
        revokedAt: event.returnValues.revokedAt,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });
    
    // Index Deposit events
    const depositEvents = await contract.getPastEvents('Deposit', {
      fromBlock: 0,
      toBlock: 'latest'
    });
    
    depositEvents.forEach(event => {
      events.Deposit.push({
        user: event.returnValues.user,
        amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
        balanceAfter: web3.utils.fromWei(event.returnValues.balanceAfter, 'ether'),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });
    
    // Index Withdraw events
    const withdrawEvents = await contract.getPastEvents('Withdraw', {
      fromBlock: 0,
      toBlock: 'latest'
    });
    
    withdrawEvents.forEach(event => {
      events.Withdraw.push({
        user: event.returnValues.user,
        amount: web3.utils.fromWei(event.returnValues.amount, 'ether'),
        balanceAfter: web3.utils.fromWei(event.returnValues.balanceAfter, 'ether'),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });
    
    // Display results
    console.log('\n📊 EVENT SUMMARY:');
    console.log('─────────────────────────────────────────────');
    console.log(`VCs Issued:    ${events.VCIssued.length}`);
    console.log(`VCs Revoked:   ${events.VCRevoked.length}`);
    console.log(`Deposits:      ${events.Deposit.length}`);
    console.log(`Withdrawals:   ${events.Withdraw.length}`);
    
    console.log('\n🎫 VC ISSUED EVENTS:');
    console.log('─────────────────────────────────────────────');
    events.VCIssued.forEach((event, index) => {
      console.log(`${index + 1}. Token #${event.tokenId}`);
      console.log(`   To: ${event.to}`);
      console.log(`   IPFS CID: ${event.ipfsCID}`);
      console.log(`   Block: ${event.blockNumber}`);
      console.log(`   TX: ${event.transactionHash}`);
      console.log('');
    });
    
    console.log('\n🚫 VC REVOKED EVENTS:');
    console.log('─────────────────────────────────────────────');
    events.VCRevoked.forEach((event, index) => {
      console.log(`${index + 1}. Token #${event.tokenId}`);
      console.log(`   Revoked By: ${event.revokedBy}`);
      console.log(`   Block: ${event.blockNumber}`);
      console.log(`   TX: ${event.transactionHash}`);
      console.log('');
    });
    
    console.log('\n💰 DEPOSIT EVENTS:');
    console.log('─────────────────────────────────────────────');
    events.Deposit.forEach((event, index) => {
      console.log(`${index + 1}. User: ${event.user}`);
      console.log(`   Amount: ${event.amount} ETH`);
      console.log(`   Balance After: ${event.balanceAfter} ETH`);
      console.log(`   Block: ${event.blockNumber}`);
      console.log(`   TX: ${event.transactionHash}`);
      console.log('');
    });
    
    console.log('\n💸 WITHDRAW EVENTS:');
    console.log('─────────────────────────────────────────────');
    events.Withdraw.forEach((event, index) => {
      console.log(`${index + 1}. User: ${event.user}`);
      console.log(`   Amount: ${event.amount} ETH`);
      console.log(`   Balance After: ${event.balanceAfter} ETH`);
      console.log(`   Block: ${event.blockNumber}`);
      console.log(`   TX: ${event.transactionHash}`);
      console.log('');
    });
    
    // In production, save to database
    // await saveToDatabase(events);
    
    console.log('✅ Event indexing completed!');
    
  } catch (error) {
    console.error('❌ Error indexing events:', error);
  }
}

// Run the indexer
indexEvents();
