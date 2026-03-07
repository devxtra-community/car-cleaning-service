-- Cleaner Assigned Vehicles Table
-- Stores permanent vehicle assignments for cleaners

CREATE TABLE IF NOT EXISTS cleaner_assigned_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    car_number VARCHAR(50) NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    car_type VARCHAR(50) NOT NULL, -- references vehicle type (Sedan, SUV, etc.)
    car_color VARCHAR(50),
    owner_name VARCHAR(100),
    owner_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint to prevent duplicate vehicles per cleaner
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cleaner_car ON cleaner_assigned_vehicles(cleaner_id, car_number);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_cleaner_assigned_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleaner_assigned_vehicles_updated_at_trigger
    BEFORE UPDATE ON cleaner_assigned_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_cleaner_assigned_vehicles_updated_at();
