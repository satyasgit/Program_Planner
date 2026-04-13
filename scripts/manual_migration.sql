-- Manual Database Migration Script
-- Week 2 - PostgreSQL Setup
-- Run this script in pgAdmin or psql after PostgreSQL installation

-- Connect to program_planner_dev database before running this script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    is_template BOOLEAN DEFAULT false,
    visibility VARCHAR(50) DEFAULT 'private',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_order INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to UUID REFERENCES users(id),
    start_date DATE,
    end_date DATE,
    estimated_hours DECIMAL(8, 2),
    actual_hours DECIMAL(8, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Steps table
CREATE TABLE IF NOT EXISTS steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_order INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    step_type VARCHAR(100),
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(6, 2),
    actual_hours DECIMAL(6, 2),
    dependencies JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_programs_project_id ON programs(project_id);
CREATE INDEX idx_programs_assigned_to ON programs(assigned_to);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_steps_program_id ON steps(program_id);
CREATE INDEX idx_steps_assigned_to ON steps(assigned_to);
CREATE INDEX idx_steps_status ON steps(status);
CREATE INDEX idx_steps_due_date ON steps(due_date);

-- Add constraints
ALTER TABLE programs ADD CONSTRAINT unique_program_order UNIQUE (project_id, sequence_order);
ALTER TABLE steps ADD CONSTRAINT unique_step_order UNIQUE (program_id, sequence_order);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (email, username, full_name, role) VALUES
    ('admin@programplanner.com', 'admin', 'System Administrator', 'admin'),
    ('demo@programplanner.com', 'demo_user', 'Demo User', 'user');

-- Grant permissions (adjust as needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Verification queries
SELECT 'Users table created' AS status, COUNT(*) AS count FROM users;
SELECT 'Projects table created' AS status, COUNT(*) AS count FROM projects;
SELECT 'Programs table created' AS status, COUNT(*) AS count FROM programs;
SELECT 'Steps table created' AS status, COUNT(*) AS count FROM steps;

SELECT 'Database migration completed successfully!' AS message;