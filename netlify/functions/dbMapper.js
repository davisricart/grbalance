// Simplified database column mapper for Netlify functions
// Mirrors the mapping logic from the main databaseMapper.ts

const USAGE_COLUMNS = {
  comparisons_used: 'comparisonsUsed',
  comparisons_limit: 'comparisonsLimit',
  subscription_tier: 'subscriptionTier',
  updated_at: 'updatedAt',
  trial_started_at: 'trialStartedAt',
  trial_ends_at: 'trialEndsAt',
  stripe_subscription_id: 'stripeSubscriptionId'
};

const CLIENTS_COLUMNS = {
  business_name: 'business_name',
  client_path: 'client_path',
  subscription_tier: 'subscription_tier',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

const PENDING_USERS_COLUMNS = {
  business_name: 'businessname',
  business_type: 'businesstype',
  subscription_tier: 'subscriptiontier',
  billing_cycle: 'billingcycle',
  created_at: 'createdat'
};

function mapToUsageDb(data) {
  const mapped = {};
  Object.entries(data).forEach(([key, value]) => {
    const dbColumn = USAGE_COLUMNS[key] || key;
    if (value !== undefined) {
      mapped[dbColumn] = value;
    }
  });
  return mapped;
}

function mapToClientsDb(data) {
  const mapped = {};
  Object.entries(data).forEach(([key, value]) => {
    const dbColumn = CLIENTS_COLUMNS[key] || key;
    if (value !== undefined) {
      mapped[dbColumn] = value;
    }
  });
  return mapped;
}

function mapToPendingUsersDb(data) {
  const mapped = {};
  Object.entries(data).forEach(([key, value]) => {
    const dbColumn = PENDING_USERS_COLUMNS[key] || key;
    if (value !== undefined) {
      mapped[dbColumn] = value;
    }
  });
  return mapped;
}

module.exports = {
  mapToUsageDb,
  mapToClientsDb,
  mapToPendingUsersDb,
  USAGE_COLUMNS,
  CLIENTS_COLUMNS,
  PENDING_USERS_COLUMNS
};