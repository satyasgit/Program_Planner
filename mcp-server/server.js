// MCP Server - Pure Node.js Implementation
// No external dependencies required due to npm issues

const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load configuration from environment variables
const config = {
  port: process.env.MCP_PORT || 3001,
  jiraCloudUrl: process.env.JIRA_CLOUD_URL,
  jiraEmail: process.env.JIRA_EMAIL,
  jiraApiToken: process.env.JIRA_API_TOKEN,
  jiraDcUrl: process.env.JIRA_DC_URL,
  jiraDcUsername: process.env.JIRA_DC_USERNAME,
  jiraDcPassword: process.env.JIRA_DC_PASSWORD,
  postgresHost: process.env.DB_HOST || 'localhost',
  postgresPort: process.env.DB_PORT || 5435,
  postgresDatabase: process.env.DB_NAME || 'program_planner',
  postgresUser: process.env.DB_USER || 'postgres',
  postgresPassword: process.env.DB_PASSWORD || 'postgres'
};

// Logger utility
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({
      timestamp,
      level,
      message,
      ...data
    }));
  }

  static info(message, data) {
    this.log('INFO', message, data);
  }

  static error(message, data) {
    this.log('ERROR', message, data);
  }

  static debug(message, data) {
    this.log('DEBUG', message, data);
  }
}

// Main MCP Server Class
class MCPServer {
  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
    this.routes = this.setupRoutes();
  }

  setupRoutes() {
    return {
      'GET /health': this.handleHealth.bind(this),
      'GET /api/jira/myself': this.handleJiraMyself.bind(this),
      'GET /api/jira/projects': this.handleJiraProjects.bind(this),
      'GET /api/jira/issues': this.handleJiraIssues.bind(this),
      'GET /api/jira/search': this.handleJiraSearch.bind(this),
      'POST /api/jira/issue': this.handleCreateIssue.bind(this),
      'GET /api/database/test': this.handleDatabaseTest.bind(this),
      'GET /api/config': this.handleConfig.bind(this)
    };
  }

  handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Handle preflight
    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Log request
    Logger.info('Incoming request', {
      method,
      pathname,
      query: parsedUrl.query
    });

    // Route matching
    const routeKey = `${method} ${pathname}`;
    const handler = this.routes[routeKey];

    if (handler) {
      // Collect body for POST requests
      if (method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            req.body = JSON.parse(body);
            handler(req, res, parsedUrl);
          } catch (err) {
            this.sendError(res, 400, 'Invalid JSON body');
          }
        });
      } else {
        handler(req, res, parsedUrl);
      }
    } else {
      this.sendError(res, 404, 'Route not found');
    }
  }

  // Utility methods
  sendSuccess(res, data, statusCode = 200) {
    res.writeHead(statusCode);
    res.end(JSON.stringify({
      success: true,
      data
    }));
  }

  sendError(res, statusCode, message, details = {}) {
    Logger.error(message, details);
    res.writeHead(statusCode);
    res.end(JSON.stringify({
      success: false,
      error: message,
      details
    }));
  }

  // Route handlers
  handleHealth(req, res) {
    this.sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  }

  handleConfig(req, res) {
    // Return non-sensitive configuration
    this.sendSuccess(res, {
      port: config.port,
      jiraCloudConfigured: !!config.jiraCloudUrl,
      jiraDcConfigured: !!config.jiraDcUrl,
      databaseConfigured: !!config.postgresHost
    });
  }

  handleDatabaseTest(req, res) {
    // Test database connection using psql command
    const { spawn } = require('child_process');
    
    const psql = spawn('psql', [
      '-h', config.postgresHost,
      '-p', config.postgresPort,
      '-U', config.postgresUser,
      '-d', config.postgresDatabase,
      '-c', 'SELECT version();'
    ], {
      env: { ...process.env, PGPASSWORD: config.postgresPassword }
    });

    let output = '';
    let error = '';

    psql.stdout.on('data', (data) => {
      output += data.toString();
    });

    psql.stderr.on('data', (data) => {
      error += data.toString();
    });

    psql.on('close', (code) => {
      if (code !== 0) {
        this.sendError(res, 500, 'Database connection failed', { error });
      } else {
        this.sendSuccess(res, {
          connected: true,
          version: output.trim()
        });
      }
    });
  }

  // JIRA handlers
  handleJiraMyself(req, res, parsedUrl) {
    const instanceType = parsedUrl.query.instance || 'cloud';
    
    if (instanceType === 'cloud') {
      this.makeJiraCloudRequest('/rest/api/3/myself', 'GET', null, res);
    } else {
      this.makeJiraDCRequest('/rest/api/2/myself', 'GET', null, res);
    }
  }

  handleJiraProjects(req, res, parsedUrl) {
    const instanceType = parsedUrl.query.instance || 'cloud';
    
    if (instanceType === 'cloud') {
      this.makeJiraCloudRequest('/rest/api/3/project', 'GET', null, res);
    } else {
      this.makeJiraDCRequest('/rest/api/2/project', 'GET', null, res);
    }
  }

  handleJiraIssues(req, res, parsedUrl) {
    const instanceType = parsedUrl.query.instance || 'cloud';
    const projectKey = parsedUrl.query.project;
    
    if (!projectKey) {
      this.sendError(res, 400, 'Project key required');
      return;
    }

    const jql = `project = ${projectKey} ORDER BY created DESC`;
    const searchPath = instanceType === 'cloud' 
      ? `/rest/api/3/search?jql=${encodeURIComponent(jql)}`
      : `/rest/api/2/search?jql=${encodeURIComponent(jql)}`;

    if (instanceType === 'cloud') {
      this.makeJiraCloudRequest(searchPath, 'GET', null, res);
    } else {
      this.makeJiraDCRequest(searchPath, 'GET', null, res);
    }
  }

  handleJiraSearch(req, res, parsedUrl) {
    const instanceType = parsedUrl.query.instance || 'cloud';
    const jql = parsedUrl.query.jql;
    
    if (!jql) {
      this.sendError(res, 400, 'JQL query required');
      return;
    }

    const searchPath = instanceType === 'cloud'
      ? `/rest/api/3/search?jql=${encodeURIComponent(jql)}`
      : `/rest/api/2/search?jql=${encodeURIComponent(jql)}`;

    if (instanceType === 'cloud') {
      this.makeJiraCloudRequest(searchPath, 'GET', null, res);
    } else {
      this.makeJiraDCRequest(searchPath, 'GET', null, res);
    }
  }

  handleCreateIssue(req, res, parsedUrl) {
    const instanceType = parsedUrl.query.instance || 'cloud';
    const issueData = req.body;

    if (!issueData) {
      this.sendError(res, 400, 'Issue data required');
      return;
    }

    const path = instanceType === 'cloud' 
      ? '/rest/api/3/issue'
      : '/rest/api/2/issue';

    if (instanceType === 'cloud') {
      this.makeJiraCloudRequest(path, 'POST', issueData, res);
    } else {
      this.makeJiraDCRequest(path, 'POST', issueData, res);
    }
  }

  // JIRA API request methods
  makeJiraCloudRequest(path, method, data, res) {
    if (!config.jiraCloudUrl || !config.jiraEmail || !config.jiraApiToken) {
      this.sendError(res, 500, 'JIRA Cloud not configured');
      return;
    }

    const auth = Buffer.from(`${config.jiraEmail}:${config.jiraApiToken}`).toString('base64');
    const urlParts = url.parse(config.jiraCloudUrl);
    
    const options = {
      hostname: urlParts.hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (jiraRes) => {
      let responseData = '';
      
      jiraRes.on('data', chunk => responseData += chunk);
      jiraRes.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (jiraRes.statusCode >= 200 && jiraRes.statusCode < 300) {
            this.sendSuccess(res, parsed);
          } else {
            this.sendError(res, jiraRes.statusCode, 'JIRA API error', parsed);
          }
        } catch (err) {
          this.sendError(res, 500, 'Failed to parse JIRA response', { response: responseData });
        }
      });
    });

    req.on('error', (err) => {
      this.sendError(res, 500, 'JIRA request failed', { error: err.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  }

  makeJiraDCRequest(path, method, data, res) {
    if (!config.jiraDcUrl || !config.jiraDcUsername || !config.jiraDcPassword) {
      this.sendError(res, 500, 'JIRA Data Center not configured');
      return;
    }

    const auth = Buffer.from(`${config.jiraDcUsername}:${config.jiraDcPassword}`).toString('base64');
    const urlParts = url.parse(config.jiraDcUrl);
    const protocol = urlParts.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlParts.hostname,
      port: urlParts.port || (urlParts.protocol === 'https:' ? 443 : 80),
      path: path,
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = protocol.request(options, (jiraRes) => {
      let responseData = '';
      
      jiraRes.on('data', chunk => responseData += chunk);
      jiraRes.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (jiraRes.statusCode >= 200 && jiraRes.statusCode < 300) {
            this.sendSuccess(res, parsed);
          } else {
            this.sendError(res, jiraRes.statusCode, 'JIRA API error', parsed);
          }
        } catch (err) {
          this.sendError(res, 500, 'Failed to parse JIRA response', { response: responseData });
        }
      });
    });

    req.on('error', (err) => {
      this.sendError(res, 500, 'JIRA request failed', { error: err.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  }

  // Start the server
  start() {
    this.server.listen(config.port, () => {
      Logger.info(`MCP Server started`, {
        port: config.port,
        pid: process.pid,
        node_version: process.version
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      Logger.info('SIGTERM received, shutting down gracefully');
      this.server.close(() => {
        Logger.info('Server closed');
        process.exit(0);
      });
    });
  }
}

// Initialize and start the server
const mcpServer = new MCPServer();
mcpServer.start();

Logger.info('MCP Server initialization complete');