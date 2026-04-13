-- Migration: 001_create_users.sql
-- Description: Create users table for Program Planner application
-- Date: 2026-04-10

-- Drop table if exists (for development only)
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Add comments
COMMENT ON TABLE users IS 'User accounts for Program Planner application';
COMMENT ON COLUMN users.id IS 'Primary key';
COMMENT ON COLUMN users.email IS 'User email address (unique identifier)';
COMMENT ON COLUMN users.password_hash IS 'Hashed password using bcrypt';
COMMENT ON COLUMN users.role IS 'User role: admin, manager, user';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN users.last_login IS 'Timestamp of last successful login';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
