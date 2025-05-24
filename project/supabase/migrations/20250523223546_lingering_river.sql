/*
  # Add DELETE policy for usage table

  1. Changes
    - Add DELETE policy for authenticated users
  
  2. Security
    - Users can only delete their own usage records
*/

-- Add policy to allow users to delete their own usage data
CREATE POLICY "Users can delete own usage data"
  ON usage
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);