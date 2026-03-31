ALTER TABLE incentive_targets
  ADD COLUMN IF NOT EXISTS cleaner_id UUID REFERENCES cleaners(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS floor_id UUID REFERENCES floors(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_incentive_targets_cleaner_id ON incentive_targets(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_incentive_targets_building_id ON incentive_targets(building_id);
CREATE INDEX IF NOT EXISTS idx_incentive_targets_floor_id ON incentive_targets(floor_id);
