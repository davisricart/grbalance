// Server-side trial utilities for Netlify functions
// Based on trialService.ts but Node.js compatible

// Constants - must match trialService.ts
const TRIAL_DURATION_DAYS = 14;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Calculate trial info for server-side use (no Supabase client required)
 */
function calculateTrialInfoServer(createdAt) {
  const trialStart = new Date(createdAt);
  const trialEnd = new Date(trialStart.getTime() + TRIAL_DURATION_MS);
  const now = new Date();
  const timeRemaining = trialEnd.getTime() - now.getTime();
  
  const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
  const daysLeft = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));
  
  return {
    daysLeft: Math.max(0, daysLeft),
    hoursLeft: Math.max(0, hoursLeft),
    expiresAt: trialEnd,
    isExpired: timeRemaining <= 0
  };
}

/**
 * Check if trial is expiring soon (for reminders)
 */
function isTrialExpiringSoon(createdAt, daysThreshold = 3) {
  const trialInfo = calculateTrialInfoServer(createdAt);
  return trialInfo.daysLeft <= daysThreshold && !trialInfo.isExpired;
}

/**
 * Get days until trial expiry (for server-side use)
 */
function getDaysUntilTrialExpiry(createdAt) {
  const trialInfo = calculateTrialInfoServer(createdAt);
  return trialInfo.daysLeft;
}

/**
 * Calculate trial end date from start date
 */
function calculateTrialEndDate(startDate) {
  return new Date(startDate.getTime() + TRIAL_DURATION_MS);
}

module.exports = {
  TRIAL_DURATION_DAYS,
  TRIAL_DURATION_MS,
  calculateTrialInfoServer,
  isTrialExpiringSoon,
  getDaysUntilTrialExpiry,
  calculateTrialEndDate
};