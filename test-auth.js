const axios = require('axios');

async function testCredentialsLogin() {
  try {
    console.log('🧪 Testing Credentials Login...');
    
    // Step 1: Try to login with credentials
    const loginResponse = await axios.post('http://localhost:3000/api/auth/callback/credentials', {
      username: 'demo_agent',
      password: 'ABcd123#',
      redirect: 'false'
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('Login response status:', loginResponse.status);
    console.log('Login response data:', loginResponse.data);
    
    // Extract session cookie if available
    const cookies = loginResponse.headers['set-cookie'];
    if (cookies) {
      console.log('Session cookies received:', cookies);
      
      // Step 2: Test API with session
      const apiResponse = await axios.get('http://localhost:3000/api/dashboard/stats', {
        headers: {
          'Cookie': cookies.join('; ')
        }
      });
      
      console.log('API response status:', apiResponse.status);
      console.log('API response data:', apiResponse.data);
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.status, error.response?.data || error.message);
  }
}

testCredentialsLogin();