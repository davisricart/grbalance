/*
  # Add tier limit trigger

  1. Changes
    - Add function to update comparison limit based on subscription tier
    - Add trigger to automatically update limit when tier changes
    
  2. Security
    - Maintains existing RLS policies
    - Only updates within defined tier limits
*/

CREATE OR REPLACE FUNCTION update_comparison_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_tier = 'basic' THEN
    NEW.comparisons_limit := 50;
  ELSIF NEW.subscription_tier = 'premium' THEN
    NEW.comparisons_limit := 100;
  ELSIF NEW.subscription_tier = 'enterprise' THEN
    NEW.comparisons_limit := 250;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tier_limit
  BEFORE INSERT OR UPDATE OF subscription_tier ON usage
  FOR EACH ROW
  EXECUTE FUNCTION update_comparison_limit();