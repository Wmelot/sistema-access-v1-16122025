-- Add capacity column to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1;

-- Update existing locations to have default capacity (optional, default handles it)
-- UPDATE locations SET capacity = 1 WHERE capacity IS NULL;
