/**
 * IoT System Test Script
 * Tests all IoT endpoints without hardware
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const API_KEY = 'blockchain-banking-iot-secure-key-2025';

// Test configuration
const TEST_CARD = {
  cardToken: 'TEST_CRD_001',
  walletAddress: '0xYourGanacheWalletAddress', // Replace with actual Ganache address
  vcTokenId: 1,
  deviceId: 'test-device-001'
};

console.log('🧪 IoT System Test Suite\n');
console.log('========================================\n');

// Test 1: Health Check
async function testHealthCheck() {
  console.log('Test 1: Health Check');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is healthy');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  console.log('');
}

// Test 2: Register Card
async function testRegisterCard() {
  console.log('Test 2: Register RFID Card');
  try {
    const response = await axios.post(`${BASE_URL}/api/iot/register-card`, TEST_CARD);
    console.log('✅ Card registered successfully');
    console.log('   Card Data:', response.data.card);
  } catch (error) {
    console.log('❌ Card registration failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 3: Get Card Details
async function testGetCard() {
  console.log('Test 3: Get Card Details');
  try {
    const response = await axios.get(`${BASE_URL}/api/iot/card/${TEST_CARD.cardToken}`);
    console.log('✅ Card details retrieved');
    console.log('   Card:', response.data.card);
  } catch (error) {
    console.log('❌ Get card failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 4: Verify Transaction
async function testVerifyTransaction() {
  console.log('Test 4: VERIFY Transaction');
  try {
    const response = await axios.post(
      `${BASE_URL}/api/iot/transaction`,
      {
        cardToken: TEST_CARD.cardToken,
        deviceId: TEST_CARD.deviceId,
        transactionType: 'VERIFY'
      },
      {
        headers: {
          'x-device-api-key': API_KEY
        }
      }
    );
    console.log('✅ Verification successful');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Verification failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 5: Unauthorized Access
async function testUnauthorized() {
  console.log('Test 5: Unauthorized Access (should fail)');
  try {
    const response = await axios.post(
      `${BASE_URL}/api/iot/transaction`,
      {
        cardToken: TEST_CARD.cardToken,
        deviceId: TEST_CARD.deviceId,
        transactionType: 'VERIFY'
      },
      {
        headers: {
          'x-device-api-key': 'wrong-api-key'
        }
      }
    );
    console.log('❌ Should have failed but succeeded!');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly blocked unauthorized access');
    } else {
      console.log('⚠️ Unexpected error:', error.response?.data || error.message);
    }
  }
  console.log('');
}

// Test 6: Invalid Card
async function testInvalidCard() {
  console.log('Test 6: Invalid Card (should fail)');
  try {
    const response = await axios.post(
      `${BASE_URL}/api/iot/transaction`,
      {
        cardToken: 'INVALID_CARD',
        deviceId: TEST_CARD.deviceId,
        transactionType: 'VERIFY'
      },
      {
        headers: {
          'x-device-api-key': API_KEY
        }
      }
    );
    console.log('❌ Should have failed but succeeded!');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Correctly rejected invalid card');
      console.log('   Message:', error.response.data.message);
    } else {
      console.log('⚠️ Unexpected error:', error.response?.data || error.message);
    }
  }
  console.log('');
}

// Test 7: Deactivate Card
async function testDeactivateCard() {
  console.log('Test 7: Deactivate Card');
  try {
    const response = await axios.delete(`${BASE_URL}/api/iot/card/${TEST_CARD.cardToken}`);
    console.log('✅ Card deactivated successfully');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Deactivation failed:', error.response?.data || error.message);
  }
  console.log('');
}

// Test 8: Use Deactivated Card
async function testDeactivatedCard() {
  console.log('Test 8: Use Deactivated Card (should fail)');
  try {
    const response = await axios.post(
      `${BASE_URL}/api/iot/transaction`,
      {
        cardToken: TEST_CARD.cardToken,
        deviceId: TEST_CARD.deviceId,
        transactionType: 'VERIFY'
      },
      {
        headers: {
          'x-device-api-key': API_KEY
        }
      }
    );
    console.log('❌ Should have failed but succeeded!');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Correctly blocked deactivated card');
      console.log('   Message:', error.response.data.message);
    } else {
      console.log('⚠️ Unexpected error:', error.response?.data || error.message);
    }
  }
  console.log('');
}

// Run all tests
async function runTests() {
  console.log('Starting tests...\n');
  console.log('⚠️  NOTE: Make sure to update TEST_CARD.walletAddress with a real Ganache address!\n');
  console.log('========================================\n');

  await testHealthCheck();
  await testRegisterCard();
  await testGetCard();
  await testVerifyTransaction();
  await testUnauthorized();
  await testInvalidCard();
  await testDeactivateCard();
  await testDeactivatedCard();

  console.log('========================================');
  console.log('✅ All tests completed!\n');
  console.log('Next steps:');
  console.log('1. Update CONTRACT_ADDRESS and BANK_PRIVATE_KEY in .env');
  console.log('2. Deploy contract: truffle migrate --reset');
  console.log('3. Issue a VC to a user from frontend');
  console.log('4. Update TEST_CARD.walletAddress to that user');
  console.log('5. Run this test again\n');
}

runTests().catch(console.error);
