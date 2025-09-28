const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000';

async function testPasswordReset() {
  console.log('=== TESTING PASSWORD RESET FLOW ===');
  
  try {
    // Step 1: Test forgot password
    console.log('\n1. Testing forgot password...');
    const forgotResponse = await axios.post(`${API_BASE_URL}/api/password/forgot`, {
      email: 'test@example.com'
    });
    console.log('Forgot password response:', forgotResponse.data);
    
    // If email fails, the token should be in the response
    if (forgotResponse.data.token) {
      console.log('Token received:', forgotResponse.data.token);
      
      // Step 2: Test token validation
      console.log('\n2. Testing token validation...');
      try {
        const validateResponse = await axios.post(`${API_BASE_URL}/api/password/validate-token`, {
          token: forgotResponse.data.token
        });
        console.log('Token validation response:', validateResponse.data);
      } catch (error) {
        console.log('Token validation error:', error.response?.data || error.message);
      }
      
      // Step 3: Test password reset
      console.log('\n3. Testing password reset...');
      try {
        const resetResponse = await axios.post(`${API_BASE_URL}/api/password/reset`, {
          token: forgotResponse.data.token,
          password: 'newpassword123'
        });
        console.log('Password reset response:', resetResponse.data);
      } catch (error) {
        console.log('Password reset error:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

testPasswordReset();
