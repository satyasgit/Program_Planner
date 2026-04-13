// JIRA Connector for MCP Server
// Supports both JIRA Cloud and Data Center

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Base JIRA Connector Class
class JIRAConnector {
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.authType = config.authType || 'apiToken';
        this.credentials = config.credentials || {};
        this.version = config.version || 'latest';
        this.timeout = config.timeout || 30000;
        this.maxRetries = config.maxRetries || 3;
        this.rateLimitDelay = 1000; // 1 second delay between requests
        this.lastRequestTime = 0;
    }

    // Make HTTP request to JIRA
    async request(method, path, data = null, headers = {}) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await this.sleep(this.rateLimitDelay - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();

        const url = new URL(path, this.baseUrl);
        const options = {
            method: method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
                ...headers
            },
            timeout: this.timeout
        };

        return new Promise((resolve, reject) => {
            const protocol = url.protocol === 'https:' ? https : http;
            
            const req = protocol.request(options, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve({
                                status: res.statusCode,
                                data: body ? JSON.parse(body) : null,
                                headers: res.headers
                            });
                        } catch (error) {
                            resolve({
                                status: res.statusCode,
                                data: body,
                                headers: res.headers
                            });
                        }
                    } else {
                        reject({
                            status: res.statusCode,
                            message: body,
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject({
                    status: 0,
                    message: error.message,
                    error: error
                });
            });

            req.on('timeout', () => {
                req.destroy();
                reject({
                    status: 0,
                    message: 'Request timeout',
                    error: new Error('Request timeout')
                });
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    // Get authentication headers based on auth type
    getAuthHeaders() {
        switch (this.authType) {
            case 'apiToken':
                // For JIRA Cloud
                const auth = Buffer.from(
                    `${this.credentials.email}:${this.credentials.apiToken}`
                ).toString('base64');
                return { 'Authorization': `Basic ${auth}` };
                
            case 'basic':
                // For JIRA Data Center
                const basicAuth = Buffer.from(
                    `${this.credentials.username}:${this.credentials.password}`
                ).toString('base64');
                return { 'Authorization': `Basic ${basicAuth}` };
                
            case 'oauth':
                // OAuth 2.0
                return { 'Authorization': `Bearer ${this.credentials.accessToken}` };
                
            case 'pat':
                // Personal Access Token (Data Center)
                return { 'Authorization': `Bearer ${this.credentials.token}` };
                
            default:
                throw new Error(`Unsupported auth type: ${this.authType}`);
        }
    }

    // Retry logic for failed requests
    async requestWithRetry(method, path, data = null, headers = {}) {
        let lastError;
        
        for (let i = 0; i < this.maxRetries; i++) {
            try {
                return await this.request(method, path, data, headers);
            } catch (error) {
                lastError = error;
                
                // Don't retry on client errors (4xx)
                if (error.status >= 400 && error.status < 500) {
                    throw error;
                }
                
                // Wait before retrying
                if (i < this.maxRetries - 1) {
                    await this.sleep(Math.pow(2, i) * 1000); // Exponential backoff
                }
            }
        }
        
        throw lastError;
    }

    // Sleep utility
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Test connection
    async testConnection() {
        try {
            const response = await this.request('GET', '/rest/api/2/myself');
            return {
                success: true,
                user: response.data,
                message: 'Connection successful'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Connection failed',
                status: error.status
            };
        }
    }

    // Get server info
    async getServerInfo() {
        try {
            const response = await this.request('GET', '/rest/api/2/serverInfo');
            return response.data;
        } catch (error) {
            // Try alternative endpoint for older versions
            try {
                const response = await this.request('GET', '/rest/api/2/configuration');
                return response.data;
            } catch (fallbackError) {
                throw error;
            }
        }
    }

    // Project operations
    async getProjects(options = {}) {
        const params = new URLSearchParams();
        if (options.expand) params.append('expand', options.expand);
        if (options.recent) params.append('recent', options.recent);
        
        const path = `/rest/api/2/project${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.requestWithRetry('GET', path);
        return response.data;
    }

    async getProject(projectKey) {
        const response = await this.requestWithRetry('GET', `/rest/api/2/project/${projectKey}`);
        return response.data;
    }

    // Issue operations
    async searchIssues(jql, options = {}) {
        const data = {
            jql: jql,
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
            fields: options.fields || ['summary', 'status', 'assignee', 'priority'],
            expand: options.expand || []
        };
        
        const response = await this.requestWithRetry('POST', '/rest/api/2/search', data);
        return response.data;
    }

    async getIssue(issueKey, options = {}) {
        const params = new URLSearchParams();
        if (options.fields) params.append('fields', options.fields.join(','));
        if (options.expand) params.append('expand', options.expand.join(','));
        
        const path = `/rest/api/2/issue/${issueKey}${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.requestWithRetry('GET', path);
        return response.data;
    }

    async createIssue(issueData) {
        const response = await this.requestWithRetry('POST', '/rest/api/2/issue', issueData);
        return response.data;
    }

    async updateIssue(issueKey, updateData) {
        const response = await this.requestWithRetry('PUT', `/rest/api/2/issue/${issueKey}`, updateData);
        return response.data;
    }

    async deleteIssue(issueKey) {
        await this.requestWithRetry('DELETE', `/rest/api/2/issue/${issueKey}`);
        return { success: true, message: `Issue ${issueKey} deleted` };
    }

    // Comment operations
    async getComments(issueKey, options = {}) {
        const params = new URLSearchParams();
        if (options.startAt) params.append('startAt', options.startAt);
        if (options.maxResults) params.append('maxResults', options.maxResults);
        
        const path = `/rest/api/2/issue/${issueKey}/comment${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.requestWithRetry('GET', path);
        return response.data;
    }

    async addComment(issueKey, comment) {
        const data = typeof comment === 'string' ? { body: comment } : comment;
        const response = await this.requestWithRetry('POST', `/rest/api/2/issue/${issueKey}/comment`, data);
        return response.data;
    }

    // Transition operations
    async getTransitions(issueKey) {
        const response = await this.requestWithRetry('GET', `/rest/api/2/issue/${issueKey}/transitions`);
        return response.data;
    }

    async transitionIssue(issueKey, transitionId, fields = {}) {
        const data = {
            transition: { id: transitionId },
            fields: fields
        };
        await this.requestWithRetry('POST', `/rest/api/2/issue/${issueKey}/transitions`, data);
        return { success: true, message: `Issue ${issueKey} transitioned` };
    }

    // Field operations
    async getFields() {
        const response = await this.requestWithRetry('GET', '/rest/api/2/field');
        return response.data;
    }

    async getCreateMeta(projectKey, issueTypeId) {
        const params = new URLSearchParams({
            projectKeys: projectKey,
            issuetypeIds: issueTypeId,
            expand: 'projects.issuetypes.fields'
        });
        
        const response = await this.requestWithRetry('GET', `/rest/api/2/issue/createmeta?${params.toString()}`);
        return response.data;
    }

    // User operations
    async getCurrentUser() {
        const response = await this.requestWithRetry('GET', '/rest/api/2/myself');
        return response.data;
    }

    async searchUsers(query, options = {}) {
        const params = new URLSearchParams();
        params.append('query', query);
        if (options.startAt) params.append('startAt', options.startAt);
        if (options.maxResults) params.append('maxResults', options.maxResults);
        
        const response = await this.requestWithRetry('GET', `/rest/api/2/user/search?${params.toString()}`);
        return response.data;
    }

    // Sprint operations (Agile)
    async getSprint(sprintId) {
        const response = await this.requestWithRetry('GET', `/rest/agile/1.0/sprint/${sprintId}`);
        return response.data;
    }

    async getSprintIssues(sprintId, options = {}) {
        const params = new URLSearchParams();
        if (options.startAt) params.append('startAt', options.startAt);
        if (options.maxResults) params.append('maxResults', options.maxResults);
        
        const path = `/rest/agile/1.0/sprint/${sprintId}/issue${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.requestWithRetry('GET', path);
        return response.data;
    }

    // Board operations (Agile)
    async getBoards(options = {}) {
        const params = new URLSearchParams();
        if (options.projectKeyOrId) params.append('projectKeyOrId', options.projectKeyOrId);
        if (options.type) params.append('type', options.type);
        if (options.startAt) params.append('startAt', options.startAt);
        if (options.maxResults) params.append('maxResults', options.maxResults);
        
        const path = `/rest/agile/1.0/board${params.toString() ? '?' + params.toString() : ''}`;
        const response = await this.requestWithRetry('GET', path);
        return response.data;
    }

    // Bulk operations
    async bulkCreateIssues(issues) {
        const data = {
            issueUpdates: issues.map(issue => ({ fields: issue }))
        };
        const response = await this.requestWithRetry('POST', '/rest/api/2/issue/bulk', data);
        return response.data;
    }

    async bulkUpdateIssues(updates) {
        const response = await this.requestWithRetry('POST', '/rest/api/2/issue/bulk', { issueUpdates: updates });
        return response.data;
    }

    // JQL validation
    async validateJQL(jql) {
        try {
            const response = await this.requestWithRetry('POST', '/rest/api/2/jql/parse', { queries: [jql] });
            return {
                valid: true,
                data: response.data
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message || 'Invalid JQL'
            };
        }
    }

    // Webhook operations
    async getWebhooks() {
        const response = await this.requestWithRetry('GET', '/rest/webhooks/1.0/webhook');
        return response.data;
    }

    async createWebhook(webhook) {
        const response = await this.requestWithRetry('POST', '/rest/webhooks/1.0/webhook', webhook);
        return response.data;
    }

    async deleteWebhook(webhookId) {
        await this.requestWithRetry('DELETE', `/rest/webhooks/1.0/webhook/${webhookId}`);
        return { success: true, message: `Webhook ${webhookId} deleted` };
    }
}

// JIRA Cloud specific connector
class JIRACloudConnector extends JIRAConnector {
    constructor(config) {
        super(config);
        this.cloudId = config.cloudId;
        
        // Update base URL to include cloud ID if not already present
        if (this.cloudId && !this.baseUrl.includes(this.cloudId)) {
            this.baseUrl = `https://api.atlassian.com/ex/jira/${this.cloudId}`;
        }
    }

    // Get accessible resources (for multi-site access)
    async getAccessibleResources() {
        const response = await this.requestWithRetry('GET', 'https://api.atlassian.com/oauth/token/accessible-resources');
        return response.data;
    }

    // Cloud-specific API endpoints
    async getCloudId() {
        if (this.cloudId) return this.cloudId;
        
        const resources = await this.getAccessibleResources();
        if (resources && resources.length > 0) {
            this.cloudId = resources[0].id;
            return this.cloudId;
        }
        
        throw new Error('No accessible JIRA Cloud sites found');
    }
}

// JIRA Data Center specific connector
class JIRADataCenterConnector extends JIRAConnector {
    constructor(config) {
        super(config);
        
        // Data Center specific configurations
        this.verifySSL = config.verifySSL !== false;
        this.proxy = config.proxy;
    }

    // Data Center specific health check
    async getSystemHealth() {
        const response = await this.requestWithRetry('GET', '/rest/api/2/system/health');
        return response.data;
    }

    // Get cluster nodes (Data Center only)
    async getClusterNodes() {
        try {
            const response = await this.requestWithRetry('GET', '/rest/api/2/cluster/nodes');
            return response.data;
        } catch (error) {
            return { error: 'Cluster information not available (single node or no permission)' };
        }
    }

    // Get system info with performance metrics
    async getSystemInfo() {
        const response = await this.requestWithRetry('GET', '/rest/api/2/system/info');
        return response.data;
    }
}

// Factory function to create appropriate connector
function createJIRAConnector(config) {
    if (config.type === 'cloud') {
        return new JIRACloudConnector(config);
    } else if (config.type === 'datacenter' || config.type === 'server') {
        return new JIRADataCenterConnector(config);
    } else {
        // Auto-detect based on URL
        if (config.baseUrl.includes('atlassian.net') || config.baseUrl.includes('atlassian.com')) {
            return new JIRACloudConnector(config);
        } else {
            return new JIRADataCenterConnector(config);
        }
    }
}

// Export connectors and factory
module.exports = {
    JIRAConnector,
    JIRACloudConnector,
    JIRADataCenterConnector,
    createJIRAConnector
};