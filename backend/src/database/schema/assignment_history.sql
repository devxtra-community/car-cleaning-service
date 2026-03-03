-- Assignment History Table
-- Tracks changes in cleaner-supervisor and cleaner-floor assignments

CREATE TABLE IF NOT EXISTS assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleaner_id UUID NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
    assignment_type VARCHAR(50) NOT NULL, -- 'supervisor' or 'floor'
    previous_value UUID,
    new_value UUID,
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster history lookups
CREATE INDEX IF NOT EXISTS idx_assignment_history_cleaner ON assignment_history(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_created_at ON assignment_history(created_at);
