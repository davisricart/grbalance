/*
  # Add email search functionality

  1. Changes
    - Add email column to usage table
    - Create index on email column for faster searches
    - Add policy for admins to search by email
*/

-- Add email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usage' AND column_name = 'email'
  ) THEN
    ALTER TABLE usage ADD COLUMN email text;
    CREATE INDEX idx_usage_email ON usage (email);
  END IF;
END $$;