/*
  # Create usage tracking table

  1. New Tables
    - `usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `comparisons_used` (integer)
      - `comparisons_limit` (integer)
      - `subscription_tier` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `usage` table
    - Add policies for users to:
      - Read their own usage data
      - Update their own usage data
*/

CREATE TABLE IF NOT EXISTS usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  comparisons_used integer DEFAULT 0,
  comparisons_limit integer DEFAULT 50,
  subscription_tier text DEFAULT 'basic',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own usage data
CREATE POLICY "Users can read own usage data"
  ON usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to update their own usage data
CREATE POLICY "Users can update own usage data"
  ON usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_usage_updated_at
  BEFORE UPDATE ON usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();