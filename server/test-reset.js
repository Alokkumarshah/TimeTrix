const http = require('http');

const API_BASE_URL = 'http://localhost:4000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testPasswordReset() {
  console.log('=== TESTING PASSWORD RESET FLOW ===');
  
  try {
    // Step 1: Test forgot password
    console.log('\n1. Testing forgot password...');
    const forgotResponse = await makeRequest('POST', '/api/password/forgot', {
      email: 'admin@univ.edu'
    });
    console.log('Forgot password response:', forgotResponse);
    
    // If email fails, the token should be in the response
    if (forgotResponse.data.token) {
      console.log('Token received:', forgotResponse.data.token);
      
      // Step 2: Test token validation
      console.log('\n2. Testing token validation...');
      try {
        const validateResponse = await makeRequest('POST', '/api/password/validate-token', {
          token: forgotResponse.data.token
        });
        console.log('Token validation response:', validateResponse);
      } catch (error) {
        console.log('Token validation error:', error.message);
      }
      
      // Step 3: Test password reset
      console.log('\n3. Testing password reset...');
      try {
        const resetResponse = await makeRequest('POST', '/api/password/reset', {
          token: forgotResponse.data.token,
          password: 'newpassword123'
        });
        console.log('Password reset response:', resetResponse);
      } catch (error) {
        console.log('Password reset error:', error.message);
      }
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testPasswordReset();
