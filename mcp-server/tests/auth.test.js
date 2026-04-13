/**
 * Authentication Middleware Tests
 * Tests for MCP Server authentication functionality
 */

const assert = require('assert');
const http = require('http');
const { AuthMiddleware } = require('../middleware/auth');

// Test utilities
class TestRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }
  
  test(description, fn) {
    this.tests.push({ description, fn });
  }
  
  async run() {
    console.log(`\n=== Running ${this.name} ===\n`);
    
    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`✓ ${test.description}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${test.description}`);
        console.log(`  Error: ${error.message}`);
        console.log(`  Stack: ${error.stack}`);
      }
    }
    
    console.log(`\n=== Results: ${this.passed} passed, ${this.failed} failed ===\n`);
    return this.failed === 0;
  }
}

// Mock request/response objects
function createMockRequest(headers = {}, body = {}) {
  return {
    headers,
    body,
    query: {},
    params: {},
    method: 'GET',
    url: '/test'
  };
}

function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    
    status(code) {
      this.statusCode = code;
      return this;
    },
    
    json(data) {
      this.headers['Content-Type'] = 'application/json';
      this.data = data;
      return this;
    },
    
    send(data) {
      this.data = data;
      return this;
    },
    
    set(key, value) {
      this.headers[key] = value;
      return this;
    }
  };
  
  return res;
}

// Authentication tests
const runner = new TestRunner('Authentication Middleware Tests');

// Test 1: API Token Authentication - Valid Token
runner.test('should authenticate valid API token', async () => {
  const auth = new AuthMiddleware();
  const req = createMockRequest({
    'authorization': 'Bearer test-api-token-123'
  });
  const res = createMockResponse();
  let nextCalled = false;
  
  await auth.authenticate(req, res, () => {
    nextCalled = true;
  });
  
  assert.strictEqual(nextCalled, true, 'next() should be called');
  assert.strictEqual(req.user.type, 'api_token', 'user type should be api_token');
});

// Test 2: API Token Authentication - Missing Token
runner.test('should reject missing API token', async () => {
  const auth = new AuthMiddleware();
  const req = createMockRequest({});
  const res = createMockResponse();
  let nextCalled = false;
  
  await auth.authenticate(req, res, () => {
    nextCalled = true;
  });
  
  assert.strictEqual(nextCalled, false, 'next() should not be called');
  assert.strictEqual(res.statusCode, 401, 'status should be 401');
  assert.strictEqual(res.data.error, 'Authentication required', 'should return error message');
});

// Test 3: Basic Authentication - Valid Credentials
runner.test('should authenticate valid basic auth credentials', async () => {
  const auth = new AuthMiddleware();
  const credentials = Buffer.from('testuser:testpass').toString('base64');
  const req = createMockRequest({
    'authorization': `Basic ${credentials}`
  });
  const res = createMockResponse();
  let nextCalled = false;
  
  await auth.authenticate(req, res, () => {
    nextCalled = true;
  });
  
  assert.strictEqual(nextCalled, true, 'next() should be called');
  assert.strictEqual(req.user.type, 'basic', 'user type should be basic');
  assert.strictEqual(req.user.username, 'testuser', 'username should match');
});

// Test 4: Basic Authentication - Invalid Format
runner.test('should reject invalid basic auth format', async () => {
  const auth = new AuthMiddleware();
  const req = createMockRequest({
    'authorization': 'Basic invalid-base64-!@#$'
  });
  const res = createMockResponse();
  let nextCalled = false;
  
  await auth.authenticate(req, res, () => {
    nextCalled = true;
  });
  
  assert.strictEqual(nextCalled, false, 'next() should not be called');
  assert.strictEqual(res.statusCode, 401, 'status should be 401');
});

// Test 5: OAuth Token Validation
runner.test('should validate OAuth token format', async () => {
  const auth = new AuthMiddleware();
  const req = createMockRequest({
    'authorization': 'Bearer oauth-token-with-valid-format-123456'
  });
  const res = createMockResponse();
  let nextCalled = false;
  
  await auth.authenticate(req, res, () => {
    nextCalled = true;
  });
  
  assert.strictEqual(nextCalled, true, 'next() should be called');
  assert.strictEqual(req.user.type, 'oauth', 'user type should be oauth when token matches OAuth pattern');
});

// Test 6: Rate Limiting
runner.test('should enforce rate limiting', async () => {
  const auth = new AuthMiddleware({ rateLimit: { windowMs: 1000, max: 2 } });
  const req = createMockRequest({
    'authorization': 'Bearer test-token'
  });
  req.ip = '127.0.0.1';
  const res = createMockResponse();
  
  // First request - should pass
  let nextCalled = false;
  await auth.authenticate(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, 'first request should pass');
  
  // Second request - should pass
  nextCalled = false;
  await auth.authenticate(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, 'second request should pass');
  
  // Third request - should be rate limited
  nextCalled = false;
  const res3 = createMockResponse();
  await auth.authenticate(req, res3, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, false, 'third request should be rate limited');
  assert.strictEqual(res3.statusCode, 429, 'status should be 429');
});

// Test 7: JIRA-specific Authentication
runner.test('should handle JIRA-specific auth headers', async () => {
  const auth = new AuthMiddleware();
  const req = createMockRequest({
    'x-atlassian-token': 'no-check',
    'authorization': 'Bearer jira-api-token'
  });
  const res = createMockResponse();
  let nextCalled = false;
  
  await auth.authenticate(req, res, () => {
    nextCalled = true;
  });
  
  assert.strictEqual(nextCalled, true, 'next() should be called');
  assert.strictEqual(req.jiraAuth, true, 'jiraAuth flag should be set');
});

// Test 8: Authorization Levels
runner.test('should check authorization levels', async () => {
  const auth = new AuthMiddleware();
  
  // Admin authorization
  const adminReq = createMockRequest({
    'authorization': 'Bearer admin-token-123'
  });
  adminReq.user = { role: 'admin' };
  
  const hasAdmin = auth.hasRole(adminReq, 'admin');
  assert.strictEqual(hasAdmin, true, 'should have admin role');
  
  // User trying to access admin
  const userReq = createMockRequest({
    'authorization': 'Bearer user-token-123'
  });
  userReq.user = { role: 'user' };
  
  const hasAdminAsUser = auth.hasRole(userReq, 'admin');
  assert.strictEqual(hasAdminAsUser, false, 'user should not have admin role');
});

// Test 9: Token Expiration
runner.test('should handle token expiration', async () => {
  const auth = new AuthMiddleware();
  const expiredToken = {
    token: 'expired-token',
    expiresAt: Date.now() - 3600000 // 1 hour ago
  };
  
  const isExpired = auth.isTokenExpired(expiredToken);
  assert.strictEqual(isExpired, true, 'token should be expired');
  
  const validToken = {
    token: 'valid-token',
    expiresAt: Date.now() + 3600000 // 1 hour from now
  };
  
  const isValid = auth.isTokenExpired(validToken);
  assert.strictEqual(isValid, false, 'token should not be expired');
});

// Test 10: Multiple Auth Methods
runner.test('should support multiple auth methods in order', async () => {
  const auth = new AuthMiddleware({
    authMethods: ['bearer', 'basic', 'apikey']
  });
  
  // Test with API key in header
  const req = createMockRequest({
    'x-api-key': 'test-api-key-123'
  });
  const res = createMockResponse();
  let nextCalled = false;
  
  await auth.authenticate(req, res, () => {
    nextCalled = true;
  });
  
  assert.strictEqual(nextCalled, true, 'next() should be called');
  assert.strictEqual(req.user.type, 'apikey', 'user type should be apikey');
});

// Run all tests
async function runTests() {
  console.log('Starting Authentication Middleware Tests...');
  const success = await runner.run();
  process.exit(success ? 0 : 1);
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});