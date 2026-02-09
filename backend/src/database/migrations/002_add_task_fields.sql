-- Add optional fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS car_location TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS car_image_url TEXT;
