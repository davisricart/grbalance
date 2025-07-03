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
import ErrorBoundary from '../components/ErrorBoundary';
import { BrowserRouter } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState('users');
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

  const [deletedUsers, setDeletedUsers] = useState<ApprovedUser[]>([]);
  const [loading, setLoading] = useState(true);
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
  const fetchClients = useCallback(async () => {
    try {
      // TEMPORARILY DISABLED - TABLE DOESN'T EXIST
      console.log('⚠️ fetchClients: Temporarily disabled (table missing)');
      setClients([]);
      return;
      
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      setClients(clientsData || []);
    } catch (error: any) {
      console.error('🚨 DATABASE ERROR in fetchClients:');
      console.error('🚨 Error Code:', error.code);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      console.error('🚨 Auth State:', user ? 'authenticated' : 'not authenticated');
      setClients([]);
    }
  }, [user]);

  // Fetch pending users
  const fetchPendingUsers = useCallback(async () => {
    try {
      const { data: users, error } = await supabase
        .from('pendingUsers')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      setPendingUsers(users || []);
    } catch (error: any) {
      console.error('🚨 DATABASE ERROR in fetchPendingUsers:');
      console.error('🚨 Error Code:', error.code);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      console.error('🚨 Auth State:', user ? 'authenticated' : 'not authenticated');
      setPendingUsers([]);
    }
  }, [user]);

  // Fetch ready-for-testing users
  const fetchReadyForTestingUsers = useCallback(async () => {
    try {
      const { data: readyForTestingUsersData, error } = await supabase
        .from('ready-for-testing')
        .select('*')
        .order('readyfortestingat', { ascending: false });
      
      if (error) throw error;
      
      // Map database field names to frontend expected field names
      const mappedData = (readyForTestingUsersData || []).map((user: any) => ({
        ...user,
        // Map database fields to camelCase frontend fields
        readyForTestingAt: user.readyfortestingat,
        businessName: user.businessname,
        businessType: user.businesstype,
        subscriptionTier: user.subscriptiontier,
        billingCycle: user.billingcycle,
        createdAt: user.createdat,
        qaStatus: user.qastatus,
        qaTestedAt: user.qatestedat,
        qaTestingNotes: user.qatestnotes,
        websiteProvisioned: user.websiteprovisioned,
        websiteProvisionedAt: user.websiteprovisionedat,
        scriptDeployed: user.scriptdeployed,
        scriptDeployedAt: user.scriptdeployedat,
        siteUrl: user.siteurl,
        siteId: user.siteid,
        siteName: user.sitename
      }));
      
      setReadyForTestingUsers(mappedData);
    } catch (error: any) {
      console.error('🚨 DATABASE ERROR in fetchReadyForTestingUsers:');
      console.error('🚨 Error Code:', error.code);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      console.error('🚨 Auth State:', user ? 'authenticated' : 'not authenticated');
      setReadyForTestingUsers([]);
    }
  }, [user]);

  // Fetch approved users
  const fetchApprovedUsers = useCallback(async () => {
    try {
      
      // Fetch approved and deactivated users (deleted users are hard-deleted from database)
      const { data: snapshot, error } = await supabase
        .from('usage')
        .select('*')
        .in('status', ['approved', 'deactivated']);
      
      if (error) throw error;
      
      const approvedUsersData: ApprovedUser[] = [];
      const urlsData: {[userId: string]: string} = {};
      const idsData: {[userId: string]: string} = {};
      const scriptsData: {[userId: string]: (string | ScriptInfo)[]} = {};
      
      (snapshot || []).forEach((userData) => {
        const userDataWithId = { ...userData } as ApprovedUser;
          
        // Add all users (approved/deactivated only since deleted are hard-deleted)
        approvedUsersData.push(userData);
        
        // Load site info if it exists (for all users)
        if (userData.siteUrl) {
          urlsData[userData.id] = userData.siteUrl;
        }
        // siteId loading removed - using single-site architecture
        
        // Load deployed scripts if they exist
        if (userData.deployedScripts && Array.isArray(userData.deployedScripts)) {
          scriptsData[userData.id] = userData.deployedScripts;
        }
      });
      
      
      setApprovedUsers(approvedUsersData);
      setDeletedUsers([]); // No deleted users since they're hard-deleted
      setSiteUrls(urlsData);
      // setSiteIds removed - using single-site architecture
      setDeployedScripts(scriptsData);
    } catch (error: any) {
      console.error('🚨 DATABASE ERROR in fetchApprovedUsers:');
      console.error('🚨 Error Code:', error.code);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      console.error('🚨 Auth State:', user ? 'authenticated' : 'not authenticated');
      setApprovedUsers([]);
      setDeletedUsers([]);
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

      // STEP 1: Verify user exists before deletion
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

      console.log('✅ User exists in database:', existingUser);
      
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

  // Move approved user back to QA testing
  const moveToQA = async (userId: string) => {
    try {
      console.log('🔄 Moving user back to QA testing:', userId);
      
      // Find the approved user
      const approvedUser = approvedUsers.find(u => u.id === userId);
      if (!approvedUser) {
        throw new Error('Approved user not found');
      }

      // Create ready-for-testing entry (using correct snake_case column names)
      const readyForTestingData = {
        id: approvedUser.id,
        email: approvedUser.email,
        businessname: approvedUser.businessName,
        businesstype: approvedUser.businessType || 'Unknown',
        subscriptiontier: approvedUser.subscriptionTier,
        billingcycle: approvedUser.billingCycle || 'monthly',
        createdat: approvedUser.createdAt || new Date().toISOString(),
        readyfortestingat: new Date().toISOString(),
        qastatus: 'pending',
        websiteprovisioned: false,
        scriptdeployed: false,
        updatedat: new Date().toISOString()
      };

      // Insert into ready-for-testing table
      const { error: insertError } = await supabase
        .from('ready-for-testing')
        .insert(readyForTestingData);

      if (insertError) {
        console.error('❌ Error inserting to ready-for-testing:', insertError);
        throw insertError;
      }

      // Remove from approved users (usage table)
      const { error: deleteError } = await supabase
        .from('usage')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('❌ Error removing from usage table:', deleteError);
        throw deleteError;
      }

      // Update local state
      setApprovedUsers(prev => prev.filter(u => u.id !== userId));
      await fetchReadyForTestingUsers(); // Refresh QA list

      console.log('✅ User moved to QA testing successfully');
      
    } catch (error) {
      console.error('❌ Error moving user to QA:', error);
      throw error;
    }
  };

  // Restore deleted user
  const restoreUser = async (userId: string) => {
    try {
      
      // Find the deleted user to get their original subscription tier
      const deletedUser = deletedUsers.find(user => user.id === userId);
      if (!deletedUser) {
        console.error('🚨 Deleted user not found');
        return;
      }

      // Get the comparison limit based on subscription tier
      const comparisonLimit = TIER_LIMITS[deletedUser.subscriptionTier as keyof typeof TIER_LIMITS] || 0;
      
      // Update status back to "approved" and restore limits
      const { error } = await supabase
        .from('usage')
        .update({
          status: 'approved',
          comparisonsLimit: comparisonLimit,
          restoredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;

      
      // Refresh data
      await fetchApprovedUsers();
      
    } catch (error) {
      console.error('🚨 Error restoring user:', error);
    }
  };

  // Permanently delete user
  const permanentlyDeleteUser = async (userId: string) => {
    try {
      
      // Find the user to get their site info
      const userToDelete = deletedUsers.find(user => user.id === userId);
      if (!userToDelete) {
        console.error('🚨 User not found in deleted users');
        return;
      }

      console.log('🗑️ Permanently deleting user:', {
        id: userId,
        email: userToDelete?.email,
        status: userToDelete?.status
      });

      // Step 1: Verify user exists in database
      const { data: existingUser, error: selectError } = await supabase
        .from('usage')
        .select('id, email, status')
        .eq('id', userId)
        .single();

      if (selectError) {
        console.error('❌ Error checking user existence:', selectError);
        throw new Error(`User verification failed: ${selectError.message}`);
      }

      console.log('✅ User confirmed in database:', existingUser);

      // Step 2: Delete from database completely with response logging
      console.log('🔄 Executing permanent delete...');
      const deleteResponse = await supabase
        .from('usage')
        .delete()
        .eq('id', userId)
        .select();

      console.log('📋 PERMANENT DELETE RESPONSE:', {
        error: deleteResponse.error,
        data: deleteResponse.data,
        count: deleteResponse.count
      });
      
      if (deleteResponse.error) {
        throw new Error(`Permanent delete failed: ${deleteResponse.error.message}`);
      }

      // Verify deletion occurred
      if (!deleteResponse.data || deleteResponse.data.length === 0) {
        console.error('❌ PERMANENT DELETE FAILED - No rows were deleted!');
        throw new Error('Permanent delete operation failed - no rows affected');
      }

      console.log('✅ PERMANENT DELETE SUCCESSFUL:', deleteResponse.data);

      // Step 3: DELETE AUTH USER COMPLETELY (Alternative approach)
      console.log('🔄 Attempting to delete authentication user...');
      console.log('⚠️ Note: Auth admin operations require service role key');
      console.log('💡 For now, database record is deleted. Auth user cleanup is manual.');
      console.log('📋 Manual cleanup needed:');
      console.log(`   • Go to Supabase Dashboard → Authentication → Users`);
      console.log(`   • Find and delete: ${existingUser.email}`);
      console.log('🔄 Future: We can implement auth deletion via backend API with service role key');

      // Step 4: Clean up local state
      setSiteUrls((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      
      // Step 5: Refresh data
      await fetchApprovedUsers();

      setNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'User Permanently Deleted',
        message: `User ${userToDelete?.email} has been permanently removed`,
        timestamp: new Date(),
        read: false
      });
      
    } catch (error: any) {
      console.error('🚨 PERMANENT DELETE ERROR REPORT:');
      console.error('🚨 Error message:', error.message);
      console.error('🚨 Full error:', error);
      
      setNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Permanent Delete Failed',
        message: `Could not permanently delete user: ${error.message}`,
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
          fetchClients(),
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
      console.log('🚀 moveToTesting called with userId:', userId);
      
      // Get the pending user data
      const pendingUser = pendingUsers.find(user => user.id === userId);
      if (!pendingUser) {
        console.error('🚨 Pending user not found');
        return;
      }
      
      console.log('✅ Found pending user:', pendingUser);
      
      // Check if consultation is complete and script is ready
      if (!pendingUser.consultationCompleted || !pendingUser.scriptReady) {
        throw new Error('User must complete consultation and have script ready before moving to testing.');
      }
      
      // Create the ready-for-testing table entry
      console.log('🚀 Moving user to ready-for-testing:', pendingUser.email);
      
      // First, insert into ready-for-testing table
      const readyForTestingData = {
        id: userId,
        email: pendingUser.email,
        businessname: pendingUser.businessName,
        businesstype: pendingUser.businessType,
        subscriptiontier: pendingUser.subscriptionTier,
        billingcycle: pendingUser.billingCycle,
        createdat: pendingUser.createdAt,
        readyfortestingat: new Date().toISOString(),
        qastatus: 'pending',
        websiteprovisioned: false,
        scriptdeployed: false,
        updatedat: new Date().toISOString()
      };
      
      console.log('📝 Inserting ready-for-testing data:', readyForTestingData);
      
      const { error: insertError } = await supabase
        .from('ready-for-testing')
        .insert([readyForTestingData]);
      
      console.log('📝 Insert result:', { insertError });
      
      if (insertError) throw insertError;
      
      console.log('✅ Successfully inserted into ready-for-testing');
      
      // Remove from pending users
      const { error: deleteError } = await supabase
        .from('pendingUsers')
        .delete()
        .eq('id', userId);
      
      console.log('🗑️ Delete result:', { deleteError });
      
      if (deleteError) throw deleteError;
      
      console.log('✅ Successfully removed from pending users');
      
      // Refresh both lists
      console.log('🔄 Refreshing data...');
      await fetchPendingUsers();
      await fetchReadyForTestingUsers();
      console.log('✅ Data refresh completed');
        
    } catch (error: any) {
      console.error('❌ Error moving user to testing:', error);
      // Inline error handling - no popup
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

      // Prepare update data
      const updateData = {
        status: 'approved',
        comparisonsLimit: comparisonLimit,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        businessName: pendingUser.businessName,
        businessType: pendingUser.businessType,
        billingCycle: pendingUser.billingCycle
      };
      

      // Update status in usage collection to "approved" and set limits
      const { error: updateError } = await supabase
        .from('usage')
        .update(updateData)
        .eq('id', userId);
      
      if (updateError) throw updateError;

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
      
      // Remove from both collections
      const { error: pendingError } = await supabase
        .from('pendingUsers')
        .delete()
        .eq('id', userId);
      
      const { error: usageError } = await supabase
        .from('usage')
        .delete()
        .eq('id', userId);
      
      if (pendingError) throw pendingError;
      if (usageError) throw usageError;

      
      // Refresh pending users list
      await fetchPendingUsers();
      
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  // Deactivate approved user
  const deactivateApprovedUser = async (userId: string) => {
    try {
      
      // Update status in usage collection to "deactivated"
      const { error } = await supabase
        .from('usage')
        .update({
          status: 'deactivated',
          comparisonsLimit: 0, // Remove access
          deactivatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;

      
      // Refresh approved users list
      await fetchApprovedUsers();
      
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  // Reactivate deactivated user
  const reactivateApprovedUser = async (userId: string) => {
    try {
      
      // Get the user data to restore their original subscription limits
      const user = approvedUsers.find(u => u.id === userId);
      if (!user) {
        console.error('User not found');
        return;
      }

      // Restore their comparison limit based on subscription tier
      const comparisonLimit = TIER_LIMITS[user.subscriptionTier as keyof typeof TIER_LIMITS] || 0;
      
      // Update status back to "approved" and restore access
      const { error } = await supabase
        .from('usage')
        .update({
          status: 'approved',
          comparisonsLimit: comparisonLimit,
          reactivatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;

      
      // Refresh approved users list
      await fetchApprovedUsers();
      
    } catch (error) {
      console.error('Error reactivating user:', error);
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

  const handleDeactivateApprovedUser = (userId: string, userEmail: string) => {
    showConfirmation(
      'Temporarily Deactivate User',
      `Are you sure you want to deactivate ${userEmail}?

This will:
• Remove their access to all services
• Set their usage limit to 0
• Keep their account data intact

Benefits:
• User can be reactivated later
• No data loss occurs
• Preserves user history and settings`,
      'Deactivate User',
      'bg-orange-600 text-white',
      () => deactivateApprovedUser(userId)
    );
  };

  const handleReactivateApprovedUser = (userId: string, userEmail: string) => {
    showConfirmation(
      'Reactivate User Account',
      `Are you sure you want to reactivate the account for ${userEmail}?

This will:
• Restore full access to their subscription
• Re-enable their comparison limits
• Allow them to use the platform again

Result:
• User will regain access immediately
• All previous data will be restored
• Usage limits will be reset to subscription tier`,
      'Reactivate User',
      'bg-green-600 hover:bg-green-700',
      () => reactivateApprovedUser(userId)
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
  const handleRestoreUser = (userId: string) => {
    const deletedUser = deletedUsers.find(user => user.id === userId);
    const userEmail = deletedUser?.email || 'Unknown';
    
    showConfirmation(
      'Restore User Account',
      `Are you sure you want to restore the account for ${userEmail}?

This will:
• Move user back to "Approved" tab
• Restore full subscription access
• Re-enable comparison limits based on tier
• Allow platform access immediately

Result:
• User will regain access immediately
• All data and settings will be restored
• Usage history will be preserved`,
      'Restore User',
      'bg-green-600 hover:bg-green-700',
      () => restoreUser(userId)
    );
  };

  // Handler for permanent deletion with strong confirmation
  const handlePermanentDeleteUser = (userId: string) => {
    const deletedUser = deletedUsers.find(user => user.id === userId);
    const userEmail = deletedUser?.email || 'Unknown';
    const hasNetlifySite = siteUrls[userId] ? 'YES' : 'NO';
    
    showConfirmation(
      'PERMANENT DELETION - IRREVERSIBLE',
      `Are you sure you want to permanently delete ALL data for ${userEmail}?

This will COMPLETELY REMOVE:
• User account from database
• Netlify website and all deployed scripts (${hasNetlifySite} site found)
• All user data and history
• All admin notes and records

WARNING:
• THIS ACTION IS 100% IRREVERSIBLE
• User will be completely erased from all systems
• No recovery will be possible
• Consider data retention compliance requirements`,
      'DELETE EVERYTHING',
      'bg-red-600 hover:bg-red-700',
      () => permanentlyDeleteUser(userId)
    );
  };

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
      
      const { error } = await supabase
        .from('usage')
        .update({
          businessName: editUserForm.businessName,
          businessType: editUserForm.businessType,
          subscriptionTier: editUserForm.subscriptionTier,
          billingCycle: editUserForm.billingCycle,
          comparisonsLimit: newComparisonLimit,
          adminNotes: editUserForm.adminNotes,
          updatedAt: new Date().toISOString()
        })
        .eq('id', selectedUserForEdit.id);
      
      if (error) throw error;

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


      const clientData = {
        id: clientId,
        email: newClient.email,
        businessName: newClient.businessName,
        businessType: newClient.businessType,
        subscriptionTier: newClient.subscriptionTier,
        billingCycle: newClient.billingCycle,
        comparisonsUsed: 0,
        comparisonsLimit: comparisonLimit,
        status: 'approved',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin'
      };

      const { error } = await supabase
        .from('usage')
        .insert(clientData);
      
      if (error) throw error;

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
        const siteUrl = `https://grbalance.netlify.app/${clientPath}`;
        
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
      const response = await fetch(`https://grbalance.netlify.app/.netlify/functions/execute-script`, {
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
              <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #666; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr>
                    ${headers.map((header, index) => `
                      <th style="
                        padding: 12px 16px; 
                        text-align: left; 
                        border-bottom: 1px solid #666; 
                        ${index > 0 ? 'border-left: 1px solid #666;' : ''}
                        font-weight: bold; 
                        background-color: #f0fdf4;
                        white-space: nowrap;
                        min-width: 120px;
                        box-sizing: border-box;
                      ">
                        ${header}
                      </th>
                    `).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${results.slice(0, 5).map((row, rowIndex) => `
                    <tr style="background-color: ${rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
                      ${headers.map((header, colIndex) => `
                        <td style="
                          padding: 12px 16px; 
                          ${colIndex > 0 ? 'border-left: 1px solid #666;' : ''}
                          ${rowIndex < 4 ? 'border-bottom: 1px solid #e5e5e5;' : ''}
                          white-space: nowrap;
                          min-width: 120px;
                          box-sizing: border-box;
                          text-align: left;
                        ">
                          ${row[header] || row[header] === 0 ? row[header] : '0'}
                        </td>
                      `).join('')}
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

      const newUsage = Math.max(0, user.comparisonsUsed - amount); // Subtract amount (give back usage)

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
    // Add script deployment logic here
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
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        {/* ... rest of existing AdminPage content ... */}
      </div>
    </BrowserRouter>
  );
};

export default AdminPage; 