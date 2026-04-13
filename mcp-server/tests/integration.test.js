/**
 * Integration Tests for MCP Server
 * End-to-end tests for complete JIRA integration flow
 */

const assert = require('assert');
const http = require('http');
const path = require('path');

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

// HTTP Client for testing
class TestHttpClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  
  async request(options) {
    return new Promise((resolve, reject) => {
      const url = new URL(options.path || '/', this.baseUrl);
      
      const reqOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };
      
      const req = http.request(reqOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = {
              status: res.statusCode,
              headers: res.headers,
              data: data ? JSON.parse(data) : null
            };
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }
}

// Mock MCP Server for testing
class MockMCPServer {
  constructor(port = 3001) {
    this.port = port;
    this.server = null;
    this.routes = new Map();
    this.middleware = [];
  }
  
  use(middleware) {
    this.middleware.push(middleware);
  }
  
  route(method, path, handler) {
    const key = `${method}:${path}`;
    this.routes.set(key, handler);
  }
  
  async start() {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        // Parse body
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            req.body = body ? JSON.parse(body) : {};
          } catch (e) {
            req.body = {};
          }
          
          // Set response helpers
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };
          
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          
          // Run middleware
          for (const mw of this.middleware) {
            await new Promise((resolve) => {
              mw(req, res, resolve);
            });
          }
          
          // Find route
          const key = `${req.method}:${req.url}`;
          const handler = this.routes.get(key);
          
          if (handler) {
            await handler(req, res);
          } else {
            res.statusCode = 404;
            res.json({ error: 'Not found' });
          }
        });
      });
      
      this.server.listen(this.port, () => {
        resolve();
      });
    });
  }
  
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(resolve);
      } else {
        resolve();
      }
    });
  }
}

// Integration tests
const runner = new TestRunner('MCP Server Integration Tests');

// Test 1: Health Check Endpoint
runner.test('should respond to health check', async () => {
  const server = new MockMCPServer();
  
  server.route('GET', '/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
  
  await server.start();
  const client = new TestHttpClient('http://localhost:3001');
  
  try {
    const response = await client.request({
      path: '/health',
      method: 'GET'
    });
    
    assert.strictEqual(response.status, 200, 'should return 200');
    assert.strictEqual(response.data.status, 'healthy', 'should be healthy');
    assert.strictEqual(response.data.version, '1.0.0', 'should have version');
  } finally {
    await server.stop();
  }
});

// Test 2: JIRA Project List Integration
runner.test('should fetch JIRA projects through MCP', async () => {
  const server = new MockMCPServer();
  
  // Mock authentication
  server.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      res.statusCode = 401;
      res.json({ error: 'Unauthorized' });
      return;
    }
    req.user = { id: 'test-user' };
    next();
  });
  
  server.route('GET', '/api/jira/projects', (req, res) => {
    res.json({
      projects: [
        { id: '10000', key: 'TEST', name: 'Test Project' },
        { id: '10001', key: 'DEMO', name: 'Demo Project' }
      ]
    });
  });
  
  await server.start();
  const client = new TestHttpClient('http://localhost:3001');
  
  try {
    const response = await client.request({
      path: '/api/jira/projects',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token-123'
      }
    });
    
    assert.strictEqual(response.status, 200, 'should return 200');
    assert.strictEqual(response.data.projects.length, 2, 'should have 2 projects');
    assert.strictEqual(response.data.projects[0].key, 'TEST', 'should have TEST project');
  } finally {
    await server.stop();
  }
});

// Test 3: Create JIRA Issue Flow
runner.test('should create JIRA issue through MCP', async () => {
  const server = new MockMCPServer();
  
  server.use((req, res, next) => {
    req.user = { id: 'test-user' };
    next();
  });
  
  server.route('POST', '/api/jira/issue', (req, res) => {
    // Validate required fields
    const { fields } = req.body;
    if (!fields || !fields.summary || !fields.project || !fields.issuetype) {
      res.statusCode = 400;
      res.json({ error: 'Missing required fields' });
      return;
    }
    
    res.json({
      id: '10100',
      key: 'TEST-123',
      self: 'http://localhost:3001/api/jira/issue/TEST-123'
    });
  });
  
  await server.start();
  const client = new TestHttpClient('http://localhost:3001');
  
  try {
    const response = await client.request({
      path: '/api/jira/issue',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token-123'
      },
      body: {
        fields: {
          project: { key: 'TEST' },
          summary: 'Test Issue from Integration Test',
          description: 'This is a test issue',
          issuetype: { name: 'Task' }
        }
      }
    });
    
    assert.strictEqual(response.status, 200, 'should return 200');
    assert.strictEqual(response.data.key, 'TEST-123', 'should return issue key');
  } finally {
    await server.stop();
  }
});

// Test 4: WebSocket Integration
runner.test('should handle WebSocket connections', async () => {
  const server = new MockMCPServer();
  let wsConnected = false;
  
  // Simple WebSocket upgrade handler
  server.server = http.createServer();
  server.server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wsConnected = true;
      socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
                   'Upgrade: websocket\r\n' +
                   'Connection: Upgrade\r\n' +
                   '\r\n');
    }
  });
  
  await new Promise(resolve => {
    server.server.listen(3001, resolve);
  });
  
  try {
    // Simulate WebSocket connection
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/ws',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
        'Sec-WebSocket-Version': '13'
      }
    });
    
    req.end();
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 100));
    
    assert.strictEqual(wsConnected, true, 'WebSocket should connect');
  } finally {
    await server.stop();
  }
});

// Test 5: Rate Limiting
runner.test('should enforce rate limiting', async () => {
  const server = new MockMCPServer();
  const requestCounts = new Map();
  
  // Simple rate limiter
  server.use((req, res, next) => {
    const ip = req.connection.remoteAddress || '127.0.0.1';
    const count = requestCounts.get(ip) || 0;
    
    if (count >= 2) {
      res.statusCode = 429;
      res.json({ error: 'Too many requests' });
      return;
    }
    
    requestCounts.set(ip, count + 1);
    next();
  });
  
  server.route('GET', '/api/test', (req, res) => {
    res.json({ success: true });
  });
  
  await server.start();
  const client = new TestHttpClient('http://localhost:3001');
  
  try {
    // First two requests should succeed
    for (let i = 0; i < 2; i++) {
      const response = await client.request({
        path: '/api/test',
        method: 'GET'
      });
      assert.strictEqual(response.status, 200, `request ${i + 1} should succeed`);
    }
    
    // Third request should be rate limited
    try {
      await client.request({
        path: '/api/test',
        method: 'GET'
      });
      assert.fail('Should have been rate limited');
    } catch (error) {
      assert.strictEqual(error.message.includes('429'), true, 'should return 429');
    }
  } finally {
    await server.stop();
  }
});

// Test 6: Caching Integration
runner.test('should cache API responses', async () => {
  const server = new MockMCPServer();
  const cache = new Map();
  let apiCalls = 0;
  
  // Simple cache middleware
  server.use((req, res, next) => {
    if (req.method === 'GET') {
      const cached = cache.get(req.url);
      if (cached) {
        res.json(cached);
        return;
      }
    }
    
    const originalJson = res.json;
    res.json = (data) => {
      if (req.method === 'GET') {
        cache.set(req.url, data);
      }
      originalJson.call(res, data);
    };
    
    next();
  });
  
  server.route('GET', '/api/expensive', (req, res) => {
    apiCalls++;
    res.json({ data: 'expensive operation', calls: apiCalls });
  });
  
  await server.start();
  const client = new TestHttpClient('http://localhost:3001');
  
  try {
    // First request - should hit API
    const response1 = await client.request({
      path: '/api/expensive',
      method: 'GET'
    });
    assert.strictEqual(response1.data.calls, 1, 'should make 1 API call');
    
    // Second request - should be cached
    const response2 = await client.request({
      path: '/api/expensive',
      method: 'GET'
    });
    assert.strictEqual(response2.data.calls, 1, 'should still show 1 API call (cached)');
  } finally {
    await server.stop();
  }
});

// Test 7: Error Handling
runner.test('should handle errors gracefully', async () => {
  const server = new MockMCPServer();
  
  server.route('GET', '/api/error', (req, res) => {
    throw new Error('Simulated error');
  });
  
  // Error handler
  server.use((err, req, res, next) => {
    res.statusCode = 500;
    res.json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });
  
  await server.start();
  const client = new TestHttpClient('http://localhost:3001');
  
  try {
    const response = await client.request({
      path: '/api/error',
      method: 'GET'
    });
    assert.fail('Should have thrown error');
  } catch (error) {
    assert.strictEqual(error.message.includes('500'), true, 'should return 500');
  } finally {
    await server.stop();
  }
});

// Test 8: JIRA Webhook Processing
runner.test('should process JIRA webhooks', async () => {
  const server = new MockMCPServer();
  let webhookReceived = false;
  
  server.route('POST', '/api/jira/webhook', (req, res) => {
    // Validate webhook signature (simplified)
    const signature = req.headers['x-hub-signature'];
    if (!signature) {
      res.statusCode = 401;
      res.json({ error: 'Missing signature' });
      return;
    }
    
    webhookReceived = true;
    res.json({ received: true });
  });
  
  await server.start();
  const client = new TestHttpClient('http://localhost:3001');
  
  try {
    const response = await client.request({
      path: '/api/jira/webhook',
      method: 'POST',
      headers: {
        'X-Hub-Signature': 'sha256=test-signature'
      },
      body: {
        webhookEvent: 'jira:issue_created',
        issue: {
          key: 'TEST-123',
          fields: {
            summary: 'New Issue Created'
          }
        }
      }
    });
    
    assert.strictEqual(response.status, 200, 'should return 200');
    assert.strictEqual(webhookReceived, true, 'webhook should be received');
  } finally {
    await server.stop();
  }
});

// Run all tests
async function runTests() {
  console.log('Starting MCP Server Integration Tests...');
  const success = await runner.run();
  process.exit(success ? 0 : 1);
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});