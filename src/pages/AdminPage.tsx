import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuthState } from '../hooks/useAuthState';
import { supabase } from '../config/supabase';
import { FiUsers, FiUserCheck, FiUserX, FiShield, FiCode, FiSettings, FiEye, FiTrash2, FiRotateCcw, FiUserMinus, FiUserPlus, FiEdit3, FiSave, FiX, FiRefreshCw, FiDownload, FiUpload, FiPlay, FiDatabase, FiBarChart, FiPieChart, FiTrendingUp, FiGrid, FiLock, FiUser, FiMail, FiKey } from 'react-icons/fi';
import { 
  User, Users, Plus, Download, Search, Filter, Edit, 
  Trash2, Check, X, Clock, AlertTriangle, Eye, EyeOff, ArrowLeft,
  UserCheck, Shield, Settings, Database, PieChart, TrendingUp, Grid, Lock, Mail, Key, HelpCircle, Upload, Copy } from 'lucide-react';
import { VisualStepBuilder } from '../components/VisualStepBuilder';
import { useAdminVerification } from '../services/adminService';
import { getUsersByWorkflowStage, updateUserWorkflowStage, updateUserBusinessInfo, UnifiedUser } from '../services/userDataService';
import clientConfig from '../config/client';
import { HiGlobeAlt, HiLockClosed, HiExclamation } from 'react-icons/hi';
import { parseFile, FileStore, generateComparisonPrompt, ParsedFileData } from '../utils/fileProcessor';
import Papa from 'papaparse';
import {
  ReconciliationResult,
  TestResult,
  FileRow,
  ScriptExecutionResult,
  UserDoc
} from '../types';
import { ReadyForTestingUser } from '../types/admin';
import PendingUsersTab from '../components/admin/UserManagement/PendingUsersTab';
import ReadyForTestingTab from '../components/admin/UserManagement/ReadyForTestingTab';
import ApprovedUsersTab from '../components/admin/UserManagement/ApprovedUsersTab';

// Add this at the top of the file, after imports
declare global {
  interface Window {
    uploadedFile1?: FileRow[];
    uploadedFile2?: FileRow[];
    aiFile1Data?: FileRow[];
    aiFile2Data?: FileRow[];
  }
}

const TIER_LIMITS = {
  starter: 50,
  professional: 75,
  business: 150
};

interface Client {
  id: string;
  name: string;
  email: string;
  subdomain: string;
  scripts: string[];
  createdAt: string;
  status: 'active' | 'inactive';
}

interface PendingUser {
  id: string;
  email: string;
  businessName: string;
  businessType: string;
  subscriptionTier: string;
  billingCycle: string;
  createdAt: string;
  
  // Consultation tracking
  consultationCompleted?: boolean;
  scriptReady?: boolean;
  consultationNotes?: string;
}

interface ApprovedUser {
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
  softwareProfile?: string; // NEW: Software profile ID
  showInsights?: boolean; // NEW: Individual control for insights tab
  
  // Minimal consultation tracking
  consultationCompleted?: boolean;
  scriptReady?: boolean;
  consultationNotes?: string;
}

interface Script {
  name: string;
  file: File | null;
  clientId: string;
}

interface ScriptInfo {
  name: string;
  deployedAt: string;
  size: number;
  type: 'custom' | 'demo';
  preview: string;
  status: 'active' | 'inactive';
  // Enhanced fields for dynamic script execution
  logic?: {
    columnMappings: {
      file1Column: string;
      file2Column: string;
    };
    algorithm: 'simple-count' | 'full-reconciliation' | 'custom';
    generatedCode: string; // The actual JavaScript logic
    description: string;
  };
}

interface ConfirmationDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmStyle: string;
  onConfirm: () => void;
}

interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Enhanced interfaces for software configuration
interface SoftwareProfile {
  id: string;
  name: string;
  displayName: string;
  dataStructure: {
    dateColumn: string[];
    amountColumn: string[];
    customerColumn: string[];
    cardBrandColumn: string[];
    feeColumn: string[];
  };
  insightsConfig: {
    showInsights: boolean;
    showPaymentTrends: boolean;
    showCustomerBehavior: boolean;
    showOperationalMetrics: boolean;
    showRiskFactors: boolean;
    showBusinessIntelligence: boolean;
  };
  availableTabs: {
    overview: boolean;
    insights: boolean;
    details: boolean;
    reports: boolean;
  };
}

// Mock user for testing - moved outside component to prevent re-creation
const mockUser = { email: 'davisricart@gmail.com' };

const AdminPage: React.FC = () => {
  // Use secure server-side admin verification
  const { isAdmin, isLoading: adminLoading, error: adminError } = useAdminVerification();
  
  const { user, isLoading: authLoading } = useAuthState();
  
  // Skip auth for testing (only on localhost)
  const skipAuth = false; // Set to true only for testing
  const hasInitiallyLoaded = useRef(false);
  const [activeTab, setActiveTab] = useState('clients');
  const [showCleanupInput, setShowCleanupInput] = useState(false);
  const [cleanupEmail, setCleanupEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [sortBy, setSortBy] = useState('approvedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [siteDeletionState, setSiteDeletionState] = useState<Record<string, string>>({});
  const [csvData, setCsvData] = useState<FileRow[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [dynamicProfiles, setDynamicProfiles] = useState<SoftwareProfile[]>([]);

  const [libraryStatus, setLibraryStatus] = useState<'initializing' | 'ready'>('initializing');

  const [clients, setClients] = useState<Client[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [readyForTestingUsers, setReadyForTestingUsers] = useState<ReadyForTestingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);

  const [loading, setLoading] = useState(true);
  
  // Persistent state for ReadyForTestingTab
  const [scriptStatus, setScriptStatus] = useState<{[key: string]: 'none' | 'ready' | 'completed'}>({});
  const [websiteStatus, setWebsiteStatus] = useState<{[key: string]: 'none' | 'created'}>({});
  const [customUrls, setCustomUrls] = useState<{[key: string]: string}>({});
  const [showAddClient, setShowAddClient] = useState(false);
  const [showUploadScript, setShowUploadScript] = useState(false);
  const [selectedClientForScript, setSelectedClientForScript] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmStyle: '',
    onConfirm: () => {}
  });
  
  // Form states
  const [newClient, setNewClient] = useState({
    email: '',
    businessName: '',
    businessType: '',
    subscriptionTier: 'professional',
    billingCycle: 'monthly'
  });

  const [newScript, setNewScript] = useState<Script>({
    name: '',
    file: null,
    clientId: ''
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Account settings state
  const [settingsForm, setSettingsForm] = useState({
    currentPassword: '',
    newEmail: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showSettingsPasswords, setShowSettingsPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Provisioning state
  const [provisioning, setProvisioning] = useState<{[userId: string]: boolean}>({});
  const [siteUrls, setSiteUrls] = useState<{[userId: string]: string}>({});
  // siteIds state removed - using single-site architecture
  const [deploying, setDeploying] = useState<{[userId: string]: boolean}>({});

  // Add script deployment state
  const [showDeployScript, setShowDeployScript] = useState(false);
  const [selectedUserForScript, setSelectedUserForScript] = useState<ApprovedUser | null>(null);
  const [scriptDeployForm, setScriptDeployForm] = useState({
    scriptName: '',
    scriptContent: ''
  });

  // Filter state
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'deactivated'>('all');
  const [filterTier, setFilterTier] = useState<'all' | 'starter' | 'professional' | 'business'>('all');

  // Edit user state
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<ApprovedUser | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    businessName: '',
    businessType: '',
    subscriptionTier: 'professional',
    billingCycle: 'monthly',
    adminNotes: ''
  });

  // Add script testing state
  const [testingForm, setTestingForm] = useState({
    selectedUser: '',
    scriptContent: '',
    previewMode: 'desktop' as 'desktop' | 'tablet' | 'mobile'
  });

  // Add state for file uploads at the top of AdminPage component
  const [testFile1, setTestFile1] = useState<File | null>(null);
  const [testFile2, setTestFile2] = useState<File | null>(null);
  const [testFile1Info, setTestFile1Info] = useState<ParsedFileData | null>(null);
  const [testFile2Info, setTestFile2Info] = useState<ParsedFileData | null>(null);

  // Migration state
  const [testFile1Error, setTestFile1Error] = useState<string>('');
  const [testFile2Error, setTestFile2Error] = useState<string>('');
  const [testFileLoading, setTestFileLoading] = useState<{file1: boolean, file2: boolean}>({file1: false, file2: false});

  const [scriptDeployError, setScriptDeployError] = useState<string>('');

  // Add state for selected headers
  const [selectedHeaders1, setSelectedHeaders1] = useState<string[]>([]);
  const [selectedHeaders2, setSelectedHeaders2] = useState<string[]>([]);

  // Add state for preview mode
  const [previewMode, setPreviewMode] = useState<'development' | 'client'>('development');

  // Add deployed scripts state
  const [deployedScripts, setDeployedScripts] = useState<{[userId: string]: (string | ScriptInfo)[]}>({});

  // Enhanced state for dynamic script generation
  const [currentScriptLogic, setCurrentScriptLogic] = useState<ScriptInfo['logic'] | null>(null);

  // Add state for client selection modal
  const [showClientSelection, setShowClientSelection] = useState(false);
  const [clientSelectionOptions, setClientSelectionOptions] = useState<ApprovedUser[]>([]);

  // Add notification state after other state declarations
  
  // Inline notifications state for better UX
  const [inlineNotifications, setInlineNotifications] = useState<Record<string, { type: 'success' | 'error' | 'info'; message: string }>>({});

  // Add Visual Step Builder state
  const [scriptSteps, setScriptSteps] = useState<any[]>([]);
  const [stepHistory, setStepHistory] = useState<any[]>([]);
  const [currentStepEdit, setCurrentStepEdit] = useState('');

  // Add missing script testing state variables
  const [showContinueOption, setShowContinueOption] = useState(false);
  const [isExecutingSteps, setIsExecutingSteps] = useState(false);
  const [currentWorkingData, setCurrentWorkingData] = useState<any[]>([]);

  // Visual Step Builder State
  const [showVisualStepBuilder, setShowVisualStepBuilder] = useState(false);
  const [stepBuilderSteps, setStepBuilderSteps] = useState<any[]>([]);
  const [stepExecutionData, setStepExecutionData] = useState<{[key: number]: any[]}>({});
  const [isExecutingStep, setIsExecutingStep] = useState(false);
  const [viewingStepNumber, setViewingStepNumber] = useState<number | null>(null);

  // Enhanced state management for better UX
  const [operationLoading, setOperationLoading] = useState<{ [key: string]: boolean }>({});
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [isProcessingScript, setIsProcessingScript] = useState(false);

  // Script Testing Environment state
  const [testEnvironmentReady, setTestEnvironmentReady] = useState(false);
  const [testFiles, setTestFiles] = useState<{
    file1: File | null;
    file2: File | null;
  }>({ file1: null, file2: null });
  const [testScript, setTestScript] = useState<string>('');
  const [testScriptText, setTestScriptText] = useState('');
  const [testScriptFileName, setTestScriptFileName] = useState<string>('');
  const [scriptInputMethod, setScriptInputMethod] = useState<'paste' | 'upload'>('paste');
  const [testScriptResults, setTestScriptResults] = useState<ScriptExecutionResult | null>(null);
  const [isTestingScript, setIsTestingScript] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showFileValidationMessage, setShowFileValidationMessage] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [validationType, setValidationType] = useState<'error' | 'warning' | ''>('');
  
  // File data states for script testing
  const [file1Data, setFile1Data] = useState<FileRow[]>([]);
  const [file2Data, setFile2Data] = useState<FileRow[]>([]);
  const [file1Name, setFile1Name] = useState<string>('');
  const [file2Name, setFile2Name] = useState<string>('');
  

  // Force clear validation messages function
  const forceClearValidation = () => {
    setShowFileValidationMessage(false);
    setValidationMessage('');
    setValidationType('');
    setIsValidating(false);
  };
  
  // Script building states

  
  // Loading helper functions
  const setOperationState = (operation: string, isLoading: boolean) => {
    setOperationLoading(prev => ({ ...prev, [operation]: isLoading }));
  };

  const trackActivity = () => {
    setLastActivity(new Date());
  };

  // Add notification helper functions
  // Inline notification helpers
  const showInlineNotification = (userId: string, type: 'success' | 'error' | 'info', message: string) => {
    setInlineNotifications(prev => ({
      ...prev,
      [userId]: { type, message }
    }));
    
    // Auto-remove after 3 seconds for success/info, 5 seconds for errors
    const timeout = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      setInlineNotifications(prev => {
        const newNotifications = { ...prev };
        delete newNotifications[userId];
        return newNotifications;
      });
    }, timeout);
  };


  // Function to show client selection modal
  const showClientSelectionModal = (users: ApprovedUser[]) => {
    setClientSelectionOptions(users);
    setShowClientSelection(true);
  };

  // Compute filtered users based on current tab and filters
  const filteredUsers = useMemo(() => {
    let users: ApprovedUser[] = [];
    
    if (activeTab === 'approved') {
      users = approvedUsers;
    } else {
      users = []; // For other tabs, we don't have filteredUsers concept
    }

    // Filter out any undefined, null, or invalid users
    users = users.filter(user => user && user.id && user.email);

    // Apply search filter
    if (searchTerm) {
      users = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.businessName && user.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply tier filter
    if (tierFilter !== 'all') {
      users = users.filter(user => user.subscriptionTier === tierFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      users = users.filter(user => user.status === statusFilter);
    }

    // Apply sorting
    users.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      
      switch (sortBy) {
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'businessName':
          aValue = a.businessName || '';
          bValue = b.businessName || '';
          break;
        case 'subscriptionTier':
          aValue = a.subscriptionTier || '';
          bValue = b.subscriptionTier || '';
          break;
        case 'approvedAt':
        default:
          aValue = a.approvedAt || '';
          bValue = b.approvedAt || '';
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return users;
  }, [approvedUsers, searchTerm, tierFilter, statusFilter, sortBy, sortOrder, activeTab]);

  // Override window.alert to prevent any popups and redirect to our notification system
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: any) => {
      // Convert alert to console logging instead of popups
      if (typeof message === 'string') {
        if (message.toLowerCase().includes('success') || message.toLowerCase().includes('deployed')) {
          console.log('✓ Operation Successful:', message);
        } else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
          console.error('❌ Operation Failed:', message);
        } else {
          console.log('ℹ️ System Message:', message);
        }
      }
    };
    
    // Cleanup on unmount
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Fetch clients

  // Fetch pending users
  const fetchPendingUsers = useCallback(async () => {
    try {
      console.log('🔍 fetchPendingUsers: Using unified data service...');
      
      // Use unified service - handles all table complexity internally
      const unifiedUsers = await getUsersByWorkflowStage('pending');
      
      // Map UnifiedUser to PendingUser interface for backward compatibility
      const mappedUsers: PendingUser[] = unifiedUsers.map((user: UnifiedUser) => ({
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        businessType: user.business_type,
        subscriptionTier: user.subscription_tier,
        billingCycle: user.billing_cycle,
        createdAt: user.created_at,
        // Add consultation tracking fields
        consultationCompleted: false, // Default for pending users
        scriptReady: false // Default for pending users
      }));
      
      console.log('✅ fetchPendingUsers: Found', mappedUsers.length, 'pending users via unified service');
      setPendingUsers(mappedUsers);
      
    } catch (error: any) {
      console.error('❌ Error in fetchPendingUsers:', error);
      setPendingUsers([]);
    }
  }, [user]);

  // Email uniqueness validation helper
  const validateEmailUniqueness = async (email: string, excludeId?: string, table: 'clients' | 'usage' = 'clients') => {
    const query = supabase
      .from(table)
      .select('id, email')
      .eq('email', email);
    
    if (excludeId) {
      query.neq('id', excludeId);
    }
    
    const { data: existingUsers, error } = await query;
    
    if (error) throw error;
    
    if (existingUsers && existingUsers.length > 0) {
      throw new Error(`Email ${email} already exists in ${table} table. Cannot create duplicate.`);
    }
    
    return true;
  };


  // Fetch ready-for-testing users
  const fetchReadyForTestingUsers = useCallback(async () => {
    try {
      console.log('🔍 fetchReadyForTestingUsers: Using unified data service...');
      
      // Use unified service for core user data
      const unifiedUsers = await getUsersByWorkflowStage('qa_testing');
      
      // Get QA-specific data from ready-for-testing table
      const userIds = unifiedUsers.map(u => u.id);
      const { data: qaData } = await supabase
        .from('ready-for-testing')
        .select('*')
        .in('id', userIds)
        .order('readyfortestingat', { ascending: false });
      
      // Map QA data by user ID for easy lookup
      const qaDataMap = new Map(qaData?.map(qa => [qa.id, qa]) || []);
      
      // Combine unified user data with QA-specific fields
      const mappedData: ReadyForTestingUser[] = unifiedUsers.map((user: UnifiedUser) => {
        const qa = qaDataMap.get(user.id);
        
        return {
          id: user.id,
          email: user.email,
          businessName: user.business_name,
          businessType: user.business_type,
          subscriptionTier: user.subscription_tier,
          billingCycle: user.billing_cycle,
          createdAt: user.created_at,
          // QA-specific fields from ready-for-testing table (all lowercase columns)
          readyForTestingAt: qa?.readyfortestingat || new Date().toISOString(),  // Fixed: lowercase column
          qaStatus: qa?.qastatus || 'pending',                                    // Fixed: lowercase column
          qaTestedAt: qa?.qatestedat,                                             // Fixed: lowercase column
          qaTestingNotes: qa?.qatestnotes || '',                                  // Fixed: lowercase column
          websiteProvisioned: qa?.websiteprovisioned || false,                   // Fixed: lowercase column
          websiteProvisionedAt: qa?.websiteprovisionedat,                        // Fixed: lowercase column
          scriptDeployed: qa?.scriptdeployed || false,                           // Fixed: lowercase column
          scriptDeployedAt: qa?.scriptdeployedat,                                // Fixed: lowercase column
          siteUrl: qa?.siteurl,
          siteId: qa?.siteid,
          siteName: qa?.sitename,
          // Default consultation fields
          consultationCompleted: true, // Must be true to reach QA testing
          scriptReady: true // Must be true to reach QA testing
        };
      });
      
      console.log('✅ fetchReadyForTestingUsers: Found', mappedData.length, 'QA testing users via unified service');
      console.log('🔍 QA Status breakdown:', mappedData.map(u => ({ email: u.email, qaStatus: u.qaStatus })));
      setReadyForTestingUsers(mappedData);
      
    } catch (error: any) {
      console.error('❌ Error in fetchReadyForTestingUsers:', error);
      setReadyForTestingUsers([]);
    }
  }, [user]);

  // Fetch approved users
  const fetchApprovedUsers = useCallback(async () => {
    try {
      console.log('🔍 fetchApprovedUsers: Using unified data service...');
      
      // Use unified service for core user data
      const unifiedUsers = await getUsersByWorkflowStage('approved');
      
      // Get approved-user-specific data from usage table (basic data only)
      const userIds = unifiedUsers.map(u => u.id);
      const { data: usageData } = await supabase
        .from('usage')
        .select('id, status, createdAt')
        .in('id', userIds);
      
      // Map usage data by user ID for easy lookup
      const usageDataMap = new Map(usageData?.map(usage => [usage.id, usage]) || []);
      
      // Combine unified user data with approved-user-specific fields
      const approvedUsersData: ApprovedUser[] = unifiedUsers.map((user: UnifiedUser) => {
        const usage = usageDataMap.get(user.id);
        
        return {
          id: user.id,
          email: user.email,
          businessName: user.business_name,
          businessType: user.business_type,
          subscriptionTier: user.subscription_tier,
          billingCycle: user.billing_cycle,
          comparisonsUsed: user.comparisons_used,
          comparisonsLimit: user.comparisons_limit,
          status: user.status,
          createdAt: user.created_at,
          approvedAt: usage?.createdAt || new Date().toISOString(),
          // Default consultation fields
          consultationCompleted: true, // Must be true to reach approved
          scriptReady: true, // Must be true to reach approved
        };
      });
      
      // Get site URLs and scripts from clients table instead
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, client_path, deployed_scripts')
        .in('id', userIds);
      
      const urlsData: {[userId: string]: string} = {};
      const scriptsData: {[userId: string]: (string | ScriptInfo)[]} = {};
      
      clientsData?.forEach((client) => {
        if (client.client_path) {
          urlsData[client.id] = `https://grbalance.com/${client.client_path}`;
        }
        if (client.deployed_scripts && Array.isArray(client.deployed_scripts)) {
          scriptsData[client.id] = client.deployed_scripts;
        }
      });
      
      console.log('✅ fetchApprovedUsers: Found', approvedUsersData.length, 'approved users via unified service');
      setApprovedUsers(approvedUsersData);
      setSiteUrls(urlsData);
      setDeployedScripts(scriptsData);
      
    } catch (error: any) {
      console.error('❌ Error in fetchApprovedUsers:', error);
      setApprovedUsers([]);
    }
  }, [user]);

  // Delete user (hard delete)
  const deleteUser = async (userId: string) => {
    try {
      // Find user details before deletion for logging
      const userToDelete = approvedUsers.find(u => u.id === userId);
      console.log('🗑️ Attempting to delete user:', {
        id: userId,
        email: userToDelete?.email,
        businessName: userToDelete?.businessName,
        currentStatus: userToDelete?.status
      });

      // STEP 1: Verify user exists before deletion and check all related tables
      console.log('🔍 Checking user existence across all tables...');
      
      const { data: existingUser, error: selectError } = await supabase
        .from('usage')
        .select('id, email, status')
        .eq('id', userId)
        .single();

      if (selectError) {
        console.error('❌ Error checking user existence:', selectError);
        throw new Error(`User verification failed: ${selectError.message}`);
      }

      if (!existingUser) {
        console.error('❌ User not found in database:', userId);
        throw new Error('User not found in database');
      }

      console.log('✅ User exists in usage table:', existingUser);
      
      // Also check clients table for related data
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userId);
      
      console.log('🔍 Client table data before deletion:', clientData);
      
      // STEP 2: Perform delete with enhanced response logging
      console.log('🔄 Executing delete operation...');
      const deleteResponse = await supabase
        .from('usage')
        .delete()
        .eq('id', userId)
        .select(); // Request the deleted data back for verification

      console.log('📋 FULL DELETE RESPONSE:', {
        error: deleteResponse.error,
        data: deleteResponse.data,
        status: deleteResponse.status,
        statusText: deleteResponse.statusText,
        count: deleteResponse.count
      });

      // STEP 3: Check for errors
      if (deleteResponse.error) {
        console.error('❌ Supabase delete error:', deleteResponse.error);
        throw new Error(`Delete failed: ${deleteResponse.error.message}`);
      }

      // STEP 4: Verify deletion actually occurred
      if (!deleteResponse.data || deleteResponse.data.length === 0) {
        console.error('❌ DELETE FAILED - No rows were deleted!');
        console.error('🔍 This could indicate:');
        console.error('   • Row Level Security (RLS) is blocking the delete');
        console.error('   • User ID format mismatch');
        console.error('   • Database constraints preventing deletion');
        console.error('   • User was already deleted by another process');
        
        // Try to re-check if user still exists
        const { data: stillExists } = await supabase
          .from('usage')
          .select('id')
          .eq('id', userId)
          .single();
          
        if (stillExists) {
          throw new Error('Delete operation failed - user still exists in database. This may be a permissions issue.');
        } else {
          console.log('🤔 User no longer exists - may have been deleted by another process');
        }
      }

      console.log('✅ DELETE SUCCESSFUL - Rows affected:', deleteResponse.data?.length);
      console.log('🗑️ Deleted user data:', deleteResponse.data);
      
      // STEP 5: COMPLETE USER DELETION VIA NETLIFY FUNCTION
      console.log('🔄 Calling server-side deletion function...');
      try {
        const deleteResponse = await fetch('/.netlify/functions/delete-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });

        const deleteResult = await deleteResponse.json();
        
        if (!deleteResponse.ok) {
          console.error('❌ Server-side deletion failed:', deleteResult);
          throw new Error(deleteResult.error || 'Deletion failed');
        }
        
        console.log('✅ Complete user deletion successful:', deleteResult.message);
        
        // Verify deletion was complete
        console.log('🔍 Verifying complete deletion...');
        const { data: remainingUsage } = await supabase
          .from('usage')
          .select('id')
          .eq('id', userId);
        
        const { data: remainingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('id', userId);
          
        console.log('🔍 Remaining usage records:', remainingUsage?.length || 0);
        console.log('🔍 Remaining client records:', remainingClient?.length || 0);
        
        if (remainingUsage?.length > 0 || remainingClient?.length > 0) {
          console.warn('⚠️ WARNING: Some data still exists after deletion!');
        }
        
      } catch (serverDeleteError) {
        console.error('❌ Server deletion error:', serverDeleteError);
        throw new Error(`Complete deletion failed: ${serverDeleteError.message}`);
      }
      
      // STEP 6: Refresh data and verify user is gone from UI
      console.log('🔄 Refreshing user data...');
      
      // Force immediate UI update by removing from local state first
      console.log('🔄 Removing user from local state immediately...');
      setApprovedUsers(prev => prev.filter(u => u.id !== userId));
      
      // Then refresh from database to confirm
      await fetchApprovedUsers();
      
      // STEP 7: Final verification - check if user is still in local state
      setTimeout(() => {
        const stillInUI = approvedUsers.find(u => u.id === userId);
        if (stillInUI) {
          console.error('⚠️ WARNING: User still appears in UI after refresh!');
          console.error('🔍 This suggests the delete may not have persisted');
          // Force another refresh
          fetchApprovedUsers();
        } else {
          console.log('✅ CONFIRMED: User removed from UI successfully');
        }
      }, 2000);
      
      // Show success notification
      setNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'User Deleted',
        message: `User ${userToDelete?.email} has been permanently removed from the database`,
        timestamp: new Date(),
        read: false
      });
      
    } catch (error: any) {
      console.error('🚨 COMPREHENSIVE DELETE ERROR REPORT:');
      console.error('🚨 Error message:', error.message);
      console.error('🚨 Error type:', typeof error);
      console.error('🚨 Full error object:', error);
      console.error('🚨 Stack trace:', error.stack);
      console.error('🚨 User ID attempted:', userId);
      console.error('🚨 User ID type:', typeof userId);
      
      setNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Delete Failed',
        message: `Could not delete user: ${error.message}`,
        timestamp: new Date(),
        read: false
      });
    }
  };


  // Load data when user is authenticated (or when bypassing auth)
  useEffect(() => {
    if (hasInitiallyLoaded.current) return;
    
    const currentUser = skipAuth ? mockUser : user;
    const isLoading = skipAuth ? false : authLoading;
    
    if (currentUser && !isLoading) {
      hasInitiallyLoaded.current = true;
      console.log('🔒 User authenticated (or bypassed), loading data...');
      setLoading(true);
      
      // For localhost bypass, just set loading to false since we don't have real data
      if (skipAuth) {
        console.log('🚧 LOCALHOST BYPASS: Skipping data fetch for testing');
        setLoading(false);
      } else {
        // Fetch data for real auth
        Promise.all([
          fetchPendingUsers(),
          fetchReadyForTestingUsers(),
          fetchApprovedUsers()
        ]).finally(() => {
          setLoading(false);
        });
      }
    } else if (!currentUser && !isLoading) {
      console.log('🔒 User not authenticated');
      setLoading(false);
    }

    // Add error catching for debugging
    window.addEventListener('error', (event) => {
      console.error('🚨 UNHANDLED ERROR:', event.error);
      console.error('🚨 ERROR DETAILS:', {
        message: event.error?.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 UNHANDLED PROMISE REJECTION:', event.reason);
      console.error('🚨 REJECTION DETAILS:', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }, [user, authLoading]);

  // Database debugging utility function
  const debugSupabaseSetup = async () => {
    console.log('🔍 SUPABASE DEBUG REPORT:');
    console.log('============================');
    
    try {
      // Test 1: Check connection
      console.log('🔗 Testing Supabase connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('usage')
        .select('count', { count: 'exact', head: true });
      
      if (connectionError) {
        console.error('❌ Connection failed:', connectionError);
      } else {
        console.log('✅ Connection successful, total records:', connectionTest);
      }

      // Test 2: Check authentication
      console.log('🔐 Checking authentication...');
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('❌ Auth error:', authError);
      } else {
        console.log('✅ Authenticated user:', currentUser?.email || 'Anonymous');
      }

      // Test 3: Test simple select
      console.log('📋 Testing simple select...');
      const { data: selectTest, error: selectError } = await supabase
        .from('usage')
        .select('id, email, status')
        .limit(3);
        
      if (selectError) {
        console.error('❌ Select failed:', selectError);
      } else {
        console.log('✅ Select successful, sample records:', selectTest);
      }

      // Test 4: Check table schema
      console.log('🏗️ Checking table schema...');
      const { data: schemaTest, error: schemaError } = await supabase
        .from('usage')
        .select('*')
        .limit(1);
        
      if (!schemaError && schemaTest?.[0]) {
        console.log('✅ Table columns:', Object.keys(schemaTest[0]));
      }

      // Test 5: Test permissions with a safe update
      console.log('🔒 Testing update permissions...');
      const testUserId = selectTest?.[0]?.id;
      if (testUserId) {
        const { error: updateError } = await supabase
          .from('usage')
          .update({ updatedAt: new Date().toISOString() })
          .eq('id', testUserId)
          .select();
          
        if (updateError) {
          console.error('❌ Update permission denied:', updateError);
          console.error('🔍 This suggests RLS (Row Level Security) may be blocking operations');
        } else {
          console.log('✅ Update permissions OK');
        }
      }

    } catch (error) {
      console.error('🚨 Debug test failed:', error);
    }
    
    console.log('============================');
    console.log('🔍 SUPABASE DEBUG COMPLETE');
  };

  // Initialize test environment when Script Testing tab is accessed
  useEffect(() => {
    if (activeTab === 'script-testing') {
      console.log('🔧 Script testing tab activated, initializing environment...');
      initializeTestEnvironment();
    } else {
      // Reset library status when leaving script-testing tab
      setLibraryStatus('initializing');
    }
  }, [activeTab, file1Data, file2Data]);

  // Move pending user to ready-for-testing (3-stage workflow)
  const moveToTesting = async (userId: string, userData: Partial<ReadyForTestingUser>) => {
    try {
      console.log('🚀 moveToTesting: Using unified service for workflow stage update...');
      
      // Get the pending user data for validation
      const pendingUser = pendingUsers.find(user => user.id === userId);
      if (!pendingUser) {
        console.error('🚨 Pending user not found');
        return;
      }
      
      // Check if consultation is complete and script is ready
      if (!pendingUser.consultationCompleted || !pendingUser.scriptReady) {
        throw new Error('User must complete consultation and have script ready before moving to testing.');
      }
      
      // Use unified service to update workflow stage - handles all table complexity internally
      console.log('🔧 Updating workflow stage from pending to qa_testing via unified service...');
      await updateUserWorkflowStage(userId, 'qa_testing');
      
      // Create ready-for-testing entry for QA-specific tracking
      const readyForTestingData = {
        id: userId,
        email: pendingUser.email,
        businessname: pendingUser.businessName,        // Fixed: lowercase for ready-for-testing table
        businesstype: pendingUser.businessType,        // Fixed: lowercase for ready-for-testing table
        subscriptiontier: pendingUser.subscriptionTier, // Fixed: lowercase for ready-for-testing table
        billingcycle: pendingUser.billingCycle,         // Fixed: lowercase for ready-for-testing table
        createdat: pendingUser.createdAt,               // Fixed: lowercase for ready-for-testing table
        readyfortestingat: new Date().toISOString(),    // Fixed: lowercase for ready-for-testing table
        qastatus: 'pending',                            // Fixed: lowercase for ready-for-testing table
        websiteprovisioned: false,                      // Fixed: lowercase for ready-for-testing table
        scriptdeployed: false,                          // Fixed: lowercase for ready-for-testing table
        updatedat: new Date().toISOString()             // Fixed: lowercase for ready-for-testing table
      };
      
      console.log('📝 Creating QA tracking record in ready-for-testing table...');
      const { error: insertError } = await supabase
        .from('ready-for-testing')
        .insert([readyForTestingData]);
      
      if (insertError) throw insertError;
      
      // Refresh data
      console.log('🔄 Refreshing data...');
      await fetchPendingUsers();
      await fetchReadyForTestingUsers();
      console.log('✅ moveToTesting completed via unified service');
        
    } catch (error: any) {
      console.error('❌ Error moving user to testing:', error);
      throw error; // Re-throw so the UI can handle it
    }
  };

  // Approve pending user
  const approvePendingUser = async (userId: string) => {
    try {
      
      // Get the pending user data
      const pendingUser = pendingUsers.find(user => user.id === userId);
      if (!pendingUser) {
        console.error('🚨 Pending user not found');
        return;
      }
      
      // Check if consultation is complete and script is ready
      if (!pendingUser.consultationCompleted || !pendingUser.scriptReady) {
        throw new Error('User must complete consultation and have script ready before approval.');
      }
      

      // Get the comparison limit based on subscription tier
      const comparisonLimit = TIER_LIMITS[pendingUser.subscriptionTier as keyof typeof TIER_LIMITS] || 0;

      // Prepare update data (using snake_case for database fields)
      // Update usage table (only columns that exist in usage table)
      const usageUpdateData = {
        status: 'approved',
        comparisonsLimit: comparisonLimit,
        subscriptionTier: pendingUser.subscriptionTier, // Correct camelCase for usage table
        updatedAt: new Date().toISOString()
      };

      const { error: usageUpdateError } = await supabase
        .from('usage')
        .update(usageUpdateData)
        .eq('id', userId);

      if (usageUpdateError) throw usageUpdateError;

      // Update clients table (business info belongs here)
      const clientUpdateData = {
        business_name: pendingUser.businessName,    // snake_case for clients table
        subscription_tier: pendingUser.subscriptionTier, // snake_case for clients table
        status: 'active', // Update client status to active when approved
        updated_at: new Date().toISOString()
      };

      const { error: clientUpdateError } = await supabase
        .from('clients')
        .update(clientUpdateData)
        .eq('id', userId);
      
      if (clientUpdateError) throw clientUpdateError;

      // CRITICAL FIX: Insert approved user into clients table
      // This is what makes users appear in the admin dashboard
      const clientData = {
        id: userId,
        name: pendingUser.businessName,
        email: pendingUser.email,
        subdomain: pendingUser.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                  pendingUser.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client',
        scripts: [],
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      const { error: clientInsertError } = await supabase
        .from('clients')
        .insert(clientData);
      
      if (clientInsertError) throw clientInsertError;

      // IMPORTANT: Remove from pendingUsers collection
      const { error: deleteError } = await supabase
        .from('pendingUsers')
        .delete()
        .eq('id', userId);
      
      if (deleteError) throw deleteError;

      // Close modal and refresh data
      setShowEditUser(false);
      setSelectedUserForEdit(null);
      await fetchApprovedUsers();
      await fetchPendingUsers(); // Refresh pending users to update badge count
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      // Error logged to console
    }
  };

  // Update pending user (for consultation tracking)
  const updatePendingUser = async (userId: string, updates: Partial<PendingUser>) => {
    try {
      // Filter out fields that don't exist in the database table
      const dbUpdates = { ...updates };
      delete dbUpdates.consultationCompleted;
      delete dbUpdates.scriptReady;
      delete dbUpdates.consultationNotes;
      
      // Only send fields that exist in the database
      const { error } = await supabase
        .from('pendingUsers')
        .update({
          ...dbUpdates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state for UI purposes
      setPendingUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, ...updates }
          : user
      ));
      
      // Don't refresh from database to preserve local UI state
      
    } catch (error) {
      console.error('Error updating pending user:', error);
    }
  };

  // Reject pending user
  const rejectPendingUser = async (userId: string) => {
    try {
      
      // Remove from pendingUsers table
      const { error: pendingError } = await supabase
        .from('pendingUsers')
        .delete()
        .eq('id', userId);
      
      if (pendingError) throw pendingError;

      // Delete from Supabase Auth using secure Netlify function
      try {
        const response = await fetch('/.netlify/functions/delete-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error deleting from auth:', errorData);
        }
      } catch (authError) {
        console.error('Error calling delete-user function:', authError);
        // Continue anyway since pendingUsers was already deleted
      }
      
      // Refresh pending users list
      await fetchPendingUsers();
      
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };



  // Confirmation handlers
  const handleApprovePendingUser = (userId: string, userEmail: string) => {
    showConfirmation(
      'Approve User Account',
      `Are you sure you want to approve ${userEmail}?

This will:
• Grant them full access to their subscription plan
• Allow them to use all platform features
• Send them login credentials

Important:
• This action cannot be easily undone
• User will gain immediate access
• They will receive email notification`,
      'Approve User',
      'bg-green-600 text-white',
      async () => {
        // Show loading state
        showInlineNotification(userId, 'info', 'Approving user...');
        
        try {
          await approvePendingUser(userId);
          showInlineNotification(userId, 'success', 'User approved successfully!');
        } catch (error) {
          showInlineNotification(userId, 'error', 'Failed to approve user');
        }
      }
    );
  };

  const handleRejectPendingUser = (userId: string, userEmail: string) => {
    showConfirmation(
      'Permanently Reject User',
      `Are you sure you want to reject ${userEmail}?

This will:
• Permanently delete their account
• Remove all their registration data
• Require them to register again if they want access

Warning:
• THIS ACTION CANNOT BE UNDONE
• All user data will be lost
• User will not be notified automatically`,
      'Reject & Delete',
      'bg-red-600 text-white',
      () => rejectPendingUser(userId)
    );
  };


  // Handler for user deletion with confirmation
  const handleDeleteUser = (userId: string, userEmail: string) => {
    showConfirmation(
      'Delete User Account',
      `Are you sure you want to PERMANENTLY delete the account for ${userEmail}?

This will:
• Completely remove user from database
• Delete all user data permanently  
• Remove access to platform
• Keep Netlify site intact

⚠️ WARNING:
• This is a PERMANENT deletion - cannot be undone
• All user data will be lost forever
• Consider deactivating instead if you may need to restore later`,
      'Delete User',
      'bg-red-600 hover:bg-red-700',
      () => deleteUser(userId)
    );
  };

  // Handler for user restoration with confirmation  

  // Edit user handlers
  const handleEditUser = (user: ApprovedUser) => {
    setSelectedUserForEdit(user);
    setEditUserForm({
      businessName: user.businessName || '',
      businessType: user.businessType || '',
      subscriptionTier: user.subscriptionTier || 'professional',
      billingCycle: user.billingCycle || 'monthly',
      adminNotes: (user as any).adminNotes || ''
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUserForEdit) return;

    try {
      const newComparisonLimit = TIER_LIMITS[editUserForm.subscriptionTier as keyof typeof TIER_LIMITS] || 0;
      
      // Update usage table (only columns that exist)
      const { error: usageError } = await supabase
        .from('usage')
        .update({
          subscriptionTier: editUserForm.subscriptionTier, // Correct camelCase for usage table
          comparisonsLimit: newComparisonLimit,
          updatedAt: new Date().toISOString()
        })
        .eq('id', selectedUserForEdit.id);

      if (usageError) throw usageError;

      // Update clients table (business info belongs here)
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          business_name: editUserForm.businessName,    // snake_case for clients table
          subscription_tier: editUserForm.subscriptionTier, // snake_case for clients table
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUserForEdit.id);

      if (clientError) throw clientError;

      // User details updated successfully
      
      // Close modal and refresh data
      setShowEditUser(false);
      setSelectedUserForEdit(null);
      await fetchApprovedUsers();
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      // Error logged to console
    }
  };

  // Add new client
  const addClient = async () => {
    try {
      
      // Validate required fields
      if (!newClient.email || !newClient.businessName || !newClient.businessType) {
        console.error('❌ Missing required fields: Email, Business Name, and Business Type');
        return;
      }


      // Create a usage record for the new client (pre-approved)
      const clientId = `admin_${Date.now()}`; // Generate unique ID for admin-created clients
      const comparisonLimit = TIER_LIMITS[newClient.subscriptionTier as keyof typeof TIER_LIMITS] || 0;


      // Create client record
      const clientData = {
        id: clientId,
        email: newClient.email,
        business_name: newClient.businessName,        // snake_case for clients table
        subscription_tier: newClient.subscriptionTier, // snake_case for clients table
        client_path: newClient.businessName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        status: 'active'
      };

      // Create usage record
      const usageData = {
        id: clientId,
        email: newClient.email,
        subscriptionTier: newClient.subscriptionTier, // camelCase for usage table
        comparisonsUsed: 0,
        comparisonsLimit: comparisonLimit,
        status: 'approved',
        updatedAt: new Date().toISOString()
      };

      // Insert into clients table
      const { error: clientError } = await supabase
        .from('clients')
        .insert(clientData);

      if (clientError) throw clientError;

      // Insert into usage table
      const { error: usageError } = await supabase
        .from('usage')
        .insert(usageData);
      
      if (usageError) throw usageError;

      // Success - no notification needed
      
      setShowAddClient(false);
      setNewClient({ 
        email: '', 
        businessName: '', 
        businessType: '', 
        subscriptionTier: 'professional', 
        billingCycle: 'monthly' 
      });
      
      // Refresh approved users to show the new client
      await fetchApprovedUsers();
      
    } catch (error: any) {
      console.error('🚨 ERROR adding client:', error);
      console.error('🚨 Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      console.error('❌ Failed to add client:', error.message || 'Unknown error');
    }
  };

  // Upload script
  const uploadScript = async () => {
    try {
      // Implementation would upload script
      setShowUploadScript(false);
      setNewScript({ name: '', file: null, clientId: '' });
    } catch (error) {
      console.error('Error uploading script:', error);
    }
  };

  // Show confirmation dialog
  const showConfirmation = (
    title: string,
    message: string,
    confirmText: string,
    confirmStyle: string,
    onConfirm: () => void
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      confirmStyle,
      onConfirm
    });
  };

  // Close confirmation dialog
  const closeConfirmation = () => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      confirmText: '',
      confirmStyle: '',
      onConfirm: () => {}
    });
  };

  // Login function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const { error } = await signIn(loginForm.email, loginForm.password);
      
      if (error) {
        console.error('🚨 Login error:', error);
        setLoginError(error.message || 'Login failed');
      } else {
        // Clear form
        setLoginForm({ email: '', password: '' });
      }
    } catch (error: any) {
      console.error('🚨 Login error:', error);
      setLoginError(error.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Update email function
  const handleUpdateEmail = async () => {
    setSettingsError('Email updates are currently disabled during Supabase migration. Please contact support for account changes.');
    return;
  };

  // Update password function
  const handleUpdatePassword = async () => {
    setSettingsError('Password updates are currently disabled during Supabase migration. Please contact support for account changes.');
    return;
  };

  const handleProvisionWebsite = async (user: ApprovedUser) => {
    // Check if site already exists
          if (siteUrls[user.id]) {
      console.log('ℹ️ Website already exists for', user.businessName || user.email, ':', siteUrls[user.id]);
      return;
    }

    setProvisioning((prev) => ({ ...prev, [user.id]: true }));
    
    // Add debug logging
    console.log('🚀 Starting provisioning for user:', {
      userId: user.id,
      businessName: user.businessName,
      email: user.email
    });
    
    try {
      const businessName = user.businessName || user.email || user.id;
      const clientId = businessName.toLowerCase().replace(/[^a-z0-9]/g, '') || user.id;
      
      // Check if we're in development mode (localhost)
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        // Mock provisioning for development
        console.log('🧪 Development mode - using mock provisioning');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate mock site data
        const mockSiteUrl = `https://mock-${clientId}.netlify.app`;
        console.log('✅ Mock provisioning successful:', {
          siteUrl: mockSiteUrl
        });
        
        // Update local state
        setSiteUrls((prev) => ({ ...prev, [user.id]: mockSiteUrl }));
        
        // Persist to database so it survives page refreshes
        const { error } = await supabase
          .from('usage')
          .update({
            siteUrl: mockSiteUrl,
            clientPath: clientId,
            websiteCreated: true,
            updatedAt: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (error) throw error;
        
        showInlineNotification(user.id, 'success', 
          `Mock website created: ${mockSiteUrl}`);
        
      } else {
        // Single-site approach - just generate the client URL
        const clientPath = businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                          user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
        const siteUrl = `https://grbalance.com/${clientPath}`;
        
        // Update local state
        setSiteUrls((prev) => ({ ...prev, [user.id]: siteUrl }));
        
        // Persist to database so it survives page refreshes
        const { error } = await supabase
          .from('usage')
          .update({
            siteUrl: siteUrl,
            clientPath: clientPath,
            websiteCreated: true,
            updatedAt: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (error) throw error;
        
        showInlineNotification(user.id, 'success', 
          `Client access created: ${siteUrl} (Ready immediately)`);
      }
      
    } catch (err: any) {
      console.error('❌ Provisioning error:', err);
      const data = err.response?.data;
      let msg = 'Provisioning failed: ';
      if (data?.error) msg += data.error;
      else if (data?.message) msg += data.message;
      else msg += err.message || JSON.stringify(data) || 'Unknown error';
      
      // Show detailed error information
      const status = err.response?.status || 'Unknown';
      console.error('❌ Provisioning failed:', status, msg);
      
      console.error('Provisioning error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        full: err
      });
    } finally {
      setProvisioning((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  // Script testing function
  const runTestScript = async () => {
    console.log('🚀 Running test script via Netlify function (same as client portal)...');
    console.log('📊 File1Data length:', file1Data.length);
    console.log('📊 File2Data length:', file2Data.length);
    console.log('📄 testScript:', testScript ? `${testScript.length} chars` : 'null');
    console.log('📄 testScriptText:', testScriptText ? `${testScriptText.length} chars` : 'null');
    console.log('📄 scriptInputMethod:', scriptInputMethod);
    
    // Check if we have files and script
    if (file1Data.length === 0) {
      console.warn('❌ No file1Data - script cannot run');
      return;
    }
    
    const scriptContent = testScript || testScriptText;
    console.log('📄 Final scriptContent:', scriptContent ? `${scriptContent.length} chars` : 'null');
    
    if (!scriptContent || scriptContent.trim().length === 0) {
      console.warn('❌ No script content - script cannot run');
      return;
    }
    
    try {
      // Show loading state
      setIsTestingScript(true);
      console.log('🌐 Calling same Netlify function as client portal...');
      
      // Convert file data to array format (same as client portal sends)
      const convertToArrayFormat = (data: any[]) => {
        if (!data || data.length === 0) return [];
        
        // Get headers from first object
        const headers = Object.keys(data[0]);
        const arrayData = [headers]; // First row is headers
        
        // Convert each object to array of values
        data.forEach(row => {
          const rowArray = headers.map(header => row[header] || '');
          arrayData.push(rowArray);
        });
        
        return arrayData;
      };
      
      const file1DataArray = convertToArrayFormat(file1Data);
      const file2DataArray = file2Data.length > 0 ? convertToArrayFormat(file2Data) : [];
      
      console.log('📤 Sending to Netlify function - File1:', file1DataArray.length, 'rows, File2:', file2DataArray.length, 'rows');
      
      // Call the SAME Netlify function that client portal uses
      const response = await fetch(`https://grbalance.com/.netlify/functions/execute-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: scriptContent,
          file1Data: file1DataArray,
          file2Data: file2DataArray
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Netlify function failed: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Netlify function success - results:', data.result?.length || 0, 'rows');
      
      // Convert array results back to objects for display (admin expects objects)
      let displayResults = data.result;
      if (data.result && data.result.length > 1 && Array.isArray(data.result[0])) {
        console.log('🔄 Converting array results to objects for admin display');
        const headers = data.result[0];
        displayResults = [];
        
        for (let i = 1; i < data.result.length; i++) {
          const row = data.result[i];
          const obj: any = {};
          headers.forEach((header: string, index: number) => {
            obj[header] = row[index];
          });
          displayResults.push(obj);
        }
      }
      
      // Update state (same as before)
      setTestScriptResults({
        success: true,
        data: displayResults,
        timestamp: new Date().toISOString(),
        rowsProcessed: file1Data.length + (file2Data.length || 0),
        title: 'Script Results (via Netlify)',
        summary: `Executed via same Netlify function as client portal`
      });
      
      // Create HTML for results display (same as before)
      const createResultsHTML = (results: any[], title?: string, summary?: string) => {
        console.log('🔧 createResultsHTML called with:', results.length, 'results');
        const headers = results.length > 0 ? Object.keys(results[0]) : [];
        
        const html = `
          <div style="padding: 16px; background-color: #fff;">
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #666;">
                <thead>
                  <tr>
                    ${headers.map((header, index) => `
                      <th style="padding: 12px; text-align: left; border-top: 1px solid #666; border-bottom: 1px solid #666; font-weight: bold; background-color: #e5e7eb; position: relative;">
                        ${header}
                        ${index < headers.length - 1 ? '<div style="position: absolute; top: 0; right: -1px; width: 1px; height: 100%; background-color: #666; z-index: 100;"></div>' : ''}
                      </th>
                    `).join('')}
                  </tr>
                </thead>
                  <tbody>
                    ${results.slice(0, 5).map((row, index) => `
                      <tr>
                        ${headers.map(header => `<td style="padding: 12px; border: 1px solid #666;">${row[header] || row[header] === 0 ? row[header] : '0'}</td>`).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div style="margin-top: 16px; color: #666; font-size: 14px;">
                ${Math.min(results.length, 5)} of ${results.length} rows displayed${results.length > 5 ? ' (showing first 5)' : ''}
              </div>
            </div>
          `;
          
          console.log('🔧 Generated HTML:', html.substring(0, 200) + '...');
          return html;
        };
        
        // Update Script Builder display
        const scriptResultsDisplay = document.getElementById('script-results-display');
        if (scriptResultsDisplay) {
          scriptResultsDisplay.innerHTML = createResultsHTML(displayResults, 'Script Results (via Netlify)', 'Executed via same Netlify function as client portal');
        }
        
        // Update Client View replica
        const clientResultsReplica = document.getElementById('client-results-replica');
        if (clientResultsReplica) {
          clientResultsReplica.innerHTML = createResultsHTML(displayResults, 'Script Results (via Netlify)', 'Executed via same Netlify function as client portal');
        }
      
      console.log('✅ Admin script execution completed via Netlify function - results match client portal 100%');
      
    } catch (error: any) {
      console.error('❌ Netlify function error:', error);
      
      setTestScriptResults({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        rowsProcessed: 0
      });
      
      // Script error - error handled via console
    } finally {
      setIsTestingScript(false);
    }
  };

  // Clear all results function  
  const clearAllResults = () => {
    console.log('🧹 Clearing all results...');
    
    // Clear all test results and data
    setTestScriptResults(null);
    setFile1Data([]);
    setFile2Data([]);
    setFile1Name('');
    setFile2Name('');
    setSelectedHeaders1([]);
    setSelectedHeaders2([]);
    setTestScript('');
    setTestScriptText('');
    setTestScriptFileName('');
    
    // Reset any validation states
    setValidationMessage('');
    setValidationType('');
    setShowFileValidationMessage(false);
    
    // Clear any script testing states
    setIsTestingScript(false);
    setIsValidating(false);
    
    console.log('✅ All results and data cleared successfully');
  };

  // Download script results to Excel function
  const downloadScriptResultsToExcel = async () => {
    console.log('📊 Downloading script results to Excel...');
    
    if (!testScriptResults || !testScriptResults.success) {
      console.error('❌ No results available - run a script first to generate results');
      return;
    }
    
    try {
      console.log('⚙️ Generating Excel file...');
      
      // Dynamically import XLSX only when needed for better performance
      const XLSX = await import('xlsx');
      
      // Prepare the data for Excel export
      let excelData: any[] = [];
      
      // If results is an array, use it directly
      if (Array.isArray(testScriptResults.data)) {
        excelData = testScriptResults.data;
      } 
      // If results is an object with a results property
      else if (testScriptResults.data && testScriptResults.data.results) {
        excelData = testScriptResults.data.results;
      }
      // If results is a simple object, wrap it in an array
      else if (typeof testScriptResults.data === 'object') {
        excelData = [testScriptResults.data];
      }
      // If no structured data, create summary
      else {
        excelData = [{
          'Script Result': testScriptResults.data || 'Script completed successfully',
          'Timestamp': testScriptResults.timestamp,
          'Rows Processed': testScriptResults.rowsProcessed
        }];
      }
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Script Results');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `script-results-${timestamp}.xlsx`;
      
      // Download the file
      XLSX.writeFile(wb, filename);
      
      // Success - no notification needed
      console.log('✅ Excel file generated and downloaded:', filename);
      
    } catch (error: any) {
      console.error('❌ Excel download error:', error);
      console.error('❌ Export failed:', error.message || 'Failed to generate Excel file');
    }
  };



  // Missing function declarations
  const initializeTestEnvironment = () => {
    console.log('🔧 Initializing test environment...');
    
    // Update React state
    setLibraryStatus('ready');
    console.log('🎉 Library status updated to ready in React state!');
    
    // Also update DOM as fallback (in case state doesn't re-render immediately)
    const updateStatus = () => {
      const statusDiv = document.getElementById('library-status');
      console.log('🔍 Looking for library-status element:', statusDiv);
      
      if (statusDiv) {
        console.log('✅ Found library-status element, updating...');
        statusDiv.innerHTML = '<p class="text-sm text-green-700">✅ Libraries ready and loaded!</p>';
        statusDiv.className = 'mb-6 p-4 bg-green-50 border border-green-200 rounded-md';
        console.log('🎉 Status updated to green successfully via DOM!');
      } else {
        console.warn('⚠️ library-status element not found, retrying...');
        // Retry after a short delay if element not found
        setTimeout(updateStatus, 200);
      }
    };
    
    // Try immediately and also with delays
    updateStatus();
    setTimeout(updateStatus, 100);
    setTimeout(updateStatus, 500);
  };

  const parseDate = (dateString: string) => {
    return new Date(dateString);
  };

  const getDaysAgo = (date: Date | string) => {
    const now = new Date();
    
    // Handle null/undefined dates
    if (!date) {
      return 0;
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid and has getTime method
    if (!dateObj || typeof dateObj.getTime !== 'function' || isNaN(dateObj.getTime())) {
      return 0; // Return 0 for invalid dates
    }
    
    const diffTime = now.getTime() - dateObj.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getSoftwareProfileName = (profileId: string) => {
    const profile = SOFTWARE_PROFILES.find(p => p.id === profileId);
    return profile?.name || 'Unknown Profile';
  };

  const updateUserSoftwareProfile = async (userId: string, profileId: string) => {
    try {
      const { error } = await supabase
        .from('usage')
        .update({
          softwareProfile: profileId,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      await fetchApprovedUsers();
    } catch (error) {
      console.error('Error updating user software profile:', error);
    }
  };

  const updateUserInsightsSetting = async (userId: string, showInsights: boolean) => {
    try {
      const { error } = await supabase
        .from('usage')
        .update({
          showInsights,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      await fetchApprovedUsers();
    } catch (error) {
      console.error('Error updating user insights setting:', error);
    }
  };

  // Usage Management Functions
  const resetUserUsage = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('usage')
        .update({ 
          comparisonsUsed: 0,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setApprovedUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, comparisonsUsed: 0 } : user
      ));

      showInlineNotification(userId, 'success', 'Usage reset to 0');
      console.log(`✅ Reset usage for user ${userId}`);
    } catch (error) {
      console.error('Error resetting usage:', error);
      showInlineNotification(userId, 'error', 'Failed to reset usage');
    }
  };

  const addUserUsage = async (userId: string, amount: number) => {
    try {
      const user = approvedUsers.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      const newUsage = Math.min(user.comparisonsLimit, user.comparisonsUsed + amount); // Add amount (increase usage)

      const { error } = await supabase
        .from('usage')
        .update({ 
          comparisonsUsed: newUsage,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setApprovedUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, comparisonsUsed: newUsage } : u
      ));

      showInlineNotification(userId, 'success', `Added ${amount} comparisons back`);
      console.log(`✅ Added ${amount} usage back for user ${userId}`);
    } catch (error) {
      console.error('Error adding usage:', error);
      showInlineNotification(userId, 'error', 'Failed to add usage');
    }
  };

  const updateUserLimit = async (userId: string, newLimit: number) => {
    try {
      if (newLimit < 1) throw new Error('Limit must be at least 1');

      const { error } = await supabase
        .from('usage')
        .update({ 
          comparisonsLimit: newLimit,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setApprovedUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, comparisonsLimit: newLimit } : user
      ));

      showInlineNotification(userId, 'success', `Monthly limit updated to ${newLimit}`);
      console.log(`✅ Updated limit to ${newLimit} for user ${userId}`);
    } catch (error) {
      console.error('Error updating limit:', error);
      showInlineNotification(userId, 'error', 'Failed to update limit');
    }
  };

  const handleDeleteScript = async (userId: string, scriptName: string) => {
    console.log('🗑️ Deleting script:', scriptName, 'for user:', userId);
    // Add script deletion logic here
  };

  // Send approved user back to QA testing
  const sendBackToQA = async (userId: string) => {
    console.log('🚀 sendBackToQA: Using unified service for workflow stage update...');
    
    try {
      // Use unified service to update workflow stage - handles all table complexity internally
      console.log('🔧 Updating workflow stage from approved to qa_testing via unified service...');
      await updateUserWorkflowStage(userId, 'qa_testing');
      
      // Refresh data
      console.log('🔄 Refreshing data...');
      await fetchApprovedUsers();
      await fetchReadyForTestingUsers();
      console.log('✅ sendBackToQA completed via unified service');
      
    } catch (error) {
      console.error('❌ Error in sendBackToQA:', error);
      throw error; // Re-throw so the UI can handle it
    }
  };

  // Hard delete approved user
  const deleteApprovedUser = async (userId: string) => {
    console.warn('⚠️ deleteApprovedUser called - this should only be used for true hard deletions!');
    console.warn('⚠️ Consider using deactivateApprovedUser instead to preserve data');
    
    // Call the proper deleteUser function for complete deletion
    return deleteUser(userId);
  };

  // Clean up orphaned auth user (for fixing stuck registrations)
  const cleanupOrphanedAuthUser = async (email: string) => {
    try {
      console.log('🧹 Cleaning up orphaned auth user:', email);
      
      // Use the specialized cleanup function for orphaned auth users
      const response = await fetch('/.netlify/functions/cleanup-orphaned-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Cleanup failed:', result);
        // Show error notification instead of alert
        setNotification({
          id: Date.now().toString(),
          type: 'error',
          title: 'Cleanup Failed',
          message: result.error || 'Unknown error occurred',
          timestamp: new Date(),
          read: false
        });
      } else {
        console.log('✅ Successfully cleaned up orphaned auth user');
        // Show success notification instead of alert
        setNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Cleanup Successful',
          message: 'Orphaned auth user cleaned up! You can now register again.',
          timestamp: new Date(),
          read: false
        });
      }
      
      // Hide the input and clear email
      setShowCleanupInput(false);
      setCleanupEmail('');
      
    } catch (error) {
      console.error('❌ Error cleaning up orphaned auth user:', error);
      setNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Cleanup Error',
        message: error.message,
        timestamp: new Date(),
        read: false
      });
      
      // Hide the input and clear email
      setShowCleanupInput(false);
      setCleanupEmail('');
    }
  };

  const handleConfirmProvisionWebsite = (user: ApprovedUser) => {
    return handleProvisionWebsite(user);
  };

  // redeployClientSite function removed - no longer needed with single-site architecture

  // handleConfirmDeleteWebsite function removed - no separate sites to delete in single-site architecture

  const handleTestFileUpload = async (fileNumber: number, file: File) => {
    console.log(`📁 Testing file ${fileNumber} upload START:`, file.name, file.size, 'bytes');
    console.log(`📋 File type:`, file.type, `Last modified:`, new Date(file.lastModified));
    
    // File upload started - no popup notification
    
    if (!file) {
      console.warn('⚠️ No file provided to handleTestFileUpload');
      return;
    }
    
    try {
      console.log(`🔍 Starting validation for file ${fileNumber}...`);
      
      // Use the existing file processing logic
      const { validateFile } = await import('../utils/fileValidator');
      console.log(`✅ File validator imported successfully`);
      
      const validation = await validateFile(file);
      console.log(`📋 File ${fileNumber} validation result:`, validation);
      
      if (!validation.isValid) {
        const errorMsg = validation.securityWarning 
          ? `🚨 SECURITY: ${validation.error} - ${validation.securityWarning}`
          : validation.error || 'File validation failed';
        console.error(`❌ File ${fileNumber} validation failed:`, errorMsg);
        // File validation failed - error handled via console
        return;
      }
      
      console.log(`🔄 Parsing file ${fileNumber}...`);
      console.log(`📦 About to call parseFile function...`);
      
      // Parse the file
      const parsedData = await parseFile(file);
      console.log(`📊 ParseFile returned:`, parsedData);
      console.log(`✅ File ${fileNumber} parsed successfully:`, parsedData.rows.length, 'rows');
      
      // Update the appropriate file data state
      if (fileNumber === 1) {
        console.log(`🔄 Setting file1Data...`);
        setFile1Data(parsedData.rows);
        setFile1Name(file.name);
        // File 1 uploaded successfully - status shown inline
        console.log('📊 File 1 data updated in state');
      } else if (fileNumber === 2) {
        console.log(`🔄 Setting file2Data...`);
        setFile2Data(parsedData.rows);
        setFile2Name(file.name);
        // File 2 uploaded successfully - status shown inline
        console.log('📊 File 2 data updated in state');
      }
      
      console.log(`🎉 File ${fileNumber} upload process COMPLETED successfully!`);
      
    } catch (error: any) {
      console.error(`❌ File ${fileNumber} upload error:`, error);
      console.error(`❌ Error stack:`, error.stack);
      console.error(`❌ Error details:`, {
        name: error.name,
        message: error.message,
        cause: error.cause
      });
      // Upload failed - error handled via console
    }
  };

  const handleTestScriptUpload = async (file: File) => {
    console.log('📄 Testing script upload START:', file.name);
    
    if (!file) {
      console.warn('⚠️ No script file provided');
      return;
    }

    // Script upload started - no popup notification

    try {
      // Read the file content
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        console.log('📄 Script file content loaded:', content.substring(0, 100) + '...');
        
        // Update the script content in the testing form
        setTestingForm(prev => ({
          ...prev,
          scriptContent: content
        }));
        
        // Also update the script deploy form for compatibility
        setScriptDeployForm(prev => ({
          ...prev,
          scriptName: file.name.replace('.js', ''),
          scriptContent: content
        }));

        // Update script testing specific states
        setTestScript(content);
        setTestScriptFileName(file.name);
        setScriptInputMethod('upload');
        
        // Script uploaded successfully - status shown inline
        console.log('✅ Script upload completed successfully');
      };
      
      reader.onerror = (error) => {
        console.error('❌ Script file read error:', error);
        // Script upload failed - error handled via console
      };
      
      // Read as text
      reader.readAsText(file);
      
    } catch (error: any) {
      console.error('❌ Script upload error:', error);
      // Script upload failed - error handled via console
    }
  };

  const handleDeployScript = async (user: ApprovedUser) => {
    console.log('🚀 Deploying script for user:', user.email);
    
    try {
      const currentScript = scriptInputMethod === 'paste' ? testScriptText : testScript;
      
      if (!currentScript.trim()) {
        alert('No script content to deploy. Please generate or paste a script first.');
        return;
      }
      
      if (!selectedUserForScript) {
        alert('No user selected for deployment.');
        return;
      }
      
      console.log('📦 Deploying script to client_scripts table for client:', selectedUserForScript.clientPath);
      
      // Deploy script to client_scripts table where client portal can access it
      const scriptData = {
        client_id: selectedUserForScript.clientPath, // Use client_path as client_id
        name: `Reconciliation Script - ${new Date().toLocaleDateString()}`,
        content: currentScript,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('client_scripts')
        .upsert(scriptData, { onConflict: 'client_id' });
      
      if (error) {
        console.error('❌ Script deployment failed:', error);
        alert(`Deployment failed: ${error.message}`);
        return;
      }
      
      console.log('✅ Script deployed successfully to client portal:', data);
      alert(`✅ Script deployed successfully to ${selectedUserForScript.businessName} client portal!`);
      
      // Refresh the QA testing data to show updated deployment status
      await fetchReadyForTestingUsers();
      
    } catch (error) {
      console.error('❌ Deployment error:', error);
      alert(`Deployment error: ${error.message}`);
    }
  };

  // Save script to file function
  const saveScriptToFile = () => {
    const currentScript = scriptInputMethod === 'paste' ? testScriptText : testScript;
    
    if (!currentScript.trim()) {
      console.warn('No script to save');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reconciliation-script-${timestamp}.js`;
    
    // Create and download the file
    const blob = new Blob([currentScript], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`💾 Script saved as ${filename}`);
  };

  // Clear script steps/history function
  const clearScriptSteps = () => {
    console.log('📋 Clearing script execution history...');
    
    // Clear the results displays
    const scriptResultsDisplay = document.getElementById('script-results-display');
    const clientResultsReplica = document.getElementById('client-results-replica');
    
    if (scriptResultsDisplay) {
      scriptResultsDisplay.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          Run your script to see results here...
        </div>
      `;
    }
    
    if (clientResultsReplica) {
      clientResultsReplica.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          Execute script to see client-side results here...
        </div>
      `;
    }
    
    // Clear test results state
    setTestScriptResults(null);
    
    console.log('✅ Script execution history cleared');
  };

  // Software profiles constant
  const SOFTWARE_PROFILES = [
    { id: 'quickbooks', name: 'QuickBooks' },
    { id: 'square', name: 'Square' },
    { id: 'toast', name: 'Toast' },
    { id: 'clover', name: 'Clover' },
    { id: 'lightspeed', name: 'Lightspeed' },
    { id: 'shopify', name: 'Shopify' },
    { id: 'generic', name: 'Generic CSV' }
  ];

  // Show loading while checking authentication (skip if bypassing)
  if (!skipAuth && authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking admin status
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Verifying admin access...</span>
          </div>
        </div>
      </div>
    );
  }

  // Determine current user (for both auth and bypass scenarios)
  const currentUser = skipAuth ? mockUser : user;

  // EMERGENCY ADMIN BYPASS for localhost development
  const isEmergencyAdmin = (currentUser?.email === 'davisricart@gmail.com' && 
                          (window.location.hostname === 'localhost' || window.location.port === '3000')) ||
                          skipAuth; // Also bypass if we're in localhost testing mode
  
  if (isEmergencyAdmin) {
    console.log('🚨 EMERGENCY ADMIN BYPASS ACTIVATED for:', currentUser?.email || 'localhost-test');
    // Force admin access - skip all checks and render admin interface directly
  } else if (currentUser && !isAdmin && !isEmergencyAdmin) {
    // Log unauthorized access attempt
          console.warn('🚨 SECURITY ALERT: Unauthorized admin access attempt by:', currentUser.email);
      console.warn('🚨 User UID:', currentUser.id);
    console.warn('🚨 Timestamp:', new Date().toISOString());
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a 
                href="/"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Home
              </a>
            </div>
          </div>
        </nav>

        <main className="flex items-center justify-center px-4 py-12">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md border-2 border-red-200">
            <div className="flex flex-col items-center space-y-3 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-red-700 text-center text-lg font-medium">
                Access Denied
              </h2>
            </div>
            
            <div className="text-center space-y-4">
              <p className="text-gray-700">
                You are not authorized to access the admin dashboard.
              </p>
              <p className="text-sm text-gray-500">
                Current user: <span className="font-medium">{currentUser.email}</span>
              </p>
              <p className="text-sm text-gray-500">
                If you believe this is an error, please contact the system administrator.
              </p>
              {adminError && (
                <p className="text-sm text-red-600">
                  Error: {adminError}
                </p>
              )}
              
              <div className="pt-4">
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show login form if not authenticated (and not bypassing)
  if (!currentUser && !skipAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a 
                href="/"
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Home
              </a>
            </div>
          </div>
        </nav>

        <main className="flex items-center justify-center px-4 py-12">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
            <div className="flex flex-col items-center space-y-3 mb-6">
              <img 
                src={clientConfig.logo}
                alt={`${clientConfig.title} Logo`}
                className="h-28 sm:h-32 w-auto object-contain"
              />
              <h2 className="text-emerald-700 text-center text-base sm:text-lg font-medium">
                Admin Login
              </h2>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-emerald-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition duration-200"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-emerald-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-red-700 text-sm">{loginError}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Access Admin Dashboard
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage clients and user approvals</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={debugSupabaseSetup}
              className="px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md transition-colors"
              title="Run Supabase Debug Report (check console)"
            >
              🔍 Debug DB
            </button>
            {!showCleanupInput ? (
              <button
                onClick={() => setShowCleanupInput(true)}
                className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
                title="Clean up orphaned auth users causing registration errors"
              >
                🧹 Cleanup Auth
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-md border border-red-200">
                <input
                  type="email"
                  value={cleanupEmail}
                  onChange={(e) => setCleanupEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="text-xs px-2 py-1 border border-red-300 rounded w-48 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && cleanupEmail.trim()) {
                      cleanupOrphanedAuthUser(cleanupEmail.trim());
                    } else if (e.key === 'Escape') {
                      setShowCleanupInput(false);
                      setCleanupEmail('');
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (cleanupEmail.trim()) {
                      cleanupOrphanedAuthUser(cleanupEmail.trim());
                    }
                  }}
                  disabled={!cleanupEmail.trim()}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clean
                </button>
                <button
                  onClick={() => {
                    setShowCleanupInput(false);
                    setCleanupEmail('');
                  }}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
            <span className="text-sm text-gray-600">Welcome, {user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="bg-green-50 rounded-lg border border-green-100 p-1">
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('clients')}
                className={`flex-1 py-3 px-4 text-xs font-medium uppercase tracking-wide transition-all duration-200 rounded-md ${
                  activeTab === 'clients'
                    ? 'bg-white text-green-600 shadow-sm border border-green-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <User className="inline w-4 h-4 mr-2" />
                CLIENTS
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-3 px-4 text-xs font-medium uppercase tracking-wide transition-all duration-200 rounded-md ${
                  activeTab === 'pending'
                    ? 'bg-white text-green-600 shadow-sm border border-green-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Settings className="inline w-4 h-4 mr-2" />
                PENDING
                {activeTab !== 'pending' && pendingUsers.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs animate-pulse">
                    {pendingUsers.length}
                  </span>
                )}
                {activeTab === 'pending' && pendingUsers.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('ready-for-testing')}
                className={`flex-1 py-3 px-4 text-xs font-medium uppercase tracking-wide transition-all duration-200 rounded-md ${
                  activeTab === 'ready-for-testing'
                    ? 'bg-white text-green-600 shadow-sm border border-green-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Clock className="inline w-4 h-4 mr-2" />
                QA TESTING
                {activeTab !== 'ready-for-testing' && readyForTestingUsers.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                    {readyForTestingUsers.length}
                  </span>
                )}
                {activeTab === 'ready-for-testing' && readyForTestingUsers.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                    {readyForTestingUsers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`flex-1 py-3 px-4 text-xs font-medium uppercase tracking-wide transition-all duration-200 rounded-md ${
                  activeTab === 'approved'
                    ? 'bg-white text-green-600 shadow-sm border border-green-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <UserCheck className="inline w-4 h-4 mr-2" />
                APPROVED  
                {activeTab !== 'approved' && approvedUsers.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                    {approvedUsers.length}
                  </span>
                )}
                {activeTab === 'approved' && approvedUsers.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                    {approvedUsers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 px-4 text-xs font-medium uppercase tracking-wide transition-all duration-200 rounded-md ${
                  activeTab === 'settings'
                    ? 'bg-white text-green-600 shadow-sm border border-green-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Settings className="inline w-4 h-4 mr-2" />
                SETTINGS
              </button>
              <button
                onClick={() => setActiveTab('script-testing')}
                className={`flex-1 py-3 px-4 text-xs font-medium uppercase tracking-wide transition-all duration-200 rounded-md ${
                  activeTab === 'script-testing'
                    ? 'bg-white text-green-600 shadow-sm border border-green-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <FiCode className="inline w-4 h-4 mr-2" />
                SCRIPT TESTING
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            {/* Manual Client Management */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Manual Client Management</h3>
                <p className="text-sm text-gray-500 mt-1">Manually add new clients to the system</p>
              </div>
              
              <div className="p-12 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <User className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Add New Client</h3>
                <p className="mt-1 text-sm text-gray-500">Create a new client account manually with custom settings.</p>
                <div className="mt-6 space-x-4">
                  <button
                    onClick={() => setShowAddClient(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </button>
                  <button
                    onClick={() => setShowUploadScript(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Script
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <PendingUsersTab
            pendingUsers={pendingUsers}
            onMoveToTesting={moveToTesting}
            onRejectUser={async (userId: string, reason?: string) => {
              await rejectPendingUser(userId);
            }}
            onUpdatePendingUser={updatePendingUser}
            isLoading={loading}
          />
        )}

        {activeTab === 'ready-for-testing' && (
          <ReadyForTestingTab
            readyForTestingUsers={readyForTestingUsers}
            scriptStatus={scriptStatus}
            setScriptStatus={setScriptStatus}
            websiteStatus={websiteStatus}
            setWebsiteStatus={setWebsiteStatus}
            customUrls={customUrls}
            setCustomUrls={setCustomUrls}
            onFinalApprove={async (userId: string, userData: Partial<ApprovedUser>) => {
              console.log('🚀 onFinalApprove: Using unified service for workflow stage update...');
              
              try {
                // Get user data for validation
                const readyUser = readyForTestingUsers.find(u => u.id === userId);
                if (!readyUser) {
                  console.error('❌ Ready user not found for userId:', userId);
                  return;
                }

                // Use unified service to update workflow stage - handles all table complexity internally
                console.log('🔧 Updating workflow stage from qa_testing to approved via unified service...');
                await updateUserWorkflowStage(userId, 'approved');
                
                // Note: Additional approval data is handled by updateUserWorkflowStage
                // No need to update usage table with extra fields that don't exist
                
                // Remove from ready-for-testing collection (QA data no longer needed)
                console.log('🗑️ Removing from ready-for-testing collection...');
                const { error: deleteError, count } = await supabase
                  .from('ready-for-testing')
                  .delete()
                  .eq('id', userId);
                
                if (deleteError) {
                  console.error('❌ Failed to remove from ready-for-testing:', deleteError);
                  throw deleteError; // Make this critical since it causes duplicates
                } else {
                  console.log('✅ Removed from ready-for-testing, rows affected:', count);
                }
                
                // Refresh data
                console.log('🔄 Refreshing data...');
                await fetchReadyForTestingUsers();
                await fetchApprovedUsers();
                console.log('✅ onFinalApprove completed via unified service');
                
              } catch (error) {
                console.error('❌ Error in onFinalApprove:', error);
                throw error; // Re-throw so the UI can handle it
              }
            }}
            onSendBackToPending={async (userId: string, reason?: string) => {
              console.log('🔄 sendBackToPending: Using unified service for workflow stage update...');
              
              // Get user data for validation
              const readyUser = readyForTestingUsers.find(u => u.id === userId);
              if (!readyUser) {
                console.error('❌ Ready user not found for userId:', userId);
                throw new Error('User not found in ready-for-testing list');
              }
              
              try {
                // Use unified service to update workflow stage - handles all table complexity internally
                console.log('🔧 Updating workflow stage from qa_testing to pending via unified service...');
                await updateUserWorkflowStage(userId, 'pending');
                
                // Remove from ready-for-testing collection (QA-specific data no longer needed)
                console.log('🗑️ Removing from ready-for-testing collection...');
                const { error: deleteError } = await supabase
                  .from('ready-for-testing')
                  .delete()
                  .eq('id', userId);
                
                if (deleteError) {
                  console.warn('⚠️ Failed to remove from ready-for-testing (non-critical):', deleteError);
                }
                
                // Refresh data
                console.log('🔄 Refreshing data...');
                await fetchReadyForTestingUsers();
                await fetchPendingUsers();
                console.log('✅ sendBackToPending completed via unified service');
                
              } catch (error) {
                console.error('❌ Error in sendBackToPending:', error);
                throw error; // Re-throw so the UI can handle it
              }
            }}
            onUpdateTestingUser={async (userId: string, updates: Partial<ReadyForTestingUser>) => {
              // Import the database mapper
              const { ReadyForTestingMapper } = await import('../services/databaseMapper');
              
              // Map standardized field names to actual database column names
              const standardUpdates = {
                ...(updates.qaStatus !== undefined && { qa_status: updates.qaStatus }),
                ...(updates.qaTestingNotes !== undefined && { qa_testing_notes: updates.qaTestingNotes }),
                ...(updates.websiteProvisioned !== undefined && { website_provisioned: updates.websiteProvisioned }),
                ...(updates.scriptDeployed !== undefined && { script_deployed: updates.scriptDeployed }),
                updated_at: new Date().toISOString()
              };
              
              const dbUpdates = ReadyForTestingMapper.toDb(standardUpdates);
              
              console.log('📝 Updating QA status for user:', userId);
              console.log('🔄 Original updates:', updates);
              console.log('🔄 Standard updates:', standardUpdates);
              console.log('📝 Database updates (mapped):', dbUpdates);
              
              // Try to update first, then insert if no record exists (UPSERT)
              const { error: updateError } = await supabase
                .from('ready-for-testing')
                .update(dbUpdates)
                .eq('id', userId);
              
              if (updateError) {
                // If update failed, try to insert a new record
                console.log('🔄 Update failed, attempting insert...');
                const insertStandardData = {
                  id: userId,
                  ready_for_testing_at: new Date().toISOString(),
                  ...standardUpdates
                };
                
                const insertData = ReadyForTestingMapper.toDb(insertStandardData);
                
                const { error: insertError } = await supabase
                  .from('ready-for-testing')
                  .insert(insertData);
                
                if (insertError) {
                  console.error('❌ Both update and insert failed:', insertError);
                  throw insertError;
                }
                
                console.log('✅ New ready-for-testing record created with mapped columns');
              } else {
                console.log('✅ Database update successful with mapped columns');
                
                // Verify the update by querying the updated record
                const { data: verifyData, error: verifyError } = await supabase
                  .from('ready-for-testing')
                  .select('qastatus')
                  .eq('id', userId)
                  .single();
                  
                if (!verifyError && verifyData) {
                  console.log('🔍 Verification: Updated QA status in DB:', verifyData.qastatus);
                } else {
                  console.warn('⚠️ Could not verify update:', verifyError);
                }
              }
              
              // Refresh data - refresh QA testing users to reflect status change
              console.log('🔄 Refreshing QA testing data after status update...');
              await fetchReadyForTestingUsers();
              console.log('✅ QA testing data refresh completed');
            }}
            isLoading={loading}
          />
        )}

        {activeTab === 'approved' && (
          <ApprovedUsersTab
            users={filteredUsers}
            isLoading={loading}
            onResetUsage={resetUserUsage}
            onAddUsage={addUserUsage}
            onUpdateLimit={updateUserLimit}
            onSendBackToQA={sendBackToQA}
            onDeleteUser={deleteApprovedUser}
            inlineNotifications={inlineNotifications}
            onRefreshUsers={fetchApprovedUsers}
          />
        )}

        {false && activeTab === 'approved-old' && (
          <div className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Users
                  </label>
                  <input
                    type="text"
                    placeholder="Search by email, business name, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'approved' | 'deactivated')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription
                  </label>
                  <select
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value as 'all' | 'starter' | 'professional' | 'business')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Tiers</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                      setFilterTier('all');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              {/* Results count */}
              <div className="mt-3 text-sm text-gray-600">
                Showing {filteredUsers.length} of {approvedUsers.length} users
              </div>
            </div>

            {/* Approved Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Approved Users</h3>
                <p className="text-sm text-gray-500 mt-1">Manage approved user accounts</p>
              </div>
              
              {approvedUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <Settings className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No approved users</h3>
                  <p className="mt-1 text-sm text-gray-500">All approved users have been processed.</p>
                  <div className="mt-6">
                    <div className="text-xs text-gray-400">
                      Approved users will appear here for admin review
                    </div>
                  </div>
                </div>
              ) : (
                /* Mobile-friendly card layout instead of wide table */
                <div className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="p-6 hover:bg-gray-50">
                      {/* User Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            user.status === 'approved' 
                              ? 'bg-green-100' 
                              : 'bg-gray-100'
                          }`}>
                            {user.status === 'approved' ? (
                              <UserCheck className="h-5 w-5 text-green-600" />
                            ) : (
                              <HiLockClosed className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                            {user.status === 'deactivated' && (
                              <div className="text-xs text-red-600 font-medium mt-1">
                                ⚠️ Account Deactivated
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.subscriptionTier}
                          </span>
                          {user.status === 'deactivated' && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Deactivated
                            </span>
                          )}
                        </div>
                      </div>

                      {/* User Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4 text-sm">
                        <div>
                          <div className="text-gray-500 text-xs uppercase tracking-wide font-medium">Business</div>
                          <div className="mt-1">
                            <div className="text-gray-900">{user.businessName || 'N/A'}</div>
                            <div className="text-gray-500">{user.businessType || 'N/A'}</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-500 text-xs uppercase tracking-wide font-medium">Usage</div>
                          <div className="mt-1">
                            <div className="text-gray-900">
                              {user.comparisonsUsed || 0}/{user.comparisonsLimit} used
                            </div>
                            <div className="text-gray-500">
                              ${user.subscriptionTier === 'starter' ? '19' : user.subscriptionTier === 'professional' ? '29' : '49'}/month
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-500 text-xs uppercase tracking-wide font-medium">Registration</div>
                          <div className="mt-1">
                            <div className="text-gray-900">{parseDate(user.createdAt)?.toLocaleDateString() || 'N/A'}</div>
                            <div className="text-gray-500">
                              {getDaysAgo(user.createdAt)} days ago
                            </div>
                          </div>
                        </div>



                        {/* Site Status - Only show if user has a website (completed 3-stage workflow) */}
                        {siteUrls[user.id] && (
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wide font-medium">Site Status</div>
                            <div className="mt-1">
                              <div>
                                <div className="text-green-600 font-medium">Provisioned</div>
                                <a
                                  href={siteUrls[user.id]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                                >
                                  View Site
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Available Scripts Section */}
                      {siteUrls[user.id] && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                          <div className="text-blue-700 text-sm font-semibold mb-3 flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Available Scripts ({deployedScripts[user.id]?.length || 0})
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              What user sees on their website
                            </span>
                          </div>
                          <div className="space-y-2">
                            {deployedScripts[user.id] && deployedScripts[user.id].length > 0 ? (
                              deployedScripts[user.id].map((script, index) => {
                                // Handle both old string format and new object format
                                const scriptName = typeof script === 'string' ? script : script.name;
                                const scriptInfo = typeof script === 'object' ? script : null;
                                
                                return (
                                  <div
                                    key={`${user.id}-${scriptName}-${index}`}
                                    className="bg-white border border-blue-200 rounded-lg p-3 shadow-sm"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-gray-900">{scriptName}</span>
                                          {scriptInfo?.status === 'active' && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                              Active
                                            </span>
                                          )}
                                        </div>
                                        
                                        {scriptInfo && (
                                          <div className="text-xs text-gray-600 space-y-1">
                                            <div>Deployed: {new Date(scriptInfo.deployedAt).toLocaleString()}</div>
                                            <div>Size: {scriptInfo.size} characters | Type: {scriptInfo.type}</div>
                                            {scriptInfo.preview && (
                                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-700 border-l-2 border-blue-400">
                                                <div className="text-blue-600 font-semibold mb-1">Script Preview:</div>
                                                {scriptInfo.preview}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                                                            handleDeleteScript(user.id, scriptName);
                                        }}
                                        className="ml-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-all"
                                        title={`Remove ${scriptName}`}
                                      >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-4 text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
                                <Upload className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                                <div className="font-medium mb-1">No scripts deployed yet</div>
                                <div className="text-sm text-blue-500">
                                  Use "Deploy Script" to add custom analysis scripts to their website
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Admin Notes */}
                      {(user as any).adminNotes && (
                        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                          <div className="text-xs text-yellow-700 font-medium mb-1">ADMIN NOTES:</div>
                          <div className="text-sm text-yellow-800">{(user as any).adminNotes}</div>
                        </div>
                      )}

                      {/* Actions - Primary and Secondary Groups */}
                      <div className="space-y-2">
                        {user.status === 'approved' ? (
                          <>
                            {/* PRIMARY Actions */}
                            <div className="flex flex-wrap gap-2">
                              {siteUrls[user.id] && (
                                <a
                                  href={siteUrls[user.id]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex-shrink-0"
                                >
                                  <HiGlobeAlt className="w-4 h-4" />
                                  Visit Site
                                </a>
                              )}

                              {siteUrls[user.id] && (
                                <button
                                  onClick={() => {
                                    setSelectedUserForScript(user);
                                    setShowDeployScript(true);
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
                                >
                                  <Settings className="w-4 h-4" />
                                  Deploy Script
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleEditUser(user)}
                                className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
                              >
                                <User className="w-4 h-4" />
                                Edit Details
                              </button>
                            </div>

                            {/* DANGER ZONE */}
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleDeactivateApprovedUser(user.id, user.email)}
                                className="inline-flex items-center gap-1.5 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex-shrink-0"
                              >
                                <HiLockClosed className="w-4 h-4" />
                                Deactivate
                              </button>
                              
                              <button
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                            </div>
                          </>
                        ) : (
                          // Deactivated users - simplified
                          <>
                            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm">
                              <HiLockClosed className="w-4 h-4" />
                              Account Deactivated
                            </div>
                            <button
                              type="button"
                              onClick={() => handleReactivateApprovedUser(user.id, user.email)}
                              className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4" />
                              Reactivate
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}



        {false && activeTab === 'profiles' && (
          <div className="space-y-6">
            {/* Software Profiles Management */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Software Profiles Management</h3>
                <p className="text-sm text-gray-500 mt-1">Configure how data is parsed for different POS software</p>
              </div>
              
              <div className="p-6">
                {/* How It Works Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-lg font-medium text-blue-900 mb-3">🧠 How Smart Column Detection Works</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>1. Automatic Matching:</strong> When a file is uploaded, the system searches for column headers containing these keywords</p>
                    <p><strong>2. Case-Insensitive:</strong> "Date", "date", "DATE" all match</p>
                    <p><strong>3. Partial Matching:</strong> "Transaction Date" matches "Date" keyword</p>
                    <p><strong>4. First Match Wins:</strong> Uses the first column found that contains any keyword</p>
                    <p><strong>5. Fallback Options:</strong> Multiple keywords provide backup options if first one isn't found</p>
                  </div>
                </div>

                {/* Current Profiles */}
                <div className="space-y-6">
                  {SOFTWARE_PROFILES.map((profile) => (
                    <div key={profile.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{profile.displayName}</h4>
                          <p className="text-sm text-gray-500">ID: {profile.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            profile.insightsConfig.showInsights 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {profile.insightsConfig.showInsights ? 'Insights Enabled' : 'Basic Only'}
                          </span>
                        </div>
                      </div>

                      {/* Column Detection Keywords */}
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Column Detection Keywords</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Date Columns</label>
                              <div className="text-xs bg-gray-50 rounded p-2 border">
                                {profile.dataStructure.dateColumn.map((keyword, idx) => (
                                  <div key={idx} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1 mb-1">
                                    {keyword}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Amount Columns</label>
                              <div className="text-xs bg-gray-50 rounded p-2 border">
                                {profile.dataStructure.amountColumn.map((keyword, idx) => (
                                  <div key={idx} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-1 mb-1">
                                    {keyword}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Customer Columns</label>
                              <div className="text-xs bg-gray-50 rounded p-2 border">
                                {profile.dataStructure.customerColumn.map((keyword, idx) => (
                                  <div key={idx} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded mr-1 mb-1">
                                    {keyword}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Card Brand Columns</label>
                              <div className="text-xs bg-gray-50 rounded p-2 border">
                                {profile.dataStructure.cardBrandColumn.map((keyword, idx) => (
                                  <div key={idx} className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded mr-1 mb-1">
                                    {keyword}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Fee Columns</label>
                              <div className="text-xs bg-gray-50 rounded p-2 border">
                                {profile.dataStructure.feeColumn.map((keyword, idx) => (
                                  <div key={idx} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded mr-1 mb-1">
                                    {keyword}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tab Configuration */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Available Features</h5>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(profile.availableTabs).map(([tab, enabled]) => (
                              <span key={tab} className={`px-2 py-1 rounded text-xs font-medium ${
                                enabled 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {enabled ? '✓' : '✗'} {tab.charAt(0).toUpperCase() + tab.slice(1)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Future Enhancement Note */}
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">🚀 Future Enhancement: Dynamic Profile Editor</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>• <strong>Add Custom Profiles:</strong> Create profiles for new POS software</p>
                    <p>• <strong>Edit Keywords:</strong> Modify column detection keywords</p>
                    <p>• <strong>Test Detection:</strong> Upload sample files to test column matching</p>
                    <p>• <strong>Clone Profiles:</strong> Duplicate existing profiles as starting points</p>
                    <p>• <strong>Import/Export:</strong> Share profiles between admin accounts</p>
                  </div>
                  <div className="mt-3">
                    <button 
                      onClick={() => console.log('ℹ️ Feature Coming Soon: Dynamic profile editing will be available in the next update!')}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                    >
                      Request Profile Editor Feature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {false && activeTab === 'dynamic-profiles' && (
          <div className="space-y-6">
            {/* Dynamic Profile Editor Header */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <h3 className="text-lg font-medium">🚀 Dynamic Profile Editor</h3>
                <p className="text-blue-100 mt-1">Create, edit, test, and clone software profiles dynamically</p>
              </div>
              
              <div className="p-6">
                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Feature 1: Add Custom Profiles */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Plus className="w-6 h-6 text-emerald-600 mr-2" />
                      <h4 className="font-medium text-emerald-900">Add Custom Profiles</h4>
                    </div>
                    <p className="text-sm text-emerald-700 mb-3">Create profiles for new POS software with custom naming and keyword configuration.</p>
                    <button className="w-full bg-emerald-600 text-white px-3 py-2 rounded text-sm hover:bg-emerald-700 transition-colors">
                      Create New Profile
                    </button>
                  </div>

                  {/* Feature 2: Edit Keywords */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Edit className="w-6 h-6 text-blue-600 mr-2" />
                      <h4 className="font-medium text-blue-900">Edit Keywords</h4>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">Modify column detection keywords for existing profiles with visual editor.</p>
                    <button className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                      Edit Keywords
                    </button>
                  </div>

                  {/* Feature 3: Test Detection */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Upload className="w-6 h-6 text-orange-600 mr-2" />
                      <h4 className="font-medium text-orange-900">Test Detection</h4>
                    </div>
                    <p className="text-sm text-orange-700 mb-3">Upload sample CSV files to test column matching before deploying profiles.</p>
                    <button className="w-full bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 transition-colors">
                      Test Profile
                    </button>
                  </div>

                  {/* Feature 4: Clone Profiles */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Copy className="w-6 h-6 text-purple-600 mr-2" />
                      <h4 className="font-medium text-purple-900">Clone Profiles</h4>
                    </div>
                    <p className="text-sm text-purple-700 mb-3">Duplicate existing profiles as starting points for new configurations.</p>
                    <button className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors">
                      Clone Profile
                    </button>
                  </div>
                </div>

                {/* Test Profile Detection */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-medium text-yellow-900 mb-4">🧪 Test Profile Detection</h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profile Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Profile to Test</label>
                      <select
                        value={selectedProfileForTest}
                        onChange={(e) => setSelectedProfileForTest(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">Choose a profile...</option>
                        {SOFTWARE_PROFILES.map(profile => (
                          <option key={profile.id} value={profile.id}>
                            {profile.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* File Upload for Testing */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Test CSV</label>
                      <div className="border-2 border-dashed border-yellow-300 rounded-lg p-4 text-center">
                        <Upload className="mx-auto h-8 w-8 text-yellow-600 mb-2" />
                        <p className="text-sm text-yellow-700">Drop CSV file here or click to browse</p>
                        <input type="file" accept=".csv" className="hidden" />
                      </div>
                    </div>
                  </div>

                  {/* Test Results */}
                  {selectedProfileForTest && (
                    <div className="mt-6 p-4 bg-white border border-yellow-300 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">Detection Preview</h5>
                      <div className="text-xs text-gray-600">
                        <p>Profile: <span className="font-medium">{SOFTWARE_PROFILES.find(p => p.id === selectedProfileForTest)?.displayName}</span></p>
                        <p className="mt-2">Upload a CSV file to see which columns would be detected for each data type.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Profiles with Action Buttons */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Current Software Profiles</h4>
                  
                  {SOFTWARE_PROFILES.map((profile) => (
                    <div key={profile.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="text-lg font-medium text-gray-900">{profile.displayName}</h5>
                          <p className="text-sm text-gray-500">ID: {profile.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => console.log('ℹ️ Edit Profile feature coming soon for', profile.displayName)}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                          >
                            <Edit className="w-4 h-4 inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => console.log('ℹ️ Clone Profile feature coming soon for', profile.displayName)}
                            className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-sm hover:bg-purple-200 transition-colors"
                          >
                            <Copy className="w-4 h-4 inline mr-1" />
                            Clone
                          </button>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            profile.insightsConfig.showInsights 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {profile.insightsConfig.showInsights ? 'Insights Enabled' : 'Basic Only'}
                          </span>
                        </div>
                      </div>

                      {/* Compact Keywords Display */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <label className="block font-medium text-gray-600 mb-1">Date</label>
                          <div className="flex flex-wrap gap-1">
                            {profile.dataStructure.dateColumn.slice(0, 2).map((keyword, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                            {profile.dataStructure.dateColumn.length > 2 && (
                              <span className="text-gray-500">+{profile.dataStructure.dateColumn.length - 2}</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block font-medium text-gray-600 mb-1">Amount</label>
                          <div className="flex flex-wrap gap-1">
                            {profile.dataStructure.amountColumn.slice(0, 2).map((keyword, idx) => (
                              <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                            {profile.dataStructure.amountColumn.length > 2 && (
                              <span className="text-gray-500">+{profile.dataStructure.amountColumn.length - 2}</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block font-medium text-gray-600 mb-1">Customer</label>
                          <div className="flex flex-wrap gap-1">
                            {profile.dataStructure.customerColumn.slice(0, 2).map((keyword, idx) => (
                              <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                            {profile.dataStructure.customerColumn.length > 2 && (
                              <span className="text-gray-500">+{profile.dataStructure.customerColumn.length - 2}</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block font-medium text-gray-600 mb-1">Card Brand</label>
                          <div className="flex flex-wrap gap-1">
                            {profile.dataStructure.cardBrandColumn.slice(0, 2).map((keyword, idx) => (
                              <span key={idx} className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                            {profile.dataStructure.cardBrandColumn.length > 2 && (
                              <span className="text-gray-500">+{profile.dataStructure.cardBrandColumn.length - 2}</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block font-medium text-gray-600 mb-1">Fee</label>
                          <div className="flex flex-wrap gap-1">
                            {profile.dataStructure.feeColumn.slice(0, 2).map((keyword, idx) => (
                              <span key={idx} className="bg-red-100 text-red-800 px-2 py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                            {profile.dataStructure.feeColumn.length > 2 && (
                              <span className="text-gray-500">+{profile.dataStructure.feeColumn.length - 2}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Business Impact */}
                <div className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-emerald-900 mb-3">💼 Business Impact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">∞</div>
                      <div className="font-medium text-emerald-800">Unlimited Customization</div>
                      <div className="text-emerald-700">Support any POS software</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="font-medium text-blue-800">Developer Dependency</div>
                      <div className="text-blue-700">Admins create profiles independently</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">⚡</div>
                      <div className="font-medium text-purple-800">Instant Deployment</div>
                      <div className="text-purple-700">New profiles live immediately</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Production Mode Toggle */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">System Status</h3>
                <p className="text-sm text-gray-500 mt-1">Automatic usage limit detection</p>
              </div>
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">🤖 Auto-Detection Active</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <strong>Localhost:</strong> Unlimited usage (development environment)</p>
                    <p>• <strong>Test users:</strong> Unlimited usage (emails containing 'test' or 'demo')</p>
                    <p>• <strong>Live users:</strong> Normal subscription limits apply</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Account Settings */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
                <p className="text-sm text-gray-500 mt-1">Update your admin account email and password</p>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Current Account Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Current Account</h4>
                  <p className="text-sm text-blue-700">
                                            Email: <span className="font-medium">{user?.email || 'Not available'}</span>
                  </p>
                </div>

                {/* Success/Error Messages */}
                {settingsSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-600">{settingsSuccess}</p>
                  </div>
                )}

                {settingsError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{settingsError}</p>
                  </div>
                )}

                {/* Update Email Section */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Change Email Address</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password (required for verification)
                      </label>
                      <div className="relative">
                        <input
                          type={showSettingsPasswords.current ? 'text' : 'password'}
                          value={settingsForm.currentPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPasswords({...showSettingsPasswords, current: !showSettingsPasswords.current})}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showSettingsPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Email Address
                      </label>
                      <input
                        type="email"
                        value={settingsForm.newEmail}
                        onChange={(e) => setSettingsForm({...settingsForm, newEmail: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new email address"
                      />
                    </div>

                    <button
                      onClick={handleUpdateEmail}
                      disabled={settingsLoading || !settingsForm.currentPassword || !settingsForm.newEmail}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {settingsLoading ? 'Updating...' : 'Update Email'}
                    </button>
                  </div>
                </div>

                {/* Update Password Section */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSettingsPasswords.current ? 'text' : 'password'}
                          value={settingsForm.currentPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPasswords({...showSettingsPasswords, current: !showSettingsPasswords.current})}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showSettingsPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSettingsPasswords.new ? 'text' : 'password'}
                          value={settingsForm.newPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter new password (min 6 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPasswords({...showSettingsPasswords, new: !showSettingsPasswords.new})}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showSettingsPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSettingsPasswords.confirm ? 'text' : 'password'}
                          value={settingsForm.confirmPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, confirmPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPasswords({...showSettingsPasswords, confirm: !showSettingsPasswords.confirm})}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showSettingsPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleUpdatePassword}
                      disabled={settingsLoading || !settingsForm.currentPassword || !settingsForm.newPassword || !settingsForm.confirmPassword}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {settingsLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h5 className="text-sm font-medium text-yellow-800 mb-2">Security Notice</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• You'll need to enter your current password to make any changes</li>
                    <li>• Choose a strong password with at least 6 characters</li>
                    <li>• Email changes may require verification</li>
                    <li>• Keep your credentials secure and don't share them</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'script-testing' && (
          <div className="space-y-6">
            {/* Script Testing Environment */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Script Testing Environment</h3>
                <p className="text-sm text-gray-500 mt-1">Test your GR Balance scripts locally before deployment</p>
              </div>
              
              <div className="p-6">
                {/* Library Status */}
                <div 
                  id="library-status" 
                  className={`mb-6 p-4 rounded-md ${
                    libraryStatus === 'ready' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <p className={`text-sm ${
                    libraryStatus === 'ready' 
                      ? 'text-green-700' 
                      : 'text-blue-700'
                  }`}>
                    {libraryStatus === 'ready' 
                      ? '✅ Libraries ready and loaded!' 
                      : '🔄 Initializing libraries...'
                    }
                  </p>
                </div>

                {/* File Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Primary Dataset Upload - Green Theme */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-semibold text-sm">
                        1
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-green-800">Primary Dataset</h3>
                        <p className="text-xs text-green-600">Main data source for analysis</p>
                      </div>
                    </div>
                    
                    <div 
                      id="test-file1-dropzone"
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer group ${
                        file1Data.length > 0 
                          ? 'border-green-500 bg-green-100' 
                          : 'border-green-300 hover:border-green-500 hover:bg-green-100'
                      }`}
                    >
                      <input
                        type="file"
                        id="test-file1"
                        accept=".xlsx,.xls,.csv"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleTestFileUpload(1, file);
                          }
                        }}
                      />
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <svg className="w-8 h-8 text-green-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-sm">
                          <span className="text-green-600 font-medium group-hover:text-green-700">Click to upload Excel or CSV</span>
                        </div>
                        <p className="text-xs text-green-500">Primary data source</p>
                        {file1Data.length > 0 && (
                          <div className="mt-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                            ✅ {file1Name}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div id="file1-validation" className="text-sm"></div>
                  </div>
                  
                  {/* Secondary Dataset Upload - Blue Theme */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                        2
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">Secondary Dataset</h3>
                        <p className="text-xs text-blue-600">Optional - for comparisons</p>
                      </div>
                    </div>
                    
                    <div 
                      id="test-file2-dropzone"
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer group ${
                        file2Data.length > 0 
                          ? 'border-blue-500 bg-blue-100' 
                          : 'border-blue-300 hover:border-blue-500 hover:bg-blue-100'
                      }`}
                    >
                      <input
                        type="file"
                        id="test-file2"
                        accept=".xlsx,.xls,.csv"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleTestFileUpload(2, file);
                          }
                        }}
                      />
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <svg className="w-8 h-8 text-blue-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-sm">
                          <span className="text-blue-600 font-medium group-hover:text-blue-700">Click to upload Excel or CSV</span>
                        </div>
                        <p className="text-xs text-blue-500">Optional comparison file</p>
                        {file2Data.length > 0 && (
                          <div className="mt-2 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                            ✅ {file2Name}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div id="file2-validation" className="text-sm"></div>
                  </div>
                </div>

                {/* File Data Preview and Column Headers */}
                {(file1Data.length > 0 || file2Data.length > 0) && (
                  <div className="mb-6">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* File 1 Preview */}
                      {file1Data.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <h4 className="text-sm font-medium text-gray-900">Primary Dataset ({file1Data.length} rows)</h4>
                          </div>
                          
                          {/* Column Headers */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                            <h5 className="text-xs font-medium text-green-800 mb-1">Column Headers</h5>
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(file1Data[0] || {}).map((header, index) => (
                                <button
                                  key={`file1-${header}-${index}`}
                                  onClick={() => {
                                    const isSelected = selectedHeaders1.includes(header);
                                    if (isSelected) {
                                      setSelectedHeaders1(prev => prev.filter(h => h !== header));
                                    } else {
                                      setSelectedHeaders1(prev => [...prev, header]);
                                    }
                                    console.log(`🔄 Column "${header}" ${isSelected ? 'deselected' : 'selected'} for File 1`);
                                  }}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    selectedHeaders1.includes(header)
                                      ? 'bg-green-600 text-white'
                                      : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                                  }`}
                                >
                                  {header}
                                </button>
                              ))}
                            </div>
                            {selectedHeaders1.length > 0 && (
                              <p className="text-xs text-green-700 mt-2">
                                ✅ {selectedHeaders1.length} column{selectedHeaders1.length !== 1 ? 's' : ''} selected: {selectedHeaders1.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* File 2 Preview */}
                      {file2Data.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <h4 className="text-sm font-medium text-gray-900">Secondary Dataset ({file2Data.length} rows)</h4>
                          </div>
                          
                          {/* Column Headers */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <h5 className="text-xs font-medium text-blue-800 mb-1">Column Headers</h5>
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(file2Data[0] || {}).map((header, index) => (
                                <button
                                  key={`file2-${header}-${index}`}
                                  onClick={() => {
                                    const isSelected = selectedHeaders2.includes(header);
                                    if (isSelected) {
                                      setSelectedHeaders2(prev => prev.filter(h => h !== header));
                                    } else {
                                      setSelectedHeaders2(prev => [...prev, header]);
                                    }
                                    console.log(`🔄 Column "${header}" ${isSelected ? 'deselected' : 'selected'} for File 2`);
                                  }}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    selectedHeaders2.includes(header)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                                  }`}
                                >
                                  {header}
                                </button>
                              ))}
                            </div>
                            {selectedHeaders2.length > 0 && (
                              <p className="text-xs text-blue-700 mt-2">
                                ✅ {selectedHeaders2.length} column{selectedHeaders2.length !== 1 ? 's' : ''} selected: {selectedHeaders2.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Script Input Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Test Script
                  </label>
                  
                  {/* Tab selector for script input method */}
                  <div className="flex mb-4 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setScriptInputMethod('paste');
                        // Clear uploaded script when switching to paste mode
                        setTestScript('');
                        setTestScriptFileName('');
                      }}
                      className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 ${
                        scriptInputMethod === 'paste'
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Copy & Paste
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScriptInputMethod('upload');
                        // Clear pasted script when switching to upload mode
                        setTestScriptText('');
                      }}
                      className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 ${
                        scriptInputMethod === 'upload'
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>

                  {/* Copy/Paste Script */}
                  {scriptInputMethod === 'paste' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <textarea
                          id="test-script-textarea"
                          value={testScriptText}
                          onChange={(e) => {
                            setTestScriptText(e.target.value);
                            // Clear validation messages when script content is added
                            if (e.target.value.trim().length > 0) {
                              setValidationMessage('');
                              setValidationType('');
                              setShowFileValidationMessage(false);
                            }
                          }}
                          placeholder="Paste your Claude-generated script here..."
                          className="w-full h-40 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        />
                        {testScriptText && (
                                                      <button
                              type="button"
                              onClick={() => setTestScriptText('')}
                              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Paste your JavaScript reconciliation script here
                      </p>
                      {testScriptText && (
                        <p className="text-xs text-green-600">
                          ✓ Script ready ({testScriptText.length} characters)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Upload Script File */}
                  {scriptInputMethod === 'upload' && (
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group">
                        <input
                          type="file"
                          id="test-script-file"
                          accept=".js"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleTestScriptUpload(file);
                          }}
                        />
                        <label 
                          htmlFor="test-script-file" 
                          className="cursor-pointer flex flex-col items-center space-y-2"
                        >
                          <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="text-sm">
                            <span className="text-blue-600 font-medium group-hover:text-blue-700">Choose Script File</span>
                          </div>
                          <p className="text-xs text-gray-500">or drag and drop a .js file</p>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        Upload a .js file containing your script
                      </p>
                      
                      {/* Script Upload Status */}
                      {testScript && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <h5 className="font-medium text-green-900">✓ Script Loaded</h5>
                          <p className="text-sm text-green-700">
                            {testScriptFileName && <strong>{testScriptFileName}</strong>} loaded successfully ({testScript.length} characters)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons - Simplified Single Action */}
                <div className="flex space-x-4 mb-6">
                  <button
                    id="run-comparison-btn"
                    onClick={runTestScript}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    🚀 Run Script
                  </button>
                  <button
                    id="clear-results-btn"
                    onClick={clearAllResults}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-medium transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    title="Clear script execution output and results"
                  >
                    🔄 Reset Output
                  </button>
                  <button
                    id="download-excel-btn"
                    onClick={downloadScriptResultsToExcel}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    title="Download complete script results as Excel file for admin analysis"
                  >
                    📊 Download to Excel
                  </button>
                </div>

                {/* Sync Status Indicator - Shows after script execution */}
                {testScriptResults && (
                  <div className="mb-4">
                    {testScriptResults.success ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <div className="text-green-600">✅</div>
                          <div className="text-sm font-medium text-green-800">
                            Sync Status: Admin & Client Portal synchronized
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="text-red-600">❌</div>
                          <div className="text-sm font-medium text-red-800">
                            Sync Status: SYNCHRONIZATION ISSUE DETECTED
                          </div>
                        </div>
                        <div className="ml-6 text-sm text-red-700 space-y-1">
                          <div className="bg-red-100 p-2 rounded border">
                            <div><strong>Error:</strong> {testScriptResults.error}</div>
                            <div className="mt-1 text-xs">🚨 DO NOT DEPLOY until this is fixed</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Validation Message */}
                {showFileValidationMessage && validationMessage && !isTestingScript && 
                 !(testScript && testScript.length > 0) && !(testScriptText && testScriptText.length > 0) && (
                  <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 text-sm animate-pulse ${
                    validationType === 'warning' 
                      ? 'bg-amber-50 border border-amber-200 text-amber-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    <span className="text-base">{validationType === 'warning' ? '⚠️' : '❌'}</span>
                    <span>{validationMessage}</span>
                  </div>
                )}

                {/* Results Section */}
                <div id="results-section" className="space-y-6">
                  {/* Script Building */}
                  <div className="rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Script Builder</h4>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">

                        
                        <button
                          onClick={saveScriptToFile}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center space-x-1 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <span>💾</span>
                          <span>Save Script</span>
                        </button>
                        

                        
                        <button
                          onClick={clearScriptSteps}
                          className="px-3 py-2 bg-slate-600 text-white text-sm rounded-md hover:bg-slate-700 flex items-center space-x-1 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          title="Clear step-by-step execution history display"
                        >
                          <span>📋</span>
                          <span>Clear History</span>
                        </button>
                      </div>
                    </div>



                    {/* Script Results Display */}
                    <div className="bg-white border border-gray-200 rounded-lg mb-6">
                      <div className="p-4">
                        {/* Dynamic results populated by showResults function */}
                        <div id="script-results-display" className="min-h-[200px]">
                          <div className="text-center text-gray-500 py-8">
                            Run your script to see results here...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client-Side Results Replica */}
                  <div className="rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Client View</h4>
                    
                    {/* This will be styled exactly like the client interface */}
                    <div className="bg-white border border-gray-200 rounded-lg">
                      <div id="client-results-replica" className="p-6">
                        <div className="text-center text-gray-500 py-8">
                          Execute script to see client-side results here...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Add Client Modal */}
        {showAddClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Add New Client</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="client@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={newClient.businessName}
                    onChange={(e) => setNewClient({...newClient, businessName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    value={newClient.businessType}
                    onChange={(e) => setNewClient({...newClient, businessType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select business type</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="retail">Retail Store</option>
                    <option value="franchise">Franchise</option>
                    <option value="grocery">Grocery Store</option>
                    <option value="salon">Salon/Spa</option>
                    <option value="automotive">Automotive</option>
                    <option value="healthcare">Healthcare/Medical</option>
                    <option value="fitness">Fitness/Gym</option>
                    <option value="service">Service Business</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="hospitality">Hotel/Hospitality</option>
                    <option value="entertainment">Entertainment/Events</option>
                    <option value="professional">Professional Services</option>
                    <option value="nonprofit">Non-Profit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={newClient.subscriptionTier}
                    onChange={(e) => setNewClient({...newClient, subscriptionTier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="starter">
                      Starter - {newClient.billingCycle === 'annual' ? '$15' : '$19'}/month
                      {newClient.billingCycle === 'annual' ? ' (Billed as $182/year)' : ''}
                    </option>
                    <option value="professional">
                      Professional - {newClient.billingCycle === 'annual' ? '$27' : '$34'}/month
                      {newClient.billingCycle === 'annual' ? ' (Billed as $324/year)' : ''}
                    </option>
                    <option value="business">
                      Business - {newClient.billingCycle === 'annual' ? '$47' : '$59'}/month
                      {newClient.billingCycle === 'annual' ? ' (Billed as $564/year)' : ''}
                    </option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={newClient.billingCycle}
                    onChange={(e) => setNewClient({...newClient, billingCycle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (Save 20%)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddClient(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={addClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Client
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Script Modal */}
        {showUploadScript && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Upload Script</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Script Name
                  </label>
                  <input
                    type="text"
                    value={newScript.name}
                    onChange={(e) => setNewScript({...newScript, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter script name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Client
                  </label>
                  <select
                    value={selectedClientForScript}
                    onChange={(e) => setSelectedClientForScript(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No clients available</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Script File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setNewScript({...newScript, file: e.target.files?.[0] || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".js,.py,.php"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadScript(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={uploadScript}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-medium mb-4">{confirmDialog.title}</h3>
              <div className="text-gray-700 mb-6 space-y-3">
                {confirmDialog.message.split('\n\n').map((paragraph, index) => (
                  <div key={index}>
                    {paragraph.split('\n').map((line, lineIndex) => {
                      if (line.startsWith('• ')) {
                        // Handle bullet points
                        return (
                          <div key={lineIndex} className="flex items-start gap-2 ml-2">
                            <span className="text-emerald-600 font-bold text-sm mt-0.5">•</span>
                            <span className="text-sm">{line.substring(2)}</span>
                          </div>
                        );
                      } else if (line.trim() === '') {
                        // Handle empty lines
                        return <div key={lineIndex} className="h-2"></div>;
                      } else {
                        // Handle regular text lines
                        return (
                          <div key={lineIndex} className="text-sm leading-relaxed">
                            {line}
                          </div>
                        );
                      }
                    })}
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeConfirmation}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDialog.onConfirm();
                    closeConfirmation();
                  }}
                  className={`px-4 py-2 ${confirmDialog.confirmStyle} rounded-md hover:bg-opacity-90 transition-colors font-medium`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deploy Script Modal */}
        {showDeployScript && selectedUserForScript && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">
                Deploy Script for {selectedUserForScript.businessName || selectedUserForScript.email}
              </h3>
              
              {/* Show if script is pre-filled from Script Testing */}
              {scriptDeployForm.scriptContent && currentScriptLogic && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-800 font-medium text-sm">Script Auto-Loaded from Testing</span>
                  </div>
                  <div className="text-green-700 text-sm space-y-1">
                    <div><strong>Algorithm:</strong> {currentScriptLogic.algorithm}</div>
                    <div><strong>Description:</strong> {currentScriptLogic.description}</div>
                    <div><strong>Mapping:</strong> {currentScriptLogic.columnMappings.file1Column} → {currentScriptLogic.columnMappings.file2Column}</div>
                  </div>
                  <div className="text-green-600 text-xs mt-2">
                    ✅ Ready to deploy! The script content below has been automatically filled with your generated logic.
                  </div>
                </div>
              )}
              
              {/* Add form wrapper with noValidate to prevent browser validation popups */}
              <form 
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                              handleDeployScript(selectedUserForScript);
                }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Script Name
                    </label>
                    <input
                      type="text"
                      value={scriptDeployForm.scriptName}
                      onChange={(e) => setScriptDeployForm({...scriptDeployForm, scriptName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., reconciliation-script-v1.js"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                                            }
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Script Content
                      </label>
                      {scriptDeployForm.scriptContent && currentScriptLogic && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          Auto-filled from testing
                        </span>
                      )}
                    </div>
                    
                    {/* File Upload Option - only show if not pre-filled */}
                    {!scriptDeployForm.scriptContent && (
                      <div className="mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept=".js,.ts,.mjs"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const { bulletproofValidateFile } = await import('../utils/bulletproofFileValidator');
                                const validation = await bulletproofValidateFile(file);
                                if (!validation.isValid) {
                                  const errorMsg = validation.securityWarning 
                                    ? `${validation.error} ${validation.securityWarning}`
                                    : validation.error || 'Invalid file. Please upload a valid JavaScript or TypeScript file.';
                                  
                                  // Show inline error message instead of popup
                                  setScriptDeployError(errorMsg);
                                  e.target.value = '';
                                  
                                  // Clear error after 10 seconds
                                  setTimeout(() => setScriptDeployError(''), 10000);
                                  return;
                                }
                                
                                // Clear any previous errors on successful upload
                                setScriptDeployError('');
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const content = event.target?.result as string;
                                  setScriptDeployForm({
                                    ...scriptDeployForm, 
                                    scriptContent: content,
                                    scriptName: scriptDeployForm.scriptName || file.name
                                  });
                                };
                                reader.readAsText(file);
                              }
                            }}
                            className="hidden"
                            id="script-file-upload"
                          />
                          <label
                            htmlFor="script-file-upload"
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <Upload className="w-4 h-4" />
                            Upload Script File
                          </label>
                          <span className="text-sm text-gray-500">or paste/write code below</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Supports .js, .ts, .mjs files. File content will populate the editor below.
                        </p>
                        
                        {/* Inline error message display */}
                        {scriptDeployError && (
                          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-3 text-sm">
                            <div className="flex items-start gap-3">
                              <span className="text-red-600 text-lg flex-shrink-0">🚫</span>
                              <div className="flex-1">
                                <div className="font-semibold text-red-800 mb-2">File Upload Error</div>
                                <div className="text-red-700 mb-3">{scriptDeployError}</div>
                                <div className="text-red-600 text-xs">
                                  <strong>Accepted file types:</strong> JavaScript (.js), TypeScript (.ts), or Module (.mjs) files only
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Script Content Textarea */}
                    <textarea
                      value={scriptDeployForm.scriptContent}
                      onChange={(e) => setScriptDeployForm({...scriptDeployForm, scriptContent: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={15}
                      placeholder={scriptDeployForm.scriptContent ? "Script content loaded automatically..." : "// Upload a file above or enter your JavaScript code here\nfunction reconcileData() {\n  // Your custom reconciliation logic\n  console.log('Reconciliation script running...');\n}\n\n// Example usage\nreconcileData();"}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                                            }
                      }}
                    />
                    
                    {/* Quick Action Buttons - only show if not pre-filled */}
                    {!currentScriptLogic && (
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setScriptDeployForm({...scriptDeployForm, scriptContent: ''})}
                          className="text-xs px-2 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const template = `// ${scriptDeployForm.scriptName || 'Custom Script'}
// Generated: ${new Date().toLocaleDateString()}

function reconcileData() {
  console.log('🚀 Reconciliation script starting...');
  
  // Your custom logic here
  
  console.log('✅ Reconciliation complete');
}

// Auto-execute
reconcileData();`;
                            setScriptDeployForm({...scriptDeployForm, scriptContent: template});
                          }}
                          className="text-xs px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Insert Template
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Deployment Info</h4>
                    <p className="text-sm text-blue-700">
                      <strong>Client:</strong> {selectedUserForScript.businessName || selectedUserForScript.email}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Site URL:</strong> {siteUrls[selectedUserForScript.id] || 'No site provisioned'}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Client ID:</strong> {selectedUserForScript.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || selectedUserForScript.id}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeployScript(false);
                      setSelectedUserForScript(null);
                      // Don't clear scriptDeployForm if it came from testing
                      if (!currentScriptLogic) {
                        setScriptDeployForm({ scriptName: '', scriptContent: '' });
                      }
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                                      handleDeployScript(selectedUserForScript);
                    }}
                    disabled={deploying[selectedUserForScript.id] || !scriptDeployForm.scriptName || !scriptDeployForm.scriptContent}
                    className={`px-4 py-2 rounded-md transition-colors font-medium ${
                      scriptDeployForm.scriptContent && currentScriptLogic
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {deploying[selectedUserForScript.id] ? 'Deploying...' : 
                     scriptDeployForm.scriptContent && currentScriptLogic ? '🚀 Deploy Generated Script' : 'Deploy Script'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUser && selectedUserForEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">
                Edit User: {selectedUserForEdit.email}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={editUserForm.businessName}
                    onChange={(e) => setEditUserForm({...editUserForm, businessName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    value={editUserForm.businessType}
                    onChange={(e) => setEditUserForm({...editUserForm, businessType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select business type</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="retail">Retail Store</option>
                    <option value="franchise">Franchise</option>
                    <option value="grocery">Grocery Store</option>
                    <option value="salon">Salon/Spa</option>
                    <option value="automotive">Automotive</option>
                    <option value="healthcare">Healthcare/Medical</option>
                    <option value="fitness">Fitness/Gym</option>
                    <option value="service">Service Business</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="hospitality">Hotel/Hospitality</option>
                    <option value="entertainment">Entertainment/Events</option>
                    <option value="professional">Professional Services</option>
                    <option value="nonprofit">Non-Profit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={editUserForm.subscriptionTier}
                    onChange={(e) => setEditUserForm({...editUserForm, subscriptionTier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="starter">Starter - {TIER_LIMITS.starter} comparisons/month</option>
                    <option value="professional">Professional - {TIER_LIMITS.professional} comparisons/month</option>
                    <option value="business">Business - {TIER_LIMITS.business} comparisons/month</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={editUserForm.billingCycle}
                    onChange={(e) => setEditUserForm({...editUserForm, billingCycle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (Save 20%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes (Private)
                  </label>
                  <textarea
                    value={editUserForm.adminNotes}
                    onChange={(e) => setEditUserForm({...editUserForm, adminNotes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Add private notes about this client (special requirements, conversation history, etc.)"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditUser(false);
                    setSelectedUserForEdit(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Client Selection Modal for Script Deployment */}
        {showClientSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Select Client for Script Deployment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose which client gets the generated script:
                  </label>
                  <select
                    id="client-selection-dropdown"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Select a client...</option>
                    {clientSelectionOptions.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.businessName || user.email} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {currentScriptLogic && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="text-sm text-blue-800">
                      <div><strong>Script:</strong> {currentScriptLogic.description.substring(0, 50)}...</div>
                      <div><strong>Algorithm:</strong> {currentScriptLogic.algorithm}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowClientSelection(false);
                    setClientSelectionOptions([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const dropdown = document.getElementById('client-selection-dropdown') as HTMLSelectElement;
                    const selectedUserId = dropdown?.value;
                    
                    if (!selectedUserId) {
                      console.log('⚠️ No client selected - please select a client to deploy the script to');
                      return;
                    }
                    
                    const selectedUser = clientSelectionOptions.find(u => u.id === selectedUserId);
                    if (selectedUser) {
                      setSelectedUserForScript(selectedUser);
                      setShowDeployScript(true);
                      setShowClientSelection(false);
                      setClientSelectionOptions([]);
                      console.log('✓ Script pre-loaded for', selectedUser.businessName || selectedUser.email);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Deploy to Selected Client
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPage; 