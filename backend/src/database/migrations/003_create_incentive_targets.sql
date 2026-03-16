-- Migration 003: Create incentive_targets table
-- This table stores admin-defined task targets with incentive amounts.
-- Used by the Admin Portal's Target Management page.

CREATE TABLE IF NOT EXISTS incentive_targets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reason           TEXT NOT NULL,
  target_tasks     INTEGER NOT NULL CHECK (target_tasks > 0),
  incentive_amount NUMERIC(10, 2) NOT NULL CHECK (incentive_amount >= 0),
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_incentive_targets_updated_at ON incentive_targets;
CREATE TRIGGER set_incentive_targets_updated_at
  BEFORE UPDATE ON incentive_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
