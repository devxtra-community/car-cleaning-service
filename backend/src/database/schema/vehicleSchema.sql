-- Vehicle Management Table Schema
-- This table stores information about different vehicle types and their pricing

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,                    -- Vehicle type (Sedan, SUV, Truck, Hatchback, Van, etc.)
    category VARCHAR(50) NOT NULL,                 -- Category (Standard, Large, Commercial, Compact)
    size VARCHAR(50) NOT NULL,                     -- Size (Small, Medium, Large, Extra Large)
    base_price DECIMAL(10, 2) NOT NULL,           -- Base service price
    premium_price DECIMAL(10, 2) NOT NULL,        -- Premium service price
    wash_time INTEGER NOT NULL,                    -- Time required in minutes
    status VARCHAR(20) DEFAULT 'Active',          -- Active/Inactive status
    created_by UUID,                               -- Reference to user who created it
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicles_updated_at_trigger
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicles_updated_at();
