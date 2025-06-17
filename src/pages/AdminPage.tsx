import React, { useState, useEffect, useMemo } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../main';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot,
  writeBatch,
  increment,
  where,
  setDoc
} from 'firebase/firestore';
import { FiUsers, FiUserCheck, FiUserX, FiShield, FiCode, FiSettings, FiEye, FiTrash2, FiRotateCcw, FiUserMinus, FiUserPlus, FiEdit3, FiSave, FiX, FiRefreshCw, FiDownload, FiUpload, FiPlay, FiDatabase, FiBarChart, FiPieChart, FiTrendingUp, FiGrid, FiLock, FiUser, FiMail, FiKey } from 'react-icons/fi';
import { 
  User, Users, Plus, Download, Search, Filter, Edit, 
  Trash2, Check, X, Clock, AlertTriangle, Eye, EyeOff, ArrowLeft,
  UserCheck, Shield, Settings, Database, PieChart, TrendingUp, Grid, Lock, Mail, Key, HelpCircle, Upload, Copy } from 'lucide-react';
import { VisualStepBuilder } from '../components/VisualStepBuilder';
import { debugFirestorePermissions, safeFetchPendingUsers } from '../utils/firebaseDebug';
import { useAdminVerification } from '../services/adminService';
import clientConfig from '../config/client';
import axios from 'axios';
import { HiGlobeAlt, HiLockClosed, HiExclamation } from 'react-icons/hi';
import { parseFile, FileStore, generateComparisonPrompt, ParsedFileData } from '../utils/fileProcessor';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  ReconciliationResult,
  TestResult,
  FileRow,
  ScriptExecutionResult,
  UserDoc
} from '../types';
import PendingUsersTab from '../components/admin/UserManagement/PendingUsersTab';
import ReadyForTestingTab from '../components/admin/UserManagement/ReadyForTestingTab';
import { ReadyForTestingUser } from '../types/admin';

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

const AdminPage: React.FC = () => {
  // Use secure server-side admin verification
  const { isAdmin, isLoading: adminLoading, error: adminError } = useAdminVerification();

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
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
  const [siteIds, setSiteIds] = useState<{[userId: string]: string}>({});
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
  const [notifications, setNotifications] = useState<{id: string, type: 'success' | 'error' | 'info' | 'warning', title: string, message: string, timestamp: number}[]>([]);
  
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

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification = {
      id,
      type,
      title,
      message,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
          aValue = a.email;
          bValue = b.email;
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
          aValue = a.approvedAt;
          bValue = b.approvedAt;
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
      // Convert alert to our notification system
      if (typeof message === 'string') {
        if (message.toLowerCase().includes('success') || message.toLowerCase().includes('deployed')) {
          showNotification('success', 'Operation Successful', message);
        } else if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
          showNotification('error', 'Operation Failed', message);
        } else {
          showNotification('info', 'System Message', message);
        }
      }
    };
    
    // Cleanup on unmount
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Fetch clients from Firebase
  const fetchClients = async () => {
    try {
      
      const clientsCollection = collection(db, 'clients');
      
      const snapshot = await getDocs(clientsCollection);
      
      const clientsData: Client[] = [];
      
      snapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() } as Client);
      });
      
      setClients(clientsData);
    } catch (error: any) {
      console.error('🚨 FIREBASE ERROR in fetchClients:');
      console.error('🚨 Error Code:', error.code);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      console.error('🚨 Auth State:', auth.currentUser ? 'authenticated' : 'not authenticated');
      console.error('🚨 User UID:', auth.currentUser?.uid);
    }
  };

  // Fetch pending users with debugging
  const fetchPendingUsers = async () => {
    try {
      
      const users = await safeFetchPendingUsers();
      setPendingUsers(users);
    } catch (error: any) {
      console.error('🚨 FIREBASE ERROR in fetchPendingUsers:');
      console.error('🚨 Error Code:', error.code);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      console.error('🚨 Auth State:', auth.currentUser ? 'authenticated' : 'not authenticated');
      setPendingUsers([]);
    }
  };

  // Fetch ready-for-testing users
  const fetchReadyForTestingUsers = async () => {
    try {
      
      const readyForTestingCollection = collection(db, 'ready-for-testing');
      const readyForTestingQuery = query(readyForTestingCollection, orderBy('readyForTestingAt', 'desc'));
      
      const snapshot = await getDocs(readyForTestingQuery);
      
      const readyForTestingUsersData: ReadyForTestingUser[] = [];
      
      snapshot.forEach((doc) => {
        readyForTestingUsersData.push({ id: doc.id, ...doc.data() } as ReadyForTestingUser);
      });
      
      setReadyForTestingUsers(readyForTestingUsersData);
    } catch (error: any) {
      console.error('🚨 FIREBASE ERROR in fetchReadyForTestingUsers:');
      console.error('🚨 Error Code:', error.code);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      console.error('🚨 Auth State:', auth.currentUser ? 'authenticated' : 'not authenticated');
      setReadyForTestingUsers([]);
    }
  };

  // Fetch approved users
  const fetchApprovedUsers = async () => {
    try {
      
      const usageCollection = collection(db, 'usage');
      // Fetch approved, deactivated, AND deleted users for full lifecycle management
      const allUsersQuery = query(usageCollection, where('status', 'in', ['approved', 'deactivated', 'deleted']));
      
      const snapshot = await getDocs(allUsersQuery);
      
      const approvedUsersData: ApprovedUser[] = [];
      const deletedUsersData: ApprovedUser[] = [];
      const urlsData: {[userId: string]: string} = {};
      const idsData: {[userId: string]: string} = {};
      const scriptsData: {[userId: string]: (string | ScriptInfo)[]} = {};
      
      snapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() } as ApprovedUser;
          
        // Separate approved/deactivated from deleted users
        if (userData.status === 'deleted') {
          deletedUsersData.push(userData);
        } else {
          approvedUsersData.push(userData);
        }
        
        // Load site info if it exists (for all users)
        const data = doc.data();
        if (data.siteUrl) {
          urlsData[doc.id] = data.siteUrl;
        }
        if (data.siteId) {
          idsData[doc.id] = data.siteId;
        }
        
        // Load deployed scripts if they exist
        if (data.deployedScripts && Array.isArray(data.deployedScripts)) {
          scriptsData[doc.id] = data.deployedScripts;
        }
      });
      
      
      setApprovedUsers(approvedUsersData);
      setDeletedUsers(deletedUsersData);
      setSiteUrls(urlsData);
      setSiteIds(idsData);
      setDeployedScripts(scriptsData);
    } catch (error: any) {
      console.error('🚨 FIREBASE ERROR in fetchApprovedUsers:');
      console.error('🚨 Error Code:', error.code);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      console.error('🚨 Auth State:', auth.currentUser ? 'authenticated' : 'not authenticated');
      setApprovedUsers([]);
      setDeletedUsers([]);
    }
  };

  // Delete user (soft delete)
  const deleteUser = async (userId: string) => {
    try {
      
      // Update status in usage collection to "deleted"
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, {
        status: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date()
      });

      
      // Refresh data
      await fetchApprovedUsers();
      
    } catch (error) {
      console.error('🚨 Error deleting user:', error);
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
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, {
        status: 'approved',
        comparisonsLimit: comparisonLimit,
        restoredAt: new Date(),
        updatedAt: new Date()
      });

      
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

      // Step 1: Delete Netlify site if it exists
      if (siteUrls[userId] && siteIds[userId]) {
        try {
          await axios.post('/api/delete-client-site', {
            siteUrl: siteUrls[userId],
            clientId: userToDelete.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || userId
          });
            } catch (netErr: any) {
          // Continue with Firebase deletion even if Netlify fails
        }
      }

      // Step 2: Delete from Firebase database completely
      const usageDocRef = doc(db, 'usage', userId);
      await deleteDoc(usageDocRef);

      // Step 3: Clean up local state
      setSiteUrls((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      setSiteIds((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });

      
      // Refresh data
      await fetchApprovedUsers();
      
    } catch (error) {
      console.error('🚨 Error permanently deleting user:', error);
    }
  };

  // Run Firebase debugging when component mounts
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = () => {
      unsubscribe = onAuthStateChanged(auth, async (authUser) => {
        console.log('🔒 Auth state changed:', authUser ? 'authenticated' : 'not authenticated');
        setUser(authUser);
        setAuthLoading(false);
    
        if (authUser) {
                      
          setLoading(true);
          
          // Fetch data
          await fetchClients();
          await fetchPendingUsers();
          await fetchReadyForTestingUsers();
          await fetchApprovedUsers();
          
          setLoading(false);
        } else {
            setLoading(false);
        }
      });
    };

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

    setupAuthListener();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

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
      // Get the pending user data
      const pendingUser = pendingUsers.find(user => user.id === userId);
      if (!pendingUser) {
        console.error('🚨 Pending user not found');
        return;
      }
      
      // Check if consultation is complete and script is ready
      if (!pendingUser.consultationCompleted || !pendingUser.scriptReady) {
        throw new Error('User must complete consultation and have script ready before moving to testing.');
      }
      
      // Add to ready-for-testing collection WITHOUT automatic website provisioning
      const readyForTestingDocRef = doc(db, 'ready-for-testing', userId);
      await setDoc(readyForTestingDocRef, {
        ...userData,
        readyForTestingAt: new Date().toISOString(),
        qaStatus: 'pending',
        websiteProvisioned: false,
        scriptDeployed: false
      });

      // Remove from pending collection
      const pendingDocRef = doc(db, 'pendingUsers', userId);
      await deleteDoc(pendingDocRef);

      // Refresh data
      await fetchReadyForTestingUsers();
      await fetchPendingUsers();
      
      // Use inline notification instead of popup
      showInlineNotification(userId, 'success', 
        `${pendingUser.email} moved to testing phase. Create their website to begin QA testing.`);
        
    } catch (error: any) {
      console.error('Error moving user to testing:', error);
      showInlineNotification(userId, 'error', 
        'Failed to move user to testing phase. Please try again.');
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
        approvedAt: new Date(),
        updatedAt: new Date(),
        businessName: pendingUser.businessName,
        businessType: pendingUser.businessType,
        billingCycle: pendingUser.billingCycle
      };
      

      // Update status in usage collection to "approved" and set limits
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, updateData);

      // IMPORTANT: Remove from pendingUsers collection
      const pendingDocRef = doc(db, 'pendingUsers', userId);
      await deleteDoc(pendingDocRef);

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
      const pendingDocRef = doc(db, 'pendingUsers', userId);
      await updateDoc(pendingDocRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      // Refresh pending users list
      await fetchPendingUsers();
      
    } catch (error) {
      console.error('Error updating pending user:', error);
    }
  };

  // Reject pending user
  const rejectPendingUser = async (userId: string) => {
    try {
      
      // Remove from both collections
      const pendingDocRef = doc(db, 'pendingUsers', userId);
      const usageDocRef = doc(db, 'usage', userId);
      
      await deleteDoc(pendingDocRef);
      await deleteDoc(usageDocRef);

      
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
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, {
        status: 'deactivated',
        comparisonsLimit: 0, // Remove access
        deactivatedAt: new Date(),
        updatedAt: new Date()
      });

      
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
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, {
        status: 'approved',
        comparisonsLimit: comparisonLimit,
        reactivatedAt: new Date(),
        updatedAt: new Date()
      });

      
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
      `Are you sure you want to delete the account for ${userEmail}?

This will:
• Move user to "Deleted" tab
• Preserve all data for recovery
• Remove access to platform
• Keep Netlify site intact

Important:
• This is a soft delete - user can be restored later
• Use "Delete Website" first if you want to remove their site
• User data is preserved for compliance`,
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
• User account from Firebase database
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
      const usageDocRef = doc(db, 'usage', selectedUserForEdit.id);
      const newComparisonLimit = TIER_LIMITS[editUserForm.subscriptionTier as keyof typeof TIER_LIMITS] || 0;
      
      await updateDoc(usageDocRef, {
        businessName: editUserForm.businessName,
        businessType: editUserForm.businessType,
        subscriptionTier: editUserForm.subscriptionTier,
        billingCycle: editUserForm.billingCycle,
        comparisonsLimit: newComparisonLimit,
        adminNotes: editUserForm.adminNotes,
        updatedAt: new Date()
      });

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
        console.error('🚨 Missing required fields');
        showNotification('error', 'Missing Information', 'Please fill in all required fields: Email, Business Name, and Business Type');
        return;
      }


      // Create a usage record for the new client (pre-approved)
      const clientId = `admin_${Date.now()}`; // Generate unique ID for admin-created clients
      const comparisonLimit = TIER_LIMITS[newClient.subscriptionTier as keyof typeof TIER_LIMITS] || 0;


      const clientData = {
        email: newClient.email,
        businessName: newClient.businessName,
        businessType: newClient.businessType,
        subscriptionTier: newClient.subscriptionTier,
        billingCycle: newClient.billingCycle,
        comparisonsUsed: 0,
        comparisonsLimit: comparisonLimit,
        status: 'approved',
        createdAt: new Date(),
        approvedAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin'
      };


      await setDoc(doc(db, 'usage', clientId), clientData);

      showNotification('success', 'Client Added', 'Client added successfully!');
      
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
      showNotification('error', 'Failed to Add Client', `Error adding client: ${error.message || 'Unknown error'}`);
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
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      
      // Clear form
      setLoginForm({ email: '', password: '' });
    } catch (error: any) {
      console.error('🚨 Login error:', error);
      setLoginError(error.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Update email function
  const handleUpdateEmail = async () => {
    if (!auth.currentUser || !settingsForm.currentPassword || !settingsForm.newEmail) {
      setSettingsError('Please enter your current password and new email');
      return;
    }

    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      // Re-authenticate user before updating email
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        settingsForm.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update email
      await updateEmail(auth.currentUser, settingsForm.newEmail);
      
      setSettingsSuccess('Email updated successfully!');
      setSettingsForm({
        currentPassword: '',
        newEmail: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('🚨 Email update error:', error);
      
      // Handle email verification requirement
      if (error.code === 'auth/operation-not-allowed' || error.message.includes('verify')) {
        setSettingsError(
          'Email verification is required. For admin access, please create a new Firebase user with your desired email address, or contact your system administrator to update Firebase settings.'
        );
      } else {
        setSettingsError(error.message || 'Failed to update email');
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  // Update password function
  const handleUpdatePassword = async () => {
    if (!auth.currentUser || !settingsForm.currentPassword || !settingsForm.newPassword) {
      setSettingsError('Please enter your current password and new password');
      return;
    }

    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      setSettingsError('New passwords do not match');
      return;
    }

    if (settingsForm.newPassword.length < 6) {
      setSettingsError('New password must be at least 6 characters');
      return;
    }

    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      // Re-authenticate user before updating password
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        settingsForm.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, settingsForm.newPassword);
      
      setSettingsSuccess('Password updated successfully!');
      setSettingsForm({
        currentPassword: '',
        newEmail: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('🚨 Password update error:', error);
      setSettingsError(error.message || 'Failed to update password');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleProvisionWebsite = async (user: ApprovedUser) => {
    // Check if site already exists
    if (siteUrls[user.id] && siteIds[user.id]) {
      showNotification('warning', 'Website Already Exists', `Website already provisioned for ${user.businessName || user.email}: ${siteUrls[user.id]}`);
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
        const mockSiteId = `mock-site-${Date.now()}`;
        
        console.log('✅ Mock provisioning successful:', {
          siteUrl: mockSiteUrl,
          siteId: mockSiteId
        });
        
        // Update local state
        setSiteUrls((prev) => ({ ...prev, [user.id]: mockSiteUrl }));
        setSiteIds((prev) => ({ ...prev, [user.id]: mockSiteId }));
        
        // Persist to Firebase so it survives page refreshes
        const usageDocRef = doc(db, 'usage', user.id);
        await updateDoc(usageDocRef, {
          siteUrl: mockSiteUrl,
          siteId: mockSiteId,
          siteName: `mock-${clientId}`,
          updatedAt: new Date()
        });
        
        showInlineNotification(user.id, 'success', 
          `Mock website created: ${mockSiteUrl}`);
        
      } else {
        // Production mode - use real Netlify API
        const res = await axios.post(
          '/.netlify/functions/provision-client',
          JSON.stringify({
            clientId,
            clientName: businessName,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        // Update local state
        setSiteUrls((prev) => ({ ...prev, [user.id]: res.data.siteUrl }));
        setSiteIds((prev) => ({ ...prev, [user.id]: res.data.siteId }));
        
        // Persist to Firebase so it survives page refreshes
        const usageDocRef = doc(db, 'usage', user.id);
        await updateDoc(usageDocRef, {
          siteUrl: res.data.siteUrl,
          siteId: res.data.siteId,
          siteName: res.data.siteName,
          updatedAt: new Date()
        });
        
        showInlineNotification(user.id, 'success', `Site provisioned: ${res.data.siteUrl}`);
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
      showNotification('error', `Provisioning Failed (${status})`, msg);
      
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
    console.log('🚀 Running test script...');
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
      // Script execution started - no popup notification
      
      // Set up the GR Balance window functions that scripts expect
      (window as any).parseFiles = () => {
        return Promise.resolve({
          data1: file1Data,
          data2: file2Data.length > 0 ? file2Data : null
        });
      };
      
      (window as any).findColumn = (sampleRow: any, possibleNames: string[]) => {
        if (!sampleRow) return null;
        const headers = Object.keys(sampleRow);
        return possibleNames.find(name => 
          headers.some(header => 
            header.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(header.toLowerCase())
          )
        ) || possibleNames.find(name => 
          headers.includes(name)
        ) || null;
      };
      
      (window as any).showResults = (results: any[], options?: any) => {
        console.log('📊 Script Results:', results);
        
        // Update state
        setTestScriptResults({
          success: true,
          data: results,
          timestamp: new Date().toISOString(),
          rowsProcessed: file1Data.length + (file2Data.length || 0),
          title: options?.title,
          summary: options?.summary
        });
        
        // Create HTML for results display
        const createResultsHTML = (results: any[], title?: string, summary?: string) => {
          const headers = results.length > 0 ? Object.keys(results[0]) : [];
          
          return `
            <div class="p-4">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 border border-gray-300">
                  <thead class="bg-gray-50">
                    <tr>
                      ${headers.map(header => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">${header}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    ${results.slice(0, 5).map(row => `
                      <tr>
                        ${headers.map(header => `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">${row[header] || row[header] === 0 ? row[header] : '0'}</td>`).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="mt-4 text-sm text-gray-500">
                ${Math.min(results.length, 5)} of ${results.length} rows displayed${results.length > 5 ? ' (showing first 5)' : ''}
              </div>
            </div>
          `;
        };
        
        // Update Script Builder display
        const scriptResultsDisplay = document.getElementById('script-results-display');
        if (scriptResultsDisplay) {
          scriptResultsDisplay.innerHTML = createResultsHTML(results, options?.title, options?.summary);
        }
        
        // Update Client View replica
        const clientResultsReplica = document.getElementById('client-results-replica');
        if (clientResultsReplica) {
          clientResultsReplica.innerHTML = createResultsHTML(results, options?.title, options?.summary);
        }
      };
      
      (window as any).showError = (message: string) => {
        console.error('❌ Script Error:', message);
        setTestScriptResults({
          success: false,
          error: message,
          timestamp: new Date().toISOString(),
          rowsProcessed: 0
        });
      };
      
      // Execute the script directly (it's an IIFE)
      eval(scriptContent);
      
      console.log('✅ Script execution completed');
      
    } catch (error: any) {
      console.error('❌ Script execution error:', error);
      
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
      showNotification('error', 'No Results', 'Please run a script first to generate results');
      return;
    }
    
    try {
      showNotification('info', 'Generating Excel', 'Creating Excel file...');
      
      // Import XLSX dynamically to avoid loading issues
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
      
      showNotification('success', 'Excel Downloaded', `Results exported to ${filename}`);
      console.log('✅ Excel file generated and downloaded:', filename);
      
    } catch (error: any) {
      console.error('❌ Excel download error:', error);
      showNotification('error', 'Export Failed', error.message || 'Failed to generate Excel file');
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
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
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
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, {
        softwareProfile: profileId,
        updatedAt: new Date()
      });
      await fetchApprovedUsers();
    } catch (error) {
      console.error('Error updating user software profile:', error);
    }
  };

  const updateUserInsightsSetting = async (userId: string, showInsights: boolean) => {
    try {
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, {
        showInsights,
        updatedAt: new Date()
      });
      await fetchApprovedUsers();
    } catch (error) {
      console.error('Error updating user insights setting:', error);
    }
  };

  const handleDeleteScript = async (userId: string, scriptName: string) => {
    console.log('🗑️ Deleting script:', scriptName, 'for user:', userId);
    // Add script deletion logic here
  };

  const handleConfirmProvisionWebsite = (user: ApprovedUser) => {
    return handleProvisionWebsite(user);
  };

  const redeployClientSite = async (userId: string) => {
    console.log('🔄 Redeploying site for user:', userId);
    // Add redeploy logic here
  };

  const handleConfirmDeleteWebsite = async (userId: string) => {
    console.log('🗑️ Deleting website for user:', userId);
    // Add website deletion logic here
  };

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

  // Show loading while checking authentication
  if (authLoading) {
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

  // Check if user is authorized admin (server-side verification)
  if (user && !isAdmin) {
    // Log unauthorized access attempt
    console.warn('🚨 SECURITY ALERT: Unauthorized admin access attempt by:', user.email);
    console.warn('🚨 User UID:', user.uid);
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
                Current user: <span className="font-medium">{user.email}</span>
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
                  onClick={() => signOut(auth)}
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

  // Show login form if not authenticated
  if (!user) {
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
            <span className="text-sm text-gray-600">Welcome, {user.email}</span>
            <button
              onClick={() => signOut(auth)}
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
                {activeTab !== 'clients' && clients.length > 0 && (
                  <span className="ml-2 bg-gray-500 text-white px-2 py-1 rounded-full text-xs">
                    {clients.length}
                  </span>
                )}
                {activeTab === 'clients' && clients.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                    {clients.length}
                  </span>
                )}
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
                TESTING
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
                {activeTab !== 'approved' && (approvedUsers.length > 0 || loading) && (
                  <span className="ml-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                    {loading ? '...' : approvedUsers.length}
                  </span>
                )}
                {activeTab === 'approved' && (approvedUsers.length > 0 || loading) && (
                  <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                    {loading ? '...' : approvedUsers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('deleted')}
                className={`flex-1 py-3 px-4 text-xs font-medium uppercase tracking-wide transition-all duration-200 rounded-md ${
                  activeTab === 'deleted'
                    ? 'bg-white text-green-600 shadow-sm border border-green-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Trash2 className="inline w-4 h-4 mr-2" />
                DELETED
                {activeTab !== 'deleted' && deletedUsers.length > 0 && (
                  <span className="ml-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
                    {deletedUsers.length}
                  </span>
                )}
                {activeTab === 'deleted' && deletedUsers.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                    {deletedUsers.length}
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
                TESTING
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAddClient(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </button>
              <button
                onClick={() => setShowUploadScript(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Script
              </button>
            </div>

            {/* Clients Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Active Clients</h3>
                <p className="text-sm text-gray-500 mt-1">Manage your client accounts and their configurations</p>
              </div>
              
              {clients.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <User className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first client.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddClient(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Client
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                          Client Information
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                          Configuration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                          Scripts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                <div className="text-sm text-gray-500">ID: {client.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                            <div className="text-sm text-gray-900">{client.email}</div>
                            <div className="text-sm text-gray-500">Registered: {parseDate(client.createdAt)?.toLocaleDateString() || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                            <div className="text-sm text-gray-900">Subdomain: {client.subdomain}</div>
                            <div className="text-sm text-gray-500">{client.scripts?.length || 0} scripts</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              client.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {client.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-200">
                            {client.scripts?.length > 0 ? (
                              <div className="space-y-1">
                                {client.scripts.slice(0, 2).map((script, index) => (
                                  <div key={index} className="text-xs bg-gray-100 rounded px-2 py-1">{script}</div>
                                ))}
                                {client.scripts.length > 2 && (
                                  <div className="text-xs text-gray-400">+{client.scripts.length - 2} more</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No scripts</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 border-b border-gray-200">
                            <button 
                              onClick={() => {
                                setSelectedClientForScript(client.id);
                                setShowUploadScript(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs"
                            >
                              Upload Script
                            </button>
                            <button className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs">
                              <Trash2 className="w-3 h-3 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
            onFinalApprove={async (userId: string, userData: Partial<ApprovedUser>) => {
              console.log('🚀 onFinalApprove called with userId:', userId, 'userData:', userData);
              
              try {
                // Move user from ready-for-testing to approved  
                const readyUser = readyForTestingUsers.find(u => u.id === userId);
                console.log('📋 Found readyUser:', readyUser);
                
                if (!readyUser) {
                  console.error('❌ Ready user not found for userId:', userId);
                  showNotification('error', 'Error', 'User not found in ready for testing list');
                  return;
                }

                // Add to approved users - PRESERVE ALL DATA including website info
                const approvedUserData = {
                  ...userData,
                  id: userId,
                  email: readyUser.email,
                  businessName: readyUser.businessName,
                  businessType: readyUser.businessType,
                  subscriptionTier: readyUser.subscriptionTier,
                  billingCycle: readyUser.billingCycle,
                  createdAt: readyUser.createdAt,
                  // ✅ CRITICAL: Preserve website data
                  siteUrl: readyUser.siteUrl || null,
                  siteId: readyUser.siteId || null,
                  siteName: readyUser.siteName || null,
                  // ✅ Preserve consultation data with defaults for undefined values
                  consultationCompleted: readyUser.consultationCompleted ?? true,
                  scriptReady: readyUser.scriptReady ?? true,
                  consultationNotes: readyUser.consultationNotes || '',
                  // ✅ Add approval timestamp
                  qaPassedAt: new Date().toISOString(),
                  approvedAt: new Date().toISOString(),
                  status: 'approved'
                };
                
                console.log('🎯 Final approval - transferring data:', approvedUserData);
                
                // Update in Firebase - move to usage collection with approved status
                console.log('💾 Writing to usage collection...');
                const usageDocRef = doc(db, 'usage', userId);
                await setDoc(usageDocRef, approvedUserData);
                console.log('✅ Successfully wrote to usage collection');
                
                // Remove from ready-for-testing collection
                console.log('🗑️ Removing from ready-for-testing collection...');
                const readyForTestingDocRef = doc(db, 'ready-for-testing', userId);
                await deleteDoc(readyForTestingDocRef);
                console.log('✅ Successfully removed from ready-for-testing');
                
                // Refresh data
                console.log('🔄 Refreshing data...');
                await fetchReadyForTestingUsers();
                await fetchApprovedUsers();
                console.log('✅ Data refresh completed');
                
                // Success - don't show popup notification, let the component handle UI updates
                console.log('✅ User approved successfully:', readyUser.email);
                
              } catch (error) {
                console.error('❌ Error in onFinalApprove:', error);
                // Re-throw error so the component can handle it with inline display
                throw error;
              }
            }}
            onSendBackToPending={async (userId: string, reason?: string) => {
              console.log('🔄 sendBackToPending called with:', { userId, reason });
              
              // Move user back to pending with reason
              const readyUser = readyForTestingUsers.find(u => u.id === userId);
              console.log('📋 Found readyUser:', readyUser);
              
              if (readyUser) {
                // Add back to pending users
                const pendingUserData = {
                  id: userId,
                  email: readyUser.email,
                  businessName: readyUser.businessName,
                  businessType: readyUser.businessType,
                  subscriptionTier: readyUser.subscriptionTier,
                  billingCycle: readyUser.billingCycle,
                  createdAt: readyUser.createdAt,
                  status: 'pending', // ✅ CRITICAL: Add status field for safeFetchPendingUsers query
                  consultationCompleted: false,
                  scriptReady: false,
                  consultationNotes: reason ? `Sent back from testing: ${reason}` : 'Sent back from testing',
                  updatedAt: new Date().toISOString()
                };
                
                console.log('💾 Preparing to save pendingUserData:', pendingUserData);
                
                try {
                  // Update in Firebase
                  const pendingDocRef = doc(db, 'pendingUsers', userId);
                  console.log('📝 Writing to pendingUsers collection...');
                  await setDoc(pendingDocRef, pendingUserData);
                  console.log('✅ Successfully wrote to pendingUsers');
                  
                  // Remove from ready-for-testing collection
                  const readyForTestingDocRef = doc(db, 'ready-for-testing', userId);
                  console.log('🗑️ Removing from ready-for-testing collection...');
                  await deleteDoc(readyForTestingDocRef);
                  console.log('✅ Successfully removed from ready-for-testing');
                  
                  // Refresh data
                  console.log('🔄 Refreshing data...');
                  await fetchReadyForTestingUsers();
                  await fetchPendingUsers();
                  console.log('✅ Data refresh completed');
                  
                  showNotification('success', 'User Sent Back', `${readyUser.email} has been sent back to pending approval with reason: ${reason || 'No reason provided'}`);
                  
                } catch (error) {
                  console.error('❌ Error in sendBackToPending:', error);
                  showNotification('error', 'Error', `Failed to send user back to pending: ${error.message}`);
                }
              } else {
                console.error('❌ Ready user not found for userId:', userId);
                showNotification('error', 'Error', 'User not found in ready for testing list');
              }
            }}
            onUpdateTestingUser={async (userId: string, updates: Partial<ReadyForTestingUser>) => {
              // Update ready-for-testing user data
              const readyForTestingDocRef = doc(db, 'ready-for-testing', userId);
              await updateDoc(readyForTestingDocRef, {
                ...updates,
                updatedAt: new Date().toISOString()
              });
              
              // Refresh data
              await fetchReadyForTestingUsers();
            }}
            isLoading={loading}
          />
        )}

        {activeTab === 'approved' && (
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

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {/* Edit button - always available */}
                        <button
                          type="button"
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700"
                        >
                          <User className="w-4 h-4" />
                          Edit Details
                        </button>

                        {user.status === 'approved' ? (
                          // Buttons for active approved users
                          <>
                            {/* Website Status Display - Only show for users who completed the 3-stage workflow */}
                            {siteUrls[user.id] && (
                              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <HiGlobeAlt className="w-4 h-4" />
                                <span>Website Active</span>
                                <a
                                  href={siteUrls[user.id]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 px-2 py-1 text-xs bg-emerald-200 hover:bg-emerald-300 rounded"
                                >
                                  Visit
                                </a>
                              </div>
                            )}
                            
                            {/* Deploy Script button (only if site is provisioned) */}
                            {siteUrls[user.id] && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedUserForScript(user);
                                    setShowDeployScript(true);
                                  }}
                                  className="px-3 py-1 rounded text-sm font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600"
                                  title="Deploy a new script to this client"
                                >
                                  Deploy Script
                                </button>
                                
                                <button
                                  onClick={() => {
                                    showConfirmation(
                                      'Redeploy Client Site',
                                      `Redeploy the entire website for ${user.businessName || user.email}?\n\n• This will update the site with the latest template\n• All dynamic scripts will remain available\n• The site will use the new Script Testing format\n• Site URL: ${siteUrls[user.id]}\n\nThis process may take 2-3 minutes.`,
                                      'Redeploy Site',
                                      'bg-green-600 text-white',
                                      () => redeployClientSite(user)
                                    );
                                  }}
                                  className="px-3 py-1 rounded text-sm font-medium transition-colors bg-green-500 text-white hover:bg-green-600"
                                  title="Redeploy entire site with updated template"
                                >
                                  Redeploy Site
                                </button>
                              </div>
                            )}
                            
                            {/* Delete Website button (only if site is provisioned) */}
                            {siteUrls[user.id] && (
                              <button
                                type="button"
                                onClick={() => handleConfirmDeleteWebsite(user)}
                                className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50"
                                disabled={provisioning[user.id]}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Website
                              </button>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => handleDeactivateApprovedUser(user.id, user.email)}
                              className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-sm hover:bg-orange-200"
                            >
                              <HiLockClosed className="w-4 h-4" />
                              Deactivate
                            </button>
                            
                            {/* Delete User button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete User
                            </button>
                          </>
                        ) : (
                          // Buttons for deactivated users
                          <>
                            <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm">
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
                            
                            {/* Delete User button for deactivated users too */}
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete User
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

        {activeTab === 'deleted' && (
          <div className="space-y-6">
            {/* Deleted Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Deleted Users</h3>
                <p className="text-sm text-gray-500 mt-1">Manage deleted user accounts</p>
              </div>
              
              {deletedUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <Settings className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No deleted users</h3>
                  <p className="mt-1 text-sm text-gray-500">All deleted users have been permanently removed.</p>
                  <div className="mt-6">
                    <div className="text-xs text-gray-400">
                      Deleted users will appear here for admin review
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Information
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscription Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usage Limit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deletedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.businessName}</div>
                            <div className="text-sm text-gray-500">{user.businessType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {user.subscriptionTier}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">{user.billingCycle}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="text-sm font-medium text-gray-900">
                              {TIER_LIMITS[user.subscriptionTier as keyof typeof TIER_LIMITS] || 'Unknown'} calls/month
                            </div>
                            <div className="text-xs text-gray-500">
                              ${user.subscriptionTier === 'starter' ? '29' : user.subscriptionTier === 'professional' ? '79' : '149'}/month
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{parseDate(user.createdAt)?.toLocaleDateString() || 'N/A'}</div>
                            <div className="text-xs text-gray-400">
                              {getDaysAgo(user.createdAt)} days ago
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleRestoreUser(user.id)}
                              className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                            >
                              ✓ Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDeleteUser(user.id)}
                              className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center mt-1"
                            >
                              ✗ Permanent Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                      onClick={() => showNotification('info', 'Feature Coming Soon', 'Dynamic profile editing will be available in the next update!')}
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
                            onClick={() => showNotification('info', 'Edit Profile', `Editing keywords for ${profile.displayName} - Feature coming soon!`)}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                          >
                            <Edit className="w-4 h-4 inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => showNotification('info', 'Clone Profile', `Cloning ${profile.displayName} - Feature coming soon!`)}
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
                    Email: <span className="font-medium">{auth.currentUser?.email}</span>
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
                      className="relative border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer group"
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
                      className="relative border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
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
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
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
                      showNotification('warning', 'No Client Selected', 'Please select a client to deploy the script to.');
                      return;
                    }
                    
                    const selectedUser = clientSelectionOptions.find(u => u.id === selectedUserId);
                    if (selectedUser) {
                      setSelectedUserForScript(selectedUser);
                      setShowDeployScript(true);
                      setShowClientSelection(false);
                      setClientSelectionOptions([]);
                      showNotification('info', 'Ready to Deploy', `Script pre-loaded for ${selectedUser.businessName || selectedUser.email}. Review and deploy!`);
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

        {/* Notification Display */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-300 ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : notification.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : notification.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 mr-2 ${
                      notification.type === 'success'
                        ? 'text-green-400'
                        : notification.type === 'error'
                        ? 'text-red-400'
                        : notification.type === 'warning'
                        ? 'text-yellow-400'
                        : 'text-blue-400'
                    }`}>
                      {notification.type === 'success' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {notification.type === 'error' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      {notification.type === 'warning' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {notification.type === 'info' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                  </div>
                  <p className="mt-1 text-sm">{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 