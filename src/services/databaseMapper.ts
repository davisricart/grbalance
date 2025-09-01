// Database Column Mapper Service
// Handles all database naming convention inconsistencies in one place
// Prevents column mismatch errors across all tables

export interface TableColumnMaps {
  usage: UsageColumns;
  clients: ClientsColumns;
  pendingUsers: PendingUsersColumns;
  'ready-for-testing': ReadyForTestingColumns;
  client_scripts: ClientScriptsColumns;
}

// Define the actual database column names for each table
interface UsageColumns {
  id: 'id';
  email: 'email';
  comparisons_used: 'comparisonsUsed';  // DB uses camelCase
  comparisons_limit: 'comparisonsLimit'; // DB uses camelCase
  subscription_tier: 'subscriptionTier'; // DB uses camelCase
  status: 'status';
  updated_at: 'updatedAt'; // DB uses camelCase
  trial_started_at: 'trialStartedAt'; // DB uses camelCase
  trial_ends_at: 'trialEndsAt'; // DB uses camelCase
  stripe_subscription_id: 'stripeSubscriptionId'; // DB uses camelCase
}

interface ClientsColumns {
  id: 'id';
  email: 'email';
  business_name: 'business_name'; // DB uses snake_case
  client_path: 'client_path'; // DB uses snake_case
  subscription_tier: 'subscription_tier'; // DB uses snake_case
  status: 'status';
  created_at: 'created_at'; // DB uses snake_case
  updated_at: 'updated_at'; // DB uses snake_case
  deployed_scripts: 'deployed_scripts'; // DB uses snake_case
  welcome_package_sent: 'welcome_package_sent'; // DB uses snake_case
  go_live: 'go_live'; // DB uses snake_case
}

interface PendingUsersColumns {
  id: 'id';
  email: 'email';
  business_name: 'businessname'; // DB uses lowercase
  business_type: 'businesstype'; // DB uses lowercase
  subscription_tier: 'subscriptiontier'; // DB uses lowercase
  billing_cycle: 'billingcycle'; // DB uses lowercase
  created_at: 'createdat'; // DB uses lowercase
  status: 'status';
}

interface ReadyForTestingColumns {
  id: 'id';
  email: 'email';
  business_name: 'businessname'; // DB uses lowercase
  business_type: 'businesstype'; // DB uses lowercase
  subscription_tier: 'subscriptiontier'; // DB uses lowercase
  billing_cycle: 'billingcycle'; // DB uses lowercase
  ready_for_testing_at: 'readyfortestingat'; // DB uses lowercase
  qa_status: 'qastatus'; // DB uses lowercase
  qa_testing_notes: 'qatestnotes'; // DB uses lowercase
  website_provisioned: 'websiteprovisioned'; // DB uses lowercase
  script_deployed: 'scriptdeployed'; // DB uses lowercase
  updated_at: 'updatedat'; // DB uses lowercase
}

interface ClientScriptsColumns {
  id: 'id';
  client_id: 'client_id'; // DB uses snake_case
  name: 'name';
  content: 'content';
  status: 'status';
  created_at: 'created_at'; // DB uses snake_case
  updated_at: 'updated_at'; // DB uses snake_case
}

// Column mapping definitions
const COLUMN_MAPS: TableColumnMaps = {
  usage: {
    id: 'id',
    email: 'email',
    comparisons_used: 'comparisonsUsed',
    comparisons_limit: 'comparisonsLimit',
    subscription_tier: 'subscriptionTier',
    status: 'status',
    updated_at: 'updatedAt',
    trial_started_at: 'trialStartedAt',
    trial_ends_at: 'trialEndsAt',
    stripe_subscription_id: 'stripeSubscriptionId'
  },
  clients: {
    id: 'id',
    email: 'email',
    business_name: 'business_name',
    client_path: 'client_path',
    subscription_tier: 'subscription_tier',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    deployed_scripts: 'deployed_scripts',
    welcome_package_sent: 'welcome_package_sent',
    go_live: 'go_live'
  },
  pendingUsers: {
    id: 'id',
    email: 'email',
    business_name: 'businessname',
    business_type: 'businesstype',
    subscription_tier: 'subscriptiontier',
    billing_cycle: 'billingcycle',
    created_at: 'createdat',
    status: 'status'
  },
  'ready-for-testing': {
    id: 'id',
    email: 'email',
    business_name: 'businessname',
    business_type: 'businesstype',
    subscription_tier: 'subscriptiontier',
    billing_cycle: 'billingcycle',
    ready_for_testing_at: 'readyfortestingat',
    qa_status: 'qastatus',
    qa_testing_notes: 'qatestnotes',
    website_provisioned: 'websiteprovisioned',
    script_deployed: 'scriptdeployed',
    updated_at: 'updatedat'
  },
  client_scripts: {
    id: 'id',
    client_id: 'client_id',
    name: 'name',
    content: 'content',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at'
  }
};

/**
 * Maps standardized column names to actual database column names
 * @param tableName - The database table name
 * @param data - Object with standardized column names
 * @returns Object with actual database column names
 */
export function mapToDbColumns<T extends keyof TableColumnMaps>(
  tableName: T, 
  data: Partial<Record<keyof TableColumnMaps[T], any>>
): Record<string, any> {
  const columnMap = COLUMN_MAPS[tableName];
  const dbData: Record<string, any> = {};
  
  Object.entries(data).forEach(([standardKey, value]) => {
    const dbColumnName = columnMap[standardKey as keyof TableColumnMaps[T]];
    if (dbColumnName && value !== undefined) {
      dbData[dbColumnName] = value;
    }
  });
  
  return dbData;
}

/**
 * Maps database column names back to standardized names
 * @param tableName - The database table name  
 * @param dbData - Data from database with actual column names
 * @returns Object with standardized column names
 */
export function mapFromDbColumns<T extends keyof TableColumnMaps>(
  tableName: T,
  dbData: Record<string, any>
): Partial<Record<keyof TableColumnMaps[T], any>> {
  const columnMap = COLUMN_MAPS[tableName];
  const standardData: Record<string, any> = {};
  
  // Create reverse mapping
  const reverseMap: Record<string, string> = {};
  Object.entries(columnMap).forEach(([standardKey, dbKey]) => {
    reverseMap[dbKey] = standardKey;
  });
  
  Object.entries(dbData).forEach(([dbKey, value]) => {
    const standardKey = reverseMap[dbKey];
    if (standardKey && value !== undefined) {
      standardData[standardKey] = value;
    }
  });
  
  return standardData;
}

/**
 * Get actual database column name for a table
 * @param tableName - The database table name
 * @param standardColumnName - The standardized column name
 * @returns The actual database column name
 */
export function getDbColumnName<T extends keyof TableColumnMaps>(
  tableName: T,
  standardColumnName: keyof TableColumnMaps[T]
): string {
  const columnMap = COLUMN_MAPS[tableName];
  return columnMap[standardColumnName] || standardColumnName.toString();
}

/**
 * Validate that all required columns exist for a table operation
 * @param tableName - The database table name
 * @param data - The data being inserted/updated
 * @param requiredColumns - Array of required standard column names
 * @returns Array of missing columns (empty if all present)
 */
export function validateColumns<T extends keyof TableColumnMaps>(
  tableName: T,
  data: Record<string, any>,
  requiredColumns: (keyof TableColumnMaps[T])[]
): (keyof TableColumnMaps[T])[] {
  const missing: (keyof TableColumnMaps[T])[] = [];
  
  requiredColumns.forEach(column => {
    const dbColumnName = getDbColumnName(tableName, column);
    if (!(dbColumnName in data)) {
      missing.push(column);
    }
  });
  
  return missing;
}

// Helper type for creating properly typed database operations
export type DbMappedData<T extends keyof TableColumnMaps> = Partial<Record<keyof TableColumnMaps[T], any>>;

// Export common usage patterns
export const UsageMapper = {
  toDb: (data: DbMappedData<'usage'>) => mapToDbColumns('usage', data),
  fromDb: (data: Record<string, any>) => mapFromDbColumns('usage', data),
  column: (name: keyof TableColumnMaps['usage']) => getDbColumnName('usage', name)
};

export const ClientsMapper = {
  toDb: (data: DbMappedData<'clients'>) => mapToDbColumns('clients', data),
  fromDb: (data: Record<string, any>) => mapFromDbColumns('clients', data),
  column: (name: keyof TableColumnMaps['clients']) => getDbColumnName('clients', name)
};

export const PendingUsersMapper = {
  toDb: (data: DbMappedData<'pendingUsers'>) => mapToDbColumns('pendingUsers', data),
  fromDb: (data: Record<string, any>) => mapFromDbColumns('pendingUsers', data),
  column: (name: keyof TableColumnMaps['pendingUsers']) => getDbColumnName('pendingUsers', name)
};

export const ReadyForTestingMapper = {
  toDb: (data: DbMappedData<'ready-for-testing'>) => mapToDbColumns('ready-for-testing', data),
  fromDb: (data: Record<string, any>) => mapFromDbColumns('ready-for-testing', data),
  column: (name: keyof TableColumnMaps['ready-for-testing']) => getDbColumnName('ready-for-testing', name)
};