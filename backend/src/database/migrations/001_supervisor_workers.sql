-- Create supervisor_workers junction table
-- Links supervisors to the workers they manage

CREATE TABLE IF NOT EXISTS supervisor_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(supervisor_id, worker_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sw_supervisor ON supervisor_workers(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_sw_worker ON supervisor_workers(worker_id);
