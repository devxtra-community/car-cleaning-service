-- Create attendance table for tracking worker check-ins with GPS verification
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cleaner_id UUID REFERENCES cleaners(id) ON DELETE SET NULL,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  check_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(worker_id, date) -- One attendance per worker per day
);

-- Create index for faster queries
CREATE INDEX idx_attendance_worker_date ON attendance(worker_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
