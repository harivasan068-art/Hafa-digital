-- HafA DIGITAL - PostgreSQL Database Schema Migration Blueprint
-- Compatible with Supabase, AWS RDS PostgreSQL, or standard PostgreSQL instances.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. EMPLOYEES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    phone VARCHAR(30),
    department VARCHAR(100) DEFAULT 'General',
    designation VARCHAR(100) DEFAULT 'Employee',
    role VARCHAR(50) DEFAULT 'EMPLOYEE', -- 'ADMIN', 'MANAGER', 'EMPLOYEE'
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE'
    photo_url TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. ATTENDANCE & FIELD DISPATCH LOGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ DEFAULT NOW(),
    check_out TIMESTAMPTZ,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    location_name TEXT DEFAULT 'Field Site Location',
    address TEXT,
    photo_url TEXT,
    proof_url TEXT,
    status VARCHAR(30) DEFAULT 'Pending', -- 'Present', 'Pending', 'Rejected'
    is_inside_geofence BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    approved_by VARCHAR(100) DEFAULT 'PENDING_APPROVAL',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. PRODUCTION WORKFLOW TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS production_workflow (
    id VARCHAR(50) PRIMARY KEY,
    item_name TEXT NOT NULL,
    cameraman VARCHAR(100) DEFAULT 'Unassigned',
    shoot_date DATE,
    editor VARCHAR(100) DEFAULT 'Unassigned',
    edit_date DATE,
    delivery_date DATE,
    upload_date DATE,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Shoot Done', 'Editing', 'Ready for Review', 'Uploaded', 'Delivered'
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. COMPANY & GEOFENCE SETTINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) DEFAULT 'HafA DIGITAL',
    theme_color VARCHAR(30) DEFAULT '#F97316',
    office_latitude NUMERIC(10, 6) DEFAULT 13.0853,
    office_longitude NUMERIC(10, 6) DEFAULT 80.0179,
    geofence_radius_meters NUMERIC(8, 2) DEFAULT 200.0,
    company_logo TEXT,
    default_checkin_time VARCHAR(20) DEFAULT '09:00 AM',
    shift_rules TEXT DEFAULT '9:00 AM - 6:00 PM (Mon-Fri)',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR HIGH-CONCURRENCY PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_emp_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_production_cameraman ON production_workflow(cameraman);
CREATE INDEX IF NOT EXISTS idx_production_editor ON production_workflow(editor);
CREATE INDEX IF NOT EXISTS idx_production_status ON production_workflow(status);

-- =============================================================================
-- AUTOMATIC TIMESTAMP TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_employees_modtime
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_production_modtime
    BEFORE UPDATE ON production_workflow
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert Default Seed Data
INSERT INTO company_settings (company_name, office_latitude, office_longitude, geofence_radius_meters)
VALUES ('HafA DIGITAL', 13.0853, 80.0179, 200.00)
ON CONFLICT DO NOTHING;
