/**
 * JIRA Connector Tests
 * Tests for MCP Server JIRA integration functionality
 */

const assert = require('assert');
const { JiraConnector } = require('../connectors/jira-connector');

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

// Mock HTTP client
class MockHttpClient {
  constructor() {
    this.requests = [];
    this.responses = new Map();
  }
  
  setResponse(url, method, response) {
    const key = `${method}:${url}`;
    this.responses.set(key, response);
  }
  
  async request(options) {
    this.requests.push(options);
    const key = `${options.method}:${options.url}`;
    const response = this.responses.get(key);
    
    if (!response) {
      throw new Error(`No mock response for ${key}`);
    }
    
    if (response.error) {
      throw response.error;
    }
    
    return response;
  }
}

// JIRA Connector tests
const runner = new TestRunner('JIRA Connector Tests');

// Test 1: Cloud Instance Configuration
runner.test('should configure JIRA Cloud instance correctly', async () => {
  const connector = new JiraConnector({
    type: 'cloud',
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token-123'
  });
  
  assert.strictEqual(connector.type, 'cloud', 'type should be cloud');
  assert.strictEqual(connector.baseUrl, 'https://test.atlassian.net', 'baseUrl should match');
  assert.strictEqual(connector.authHeader.startsWith('Basic '), true, 'should use Basic auth');
});

// Test 2: Data Center Instance Configuration
runner.test('should configure JIRA Data Center instance correctly', async () => {
  const connector = new JiraConnector({
    type: 'datacenter',
    baseUrl: 'https://jira.company.com',
    username: 'testuser',
    password: 'testpass'
  });
  
  assert.strictEqual(connector.type, 'datacenter', 'type should be datacenter');
  assert.strictEqual(connector.baseUrl, 'https://jira.company.com', 'baseUrl should match');
  assert.strictEqual(connector.authHeader.startsWith('Basic '), true, 'should use Basic auth');
});

// Test 3: Get Projects
runner.test('should fetch projects list', async () => {
  const mockClient = new MockHttpClient();
  const connector = new JiraConnector({
    type: 'cloud',
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token'
  });
  
  // Replace the internal HTTP client with mock
  connector.makeRequest = mockClient.request.bind(mockClient);
  
  // Set mock response
  mockClient.setResponse(
    'https://test.atlassian.net/rest/api/3/project',
    'GET',
    {
      data: [
        { id: '10000', key: 'TEST', name: 'Test Project' },
        { id: '10001', key: 'DEMO', name: 'Demo Project' }
      ]
    }
  );
  
  const projects = await connector.getProjects();
  
  assert.strictEqual(Array.isArray(projects), true, 'should return array');
  assert.strictEqual(projects.length, 2, 'should have 2 projects');
  assert.strictEqual(projects[0].key, 'TEST', 'first project key should be TEST');
});

// Test 4: Create Issue
runner.test('should create JIRA issue', async () => {
  const mockClient = new MockHttpClient();
  const connector = new JiraConnector({
    type: 'cloud',
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token'
  });
  
  connector.makeRequest = mockClient.request.bind(mockClient);
  
  // Set mock response
  mockClient.setResponse(
    'https://test.atlassian.net/rest/api/3/issue',
    'POST',
    {
      data: {
        id: '10100',
        key: 'TEST-123',
        self: 'https://test.atlassian.net/rest/api/3/issue/10100'
      }
    }
  );
  
  const issueData = {
    fields: {
      project: { key: 'TEST' },
      summary: 'Test Issue',
      description: 'Test Description',
      issuetype: { name: 'Task' }
    }
  };
  
  const result = await connector.createIssue(issueData);
  
  assert.strictEqual(result.key, 'TEST-123', 'should return issue key');
  assert.strictEqual(mockClient.requests.length, 1, 'should make one request');
  assert.strictEqual(mockClient.requests[0].method, 'POST', 'should use POST method');
});

// Test 5: Update Issue
runner.test('should update JIRA issue', async () => {
  const mockClient = new MockHttpClient();
  const connector = new JiraConnector({
    type: 'cloud',
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token'
  });
  
  connector.makeRequest = mockClient.request.bind(mockClient);
  
  // Set mock response
  mockClient.setResponse(
    'https://test.atlassian.net/rest/api/3/issue/TEST-123',
    'PUT',
    { data: { success: true } }
  );
  
  const updateData = {
    fields: {
      summary: 'Updated Summary',
      description: 'Updated Description'
    }
  };
  
  await connector.updateIssue('TEST-123', updateData);
  
  assert.strictEqual(mockClient.requests.length, 1, 'should make one request');
  assert.strictEqual(mockClient.requests[0].method, 'PUT', 'should use PUT method');
});

// Test 6: Search Issues with JQL
runner.test('should search issues using JQL', async () => {
  const mockClient = new MockHttpClient();
  const connector = new JiraConnector({
    type: 'cloud',
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token'
  });
  
  connector.makeRequest = mockClient.request.bind(mockClient);
  
  // Set mock response
  mockClient.setResponse(
    'https://test.atlassian.net/rest/api/3/search',
    'POST',
    {
      data: {
        issues: [
          { key: 'TEST-1', fields: { summary: 'Issue 1' } },
          { key: 'TEST-2', fields: { summary: 'Issue 2' } }
        ],
        total: 2
      }
    }
  );
  
  const jql = 'project = TEST AND status = "In Progress"';
  const results = await connector.searchIssues(jql);
  
  assert.strictEqual(results.issues.length, 2, 'should return 2 issues');
  assert.strictEqual(results.total, 2, 'total should be 2');
});

// Test 7: Get Issue Details
runner.test('should fetch issue details', async () => {
  const mockClient = new MockHttpClient();
  const connector = new JiraConnector({
    type: 'cloud',
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token'
  });
  
  connector.makeRequest = mockClient.request.bind(mockClient);
  
  // Set mock response
  mockClient.setResponse(
    'https://test.atlassian.net/rest/api/3/issue/TEST-123',
    'GET',
    {
      data: {
        key: 'TEST-123',
        fields: {
          summary: 'Test Issue',
          description: 'Test Description',
          status: { name: 'In Progress' },
          assignee: { displayName: 'John Doe' }
        }
      }
    }
  );
  
  const issue = await connector.getIssue('TEST-123');
  
  assert.strictEqual(issue.key, 'TEST-123', 'should return correct issue');
  assert.strictEqual(issue.fields.status.name, 'In Progress', 'should have status');
});

// Test 8: Add Comment
runner.test('should add comment to issue', async () => {
  const mockClient = new MockHttpClient();
  const connector = new JiraConnector({
    type: 'cloud',
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token'
  });
  
  connector.makeRequest = mockClient.request.bind(mockClient);
  
  // Set mock response
  mockClient.setResponse(
    'https://test.atlassian.net/rest/api/3/issue/TEST-123/comment',
    'POST',
    {
      data: {
        id: '10000',
        body: 'Test comment',
        author: { displayName: 'Test User' }
      }
    }
  );
  
  const comment = await connector.addComment('TEST-123', 'Test comment');
  
  assert.strictEqual(comment.body, 'Test comment', 'should return comment');
});

// Test 9: Error Handling
runner.test('should handle API errors gracefully', async () => {
  const mockClient = new MockHttpClient();
  const connector = new JiraConnector({
    type: 'cloud',
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token'
  });
  
  connector.makeRequest = mockClient.request.bind(mockClient);
  
  // Set error response
  mockClient.setResponse(
    'https://test.atlassian.net/rest/api/3/issue/INVALID-999',
    'GET',
    {
      error: new Error('Issue does not exist')
    }
  );
  
  try {
    await connector.getIssue('INVALID-999');
    assert.fail('Should throw error');
  } catch (error) {
    assert.strictEqual(error.message, 'Issue does not exist', 'should throw correct error');
  }
});

// Test 10: Webhook Validation
runner.test('should validate JIRA webhooks', async () => {
  const connector = new JiraConnector({
    type: 'cloud',
    baseUrl: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiToken: 'test-token',
    webhookSecret: 'webhook-secret-123'
  });
  
  const payload = JSON.stringify({
    webhookEvent: 'jira:issue_created',
    issue: { key: 'TEST-123' }
  });
  
  const signature = connector.generateWebhookSignature(payload);
  const isValid = connector.validateWebhookSignature(payload, signature);
  
  assert.strictEqual(isValid, true, 'should validate correct signature');
  
  const isInvalid = connector.validateWebhookSignature(payload, 'wrong-signature');
  assert.strictEqual(isInvalid, false, 'should reject incorrect signature');
});

// Run all tests
async function runTests() {
  console.log('Starting JIRA Connector Tests...');
  const success = await runner.run();
  process.exit(success ? 0 : 1);
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});