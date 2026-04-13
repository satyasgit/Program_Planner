-- Migration: 005_add_indexes_and_constraints.sql
-- Description: Add additional indexes, constraints, and performance optimizations
-- Date: 2026-04-10

-- Add composite indexes for common query patterns
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_programs_project_status ON programs(project_id, status);
CREATE INDEX idx_steps_program_status ON steps(program_id, status);
CREATE INDEX idx_steps_program_sequence_status ON steps(program_id, sequence_number, status);

-- Add check constraints for valid status values
ALTER TABLE projects ADD CONSTRAINT chk_project_status 
    CHECK (status IN ('draft', 'active', 'completed', 'archived', 'cancelled'));

ALTER TABLE programs ADD CONSTRAINT chk_program_status 
    CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled'));

ALTER TABLE steps ADD CONSTRAINT chk_step_status 
    CHECK (status IN ('pending', 'in-progress', 'blocked', 'completed', 'skipped'));

-- Add check constraints for priority values
ALTER TABLE programs ADD CONSTRAINT chk_program_priority 
    CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Add check constraints for role values
ALTER TABLE users ADD CONSTRAINT chk_user_role 
    CHECK (role IN ('admin', 'manager', 'user', 'viewer'));

-- Add date validation constraints
ALTER TABLE projects ADD CONSTRAINT chk_project_dates 
    CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);

ALTER TABLE programs ADD CONSTRAINT chk_program_dates 
    CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);

ALTER TABLE steps ADD CONSTRAINT chk_step_dates 
    CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);

-- Create audit log table for tracking changes
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,
    user_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_audit_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- Create views for common queries
CREATE OR REPLACE VIEW v_project_summary AS
SELECT 
    p.id,
    p.name,
    p.status,
    p.start_date,
    p.end_date,
    u.email as owner_email,
    COUNT(DISTINCT pr.id) as program_count,
    AVG(pr.progress_percentage) as avg_progress
FROM projects p
JOIN users u ON p.user_id = u.id
LEFT JOIN programs pr ON p.id = pr.project_id
GROUP BY p.id, p.name, p.status, p.start_date, p.end_date, u.email;

CREATE OR REPLACE VIEW v_program_progress AS
SELECT 
    pr.id,
    pr.name,
    pr.status,
    pr.progress_percentage,
    p.name as project_name,
    COUNT(s.id) as total_steps,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_steps
FROM programs pr
JOIN projects p ON pr.project_id = p.id
LEFT JOIN steps s ON pr.id = s.program_id
GROUP BY pr.id, pr.name, pr.status, pr.progress_percentage, p.name;

-- Add comments
COMMENT ON TABLE audit_log IS 'Audit trail for tracking changes to records';
COMMENT ON VIEW v_project_summary IS 'Summary view of projects with program statistics';
COMMENT ON VIEW v_program_progress IS 'Progress view of programs with step completion statistics';
