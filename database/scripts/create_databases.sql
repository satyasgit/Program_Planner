-- PostgreSQL Database Creation Script
-- Run this script as the postgres superuser

-- Create main application database
CREATE DATABASE program_planner
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE program_planner
    IS 'Main database for Program Planner application';

-- Create test database
CREATE DATABASE program_planner_test
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE program_planner_test
    IS 'Test database for Program Planner application';

-- Grant all privileges to postgres user (already owner, but explicit)
GRANT ALL PRIVILEGES ON DATABASE program_planner TO postgres;
GRANT ALL PRIVILEGES ON DATABASE program_planner_test TO postgres;

-- Display created databases
\l program_planner*

\echo 'Databases created successfully!'
\echo 'To connect: psql -U postgres -d program_planner'