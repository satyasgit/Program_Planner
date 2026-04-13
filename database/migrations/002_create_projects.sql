-- Migration: 002_create_projects.sql
-- Description: Create projects table for Program Planner application
-- Date: 2026-04-10

-- Drop table if exists (for development only)
DROP TABLE IF EXISTS projects CASCADE;

-- Create projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2),
    is_template BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_projects_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_is_template ON projects(is_template);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_projects_metadata ON projects USING GIN (metadata);

-- Add comments
COMMENT ON TABLE projects IS 'Projects managed in Program Planner';
COMMENT ON COLUMN projects.id IS 'Primary key';
COMMENT ON COLUMN projects.user_id IS 'Reference to user who owns the project';
COMMENT ON COLUMN projects.name IS 'Project name';
COMMENT ON COLUMN projects.description IS 'Detailed project description';
COMMENT ON COLUMN projects.status IS 'Project status: draft, active, completed, archived';
COMMENT ON COLUMN projects.is_template IS 'Whether this project can be used as a template';
COMMENT ON COLUMN projects.metadata IS 'Additional project metadata in JSON format';

-- Create updated_at trigger
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE
    ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
