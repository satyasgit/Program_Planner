// MCP Server Test Script
// Manual testing since npm is not available

const http = require('http');

// Test configuration
const MCP_HOST = 'localhost';
const MCP_PORT = 3001;

// Helper function to make JSON-RPC requests
function makeRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: Date.now()
        });

        const options = {
            hostname: MCP_HOST,
            port: MCP_PORT,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(responseData);
                    if (response.error) {
                        reject(new Error(response.error.message));
                    } else {
                        resolve(response.result);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Test functions
async function testHealth() {
    console.log('\n=== Testing Health Check ===');
    try {
        const result = await makeRequest('system/health');
        console.log('✓ Health check passed:', result);
    } catch (error) {
        console.error('✗ Health check failed:', error.message);
    }
}

async function testConfig() {
    console.log('\n=== Testing Configuration ===');
    try {
        const result = await makeRequest('system/config');
        console.log('✓ Configuration retrieved:', result);
    } catch (error) {
        console.error('✗ Configuration failed:', error.message);
    }
}

async function testJiraAuth() {
    console.log('\n=== Testing JIRA Authentication ===');
    try {
        const result = await makeRequest('jira/authenticate', { type: 'cloud' });
        console.log('✓ JIRA authentication successful:', result);
    } catch (error) {
        console.error('✗ JIRA authentication failed:', error.message);
    }
}

async function testJiraFetchIssues() {
    console.log('\n=== Testing JIRA Fetch Issues ===');
    try {
        const result = await makeRequest('jira/fetchIssues', {
            jql: 'project = DEMO ORDER BY created DESC',
            maxResults: 5
        });
        console.log('✓ Issues fetched:', result);
    } catch (error) {
        console.error('✗ Fetch issues failed:', error.message);
    }
}

async function testJiraCreateIssue() {
    console.log('\n=== Testing JIRA Create Issue ===');
    try {
        const result = await makeRequest('jira/createIssue', {
            project: 'DEMO',
            summary: 'Test issue from MCP Server',
            description: 'This is a test issue created via MCP Server',
            issueType: 'Task'
        });
        console.log('✓ Issue created:', result);
    } catch (error) {
        console.error('✗ Create issue failed:', error.message);
    }
}

// Run all tests
async function runTests() {
    console.log('MCP Server Test Suite');
    console.log('====================');
    console.log(`Testing server at ${MCP_HOST}:${MCP_PORT}`);

    // Wait a bit for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testHealth();
    await testConfig();
    
    // Only run JIRA tests if configured
    const config = await makeRequest('system/config');
    if (config.jira.cloud.configured) {
        await testJiraAuth();
        await testJiraFetchIssues();
        // await testJiraCreateIssue(); // Commented out to avoid creating test issues
    } else {
        console.log('\n⚠️  JIRA not configured - skipping JIRA tests');
    }

    console.log('\n=== Test Suite Complete ===');
}

// Check if server is running
http.get(`http://${MCP_HOST}:${MCP_PORT}/`, (res) => {
    console.error('\n✗ Server is not an MCP server (returned HTML)');
    process.exit(1);
}).on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        console.error(`\n✗ MCP Server is not running on ${MCP_HOST}:${MCP_PORT}`);
        console.error('Please start the server first: node mcp-server/src/core/server.js');
    } else {
        console.error('\n✗ Error connecting to server:', err.message);
    }
    process.exit(1);
});

// Run tests
runTests().catch(console.error);