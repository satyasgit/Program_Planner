-- Migration: 003_create_programs.sql
-- Description: Create programs table for Program Planner application
-- Date: 2026-04-10

-- Drop table if exists (for development only)
DROP TABLE IF EXISTS programs CASCADE;

-- Create programs table
CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    objectives TEXT,
    deliverables TEXT,
    status VARCHAR(50) DEFAULT 'planning',
    priority VARCHAR(20) DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_programs_project
        FOREIGN KEY(project_id) 
        REFERENCES projects(id)
        ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_programs_project_id ON programs(project_id);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_priority ON programs(priority);
CREATE INDEX idx_programs_dates ON programs(start_date, end_date);
CREATE INDEX idx_programs_progress ON programs(progress_percentage);
CREATE INDEX idx_programs_metadata ON programs USING GIN (metadata);

-- Add comments
COMMENT ON TABLE programs IS 'Programs within projects in Program Planner';
COMMENT ON COLUMN programs.id IS 'Primary key';
COMMENT ON COLUMN programs.project_id IS 'Reference to parent project';
COMMENT ON COLUMN programs.name IS 'Program name';
COMMENT ON COLUMN programs.objectives IS 'Program objectives';
COMMENT ON COLUMN programs.deliverables IS 'Expected deliverables';
COMMENT ON COLUMN programs.status IS 'Program status: planning, active, on-hold, completed, cancelled';
COMMENT ON COLUMN programs.priority IS 'Priority level: low, medium, high, critical';
COMMENT ON COLUMN programs.progress_percentage IS 'Overall progress percentage (0-100)';
COMMENT ON COLUMN programs.metadata IS 'Additional program metadata in JSON format';

-- Create updated_at trigger
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE
    ON programs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
