-- Migration: Create Admin, Supervisor, and Safety module tables
-- Created: 2026-11-11
-- Description: Creates core tables for Admin, Supervisor, and Safety modules with stats tables

-- AdminDB Table
CREATE TABLE IF NOT EXISTS admin_db (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    department VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_db(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_user_id ON admin_db(user_id);
CREATE INDEX idx_admin_email ON admin_db(email);
CREATE INDEX idx_admin_role ON admin_db(role);
CREATE INDEX idx_admin_department ON admin_db(department);
CREATE INDEX idx_admin_is_active ON admin_db(is_active);
CREATE INDEX idx_admin_created_at ON admin_db(created_at);

-- AdminStatsDB Table
CREATE TABLE IF NOT EXISTS admin_stats_db (
    id UUID PRIMARY KEY,
    admin_id UUID NOT NULL UNIQUE,
    total_users_managed INTEGER DEFAULT 0,
    active_sessions INTEGER DEFAULT 0,
    actions_performed INTEGER DEFAULT 0,
    reports_generated INTEGER DEFAULT 0,
    alerts_issued INTEGER DEFAULT 0,
    system_changes_made INTEGER DEFAULT 0,
    avg_response_time_ms FLOAT DEFAULT 0.0,
    last_activity_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_db(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_stats_admin_id ON admin_stats_db(admin_id);
CREATE INDEX idx_admin_stats_created_at ON admin_stats_db(created_at);

-- SupervisorDB Table
CREATE TABLE IF NOT EXISTS supervisor_db (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    team_size INTEGER DEFAULT 0,
    performance_rating FLOAT DEFAULT 0.0 CHECK (performance_rating >= 0 AND performance_rating <= 5),
    department VARCHAR(100),
    experience_level VARCHAR(50) CHECK (experience_level IN ('junior', 'mid', 'senior', 'lead')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_db(id) ON DELETE CASCADE
);

CREATE INDEX idx_supervisor_user_id ON supervisor_db(user_id);
CREATE INDEX idx_supervisor_email ON supervisor_db(email);
CREATE INDEX idx_supervisor_department ON supervisor_db(department);
CREATE INDEX idx_supervisor_experience_level ON supervisor_db(experience_level);
CREATE INDEX idx_supervisor_is_active ON supervisor_db(is_active);
CREATE INDEX idx_supervisor_created_at ON supervisor_db(created_at);

-- SupervisorStatsDB Table
CREATE TABLE IF NOT EXISTS supervisor_stats_db (
    id UUID PRIMARY KEY,
    supervisor_id UUID NOT NULL UNIQUE,
    team_members INTEGER DEFAULT 0,
    active_sessions INTEGER DEFAULT 0,
    avg_quality_score FLOAT DEFAULT 0.0 CHECK (avg_quality_score >= 0 AND avg_quality_score <= 100),
    total_workload INTEGER DEFAULT 0,
    team_productivity_percent FLOAT DEFAULT 0.0 CHECK (team_productivity_percent >= 0 AND team_productivity_percent <= 100),
    coaching_sessions_conducted INTEGER DEFAULT 0,
    performance_improvements INTEGER DEFAULT 0,
    escalations_handled INTEGER DEFAULT 0,
    last_review_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supervisor_id) REFERENCES supervisor_db(id) ON DELETE CASCADE
);

CREATE INDEX idx_supervisor_stats_supervisor_id ON supervisor_stats_db(supervisor_id);
CREATE INDEX idx_supervisor_stats_created_at ON supervisor_stats_db(created_at);

-- SafetyDB Table
CREATE TABLE IF NOT EXISTS safety_db (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    status VARCHAR(50) NOT NULL CHECK (status IN ('low_risk', 'medium_risk', 'high_risk', 'critical', 'safe', 'under_review')),
    last_assessment_date TIMESTAMP,
    needs_intervention BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_db(id) ON DELETE CASCADE
);

CREATE INDEX idx_safety_user_id ON safety_db(user_id);
CREATE INDEX idx_safety_email ON safety_db(email);
CREATE INDEX idx_safety_risk_score ON safety_db(risk_score);
CREATE INDEX idx_safety_status ON safety_db(status);
CREATE INDEX idx_safety_needs_intervention ON safety_db(needs_intervention);
CREATE INDEX idx_safety_is_active ON safety_db(is_active);
CREATE INDEX idx_safety_created_at ON safety_db(created_at);

-- SafetyStatsDB Table
CREATE TABLE IF NOT EXISTS safety_stats_db (
    id UUID PRIMARY KEY,
    safety_id UUID NOT NULL UNIQUE,
    high_risk_users INTEGER DEFAULT 0,
    alerts_active INTEGER DEFAULT 0,
    incidents_reported INTEGER DEFAULT 0,
    avg_response_time_minutes INTEGER DEFAULT 0,
    escalations_made INTEGER DEFAULT 0,
    assessment_completion_rate FLOAT DEFAULT 0.0 CHECK (assessment_completion_rate >= 0 AND assessment_completion_rate <= 100),
    critical_cases INTEGER DEFAULT 0,
    cases_resolved INTEGER DEFAULT 0,
    intervention_success_rate FLOAT DEFAULT 0.0 CHECK (intervention_success_rate >= 0 AND intervention_success_rate <= 100),
    last_escalation_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (safety_id) REFERENCES safety_db(id) ON DELETE CASCADE
);

CREATE INDEX idx_safety_stats_safety_id ON safety_stats_db(safety_id);
CREATE INDEX idx_safety_stats_created_at ON safety_stats_db(created_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_admin_active_by_role ON admin_db(role, is_active);
CREATE INDEX idx_supervisor_active_by_dept ON supervisor_db(department, is_active);
CREATE INDEX idx_safety_high_risk ON safety_db(status, needs_intervention) WHERE status = 'high_risk' OR status = 'critical';
