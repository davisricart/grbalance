import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, auth } from '../main';
import { Plus, Trash2, Upload, User, Settings, UserCheck, Eye, EyeOff, Shield, Users } from 'lucide-react';
import { debugFirestorePermissions, safeFetchPendingUsers } from '../utils/firebaseDebug';
import clientConfig from '../config/client';
import axios from 'axios';
import { HiGlobeAlt, HiLockClosed } from 'react-icons/hi';
import { parseFile, FileStore, generateComparisonPrompt, ParsedFileData } from '../utils/fileProcessor';

// Add this at the top of the file, after imports
declare global {
  interface Window {
    uploadedFile1?: any;
    uploadedFile2?: any;
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
}

interface ApprovedUser {
  id: string;
  email: string;
  businessName?: string;
  businessType?: string;
  subscriptionTier: string;
  billingCycle?: string;
  comparisonsUsed: number;
  comparisonsLimit: number;
  status: string;
  approvedAt: string;
  createdAt: string;
}

interface Script {
  name: string;
  file: File | null;
  clientId: string;
}

interface ConfirmationDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmStyle: string;
  onConfirm: () => void;
}

const AdminPage: React.FC = () => {
  // FORCE CONSOLE OUTPUT - TEMP DEBUG
  console.log('🟢 ADMIN PAGE COMPONENT LOADED');
  console.log('🟢 AUTH CURRENT USER:', auth.currentUser);
  console.log('🟢 AUTH STATE:', auth.currentUser ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');

  const [activeTab, setActiveTab] = useState<'clients' | 'pending' | 'approved' | 'deleted' | 'testing' | 'settings'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
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

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
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

  // Add state for selected headers
  const [selectedHeaders1, setSelectedHeaders1] = useState<string[]>([]);
  const [selectedHeaders2, setSelectedHeaders2] = useState<string[]>([]);

  // Add state for preview mode
  const [previewMode, setPreviewMode] = useState<'development' | 'client'>('development');

  // Add notification state after other state declarations
  const [notifications, setNotifications] = useState<{id: string, type: 'success' | 'error' | 'info' | 'warning', title: string, message: string, timestamp: number}[]>([]);

  // Add notification helper functions
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

  // Fetch clients from Firebase
  const fetchClients = async () => {
    try {
      console.log('🔥 Fetching clients...');
      console.log('🔥 Current user:', auth.currentUser);
      console.log('🔥 Database reference:', db);
      
      const clientsCollection = collection(db, 'clients');
      console.log('🔥 Collection reference created:', clientsCollection);
      
      const snapshot = await getDocs(clientsCollection);
      console.log('🔥 Query executed successfully');
      
      const clientsData: Client[] = [];
      
      snapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() } as Client);
      });
      
      console.log('✅ Clients fetched successfully:', clientsData.length);
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
      console.log('🔥 Fetching pending users...');
      console.log('🔥 Current user:', auth.currentUser);
      
      const users = await safeFetchPendingUsers();
      console.log('✅ Pending users fetched successfully:', users.length);
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

  // Fetch approved users
  const fetchApprovedUsers = async () => {
    try {
      console.log('🔥 Fetching approved users...');
      console.log('🔥 Current user:', auth.currentUser);
      
      const usageCollection = collection(db, 'usage');
      // Fetch approved, deactivated, AND deleted users for full lifecycle management
      const allUsersQuery = query(usageCollection, where('status', 'in', ['approved', 'deactivated', 'deleted']));
      console.log('🔥 Created all users query:', allUsersQuery);
      
      const snapshot = await getDocs(allUsersQuery);
      console.log('🔥 Query executed, document count:', snapshot.size);
      
      const approvedUsersData: ApprovedUser[] = [];
      const deletedUsersData: ApprovedUser[] = [];
      const urlsData: {[userId: string]: string} = {};
      const idsData: {[userId: string]: string} = {};
      
      snapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() } as ApprovedUser;
        console.log('🔥 Found user:', userData);
        
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
      });
      
      console.log('✅ Approved/deactivated users fetched successfully:', approvedUsersData.length);
      console.log('✅ Deleted users fetched successfully:', deletedUsersData.length);
      console.log('✅ Site URLs loaded:', Object.keys(urlsData).length);
      console.log('✅ Site IDs loaded:', Object.keys(idsData).length);
      
      setApprovedUsers(approvedUsersData);
      setDeletedUsers(deletedUsersData);
      setSiteUrls(urlsData);
      setSiteIds(idsData);
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
      console.log('🗑️ Soft deleting user:', userId);
      
      // Update status in usage collection to "deleted"
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, {
        status: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ User marked as deleted successfully');
      
      // Refresh data
      await fetchApprovedUsers();
      
    } catch (error) {
      console.error('🚨 Error deleting user:', error);
    }
  };

  // Restore deleted user
  const restoreUser = async (userId: string) => {
    try {
      console.log('🔄 Restoring deleted user:', userId);
      
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

      console.log('✅ User restored successfully');
      
      // Refresh data
      await fetchApprovedUsers();
      
    } catch (error) {
      console.error('🚨 Error restoring user:', error);
    }
  };

  // Permanently delete user
  const permanentlyDeleteUser = async (userId: string) => {
    try {
      console.log('🗑️ Permanently deleting user:', userId);
      
      // Find the user to get their site info
      const userToDelete = deletedUsers.find(user => user.id === userId);
      if (!userToDelete) {
        console.error('🚨 User not found in deleted users');
        return;
      }

      // Step 1: Delete Netlify site if it exists
      if (siteUrls[userId] && siteIds[userId]) {
        console.log('🌐 Deleting Netlify site for user:', userToDelete.email);
        try {
          await axios.post('/api/delete-client-site', {
            siteUrl: siteUrls[userId],
            clientId: userToDelete.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || userId
          });
          console.log('✅ Netlify site deleted successfully');
        } catch (netErr: any) {
          console.log('⚠️ Netlify site deletion failed (may not exist or local testing):', netErr.message);
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

      console.log('✅ User permanently deleted from all systems');
      
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
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('🔵 AUTH STATE CHANGED:', user ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
        console.log('🔵 USER OBJECT:', user);

        if (user) {
          console.log('✅ User is authenticated - starting Firebase operations');
          console.log('✅ User UID:', user.uid);
          console.log('✅ User Email:', user.email);
          
          setLoading(true);
          
          // Now run debugging and fetch data
          console.log('🚀 Running Firebase debug...');
          await debugFirestorePermissions();
          
          console.log('🔥 Starting fetchClients...');
          await fetchClients();
          console.log('🔥 Starting fetchPendingUsers...');
          await fetchPendingUsers();
          console.log('🔥 Starting fetchApprovedUsers...');
          await fetchApprovedUsers();
          
          setLoading(false);
        } else {
          console.log('❌ User not authenticated - redirecting or waiting...');
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

  // Approve pending user
  const approvePendingUser = async (userId: string) => {
    try {
      console.log('🔥 Approving user:', userId);
      
      // Get the pending user data
      const pendingUser = pendingUsers.find(user => user.id === userId);
      if (!pendingUser) {
        console.error('🚨 Pending user not found');
        return;
      }
      
      console.log('🔥 Found pending user:', pendingUser);

      // Get the comparison limit based on subscription tier
      const comparisonLimit = TIER_LIMITS[pendingUser.subscriptionTier as keyof typeof TIER_LIMITS] || 0;
      console.log('🔥 Calculated comparison limit:', comparisonLimit);

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
      
      console.log('🔥 Update data for usage collection:', updateData);

      // Update status in usage collection to "approved" and set limits
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, updateData);
      console.log('✅ Updated usage collection successfully');

      // Remove from pendingUsers collection
      const pendingDocRef = doc(db, 'pendingUsers', userId);
      await deleteDoc(pendingDocRef);
      console.log('✅ Deleted from pendingUsers collection successfully');

      console.log('✅ User approved successfully');
      
      // Refresh both lists
      console.log('🔄 Refreshing data...');
      await fetchPendingUsers();
      await fetchApprovedUsers();
      console.log('✅ Data refresh completed');
      
    } catch (error) {
      console.error('🚨 Error approving user:', error);
    }
  };

  // Reject pending user
  const rejectPendingUser = async (userId: string) => {
    try {
      console.log('Rejecting user:', userId);
      
      // Remove from both collections
      const pendingDocRef = doc(db, 'pendingUsers', userId);
      const usageDocRef = doc(db, 'usage', userId);
      
      await deleteDoc(pendingDocRef);
      await deleteDoc(usageDocRef);

      console.log('User rejected successfully');
      
      // Refresh pending users list
      await fetchPendingUsers();
      
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  // Deactivate approved user
  const deactivateApprovedUser = async (userId: string) => {
    try {
      console.log('Deactivating user:', userId);
      
      // Update status in usage collection to "deactivated"
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, {
        status: 'deactivated',
        comparisonsLimit: 0, // Remove access
        deactivatedAt: new Date(),
        updatedAt: new Date()
      });

      console.log('User deactivated successfully');
      
      // Refresh approved users list
      await fetchApprovedUsers();
      
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  // Reactivate deactivated user
  const reactivateApprovedUser = async (userId: string) => {
    try {
      console.log('Reactivating user:', userId);
      
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

      console.log('User reactivated successfully');
      
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
      () => approvePendingUser(userId)
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
    console.log('🔥 handleDeactivateApprovedUser called for:', userEmail);
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
    console.log('🔥 Confirmation dialog should now be visible');
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
      subscriptionTier: user.subscriptionTier,
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

      alert(`User details updated successfully!`);
      
      // Close modal and refresh data
      setShowEditUser(false);
      setSelectedUserForEdit(null);
      await fetchApprovedUsers();
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('Failed to update user: ' + error.message);
    }
  };

  // Add new client
  const addClient = async () => {
    try {
      console.log('🔥 ADD CLIENT BUTTON CLICKED');
      console.log('🔥 Form data:', newClient);
      console.log('🔥 Auth user:', auth.currentUser);
      
      // Validate required fields
      if (!newClient.email || !newClient.businessName || !newClient.businessType) {
        console.error('🚨 Missing required fields');
        alert('Please fill in all required fields: Email, Business Name, and Business Type');
        return;
      }

      console.log('✅ Validation passed, creating client...');

      // Create a usage record for the new client (pre-approved)
      const clientId = `admin_${Date.now()}`; // Generate unique ID for admin-created clients
      const comparisonLimit = TIER_LIMITS[newClient.subscriptionTier as keyof typeof TIER_LIMITS] || 0;

      console.log('🔥 Client ID:', clientId);
      console.log('🔥 Comparison limit:', comparisonLimit);

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

      console.log('🔥 Client data to save:', clientData);

      await setDoc(doc(db, 'usage', clientId), clientData);

      console.log('✅ Client created successfully in Firebase');
      alert('Client added successfully!');
      
      setShowAddClient(false);
      setNewClient({ 
        email: '', 
        businessName: '', 
        businessType: '', 
        subscriptionTier: 'professional', 
        billingCycle: 'monthly' 
      });
      
      // Refresh approved users to show the new client
      console.log('🔄 Refreshing approved users list...');
      await fetchApprovedUsers();
      console.log('✅ Approved users list refreshed');
      
    } catch (error: any) {
      console.error('🚨 ERROR adding client:', error);
      console.error('🚨 Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      alert(`Error adding client: ${error.message || 'Unknown error'}`);
    }
  };

  // Upload script
  const uploadScript = async () => {
    try {
      console.log('Uploading script:', newScript);
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
    console.log('🔥 showConfirmation called with:', { title, message, confirmText });
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      confirmStyle,
      onConfirm
    });
    console.log('🔥 confirmDialog state should now be open');
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
      console.log('🔐 Attempting admin login...');
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      console.log('✅ Login successful');
      
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
    try {
      const businessName = user.businessName || user.email || user.id;
      const clientId = businessName.toLowerCase().replace(/[^a-z0-9]/g, '') || user.id;
      const payload = { businessName, clientEmail: user.email, clientName: businessName, clientId };
      console.log('Sending payload:', payload);
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
      
      showNotification('success', 'Website Provisioned Successfully', `Site provisioned: ${res.data.siteUrl}`);
    } catch (err: any) {
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

  // Add this handler near the other confirmation handlers
  const handleConfirmProvisionWebsite = (user: ApprovedUser) => {
    showConfirmation(
      'Provision New Website',
      `Are you sure you want to provision a website for ${user.businessName || user.email}?

This will:
• Create a new Netlify site
• Generate a unique client portal URL
• Set up environment variables
• Enable script deployment capabilities

Important Notes:
• Each user can only have ONE website
• This process may take 30-60 seconds
• The website will be immediately available once created`,
      'Provision Website',
      'bg-emerald-600 text-white',
      () => handleProvisionWebsite(user)
    );
  };

  // Add this handler near the other confirmation handlers
  const handleConfirmDeleteWebsite = (user: ApprovedUser) => {
    showConfirmation(
      'Permanently Delete Website',
      `Are you sure you want to delete the website for ${user.businessName || user.email}?

This will:
• Permanently remove their Netlify site
• Delete all deployed scripts
• Remove the client portal URL
• Cannot be undone

Warning:
• The user will lose access to their custom portal
• You can provision a new website afterward if needed
• All custom configurations will be lost`,
      'Delete Website',
      'bg-red-600 text-white',
      () => handleDeleteWebsite(user)
    );
  };

  const handleDeleteWebsite = async (user: ApprovedUser) => {
    setProvisioning((prev) => ({ ...prev, [user.id]: true }));
    try {
      // Try to delete from Netlify (will fail locally)
      await axios.post('/api/delete-client-site', {
        siteUrl: siteUrls[user.id],
        clientId: user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || user.id
      });
      alert('Site deleted successfully.');
    } catch (err: any) {
      console.log('API deletion failed (expected in local testing):', err.message);
      // Don't show error alert for local testing - just log it
    }
    
    // Always clean up state, regardless of API success/failure
    try {
      // Update local state
      setSiteUrls((prev) => {
        const copy = { ...prev };
        delete copy[user.id];
        return copy;
      });
      setSiteIds((prev) => {
        const copy = { ...prev };
        delete copy[user.id];
        return copy;
      });
      
      // Remove from Firebase
      const usageDocRef = doc(db, 'usage', user.id);
      await updateDoc(usageDocRef, {
        siteUrl: null,
        siteId: null,
        siteName: null,
        updatedAt: new Date()
      });
      
      console.log('✅ State cleaned up successfully');
      
      // Only show success message if this is local testing
      if (window.location.hostname === 'localhost') {
        alert('Website state reset successfully (local testing mode)');
      }
      
    } catch (stateErr: any) {
      console.error('Failed to clean up state:', stateErr);
      alert('Failed to reset website state: ' + stateErr.message);
    } finally {
      setProvisioning((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  // Script deployment functions
  const handleDeployScript = async (user: ApprovedUser) => {
    if (!scriptDeployForm.scriptName || !scriptDeployForm.scriptContent) {
      alert('Please provide both script name and content.');
      return;
    }

    if (!siteUrls[user.id] || !siteIds[user.id]) {
      alert('Please provision a website for this user first.');
      return;
    }

    setDeploying((prev) => ({ ...prev, [user.id]: true }));
    try {
      const payload = {
        siteId: siteIds[user.id],
        scriptContent: scriptDeployForm.scriptContent,
        scriptName: scriptDeployForm.scriptName,
        clientId: user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || user.id
      };

      console.log('Deploying script with payload:', payload);
      
      const res = await axios.post(
        '/.netlify/functions/deploy-script',
        JSON.stringify(payload),
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      alert(`Script "${scriptDeployForm.scriptName}" deployed successfully to ${user.businessName || user.email}!`);
      
      // Clear form and close modal
      setScriptDeployForm({ scriptName: '', scriptContent: '' });
      setShowDeployScript(false);
      setSelectedUserForScript(null);
      
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'Script deployment failed: ';
      if (data?.error) msg += data.error;
      else if (data?.message) msg += data.message;
      else msg += err.message || JSON.stringify(data) || 'Unknown error';
      alert(msg);
    } finally {
      setDeploying((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  const extractSiteIdFromUrl = (url: string): string | null => {
    // This function is now deprecated since we store site IDs directly
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      if (hostname.includes('.netlify.app')) {
        return hostname.replace('.netlify.app', '');
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const handleConfirmDeployScript = (user: ApprovedUser) => {
    showConfirmation(
      'Deploy Custom Script',
      `Ready to deploy a custom script for ${user.businessName || user.email}?

This will:
• Open the script deployment editor
• Allow you to write/paste JavaScript code
• Deploy the script to their website
• Update their client portal

Features:
• You can deploy multiple scripts
• Scripts can be updated anytime
• Changes are applied immediately`,
      'Open Script Editor',
      'bg-blue-600 text-white',
      () => {
        setSelectedUserForScript(user);
        setShowDeployScript(true);
        closeConfirmation();
      }
    );
  };

  const parseDate = (dateVal: any) => {
    if (!dateVal) return null;
    if (typeof dateVal === 'string') return new Date(dateVal);
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
    return new Date(dateVal);
  };

  const getDaysAgo = (dateVal: any) => {
    const d = parseDate(dateVal);
    return d && !isNaN(d.getTime()) ? Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)) : 'N/A';
  };

  // Filter users based on search and filters
  const filteredUsers = approvedUsers.filter(user => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchLower) ||
      user.businessName?.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    // Tier filter
    const matchesTier = filterTier === 'all' || user.subscriptionTier === filterTier;

    return matchesSearch && matchesStatus && matchesTier;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
          <p className="mt-2 text-sm text-gray-500">Running Firebase diagnostics...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200">
              {/* You can use Link from react-router-dom if preferred */}
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back to Home
            </a>
          </div>
        </nav>
        <main className="flex items-center justify-center px-4 py-12">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
            <div className="flex flex-col items-center space-y-3 mb-6">
              <img 
                src={clientConfig.logo}
                alt={clientConfig.title + ' Logo'}
                className="h-28 sm:h-32 w-auto object-contain"
              />
              <p className="text-emerald-700 text-center text-base sm:text-lg font-medium">
                Admin Login
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-emerald-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
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
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {loginError && (
                <div className="text-red-600 text-sm bg-red-50/50 p-3 rounded-md border border-red-100 flex items-center gap-2">
                  {/** Optionally add an icon here */}
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 ${loginLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loginLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                  </>
                )}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Admin access only. Unauthorized access is prohibited.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`relative rounded-lg shadow-lg p-4 border ${
              notification.type === 'success' ? 'bg-green-50 border-green-200' :
              notification.type === 'error' ? 'bg-red-50 border-red-200' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            } transform transition-all duration-300 ease-in-out`}
            style={{
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${
                  notification.type === 'success' ? 'text-green-600' :
                  notification.type === 'error' ? 'text-red-600' :
                  notification.type === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  {notification.type === 'success' && <UserCheck className="w-5 h-5" />}
                  {notification.type === 'error' && <Trash2 className="w-5 h-5" />}
                  {notification.type === 'warning' && <Upload className="w-5 h-5" />}
                  {notification.type === 'info' && <User className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${
                    notification.type === 'success' ? 'text-green-900' :
                    notification.type === 'error' ? 'text-red-900' :
                    notification.type === 'warning' ? 'text-yellow-900' :
                    'text-blue-900'
                  }`}>
                    {notification.title}
                  </div>
                  <div className={`mt-1 text-sm ${
                    notification.type === 'success' ? 'text-green-700' :
                    notification.type === 'error' ? 'text-red-700' :
                    notification.type === 'warning' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>
                    {notification.message}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className={`flex-shrink-0 ml-4 ${
                  notification.type === 'success' ? 'text-green-400 hover:text-green-600' :
                  notification.type === 'error' ? 'text-red-400 hover:text-red-600' :
                  notification.type === 'warning' ? 'text-yellow-400 hover:text-yellow-600' :
                  'text-blue-400 hover:text-blue-600'
                }`}
              >
                <span className="sr-only">Close</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage clients and user approvals</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('clients')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'clients'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="inline w-4 h-4 mr-2" />
                Client Management ({clients.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="inline w-4 h-4 mr-2" />
                Pending Approvals ({pendingUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserCheck className="inline w-4 h-4 mr-2" />
                Approved Users ({filteredUsers.length}{filteredUsers.length !== approvedUsers.length ? `/${approvedUsers.length}` : ''})
              </button>
              <button
                onClick={() => setActiveTab('deleted')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'deleted'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="inline w-4 h-4 mr-2" />
                Deleted Users ({deletedUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('testing')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'testing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Upload className="inline w-4 h-4 mr-2" />
                Script Testing
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="inline w-4 h-4 mr-2" />
                Account Settings
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
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client Information
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Configuration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scripts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.email}</div>
                            <div className="text-sm text-gray-500">Registered: {parseDate(client.createdAt)?.toLocaleDateString() || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Subdomain: {client.subdomain}</div>
                            <div className="text-sm text-gray-500">{client.scripts?.length || 0} scripts</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              client.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {client.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
          <div className="space-y-6">
            {/* Pending Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Pending User Approvals</h3>
                <p className="text-sm text-gray-500 mt-1">Review and approve new user registrations</p>
              </div>
              
              {pendingUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <Settings className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                  <p className="mt-1 text-sm text-gray-500">All user registrations have been processed.</p>
                  <div className="mt-6">
                    <div className="text-xs text-gray-400">
                      New user registrations will appear here for admin review
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
                      {pendingUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-yellow-600" />
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
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
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
                              onClick={() => handleApprovePendingUser(user.id, user.email)}
                              className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectPendingUser(user.id, user.email)}
                              className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center mt-1"
                            >
                              ✗ Reject
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
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

                        <div>
                          <div className="text-gray-500 text-xs uppercase tracking-wide font-medium">Site Status</div>
                          <div className="mt-1">
                            {siteUrls[user.id] ? (
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
                            ) : (
                              <div className="text-gray-500">Not provisioned</div>
                            )}
                          </div>
                        </div>
                      </div>

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
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700"
                        >
                          <User className="w-4 h-4" />
                          Edit Details
                        </button>

                        {user.status === 'approved' ? (
                          // Buttons for active approved users
                          <>
                            {/* Provision Website button (only if not already provisioned) */}
                            {!siteUrls[user.id] && (
                              <button
                                onClick={() => handleConfirmProvisionWebsite(user)}
                                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                                disabled={provisioning[user.id]}
                              >
                                <HiGlobeAlt className="w-4 h-4" />
                                {provisioning[user.id] ? 'Provisioning...' : 'Provision Website'}
                              </button>
                            )}
                            
                            {/* Deploy Script button (only if site is provisioned) */}
                            {siteUrls[user.id] && (
                              <button
                                onClick={() => handleConfirmDeployScript(user)}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                                disabled={deploying[user.id]}
                              >
                                <Upload className="w-4 h-4" />
                                {deploying[user.id] ? 'Deploying...' : 'Deploy Script'}
                              </button>
                            )}
                            
                            {/* Delete Website button (only if site is provisioned) */}
                            {siteUrls[user.id] && (
                              <button
                                onClick={() => handleConfirmDeleteWebsite(user)}
                                className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50"
                                disabled={provisioning[user.id]}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Website
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeactivateApprovedUser(user.id, user.email)}
                              className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-sm hover:bg-orange-200"
                            >
                              <HiLockClosed className="w-4 h-4" />
                              Deactivate
                            </button>
                            
                            {/* Delete User button */}
                            <button
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
                              onClick={() => handleReactivateApprovedUser(user.id, user.email)}
                              className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4" />
                              Reactivate
                            </button>
                            
                            {/* Delete User button for deactivated users too */}
                            <button
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

        {activeTab === 'testing' && (
          <div className="space-y-6">
            {/* File Uploads */}
            <div className="flex flex-col md:flex-row gap-6 mb-4">
              {/* File 1 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload File 1</label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    setTestFile1(file);
                    setTestFile1Error('');
                    setTestFile1Info(null);
                    if (file) {
                      setTestFileLoading(l => ({...l, file1: true}));
                      try {
                        const parsed = await parseFile(file);
                        FileStore.store('file1', parsed);
                        setTestFile1Info(parsed);
                      } catch (err: any) {
                        setTestFile1Error(err.message || 'Failed to parse file');
                      } finally {
                        setTestFileLoading(l => ({...l, file1: false}));
                      }
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer"
                />
                {testFileLoading.file1 && <div className="text-xs text-emerald-600 mt-1">Parsing file...</div>}
                {testFile1Info && (
                  <>
                    <div className="mt-2 text-xs text-gray-700 bg-emerald-50 border border-emerald-100 rounded p-2">
                      <div><b>{testFile1Info.filename}</b> ({testFile1Info.summary.totalRows} rows, {testFile1Info.summary.columns} columns)</div>
                      <div>Headers: <span className="break-all">{testFile1Info.headers.join(', ')}</span></div>
                    </div>
                    {/* Clickable header selector for File 1 */}
                    <div className="mt-2">
                      <div className="text-xs font-semibold mb-1">Select columns from File 1:</div>
                      <div className="flex flex-wrap gap-2">
                        {testFile1Info.headers.map((header) => (
                          <button
                            key={header}
                            type="button"
                            className={`px-2 py-1 rounded border text-xs ${selectedHeaders1.includes(header) ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}
                            onClick={() => {
                              setSelectedHeaders1((prev) =>
                                prev.includes(header)
                                  ? prev.filter((h) => h !== header)
                                  : [...prev, header]
                              );
                            }}
                          >
                            {header}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {testFile1Error && <div className="text-xs text-red-600 mt-1">{testFile1Error}</div>}
              </div>
              {/* File 2 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload File 2</label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    setTestFile2(file);
                    setTestFile2Error('');
                    setTestFile2Info(null);
                    if (file) {
                      setTestFileLoading(l => ({...l, file2: true}));
                      try {
                        const parsed = await parseFile(file);
                        FileStore.store('file2', parsed);
                        setTestFile2Info(parsed);
                      } catch (err: any) {
                        setTestFile2Error(err.message || 'Failed to parse file');
                      } finally {
                        setTestFileLoading(l => ({...l, file2: false}));
                      }
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer"
                />
                {testFileLoading.file2 && <div className="text-xs text-emerald-600 mt-1">Parsing file...</div>}
                {testFile2Info && (
                  <>
                    <div className="mt-2 text-xs text-gray-700 bg-emerald-50 border border-emerald-100 rounded p-2">
                      <div><b>{testFile2Info.filename}</b> ({testFile2Info.summary.totalRows} rows, {testFile2Info.summary.columns} columns)</div>
                      <div>Headers: <span className="break-all">{testFile2Info.headers.join(', ')}</span></div>
                    </div>
                    {/* Clickable header selector for File 2 */}
                    <div className="mt-2">
                      <div className="text-xs font-semibold mb-1">Select columns from File 2:</div>
                      <div className="flex flex-wrap gap-2">
                        {testFile2Info.headers.map((header) => (
                          <button
                            key={header}
                            type="button"
                            className={`px-2 py-1 rounded border text-xs ${selectedHeaders2.includes(header) ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
                            onClick={() => {
                              setSelectedHeaders2((prev) =>
                                prev.includes(header)
                                  ? prev.filter((h) => h !== header)
                                  : [...prev, header]
                              );
                            }}
                          >
                            {header}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {testFile2Error && <div className="text-xs text-red-600 mt-1">{testFile2Error}</div>}
              </div>
            </div>
            {/* Prompt Box and Generate Results Button */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="analysis-instruction" className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Instructions
              </label>
              <textarea
                id="analysis-instruction"
                placeholder="Describe your calculation or comparison here... (e.g., 'Compare card brand frequencies between files', 'Find missing transactions', 'Calculate discrepancies')"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition duration-200 text-sm"
                style={{ minHeight: 80 }}
                rows={3}
              />
            </div>
            <div className="mt-4 space-y-4">
              {/* Results Controls */}
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => {
                    console.log('🔄 Generate Results button clicked!');
                    
                    // Clear any previous error
                    const errorArea = document.getElementById('generate-results-error');
                    if (errorArea) errorArea.style.display = 'none';
                    
                    // Access parsed files from FileStore and expose globally
                    const file1 = FileStore.get('file1');
                    const file2 = FileStore.get('file2');
                    console.log('📁 File 1:', file1);
                    console.log('📁 File 2:', file2);
                    console.log('🎯 Selected headers 1:', selectedHeaders1);
                    console.log('🎯 Selected headers 2:', selectedHeaders2);
                    
                    window.uploadedFile1 = file1;
                    window.uploadedFile2 = file2;
                    if (!file1 || !file2) {
                      if (errorArea) {
                        errorArea.innerHTML = '⚠️ Please upload both files first!';
                        errorArea.style.display = 'block';
                      }
                      return;
                    }
                    if (selectedHeaders1.length === 0 || selectedHeaders2.length === 0) {
                      if (errorArea) {
                        errorArea.innerHTML = '⚠️ Please select at least one column from each file!';
                        errorArea.style.display = 'block';
                      }
                      return;
                    }
                    
                    console.log('✅ All checks passed, generating results...');
                    
                    // Example: For each unique value in the first selected header from file1, count how many times it appears in the first selected header from file2
                    const col1 = selectedHeaders1[0];
                    const col2 = selectedHeaders2[0];
                    console.log(`🔍 Comparing "${col1}" (File 1) vs "${col2}" (File 2)`);
                    
                    const uniqueValues = [...new Set(file1.rows.map((row: any) => row[col1]))];
                    console.log('🔢 Unique values in', col1, ':', uniqueValues);
                    
                    // FIX: Case-insensitive matching
                    const counts = uniqueValues.map((val) => ({
                      value: val,
                      count: file2.rows.filter((row: any) => 
                        String(row[col2]).toLowerCase() === String(val).toLowerCase()
                      ).length
                    }));
                    console.log('📊 Counts (case-insensitive):', counts);
                    
                    let html = `<div class='mb-2 text-sm font-semibold'>How many times each unique value from "${col1}" in File 1 appears in "${col2}" in File 2 (case-insensitive):</div>`;
                    html += '<table style="margin:16px 0;border-collapse:collapse;width:100%"><tr><th style="border:1px solid #ccc;padding:8px">' + col1 + '</th><th style="border:1px solid #ccc;padding:8px">Count in ' + col2 + '</th></tr>';
                    counts.forEach(({value, count}) => {
                      html += `<tr><td style="border:1px solid #ccc;padding:8px">${value}</td><td style="border:1px solid #ccc;padding:8px">${count}</td></tr>`;
                    });
                    html += '</table>';
                    
                    console.log('🎨 Generated HTML:', html);
                    
                    // Generate results for BOTH preview modes simultaneously
                    const devResultsArea = document.getElementById('results-testing-area');
                    const clientResultsArea = document.getElementById('results-testing-area-client');
                    
                    console.log('🎯 Results areas:', {
                      development: devResultsArea,
                      client: clientResultsArea,
                      currentMode: previewMode
                    });
                    
                    // Add more specific debugging
                    if (!devResultsArea) {
                      console.error('❌ Development results area NOT FOUND! Expected element with id="results-testing-area"');
                    } else {
                      console.log('✅ Development results area found:', devResultsArea);
                    }
                    
                    if (!clientResultsArea) {
                      console.error('❌ Client results area NOT FOUND! Expected element with id="results-testing-area-client"');
                    } else {
                      console.log('✅ Client results area found:', clientResultsArea);
                    }
                    
                    // Prepare HTML for both modes
                    const devHtml = html; // Original simple HTML for development
                    
                    // Enhanced HTML for client preview mode
                    const clientHtml = html
                      .replace(/style="margin:16px 0;border-collapse:collapse;width:100%"/g, 
                        'class="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"')
                      .replace(/style="border:1px solid #ccc;padding:8px"/g, 
                        'class="px-4 py-3 text-left border-b border-gray-200 bg-gray-50 font-medium text-gray-700 border-r border-gray-200 last:border-r-0"')
                      .replace(/<tr>/g, '<tr class="hover:bg-gray-50">')
                      .replace(/<td style="border:1px solid #ccc;padding:8px">/g, 
                        '<td class="px-4 py-3 border-b border-gray-200 text-gray-900 border-r border-gray-200 last:border-r-0">');
                    
                    // Wrap client HTML in styled container
                    const finalClientHtml = `
                      <div class="space-y-6">
                        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                          <div class="flex items-center gap-2 mb-2">
                            <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span class="text-emerald-800 font-medium text-sm">Analysis Complete</span>
                          </div>
                          ${clientHtml.replace(/class='mb-2 text-sm font-semibold'/, 'class="text-emerald-700 font-medium"')}
                        </div>
                      </div>
                    `;
                    
                    // Check if we should append or replace
                    const appendMode = (document.getElementById('append-mode') as HTMLInputElement)?.checked;
                    
                    // Update BOTH areas
                    if (devResultsArea) {
                      if (appendMode && devResultsArea.innerHTML.trim() !== '' && !devResultsArea.innerHTML.includes('Results will appear here')) {
                        const separator = '<hr style="margin: 20px 0; border: 1px solid #ddd;">';
                        devResultsArea.innerHTML += separator + devHtml;
                      } else {
                        devResultsArea.innerHTML = devHtml;
                      }
                    }
                    
                    if (clientResultsArea) {
                      if (appendMode && clientResultsArea.innerHTML.trim() !== '' && !clientResultsArea.innerHTML.includes('Ready for Analysis')) {
                        const separator = '<div class="border-t border-gray-200 my-6"></div>';
                        clientResultsArea.innerHTML += separator + finalClientHtml;
                      } else {
                        clientResultsArea.innerHTML = finalClientHtml;
                      }
                    }
                    
                    console.log('✅ Results displayed successfully in BOTH modes!');
                    
                    if (!devResultsArea && !clientResultsArea) {
                      console.error('❌ Both results areas not found!');
                    } else if (!devResultsArea) {
                      console.error('❌ Development results area not found!');
                    } else if (!clientResultsArea) {
                      console.error('❌ Client results area not found!');
                    }
                  }}
                  style={{ padding: '8px 16px', background: '#10b981', color: 'white', borderRadius: 4 }}
                >
                  Generate Results
                </button>
                
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox" 
                    id="append-mode"
                    className="rounded"
                  />
                  Append to existing results (keep building)
                </label>
                
                <button
                  onClick={() => {
                    const devResultsArea = document.getElementById('results-testing-area');
                    const clientResultsArea = document.getElementById('results-testing-area-client');
                    
                    if (devResultsArea) {
                      devResultsArea.innerHTML = '<div class="text-gray-500 text-sm">Results cleared. Ready for new analysis.</div>';
                    }
                    
                    if (clientResultsArea) {
                      clientResultsArea.innerHTML = `
                        <div class="text-center py-12">
                          <div class="text-emerald-600 text-lg font-medium mb-2">Ready for Analysis</div>
                          <div class="text-gray-500 text-sm">Click "Generate Results" to see your comparison data in client format</div>
                        </div>
                      `;
                    }
                    
                    console.log('🗑️ Results cleared in both areas');
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  Clear Results
                </button>
                
                <button
                  onClick={() => {
                    // Clear file uploads
                    setTestFile1(null);
                    setTestFile2(null);
                    setTestFile1Info(null);
                    setTestFile2Info(null);
                    setTestFile1Error('');
                    setTestFile2Error('');
                    setSelectedHeaders1([]);
                    setSelectedHeaders2([]);
                    FileStore.clear();
                    
                    // Clear file inputs
                    const file1Input = document.querySelector('input[type="file"]') as HTMLInputElement;
                    const file2Input = document.querySelectorAll('input[type="file"]')[1] as HTMLInputElement;
                    if (file1Input) file1Input.value = '';
                    if (file2Input) file2Input.value = '';
                    
                    console.log('🗑️ All uploads cleared');
                  }}
                  className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                >
                  Clear Uploads
                </button>
                
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".js"
                    id="script-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log('📂 File selected for loading:', file.name);
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const scriptContent = event.target?.result as string;
                            console.log('📜 Loading script content...');
                            
                            // Always restore results first (this works without files)
                            const htmlMatch = scriptContent.match(/innerHTML = `(.+)`;/s);
                            if (htmlMatch) {
                              const savedHtml = htmlMatch[1].replace(/\\`/g, '`');
                              const resultsArea = document.getElementById('results-testing-area');
                              if (resultsArea) {
                                resultsArea.innerHTML = savedHtml;
                                console.log('✅ Script results restored!');
                              } else {
                                console.error('❌ Results area not found');
                              }
                            }
                            
                            // Try to restore column selections (only if files are uploaded)
                            const file1ColsMatch = scriptContent.match(/\/\/ File 1 columns: (.+)/);
                            const file2ColsMatch = scriptContent.match(/\/\/ File 2 columns: (.+)/);
                            
                            if (file1ColsMatch && file2ColsMatch) {
                              const file1Cols = file1ColsMatch[1].split(', ').filter(col => col.trim());
                              const file2Cols = file2ColsMatch[1].split(', ').filter(col => col.trim());
                              
                              // Only restore selections if files are currently uploaded
                              const file1Info = testFile1Info;
                              const file2Info = testFile2Info;
                              
                              if (file1Info && file2Info) {
                                const validCols1 = file1Cols.filter(col => file1Info.headers.includes(col));
                                const validCols2 = file2Cols.filter(col => file2Info.headers.includes(col));
                                
                                setSelectedHeaders1(validCols1);
                                setSelectedHeaders2(validCols2);
                                
                                console.log('✅ Column selections restored:', { validCols1, validCols2 });
                                alert(`Script "${file.name}" loaded successfully! Results and column selections restored.`);
                              } else {
                                console.log('⚠️ Files not uploaded yet, only results restored');
                                alert(`Script "${file.name}" loaded successfully! Results restored.\n\nTo restore column selections, upload your files first, then load the script again.`);
                              }
                            } else {
                              alert(`Script "${file.name}" loaded successfully! Results restored.`);
                            }
                            
                            // IMPORTANT: Reset the file input so it can be used again
                            const input = e.target as HTMLInputElement;
                            input.value = '';
                            console.log('🔄 File input reset for next use');
                            
                          } catch (error) {
                            console.error('❌ Error loading script:', error);
                            alert('Error loading script. Please make sure it\'s a valid script file saved from this tool.');
                            
                            // Reset file input even on error
                            const input = e.target as HTMLInputElement;
                            input.value = '';
                          }
                        };
                        reader.readAsText(file);
                      } else {
                        console.log('❌ No file selected');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      console.log('🔍 Load Script button clicked');
                      const input = document.getElementById('script-upload') as HTMLInputElement;
                      if (input) {
                        console.log('📂 Opening file dialog...');
                        input.click();
                      } else {
                        console.error('❌ Script upload input not found');
                      }
                    }}
                    className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                  >
                    Load Script
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    const resultsArea = document.getElementById('results-testing-area');
                    if (resultsArea && resultsArea.innerHTML.trim() !== '') {
                      // Create and download the current script
                      const scriptContent = `// Generated comparison script
// File 1 columns: ${selectedHeaders1.join(', ')}
// File 2 columns: ${selectedHeaders2.join(', ')}
// Generated on: ${new Date().toISOString()}

console.log('🔄 Running comparison script...');

const file1 = window.uploadedFile1;
const file2 = window.uploadedFile2;

if (!file1 || !file2) {
  console.error('Files not loaded');
  return;
}

// Current analysis results saved:
document.getElementById('results-testing-area').innerHTML = \`${resultsArea.innerHTML.replace(/`/g, '\\`')}\`;

console.log('✅ Script executed successfully');`;

                      const blob = new Blob([scriptContent], { type: 'application/javascript' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `comparison-script-${Date.now()}.js`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      alert('Script saved! You can assign this to a client or continue building on it.');
                    } else {
                      alert('No results to save yet. Generate some results first!');
                    }
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Save Progress
                </button>
              </div>
              
              {/* Error Message Area */}
              <div
                id="generate-results-error"
                className="hidden bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm"
                style={{ display: 'none' }}
              >
                {/* Error messages will be populated by JavaScript */}
              </div>
              
              {/* Note about customization */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-700 text-xs">
                <strong>Note:</strong> The descriptive text shown in results (like "How many times each unique value...") is just example output. 
                In live client scripts, this text will be customized for each specific business need and analysis type.
              </div>
              
              {/* Results Display */}
              <div className="space-y-4">
                {/* Preview Mode Toggle */}
                <div className="flex items-center gap-4 p-3 bg-white border rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Preview Mode:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewMode('development')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        previewMode === 'development'
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📱 Development View
                    </button>
                    <button
                      onClick={() => setPreviewMode('client')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        previewMode === 'client'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      🌐 Client Preview
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {previewMode === 'development' 
                      ? 'Simple view for building and testing' 
                      : 'Exactly how clients will see results'
                    }
                  </div>
                </div>

                {/* Results Area - Development Mode */}
                <div 
                  id="results-testing-area" 
                  className={`p-4 bg-gray-50 border rounded-md min-h-[100px] ${
                    previewMode === 'development' ? 'block' : 'hidden'
                  }`}
                >
                  <div className="text-gray-500 text-sm">Results will appear here after clicking "Generate Results"</div>
                </div>

                {/* Results Area - Client Preview Mode */}
                <div className={`bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden ${
                  previewMode === 'client' ? 'block' : 'hidden'
                }`}>
                  {/* GR Balance Header */}
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-white text-xl font-bold">Payment Reconciliation Results</h2>
                        <p className="text-emerald-100 text-sm">Automated analysis and comparison</p>
                      </div>
                      <div className="text-emerald-100 text-xs">
                        Generated: {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Client Results Content */}
                  <div id="results-testing-area-client" className="p-6 min-h-[200px] bg-white">
                    <div className="text-center py-12">
                      <div className="text-emerald-600 text-lg font-medium mb-2">Ready for Analysis</div>
                      <div className="text-gray-500 text-sm">Click "Generate Results" to see your comparison data in client format</div>
                    </div>
                  </div>
                  
                  {/* Client Footer */}
                  <div className="bg-gray-50 px-6 py-3 border-t">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Powered by GR Balance</span>
                      <span>Data processed securely</span>
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
                      Professional - {newClient.billingCycle === 'annual' ? '$23' : '$29'}/month
                      {newClient.billingCycle === 'annual' ? ' (Billed as $277/year)' : ''}
                    </option>
                    <option value="business">
                      Business - {newClient.billingCycle === 'annual' ? '$39' : '$49'}/month
                      {newClient.billingCycle === 'annual' ? ' (Billed as $470/year)' : ''}
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
                  onClick={closeConfirmation}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Script Content
                  </label>
                  
                  {/* File Upload Option */}
                  <div className="mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".js,.ts,.mjs"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
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
                  </div>

                  {/* Script Content Textarea */}
                  <textarea
                    value={scriptDeployForm.scriptContent}
                    onChange={(e) => setScriptDeployForm({...scriptDeployForm, scriptContent: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={15}
                    placeholder="// Upload a file above or enter your JavaScript code here
function reconcileData() {
  // Your custom reconciliation logic
  console.log('Reconciliation script running...');
}

// Example usage
reconcileData();"
                  />
                  
                  {/* Quick Action Buttons */}
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
                  onClick={() => {
                    setShowDeployScript(false);
                    setSelectedUserForScript(null);
                    setScriptDeployForm({ scriptName: '', scriptContent: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeployScript(selectedUserForScript)}
                  disabled={deploying[selectedUserForScript.id] || !scriptDeployForm.scriptName || !scriptDeployForm.scriptContent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deploying[selectedUserForScript.id] ? 'Deploying...' : 'Deploy Script'}
                </button>
              </div>
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
      </div>
    </div>
  );
};

export default AdminPage; 