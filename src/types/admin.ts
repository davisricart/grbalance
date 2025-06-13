export interface Client {
  id: string;
  name: string;
  email: string;
  subdomain: string;
  scripts: string[];
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface PendingUser {
  id: string;
  email: string;
  businessName: string;
  businessType: string;
  subscriptionTier: string;
  billingCycle: string;
  createdAt: string;
}

export interface ApprovedUser {
  id: string;
  email: string;
  businessName?: string;
  businessType?: string;
  subscriptionTier?: string;
  billingCycle?: string;
  comparisonsUsed: number;
  comparisonsLimit: number;
  status: string;
  approvedAt: string;
  createdAt: string;
  softwareProfile?: string;
  showInsights?: boolean;
}

export interface ScriptData {
  name: string;
  file: File | null;
  clientId: string;
}

export interface ScriptInfo {
  name: string;
  deployedAt: string;
  size: number;
  type: 'custom' | 'demo';
  preview: string;
  status: 'active' | 'inactive';
  logic?: {
    columnMappings: Record<string, string>;
    matchingRules: Array<{
      field1: string;
      field2: string;
      tolerance: number;
      required: boolean;
    }>;
    outputFormat: 'table' | 'summary' | 'detailed';
  };
}

export interface DeletedUser {
  id: string;
  email: string;
  businessName?: string;
  deletedAt: string;
  deletedBy: string;
  reason?: string;
}

export type AdminTab = 
  | 'clients' 
  | 'pending' 
  | 'approved' 
  | 'deleted' 
  | 'profiles' 
  | 'dynamic-profiles' 
  | 'settings' 
  | 'script-testing';

export interface AdminState {
  activeTab: AdminTab;
  clients: Client[];
  pendingUsers: PendingUser[];
  approvedUsers: ApprovedUser[];
  deletedUsers: DeletedUser[];
  isLoading: boolean;
  error: string | null;
}

export const TIER_LIMITS = {
  starter: 50,
  professional: 75,
  business: 150
} as const;