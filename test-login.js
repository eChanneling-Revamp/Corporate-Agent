const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with agent@gmail.com...')
    
    // Test login
    const loginResponse = await axios.post('http://localhost:3000/api/auth/callback/credentials', {
      email: 'agent@gmail.com',
      password: 'ABcd123#'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login response:', loginResponse.status);
    console.log('Cookies:', loginResponse.headers['set-cookie']);
    
    // Extract session cookie if available
    const cookies = loginResponse.headers['set-cookie'];
    if (cookies) {
      const sessionCookie = cookies.find(cookie => cookie.includes('next-auth'));
      console.log('Session cookie:', sessionCookie);
    }
    
  } catch (error) {
    console.error('Login test failed:', error.response?.status, error.response?.data || error.message);
  }
}

testLogin();