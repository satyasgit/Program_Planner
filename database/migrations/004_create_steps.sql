-- Migration: 004_create_steps.sql
-- Description: Create steps table for Program Planner application
-- Date: 2026-04-10

-- Drop table if exists (for development only)
DROP TABLE IF EXISTS steps CASCADE;

-- Create steps table
CREATE TABLE steps (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to INTEGER,
    start_date DATE,
    end_date DATE,
    estimated_hours DECIMAL(8, 2),
    actual_hours DECIMAL(8, 2),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    dependencies JSONB,
    attachments JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_steps_program
        FOREIGN KEY(program_id) 
        REFERENCES programs(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_steps_assigned_user
        FOREIGN KEY(assigned_to) 
        REFERENCES users(id)
        ON DELETE SET NULL,
        
    -- Unique constraint for sequence within a program
    CONSTRAINT unique_program_sequence 
        UNIQUE(program_id, sequence_number)
);

-- Create indexes
CREATE INDEX idx_steps_program_id ON steps(program_id);
CREATE INDEX idx_steps_assigned_to ON steps(assigned_to);
CREATE INDEX idx_steps_status ON steps(status);
CREATE INDEX idx_steps_sequence ON steps(sequence_number);
CREATE INDEX idx_steps_dates ON steps(start_date, end_date);
CREATE INDEX idx_steps_completion ON steps(completion_percentage);
CREATE INDEX idx_steps_dependencies ON steps USING GIN (dependencies);
CREATE INDEX idx_steps_metadata ON steps USING GIN (metadata);

-- Add comments
COMMENT ON TABLE steps IS 'Individual steps within programs';
COMMENT ON COLUMN steps.id IS 'Primary key';
COMMENT ON COLUMN steps.program_id IS 'Reference to parent program';
COMMENT ON COLUMN steps.name IS 'Step name';
COMMENT ON COLUMN steps.sequence_number IS 'Order of execution within the program';
COMMENT ON COLUMN steps.status IS 'Step status: pending, in-progress, blocked, completed, skipped';
COMMENT ON COLUMN steps.assigned_to IS 'User assigned to this step';
COMMENT ON COLUMN steps.dependencies IS 'JSON array of step IDs this step depends on';
COMMENT ON COLUMN steps.attachments IS 'JSON array of file attachments';
COMMENT ON COLUMN steps.metadata IS 'Additional step metadata in JSON format';

-- Create updated_at trigger
CREATE TRIGGER update_steps_updated_at BEFORE UPDATE
    ON steps FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
