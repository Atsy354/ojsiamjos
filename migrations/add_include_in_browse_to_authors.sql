-- Migration: Add include_in_browse column to authors table
-- Date: 2025-12-18
-- Description: Add browse list functionality for authors

-- Add the column with default value true
ALTER TABLE authors 
ADD COLUMN IF NOT EXISTS include_in_browse BOOLEAN DEFAULT true;

-- Update existing records to have include_in_browse = true
UPDATE authors 
SET include_in_browse = true 
WHERE include_in_browse IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN authors.include_in_browse IS 'Whether this author should be included in browse lists (default: true)';
