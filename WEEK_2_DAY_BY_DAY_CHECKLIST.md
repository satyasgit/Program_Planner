# Week 2 Day-by-Day Implementation Checklist

## Week 2: April 17-21, 2026

---

## 📅 Day 1 - Monday, April 17

### 🌅 Morning Tasks (9:00 AM - 12:00 PM)

#### Environment Setup Resolution
- [ ] **Fix npm Installation Issues**
  ```bash
  # Try alternative approaches
  - [ ] Clear npm cache: npm cache clean --force
  - [ ] Use yarn: npm install -g yarn
  - [ ] Use pnpm: npm install -g pnpm
  - [ ] Verify Node.js PATH settings
  ```

#### PostgreSQL Installation
- [ ] **Download PostgreSQL 14+**
  - [ ] Visit https://www.postgresql.org/download/
  - [ ] Select Windows installer
  - [ ] Download PostgreSQL 14.x or 15.x

- [ ] **Install PostgreSQL**
  - [ ] Run installer as administrator
  - [ ] Set superuser password (document it!)
  - [ ] Default port: 5432
  - [ ] Install Stack Builder: Yes

- [ ] **Verify Installation**
  ```bash
  psql --version
  pg_config --version
  ```

### 🌆 Afternoon Tasks (1:00 PM - 5:00 PM)

#### Database Setup
- [ ] **Create Databases**
  ```sql
  -- Open psql as postgres user
  CREATE DATABASE program_planner_dev;
  CREATE DATABASE program_planner_test;
  CREATE DATABASE program_planner_staging;
  
  -- Create application user
  CREATE USER program_planner_user WITH ENCRYPTED PASSWORD 'your_secure_password';
  GRANT ALL PRIVILEGES ON DATABASE program_planner_dev TO program_planner_user;
  GRANT ALL PRIVILEGES ON DATABASE program_planner_test TO program_planner_user;
  ```

#### Database Tools Installation
- [ ] **Install pgAdmin 4**
  - [ ] Download from pgadmin.org
  - [ ] Configure server connection
  - [ ] Test connection to local PostgreSQL

- [ ] **Alternative: Install DBeaver**
  - [ ] Download from dbeaver.io
  - [ ] Add PostgreSQL connection
  - [ ] Verify database access

#### Package Installation
- [ ] **Install Migration Dependencies**
  ```bash
  # Using npm (if fixed)
  npm install knex@latest pg@latest dotenv@latest
  npm install --save-dev @types/node jest ts-node typescript
  
  # Or using yarn
  yarn add knex pg dotenv
  yarn add -D @types/node jest ts-node typescript
  ```

#### Day 1 Documentation
- [ ] **Create Day 1 Summary**
  - [ ] Document installation steps
  - [ ] Record any issues encountered
  - [ ] Update environment variables
  - [ ] Commit changes to Git

---

## 📅 Day 2 - Tuesday, April 18

### 🌅 Morning Tasks (9:00 AM - 12:00 PM)

#### SQLite Export
- [ ] **Export SQLite Database**
  ```bash
  # Export schema
  sqlite3 program_planner.db ".schema" > sqlite_schema_export.sql
  
  # Export data
  sqlite3 program_planner.db ".dump" > sqlite_full_dump.sql
  
  # Export as CSV for analysis
  sqlite3 -header -csv program_planner.db "SELECT * FROM users;" > users_data.csv
  sqlite3 -header -csv program_planner.db "SELECT * FROM projects;" > projects_data.csv
  sqlite3 -header -csv program_planner.db "SELECT * FROM programs;" > programs_data.csv
  sqlite3 -header -csv program_planner.db "SELECT * FROM steps;" > steps_data.csv
  ```

#### Data Analysis
- [ ] **Analyze Data Volume**
  ```sql
  -- Run in SQLite
  SELECT 'users' as table_name, COUNT(*) as row_count FROM users
  UNION ALL
  SELECT 'projects', COUNT(*) FROM projects
  UNION ALL
  SELECT 'programs', COUNT(*) FROM programs
  UNION ALL
  SELECT 'steps', COUNT(*) FROM steps;
  ```

- [ ] **Document Relationships**
  - [ ] Create relationship diagram
  - [ ] Note foreign key constraints
  - [ ] Identify orphaned records

### 🌆 Afternoon Tasks (1:00 PM - 5:00 PM)

#### Migration Testing
- [ ] **Test Migration Scripts**
  ```bash
  # Run migrations
  cd database/migrations
  
  # Test each migration
  psql -U program_planner_user -d program_planner_test -f 001_create_users.sql
  psql -U program_planner_user -d program_planner_test -f 002_create_projects.sql
  psql -U program_planner_user -d program_planner_test -f 003_create_programs.sql
  psql -U program_planner_user -d program_planner_test -f 004_create_steps.sql
  psql -U program_planner_user -d program_planner_test -f 005_add_indexes_and_constraints.sql
  ```

- [ ] **Validate Tables**
  ```sql
  -- Check tables exist
  \dt
  
  -- Check table structures
  \d+ users
  \d+ projects
  \d+ programs
  \d+ steps
  ```

- [ ] **Test Rollbacks**
  ```bash
  # Test rollback scripts
  psql -U program_planner_user -d program_planner_test -f rollback_001_users.sql
  ```

---

## 📅 Day 3 - Wednesday, April 19

### 🌅 Morning Tasks (9:00 AM - 12:00 PM)

#### MCP Server Setup
- [ ] **Create MCP Directory Structure**
  ```bash
  mkdir -p mcp-server/src/connectors
  mkdir -p mcp-server/src/handlers
  mkdir -p mcp-server/src/utils
  mkdir -p mcp-server/src/middleware
  mkdir -p mcp-server/tests
  mkdir -p mcp-server/config
  mkdir -p mcp-server/docs
  ```

- [ ] **Initialize MCP Project**
  ```bash
  cd mcp-server
  npm init -y
  
  # Install MCP dependencies
  npm install @modelcontextprotocol/server express cors helmet
  npm install --save-dev nodemon eslint prettier
  ```

- [ ] **Create Base Files**
  - [ ] Create `mcp-server/src/index.js`
  - [ ] Create `mcp-server/src/server.js`
  - [ ] Create `mcp-server/config/default.js`
  - [ ] Create `mcp-server/.env.example`

### 🌆 Afternoon Tasks (1:00 PM - 5:00 PM)

#### JIRA Research
- [ ] **API Documentation Review**
  - [ ] Read JIRA REST API v3 docs
  - [ ] Understand authentication methods
  - [ ] List required endpoints

- [ ] **Create Integration Design**
  - [ ] Design authentication flow
  - [ ] Map JIRA fields to database
  - [ ] Plan data synchronization
  - [ ] Document API rate limits

- [ ] **Create JIRA Design Document**
  ```markdown
  # JIRA Integration Design
  
  ## Authentication
  - Method: API Token
  - Storage: Environment variables
  
  ## Endpoints Required
  - GET /rest/api/3/project
  - GET /rest/api/3/search
  - GET /rest/api/3/issue/{issueKey}
  
  ## Data Mapping
  - JIRA Project -> programs table
  - JIRA Issues -> steps table
  ```

---

## 📅 Day 4 - Thursday, April 20

### 🌅 Morning Tasks (9:00 AM - 12:00 PM)

#### Database Migration
- [ ] **Run Production Migrations**
  ```bash
  # Run on development database
  knex migrate:latest --env development
  
  # Or manually
  psql -U program_planner_user -d program_planner_dev < all_migrations.sql
  ```

- [ ] **Migrate Sample Data**
  ```sql
  -- Create data migration script
  INSERT INTO users (email, password_hash, role)
  SELECT email, password, role FROM sqlite_users_export;
  ```

- [ ] **Validate Data Integrity**
  - [ ] Check row counts match
  - [ ] Verify foreign keys
  - [ ] Test sample queries

### 🌆 Afternoon Tasks (1:00 PM - 5:00 PM)

#### MCP Server Implementation
- [ ] **Basic Server Structure**
  ```javascript
  // Implement core MCP server
  - [ ] Connection handler
  - [ ] Request router
  - [ ] Error handling
  - [ ] Logging setup
  ```

- [ ] **Create Handlers**
  - [ ] Database handler
  - [ ] JIRA handler stub
  - [ ] Health check endpoint

- [ ] **Test MCP Server**
  ```bash
  npm run dev
  # Test health endpoint
  curl http://localhost:3001/health
  ```

---

## 📅 Day 5 - Friday, April 21

### 🌅 Morning Tasks (9:00 AM - 12:00 PM)

#### Integration Testing
- [ ] **Update Application Config**
  ```javascript
  // Update database configuration
  - [ ] Switch from SQLite to PostgreSQL
  - [ ] Update connection strings
  - [ ] Test database connection
  ```

- [ ] **Test Core Features**
  - [ ] User authentication
  - [ ] Project creation
  - [ ] Program management
  - [ ] Step operations

- [ ] **Performance Testing**
  ```bash
  # Run performance tests
  - [ ] Query performance
  - [ ] Connection pooling
  - [ ] Concurrent users
  ```

### 🌆 Afternoon Tasks (1:00 PM - 5:00 PM)

#### Week 2 Wrap-up
- [ ] **Documentation Updates**
  - [ ] Update README with PostgreSQL setup
  - [ ] Document MCP server architecture
  - [ ] Create migration guide

- [ ] **Team Retrospective**
  - [ ] What went well?
  - [ ] What challenges faced?
  - [ ] What to improve?

- [ ] **Week 3 Planning**
  - [ ] Review remaining Phase 1 tasks
  - [ ] Prioritize Week 3 activities
  - [ ] Assign responsibilities

- [ ] **Create Summary Report**
  ```markdown
  # Week 2 Summary
  
  ## Completed
  - PostgreSQL setup ✅
  - Database migration ✅
  - MCP server foundation ✅
  
  ## In Progress
  - JIRA integration design
  - Performance optimization
  
  ## Next Week
  - JIRA connector implementation
  - AI capability planning
  ```

---

## 🔧 Quick Reference

### PostgreSQL Commands
```bash
# Connect to database
psql -U program_planner_user -d program_planner_dev

# List databases
\l

# List tables
\dt

# Describe table
\d+ table_name

# Exit psql
\q
```

### Git Commands
```bash
# Create Week 2 branch
git checkout -b phase1-week2

# Daily commits
git add .
git commit -m "Week 2 Day X: Description"
git push origin phase1-week2
```

### Testing Commands
```bash
# Run tests
npm test

# Run specific test
npm test -- --testNamePattern="migration"

# Run with coverage
npm test -- --coverage
```

---

**Week 2 Health Status**: 🟢 Not Started | 🟡 In Progress | 🔴 Blocked

**Last Updated**: 2026-04-10