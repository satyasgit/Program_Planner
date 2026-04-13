# Database Migration - SQLite to PostgreSQL

## Overview
This directory contains all files related to migrating the Program Planner application from SQLite to PostgreSQL.

## Directory Structure
```
database/
├── config/
│   └── database.config.js    # PostgreSQL connection configuration
├── migrations/
│   ├── 001_create_users.sql  # Users table migration
│   ├── 002_create_projects.sql # Projects table migration
│   ├── 003_create_programs.sql # Programs table migration
│   ├── 004_create_steps.sql  # Steps table migration
│   ├── 005_add_indexes_and_constraints.sql # Additional optimizations
│   ├── rollback_001_users.sql # Rollback script example
│   ├── sqlite_schema_export.sql # SQLite export commands
│   ├── data_type_mapping.md  # Data type conversion guide
│   └── migration_validation_tests.js # Validation test suite
└── seeds/
    └── (test data generators - to be created)
```

## Migration Steps

### 1. Prerequisites
- PostgreSQL 14+ installed
- Node.js 18+ installed
- Database management tool (pgAdmin/DBeaver)

### 2. Environment Setup
```bash
# Install dependencies (when npm is working)
npm install knex pg dotenv

# Create databases
createdb program_planner_dev
createdb program_planner_test

# Create user
createuser -P program_planner_user
```

### 3. Configure Environment
Update `.env` file with PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=program_planner_dev
DB_USER=program_planner_user
DB_PASSWORD=your_secure_password
```

### 4. Export SQLite Schema
```bash
# Export schema
sqlite3 database.db ".schema" > sqlite_schema.sql

# Export data
sqlite3 database.db ".dump" > sqlite_data.sql

# Get row counts
sqlite3 database.db "SELECT name, sql FROM sqlite_master WHERE type='table';"
```

### 5. Run Migrations
```bash
# Using Knex (when configured)
knex migrate:latest

# Or manually
psql -U program_planner_user -d program_planner_dev -f migrations/001_create_users.sql
psql -U program_planner_user -d program_planner_dev -f migrations/002_create_projects.sql
# ... continue for all migration files
```

### 6. Validate Migration
```bash
# Run validation tests
node migrations/migration_validation_tests.js
```

## Migration Checklist

- [ ] PostgreSQL installed and running
- [ ] Databases created (dev, test)
- [ ] User created with proper permissions
- [ ] SQLite schema exported
- [ ] Data type mappings reviewed
- [ ] Migration scripts created
- [ ] Rollback scripts created
- [ ] Test environment ready
- [ ] Validation tests written
- [ ] Migration executed
- [ ] Data integrity verified
- [ ] Performance baseline established

## Rollback Procedure

If migration fails:
```bash
# Run rollback scripts in reverse order
psql -U program_planner_user -d program_planner_dev -f migrations/rollback_005_indexes.sql
psql -U program_planner_user -d program_planner_dev -f migrations/rollback_004_steps.sql
# ... continue in reverse order
```

## Important Notes

1. **Backup First**: Always backup SQLite database before migration
2. **Test Environment**: Test migration on a copy first
3. **Data Validation**: Verify row counts match after migration
4. **Foreign Keys**: PostgreSQL enforces FK constraints - ensure data integrity
5. **Sequences**: Reset sequences after data import

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check PostgreSQL is running
   - Verify connection parameters
   - Check pg_hba.conf for authentication

2. **Permission Denied**
   - Grant proper permissions to user
   - Check database ownership

3. **Data Type Mismatch**
   - Review data_type_mapping.md
   - Check for NULL values
   - Verify date formats

## Support

For migration support:
- Review PostgreSQL documentation
- Check Knex.js migration guide
- Consult team lead for complex issues

---

**Last Updated**: 2026-04-10
**Status**: In Progress
