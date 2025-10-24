#!/usr/bin/env node

const https = require('https');

const BASE_URL = 'https://backend-appointment-app-wqo0.onrender.com';
const FRONTEND_ORIGIN = 'https://kdbeauty.vercel.app';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  try {
    const response = await makeRequest(`${BASE_URL}/ping`);
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ CORS Origin: ${response.headers['access-control-allow-origin']}`);
    console.log(`✅ Response: ${response.data}`);
    return response.status === 200;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testCORS() {
  console.log('\n🌐 Testing CORS...');
  try {
    const response = await makeRequest(`${BASE_URL}/ping`);
    const corsOrigin = response.headers['access-control-allow-origin'];
    const corsMethods = response.headers['access-control-allow-methods'];
    
    console.log(`✅ CORS Origin: ${corsOrigin}`);
    console.log(`✅ CORS Methods: ${corsMethods}`);
    
    return corsOrigin && corsMethods;
  } catch (error) {
    console.log(`❌ CORS Error: ${error.message}`);
    return false;
  }
}

async function testLogin() {
  console.log('\n🔐 Testing admin login...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: {
        email: 'jamesdevers2021@gmail.com',
        password: 'admin123456'
      }
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response: ${response.data}`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      console.log(`✅ Login successful for: ${data.user?.name}`);
      return data.user;
    }
    return false;
  } catch (error) {
    console.log(`❌ Login Error: ${error.message}`);
    return false;
  }
}

async function testDatabase() {
  console.log('\n🗄️ Testing database connection...');
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response: ${response.data}`);
    return response.status === 200;
  } catch (error) {
    console.log(`❌ Database Error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Backend Tests...\n');
  
  const results = {
    health: await testHealthCheck(),
    cors: await testCORS(),
    login: await testLogin(),
    database: await testDatabase()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log(`🏥 Health Check: ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🌐 CORS: ${results.cors ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🔐 Login: ${results.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🗄️ Database: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Your backend is fully functional!');
  } else {
    console.log('\n⚠️ Some issues detected. Check the logs above.');
  }
}

runTests().catch(console.error);
