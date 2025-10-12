// Test script to verify agents profile API
const testAPI = async () => {
  try {
    console.log('Testing /api/agents/profile endpoint...');
    
    const response = await fetch('http://localhost:3000/api/agents/profile', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API working! Data received:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Test without authentication (should return 401)
testAPI();