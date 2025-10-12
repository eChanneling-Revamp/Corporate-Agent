const axios = require('axios');
const tough = require('tough-cookie');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;

// Setup axios with cookie support
axiosCookieJarSupport(axios);
const cookieJar = new tough.CookieJar();

async function testCompleteFlow() {
  try {
    console.log('🧪 Starting complete system test...\n');
    
    // Test 1: Login with test credentials
    console.log('1️⃣ Testing login...');
    const csrfResponse = await axios.get('http://localhost:3000/api/auth/csrf', {
      jar: cookieJar,
      withCredentials: true
    });
    
    const csrfToken = csrfResponse.data.csrfToken;
    console.log('✅ CSRF token obtained');
    
    const loginData = new URLSearchParams({
      username: 'demo_agent',
      password: 'ABcd123#',
      csrfToken: csrfToken,
      callbackUrl: 'http://localhost:3000/dashboard',
      json: 'true'
    });
    
    const loginResponse = await axios.post(
      'http://localhost:3000/api/auth/callback/credentials',
      loginData,
      {
        jar: cookieJar,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 400
      }
    );
    
    console.log('✅ Login request sent, status:', loginResponse.status);
    
    // Test 2: Check session
    console.log('\n2️⃣ Testing session...');
    const sessionResponse = await axios.get('http://localhost:3000/api/auth/session', {
      jar: cookieJar,
      withCredentials: true
    });
    
    if (sessionResponse.data.user) {
      console.log('✅ Session active for user:', sessionResponse.data.user.email);
    } else {
      console.log('❌ No active session found');
    }
    
    // Test 3: Test API endpoints with authentication
    console.log('\n3️⃣ Testing API endpoints...');
    
    const apiTests = [
      { name: 'Dashboard Stats', url: 'http://localhost:3000/api/dashboard/stats' },
      { name: 'Appointments', url: 'http://localhost:3000/api/appointments' },
      { name: 'Doctors', url: 'http://localhost:3000/api/doctors' },
      { name: 'Transactions', url: 'http://localhost:3000/api/transactions' },
      { name: 'Reports Analytics', url: 'http://localhost:3000/api/reports/analytics' },
      { name: 'Agent Profile', url: 'http://localhost:3000/api/agents/profile' },
      { name: 'Notifications', url: 'http://localhost:3000/api/notifications' }
    ];
    
    for (const test of apiTests) {
      try {
        const response = await axios.get(test.url, {
          jar: cookieJar,
          withCredentials: true,
          timeout: 10000
        });
        
        if (response.status === 200) {
          console.log(`✅ ${test.name}: SUCCESS (${response.status})`);
          
          // Show sample data for verification
          const data = response.data;
          if (Array.isArray(data)) {
            console.log(`   📊 Data: Array with ${data.length} items`);
          } else if (typeof data === 'object') {
            const keys = Object.keys(data);
            console.log(`   📊 Data: Object with keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
          }
        } else {
          console.log(`❌ ${test.name}: Failed (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: Error (${error.response?.status || 'Network'})`);
      }
    }
    
    console.log('\n🎉 System test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFlow();