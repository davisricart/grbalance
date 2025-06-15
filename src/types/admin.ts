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
  
  // Consultation tracking (moved from ApprovedUser)
  consultationCompleted?: boolean;
  scriptReady?: boolean;
  consultationNotes?: string;
}

export interface ReadyForTestingUser {
  id: string;
  email: string;
  businessName: string;
  businessType: string;
  subscriptionTier: string;
  billingCycle: string;
  createdAt: string;
  readyForTestingAt: string;
  
  // Website and deployment info
  siteUrl?: string;
  siteId?: string;
  siteName?: string;
  scriptDeployed?: boolean;
  scriptDeployedAt?: string;
  
  // QA Testing fields
  qaStatus?: 'pending' | 'testing' | 'passed' | 'failed';
  qaTestedAt?: string;
  qaTestingNotes?: string;
  qaScreenshots?: string[];
  
  // Admin testing workflow
  websiteProvisioned?: boolean;
  websiteProvisionedAt?: string;
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
  
  // QA completed - ready for billing
  qaPassedAt?: string;
  billingLinkSent?: boolean;
  billingLinkSentAt?: string;
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
  | 'ready-for-testing'
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
  readyForTestingUsers: ReadyForTestingUser[];
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

export const TIER_PRICING = {
  starter: {
    monthly: 19,
    annual: 15
  },
  professional: {
    monthly: 34,
    annual: 27
  },
  business: {
    monthly: 59,
    annual: 47
  }
} as const;