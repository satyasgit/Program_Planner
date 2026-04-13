-- SQLite Schema Export Template
-- Date: 2026-04-10
-- Instructions: Run these commands to export SQLite schema and data

-- To export schema only:
-- sqlite3 database.db ".schema" > sqlite_schema_dump.sql

-- To export full database with data:
-- sqlite3 database.db ".dump" > sqlite_full_dump.sql

-- To export specific tables:
-- sqlite3 database.db ".schema users" > users_schema.sql
-- sqlite3 database.db ".schema projects" > projects_schema.sql
-- sqlite3 database.db ".schema programs" > programs_schema.sql
-- sqlite3 database.db ".schema steps" > steps_schema.sql

-- To get row counts:
-- sqlite3 database.db "SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'projects', COUNT(*) FROM projects UNION ALL SELECT 'programs', COUNT(*) FROM programs UNION ALL SELECT 'steps', COUNT(*) FROM steps;"

-- Expected SQLite schema structure (to be verified):
/*
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sequence_number INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id)
);
*/
