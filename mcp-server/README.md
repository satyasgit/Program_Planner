# MCP Server - JIRA Integration

## Overview

This is a pure Node.js implementation of the MCP (Model Context Protocol) Server for JIRA integration. Built without external dependencies due to npm installation issues.

## Features

- **JIRA Cloud Integration**: Connect to JIRA Cloud instances using API tokens
- **JIRA Data Center Integration**: Connect to on-premise JIRA DC instances
- **PostgreSQL Integration**: Database connectivity using psql commands
- **RESTful API**: Clean API endpoints for JIRA operations
- **No Dependencies**: Built using only Node.js built-in modules

## Prerequisites

- Node.js v25.7.0 (already installed)
- PostgreSQL 14+ (needs installation)
- JIRA Cloud or Data Center instance
- API credentials for JIRA

## Configuration

Set the following environment variables in your `.env` file:

```bash
# MCP Server
MCP_PORT=3001

# JIRA Cloud Configuration
JIRA_CLOUD_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token

# JIRA Data Center Configuration
JIRA_DC_URL=https://jira.yourcompany.com
JIRA_DC_USERNAME=your-username
JIRA_DC_PASSWORD=your-password

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=program_planner
DB_USER=postgres
DB_PASSWORD=postgres
```

## Starting the Server

```bash
node mcp-server/server.js
```

## API Endpoints

### Health Check
```
GET /health
```

Returns server health status, uptime, and memory usage.

### Configuration Check
```
GET /api/config
```

Returns non-sensitive configuration status.

### Database Test
```
GET /api/database/test
```

Tests PostgreSQL connection.

### JIRA Endpoints

#### Get Current User
```
GET /api/jira/myself?instance=cloud|dc
```

#### List Projects
```
GET /api/jira/projects?instance=cloud|dc
```

#### Get Issues
```
GET /api/jira/issues?project=PROJECT_KEY&instance=cloud|dc
```

#### Search Issues (JQL)
```
GET /api/jira/search?jql=YOUR_JQL_QUERY&instance=cloud|dc
```

#### Create Issue
```
POST /api/jira/issue?instance=cloud|dc

Body:
{
  "fields": {
    "project": { "key": "PROJECT_KEY" },
    "summary": "Issue summary",
    "description": "Issue description",
    "issuetype": { "name": "Task" }
  }
}
```

## Architecture

```
┌─────────────────┐
│ Program Planner │
│   Frontend      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   MCP Server    │
│  (Node.js API)  │
├─────────────────┤
│ - JIRA Proxy    │
│ - Auth Handler  │
│ - Data Mapper   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    v         v
┌────────┐ ┌────────┐
│  JIRA  │ │  JIRA  │
│ Cloud  │ │   DC   │
└────────┘ └────────┘
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

## Logging

Structured JSON logging to console:

```json
{
  "timestamp": "2024-04-17T10:00:00.000Z",
  "level": "INFO",
  "message": "Server started",
  "port": 3001
}
```

## Security Considerations

1. **API Tokens**: Never commit API tokens to version control
2. **CORS**: Currently allows all origins (update for production)
3. **HTTPS**: Use HTTPS in production
4. **Rate Limiting**: Implement rate limiting for production
5. **Input Validation**: Add comprehensive input validation

## Development Notes

### Why No Dependencies?

Due to npm installation issues, this server is built using only Node.js built-in modules:
- `http` / `https` for server and requests
- `url` for URL parsing
- `querystring` for query parameter handling
- `fs` for file operations
- `child_process` for PostgreSQL commands
- `crypto` for security operations

### Future Enhancements

Once npm is working:
1. Add Express.js for better routing
2. Use node-postgres for database connections
3. Add request validation with Joi
4. Implement proper logging with Winston
5. Add API documentation with Swagger

## Troubleshooting

### Server won't start
- Check if port 3001 is available
- Verify Node.js version: `node --version`
- Check environment variables are set

### JIRA connection fails
- Verify JIRA URL is correct
- Check API token/credentials
- Ensure network connectivity

### Database connection fails
- Verify PostgreSQL is installed and running
- Check database credentials
- Ensure database exists

## Testing

### Manual Testing

1. Health check:
```bash
curl http://localhost:3001/health
```

2. JIRA test:
```bash
curl http://localhost:3001/api/jira/myself?instance=cloud
```

3. Database test:
```bash
curl http://localhost:3001/api/database/test
```

### Load Testing

Use Apache Bench (ab) for basic load testing:
```bash
ab -n 1000 -c 10 http://localhost:3001/health
```

## License

MIT