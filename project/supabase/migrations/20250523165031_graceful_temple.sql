/*
  # Update usage table policies

  1. Changes
    - Add INSERT policy for authenticated users
    - Modify UPDATE policy to use WITH CHECK clause
  
  2. Security
    - Users can only insert their own usage records
    - Users can only update their own usage records
    - Maintains existing read policy
*/

-- Add policy to allow users to insert their own usage data
CREATE POLICY "Users can insert own usage data"
  ON usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update the existing update policy to include WITH CHECK clause
DROP POLICY IF EXISTS "Users can update own usage data" ON usage;

CREATE POLICY "Users can update own usage data"
  ON usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);