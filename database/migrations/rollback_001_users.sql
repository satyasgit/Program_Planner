-- Rollback: 001_create_users.sql
-- Description: Rollback script for users table
-- Date: 2026-04-10

-- Drop trigger first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_is_active;

-- Drop table
DROP TABLE IF EXISTS users CASCADE;
