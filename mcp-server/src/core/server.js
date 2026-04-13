// MCP Server Core Implementation
// Week 2 - Manual Implementation (No npm dependencies)

const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const config = {
    port: process.env.MCP_PORT || 3001,
    host: process.env.MCP_HOST || 'localhost',
    logLevel: process.env.MCP_LOG_LEVEL || 'info',
    jira: {
        cloud: {
            url: process.env.JIRA_CLOUD_URL,
            email: process.env.JIRA_CLOUD_EMAIL,
            apiToken: process.env.JIRA_CLOUD_API_TOKEN
        },
        dc: {
            url: process.env.JIRA_DC_URL,
            username: process.env.JIRA_DC_USERNAME,
            password: process.env.JIRA_DC_PASSWORD
        }
    }
};

// Logger
class Logger {
    constructor(level = 'info') {
        this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
        this.currentLevel = this.levels[level] || 2;
    }

    log(level, message, data = {}) {
        if (this.levels[level] <= this.currentLevel) {
            const timestamp = new Date().toISOString();
            console.log(JSON.stringify({ timestamp, level, message, ...data }));
        }
    }

    error(message, data) { this.log('error', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    info(message, data) { this.log('info', message, data); }
    debug(message, data) { this.log('debug', message, data); }
}

const logger = new Logger(config.logLevel);

// MCP Server Class
class MCPServer {
    constructor() {
        this.handlers = new Map();
        this.setupHandlers();
    }

    setupHandlers() {
        // System handlers
        this.registerHandler('system/health', this.handleHealth.bind(this));
        this.registerHandler('system/config', this.handleConfig.bind(this));
        
        // JIRA handlers
        this.registerHandler('jira/authenticate', this.handleJiraAuth.bind(this));
        this.registerHandler('jira/fetchIssues', this.handleJiraFetchIssues.bind(this));
        this.registerHandler('jira/createIssue', this.handleJiraCreateIssue.bind(this));
        
        logger.info('Handlers registered', { count: this.handlers.size });
    }

    registerHandler(method, handler) {
        this.handlers.set(method, handler);
    }

    async handleRequest(request, response) {
        let body = '';
        
        request.on('data', chunk => {
            body += chunk.toString();
        });

        request.on('end', async () => {
            try {
                const rpcRequest = JSON.parse(body);
                logger.debug('Received request', { method: rpcRequest.method });

                if (!rpcRequest.jsonrpc || rpcRequest.jsonrpc !== '2.0') {
                    throw new Error('Invalid JSON-RPC version');
                }

                const handler = this.handlers.get(rpcRequest.method);
                if (!handler) {
                    throw new Error(`Method not found: ${rpcRequest.method}`);
                }

                const result = await handler(rpcRequest.params || {});
                
                const rpcResponse = {
                    jsonrpc: '2.0',
                    result,
                    id: rpcRequest.id
                };

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(rpcResponse));
                
            } catch (error) {
                logger.error('Request error', { error: error.message });
                
                const errorResponse = {
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: error.message
                    },
                    id: null
                };
                
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(errorResponse));
            }
        });
    }

    // System Handlers
    async handleHealth() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            uptime: process.uptime()
        };
    }

    async handleConfig() {
        return {
            jira: {
                cloud: {
                    configured: !!config.jira.cloud.url,
                    url: config.jira.cloud.url || 'Not configured'
                },
                dc: {
                    configured: !!config.jira.dc.url,
                    url: config.jira.dc.url || 'Not configured'
                }
            }
        };
    }

    // JIRA Handlers
    async handleJiraAuth(params) {
        const { type = 'cloud' } = params;
        
        if (type === 'cloud') {
            if (!config.jira.cloud.url || !config.jira.cloud.email || !config.jira.cloud.apiToken) {
                throw new Error('JIRA Cloud not configured');
            }
            
            // Test authentication
            const auth = Buffer.from(`${config.jira.cloud.email}:${config.jira.cloud.apiToken}`).toString('base64');
            const testUrl = `${config.jira.cloud.url}/rest/api/3/myself`;
            
            try {
                const response = await this.makeHttpRequest(testUrl, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Accept': 'application/json'
                    }
                });
                
                return {
                    authenticated: true,
                    user: response,
                    type: 'cloud'
                };
            } catch (error) {
                throw new Error(`Authentication failed: ${error.message}`);
            }
        }
        
        throw new Error('Only JIRA Cloud authentication implemented');
    }

    async handleJiraFetchIssues(params) {
        const { jql, fields = ['summary', 'status', 'assignee'], maxResults = 50 } = params;
        
        if (!jql) {
            throw new Error('JQL query required');
        }
        
        const auth = Buffer.from(`${config.jira.cloud.email}:${config.jira.cloud.apiToken}`).toString('base64');
        const searchUrl = `${config.jira.cloud.url}/rest/api/3/search`;
        
        const searchParams = {
            jql,
            startAt: 0,
            maxResults,
            fields: fields.join(',')
        };
        
        try {
            const response = await this.makeHttpRequest(
                `${searchUrl}?${querystring.stringify(searchParams)}`,
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Accept': 'application/json'
                    }
                }
            );
            
            return response;
        } catch (error) {
            throw new Error(`Failed to fetch issues: ${error.message}`);
        }
    }

    async handleJiraCreateIssue(params) {
        const { project, summary, description, issueType = 'Task' } = params;
        
        if (!project || !summary) {
            throw new Error('Project and summary are required');
        }
        
        const auth = Buffer.from(`${config.jira.cloud.email}:${config.jira.cloud.apiToken}`).toString('base64');
        const createUrl = `${config.jira.cloud.url}/rest/api/3/issue`;
        
        const issueData = {
            fields: {
                project: { key: project },
                summary,
                description: {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: description || ''
                                }
                            ]
                        }
                    ]
                },
                issuetype: { name: issueType }
            }
        };
        
        try {
            const response = await this.makeHttpRequest(createUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(issueData)
            });
            
            return response;
        } catch (error) {
            throw new Error(`Failed to create issue: ${error.message}`);
        }
    }

    // HTTP Request Helper
    makeHttpRequest(requestUrl, options = {}) {
        return new Promise((resolve, reject) => {
            const parsedUrl = url.parse(requestUrl);
            const isHttps = parsedUrl.protocol === 'https:';
            const httpModule = isHttps ? https : http;
            
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.path,
                method: options.method || 'GET',
                headers: options.headers || {}
            };
            
            const req = httpModule.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(jsonData);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${jsonData.message || data}`));
                        }
                    } catch (error) {
                        reject(new Error(`Invalid JSON response: ${data}`));
                    }
                });
            });
            
            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    start() {
        const server = http.createServer(this.handleRequest.bind(this));
        
        server.listen(config.port, config.host, () => {
            logger.info('MCP Server started', { 
                host: config.host, 
                port: config.port,
                pid: process.pid
            });
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('Shutting down server');
            server.close(() => {
                logger.info('Server shut down');
                process.exit(0);
            });
        });
    }
}

// Start server
const mcpServer = new MCPServer();
mcpServer.start();

module.exports = MCPServer;