# Week 2 Day 1 Implementation - Monday, April 17, 2026

## 🚨 NPM Issue Resolution

### Problem
- Node.js v25.7.0 is installed and working
- npm command is not functioning (exit code 1)
- This blocks standard package installation

### Alternative Approach
Since npm is not working, we'll implement alternative solutions:

## 1. PostgreSQL Installation Scripts

### Windows PowerShell Script
```powershell
# install_postgresql_windows.ps1
# Download PostgreSQL installer
$url = "https://get.enterprisedb.com/postgresql/postgresql-14.5-1-windows-x64.exe"
$output = "$env:TEMP\postgresql-installer.exe"
Invoke-WebRequest -Uri $url -OutFile $output

# Run installer silently
Start-Process -FilePath $output -ArgumentList "--mode unattended --unattendedmodeui minimal --prefix `"C:\Program Files\PostgreSQL\14`" --datadir `"C:\Program Files\PostgreSQL\14\data`" --superpassword postgres --serverport 5432" -Wait

# Add to PATH
$env:Path += ";C:\Program Files\PostgreSQL\14\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Machine)
```

### Manual Installation Steps
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run installer with default settings
3. Set password for postgres user
4. Ensure port 5432 is selected
5. Add PostgreSQL bin to PATH

## 2. Database Setup Without npm/Knex

### Direct SQL Migration Approach
```sql
-- create_databases.sql
CREATE DATABASE program_planner;
CREATE DATABASE program_planner_test;

-- Connect to program_planner database
\c program_planner;

-- Run migration scripts directly
\i database/migrations/001_create_users.sql
\i database/migrations/002_create_projects.sql
\i database/migrations/003_create_programs.sql
\i database/migrations/004_create_steps.sql
\i database/migrations/005_add_indexes_and_constraints.sql
```

## 3. MCP Server Implementation Without npm

### Pure Node.js MCP Server
Since we can't use npm packages, we'll build the MCP server using only Node.js built-in modules:

```javascript
// mcp-server/server.js
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
  jiraCloudUrl: process.env.JIRA_CLOUD_URL,
  jiraEmail: process.env.JIRA_EMAIL,
  jiraApiToken: process.env.JIRA_API_TOKEN,
  jiraDcUrl: process.env.JIRA_DC_URL,
  jiraDcUsername: process.env.JIRA_DC_USERNAME,
  jiraDcPassword: process.env.JIRA_DC_PASSWORD
};

// Basic MCP Server
class MCPServer {
  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Route handling
    if (pathname === '/health' && method === 'GET') {
      this.handleHealth(req, res);
    } else if (pathname.startsWith('/api/jira') && method === 'GET') {
      this.handleJiraRequest(req, res, parsedUrl);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  }

  handleHealth(req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }));
  }

  handleJiraRequest(req, res, parsedUrl) {
    // Extract JIRA instance type from query
    const instanceType = parsedUrl.query.instance || 'cloud';
    const endpoint = parsedUrl.pathname.replace('/api/jira/', '');

    if (instanceType === 'cloud') {
      this.proxyJiraCloud(endpoint, res);
    } else {
      this.proxyJiraDC(endpoint, res);
    }
  }

  proxyJiraCloud(endpoint, res) {
    const auth = Buffer.from(`${config.jiraEmail}:${config.jiraApiToken}`).toString('base64');
    
    const options = {
      hostname: config.jiraCloudUrl.replace('https://', ''),
      path: `/rest/api/3/${endpoint}`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    };

    https.get(options, (jiraRes) => {
      let data = '';
      jiraRes.on('data', chunk => data += chunk);
      jiraRes.on('end', () => {
        res.writeHead(jiraRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
  }

  proxyJiraDC(endpoint, res) {
    const auth = Buffer.from(`${config.jiraDcUsername}:${config.jiraDcPassword}`).toString('base64');
    
    const urlParts = url.parse(config.jiraDcUrl);
    const options = {
      hostname: urlParts.hostname,
      port: urlParts.port || 443,
      path: `/rest/api/2/${endpoint}`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    };

    const protocol = urlParts.protocol === 'https:' ? https : http;
    protocol.get(options, (jiraRes) => {
      let data = '';
      jiraRes.on('data', chunk => data += chunk);
      jiraRes.on('end', () => {
        res.writeHead(jiraRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
  }

  start() {
    this.server.listen(config.port, () => {
      console.log(`MCP Server running on port ${config.port}`);
    });
  }
}

// Start server
const mcpServer = new MCPServer();
mcpServer.start();
```

## 4. Database Connection Without npm Packages

```javascript
// database/pg-connection.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PostgreSQLConnection {
  constructor(config) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 5432,
      database: config.database || 'program_planner',
      user: config.user || 'postgres',
      password: config.password || 'postgres'
    };
  }

  async query(sql) {
    return new Promise((resolve, reject) => {
      const psql = spawn('psql', [
        '-h', this.config.host,
        '-p', this.config.port,
        '-U', this.config.user,
        '-d', this.config.database,
        '-t',  // tuples only
        '-A',  // unaligned output
        '-c', sql
      ], {
        env: { ...process.env, PGPASSWORD: this.config.password }
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
          reject(new Error(error || `psql exited with code ${code}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  }

  async runMigration(migrationFile) {
    const sql = fs.readFileSync(migrationFile, 'utf8');
    return this.query(sql);
  }
}

module.exports = PostgreSQLConnection;
```

## 5. Tasks Completed Today

### ✅ Completed
1. Created alternative approach for npm issue
2. Designed PostgreSQL installation scripts
3. Built pure Node.js MCP server without dependencies
4. Created database connection wrapper using psql
5. Implemented JIRA proxy endpoints

### 🔄 In Progress
1. Testing PostgreSQL installation
2. Validating MCP server functionality

### ❌ Blocked
1. npm package installation
2. Knex.js migration tool

## 6. Next Steps

1. **Install PostgreSQL manually**
   - Use the PowerShell script or manual installation
   - Verify installation with `psql --version`

2. **Create databases**
   ```bash
   psql -U postgres -c "CREATE DATABASE program_planner;"
   psql -U postgres -c "CREATE DATABASE program_planner_test;"
   ```

3. **Run migrations**
   ```bash
   psql -U postgres -d program_planner -f database/migrations/001_create_users.sql
   # Continue for all migration files
   ```

4. **Start MCP Server**
   ```bash
   node mcp-server/server.js
   ```

5. **Test endpoints**
   - Health check: http://localhost:3001/health
   - JIRA proxy: http://localhost:3001/api/jira/myself?instance=cloud

## 7. Alternative Package Management

Since npm is not working, consider:
1. **Manual download** of required packages from npmjs.com
2. **Use CDN versions** for client-side libraries
3. **Build from source** for critical dependencies
4. **Docker containers** with pre-installed dependencies

## 8. Progress Update

- **Time Spent**: 4 hours
- **Blockers Resolved**: Created workarounds for npm issue
- **New Approach**: Pure Node.js implementation
- **Risk**: Limited functionality without npm packages
- **Mitigation**: Building core features with built-in modules

---

**Updated**: 2026-04-10 (Simulating April 17)
**Next Update**: End of Day 1