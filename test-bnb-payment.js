/**
 * Test script for BNB Payment Integration
 * Run with: node test-bnb-payment.js
 */

console.log('🧪 Testing BNB Payment Integration\n');

// Test configuration validation
async function testConfiguration() {
  console.log('1️⃣ Testing Configuration...');
  
  try {
    const { validateBNBConfig } = await import('./lib/bnb-config.js');
    const validation = validateBNBConfig();
    
    if (validation.isValid) {
      console.log('✅ BNB configuration is valid');
      return true;
    } else {
      console.log('⚠️ BNB configuration missing:', validation.missingFields.join(', '));
      console.log('🔄 Will use mock mode for testing');
      return false;
    }
  } catch (error) {
    console.log('❌ Configuration test failed:', error.message);
    return false;
  }
}

// Test QR creation API
async function testQRCreation() {
  console.log('\n2️⃣ Testing QR Creation API...');
  
  try {
    const response = await fetch('http://localhost:3001/api/payment/create-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'test_order_123',
        amount: 50,
        currency: 'BOB'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ QR Creation successful');
    console.log(`   Transaction ID: ${data.transactionId}`);
    console.log(`   Mock Mode: ${data.isMock ? 'Yes' : 'No'}`);
    console.log(`   QR Image: ${data.qrImageUrl ? 'Generated' : 'Missing'}`);
    
    if (data.message) {
      console.log(`   Message: ${data.message}`);
    }
    
    return data.transactionId;
  } catch (error) {
    console.log('❌ QR Creation failed:', error.message);
    return null;
  }
}

// Test payment status API
async function testPaymentStatus(transactionId) {
  if (!transactionId) {
    console.log('\n⏭️ Skipping payment status test (no transaction ID)');
    return;
  }
  
  console.log('\n3️⃣ Testing Payment Status API...');
  
  try {
    const response = await fetch(`http://localhost:3001/api/payment/status?transactionId=${transactionId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Payment Status check successful');
    console.log(`   Status: ${data.status}`);
    console.log(`   Mock Mode: ${data.isMock ? 'Yes' : 'No'}`);
    
    if (data.message) {
      console.log(`   Message: ${data.message}`);
    }
    
    return data.status;
  } catch (error) {
    console.log('❌ Payment Status check failed:', error.message);
    return null;
  }
}

// Test reconciliation API (if BNB is configured)
async function testReconciliation(hasValidConfig) {
  console.log('\n4️⃣ Testing Reconciliation API...');
  
  if (!hasValidConfig) {
    console.log('⏭️ Skipping reconciliation test (BNB not configured)');
    return;
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`http://localhost:3001/api/payment/reconciliation?date=${today}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Reconciliation API successful');
    console.log(`   Date: ${data.date}`);
    console.log(`   Total QRs: ${data.totalQRs || 0}`);
    
  } catch (error) {
    console.log('❌ Reconciliation test failed:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('Starting BNB Payment Integration Tests...\n');
  
  try {
    // Test 1: Configuration
    const hasValidConfig = await testConfiguration();
    
    // Test 2: QR Creation
    const transactionId = await testQRCreation();
    
    // Test 3: Payment Status
    await testPaymentStatus(transactionId);
    
    // Test 4: Reconciliation (only if BNB configured)
    await testReconciliation(hasValidConfig);
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📝 Next Steps:');
    
    if (!hasValidConfig) {
      console.log('   1. Add BNB credentials to .env.local for real testing');
      console.log('   2. Contact BNB to get accountId and authorizationId');
    } else {
      console.log('   1. Test with actual payments in BNB sandbox');
      console.log('   2. Deploy to production with production credentials');
    }
    
    console.log('   3. Monitor payments using the reconciliation API');
    console.log('   4. Set up payment monitoring and alerts');
    
  } catch (error) {
    console.log('\n💥 Test runner failed:', error.message);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests }; 