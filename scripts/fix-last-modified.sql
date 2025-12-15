-- Quick fix: Add last_modified column to review_assignments
-- Run this in Supabase SQL Editor

ALTER TABLE review_assignments
ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();

-- Create trigger to auto-update last_modified
CREATE OR REPLACE FUNCTION update_review_assignment_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_assignment_modified
BEFORE UPDATE ON review_assignments
FOR EACH ROW
EXECUTE FUNCTION update_review_assignment_modified();

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'review_assignments' 
AND column_name = 'last_modified';
