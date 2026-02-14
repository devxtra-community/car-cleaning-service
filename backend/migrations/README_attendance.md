# Attendance Table Migration Guide

## Run this SQL in your PostgreSQL database

You can run this migration using your preferred method:

### Option 1: Using psql command line

```bash
psql -U your_username -d your_database -f backend/migrations/create_attendance_table.sql
```

### Option 2: Using pgAdmin

1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Copy the SQL from `backend/migrations/create_attendance_table.sql`
5. Execute the query

### Option 3: Using Node.js migration script

```bash
cd backend
node migrate_db.js
```

## SQL to run:

```sql
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
```

## Verify Migration

After running, verify with:

```sql
SELECT * FROM attendance LIMIT 1;
```

Should return empty result with no errors.
