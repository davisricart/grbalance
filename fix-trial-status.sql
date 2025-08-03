-- Fix trial user status for billing page
-- This user was activated before the trial status fix was implemented

UPDATE usage 
SET status = 'trial' 
WHERE id = 'b851d12a-5d18-4aff-a92c-08efa2a0de2d' 
AND status = 'approved';

-- Verify the update
SELECT id, email, status, "subscriptionTier", "comparisonsUsed", "comparisonsLimit" 
FROM usage 
WHERE id = 'b851d12a-5d18-4aff-a92c-08efa2a0de2d';