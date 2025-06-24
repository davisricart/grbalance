import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import axios from 'axios';
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
  deletedAt?: string; // For soft deletes
  updatedAt?: string; // For tracking updates
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
  
  const { user, isLoading: authLoading } = useAuthState();
  
  // Skip auth for testing (only on localhost)
  const skipAuth = false; // Set to true only for testing
  const mockUser = { email: 'davisricart@gmail.com' }; // Mock user for testing
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

  // Notification system
  const showNotification = useCallback((type: NotificationItem['type'], title: string, message: string) => {
    const newNotification: NotificationItem = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false
    };
    setNotification(newNotification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // Fetch pending users using Supabase
  const fetchPendingUsers = useCallback(async () => {
    try {
      console.log('🔄 Fetching pending users from Supabase...');
      
      const { data, error } = await supabase
        .from('pendingUsers')
        .select('*')
        .eq('status', 'pending')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('❌ Supabase error in fetchPendingUsers:', error);
        throw error;
      }

      console.log('✅ Successfully fetched pending users:', data);
      setPendingUsers(data || []);
    } catch (error: any) {
      console.error('🚨 DATABASE ERROR in fetchPendingUsers:');
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      setPendingUsers([]);
      showNotification('error', 'Database Error', 'Failed to fetch pending users');
    }
  }, [showNotification]);

  // Fetch ready-for-testing users using Supabase
  const fetchReadyForTestingUsers = useCallback(async () => {
    try {
      console.log('🔄 Fetching ready-for-testing users from Supabase...');
      
      const { data, error } = await supabase
        .from('ready_for_testing')
        .select('*')
        .order('readyForTestingAt', { ascending: false });

      if (error) {
        console.error('❌ Supabase error in fetchReadyForTestingUsers:', error);
        throw error;
      }

      console.log('✅ Successfully fetched ready-for-testing users:', data);
      setReadyForTestingUsers(data || []);
    } catch (error: any) {
      console.error('🚨 DATABASE ERROR in fetchReadyForTestingUsers:');
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      setReadyForTestingUsers([]);
      showNotification('error', 'Database Error', 'Failed to fetch ready-for-testing users');
    }
  }, [showNotification]);

  // Fetch approved users using Supabase
  const fetchApprovedUsers = useCallback(async () => {
    try {
      console.log('🔄 Fetching approved users from Supabase...');
      
      const { data, error } = await supabase
        .from('usage')
        .select('*')
        .in('status', ['approved', 'deactivated', 'deleted'])
        .order('approvedAt', { ascending: false });

      if (error) {
        console.error('❌ Supabase error in fetchApprovedUsers:', error);
        throw error;
      }

      console.log('✅ Successfully fetched approved users:', data);
      
      const approvedUsersData: ApprovedUser[] = [];
      const deletedUsersData: ApprovedUser[] = [];
      
      (data || []).forEach((userData) => {
        // Separate approved/deactivated from deleted users
        if (userData.status === 'deleted') {
          deletedUsersData.push(userData as ApprovedUser);
        } else {
          approvedUsersData.push(userData as ApprovedUser);
        }
      });

      setApprovedUsers(approvedUsersData);
      setDeletedUsers(deletedUsersData);
      
    } catch (error: any) {
      console.error('🚨 DATABASE ERROR in fetchApprovedUsers:');
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      setApprovedUsers([]);
      setDeletedUsers([]);
      showNotification('error', 'Database Error', 'Failed to fetch approved users');
    }
  }, [showNotification]);

  // Delete user (soft delete) using Supabase
  const deleteUser = useCallback(async (userId: string) => {
    try {
      console.log('🗑️ Soft deleting user:', userId);

      // Update status in usage collection to "deleted"
      const { error } = await supabase
        .from('usage')
        .update({
          status: 'deleted',
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Failed to delete user:', error);
        throw error;
      }

      console.log('✅ User successfully deleted (soft delete)');
      showNotification('success', 'User Deleted', 'User has been moved to deleted users');
      
      // Refresh data
      await fetchApprovedUsers();
      
    } catch (error: any) {
      console.error('❌ Error in deleteUser:', error);
      showNotification('error', 'Delete Failed', error.message || 'Failed to delete user');
    }
  }, [fetchApprovedUsers, showNotification]);

  // Restore user from deleted using Supabase
  const restoreUser = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Restoring user:', userId);

      const { error } = await supabase
        .from('usage')
        .update({
          status: 'approved',
          deletedAt: null,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Failed to restore user:', error);
        throw error;
      }

      console.log('✅ User successfully restored');
      showNotification('success', 'User Restored', 'User has been restored from deleted users');
      
      // Refresh data
      await fetchApprovedUsers();
      
    } catch (error: any) {
      console.error('❌ Error in restoreUser:', error);
      showNotification('error', 'Restore Failed', error.message || 'Failed to restore user');
    }
  }, [fetchApprovedUsers, showNotification]);

  // Permanently delete user using Supabase
  const permanentlyDeleteUser = useCallback(async (userId: string) => {
    try {
      console.log('🗑️ Permanently deleting user:', userId);

      const { error } = await supabase
        .from('usage')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('❌ Failed to permanently delete user:', error);
        throw error;
      }

      console.log('✅ User permanently deleted');
      showNotification('success', 'User Permanently Deleted', 'User has been permanently removed from the system');
      
      // Refresh data
      await fetchApprovedUsers();
      
    } catch (error: any) {
      console.error('❌ Error in permanentlyDeleteUser:', error);
      showNotification('error', 'Delete Failed', error.message || 'Failed to permanently delete user');
    }
  }, [fetchApprovedUsers, showNotification]);

  // Approve pending user using Supabase
  const approvePendingUser = useCallback(async (userId: string, subscriptionTier: string = 'starter') => {
    try {
      console.log('✅ Approving pending user:', userId);

      // Get pending user data first
      const { data: pendingUserData, error: fetchError } = await supabase
        .from('pendingUsers')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !pendingUserData) {
        throw new Error('Failed to fetch pending user data');
      }

      // Calculate limits based on subscription tier
      const comparisonsLimit = TIER_LIMITS[subscriptionTier as keyof typeof TIER_LIMITS] || TIER_LIMITS.starter;

      const approvedUserData = {
        id: userId,
        email: pendingUserData.email,
        businessName: pendingUserData.businessName,
        businessType: pendingUserData.businessType,
        subscriptionTier: subscriptionTier,
        billingCycle: pendingUserData.billingCycle,
        comparisonsUsed: 0,
        comparisonsLimit: comparisonsLimit,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        createdAt: pendingUserData.createdAt,
        updatedAt: new Date().toISOString()
      };

      // Update status in usage collection to "approved" and set limits
      const { error: updateError } = await supabase
        .from('usage')
        .update(approvedUserData)
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Failed to update usage record:', updateError);
        throw updateError;
      }

      // Remove from pending users
      const { error: deleteError } = await supabase
        .from('pendingUsers')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('❌ Failed to remove from pending users:', deleteError);
        throw deleteError;
      }

      console.log('✅ User successfully approved');
      showNotification('success', 'User Approved', `User has been approved with ${subscriptionTier} plan`);
      
      // Refresh data
      await Promise.all([fetchPendingUsers(), fetchApprovedUsers()]);
      
    } catch (error: any) {
      console.error('❌ Error in approvePendingUser:', error);
      showNotification('error', 'Approval Failed', error.message || 'Failed to approve user');
    }
  }, [fetchPendingUsers, fetchApprovedUsers, showNotification]);

  // Reject pending user using Supabase
  const rejectPendingUser = useCallback(async (userId: string, reason: string = '') => {
    try {
      console.log('❌ Rejecting pending user:', userId);

      // Remove from pending users
      const { error: pendingError } = await supabase
        .from('pendingUsers')
        .delete()
        .eq('id', userId);

      if (pendingError) {
        console.error('❌ Failed to remove from pending users:', pendingError);
        throw pendingError;
      }

      // Remove from usage (if exists)
      const { error: usageError } = await supabase
        .from('usage')
        .delete()
        .eq('id', userId);

      // Don't throw error if usage record doesn't exist
      if (usageError && !usageError.message?.includes('No rows found')) {
        console.error('❌ Failed to remove from usage:', usageError);
        throw usageError;
      }

      console.log('✅ User successfully rejected');
      showNotification('success', 'User Rejected', 'User registration has been rejected');
      
      // Refresh data
      await fetchPendingUsers();
      
    } catch (error: any) {
      console.error('❌ Error in rejectPendingUser:', error);
      showNotification('error', 'Rejection Failed', error.message || 'Failed to reject user');
    }
  }, [fetchPendingUsers, showNotification]);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPendingUsers(),
          fetchApprovedUsers(),
          fetchReadyForTestingUsers()
        ]);
      } catch (error) {
        console.error('Failed to initialize data:', error);
      } finally {
        setLoading(false);
      }
    };

    if ((user && user.email === 'davisricart@gmail.com') || skipAuth) {
      initializeData();
    }
  }, [user, skipAuth, fetchPendingUsers, fetchApprovedUsers, fetchReadyForTestingUsers]);

  // Filter and sort users
  const filteredAndSortedApprovedUsers = useMemo(() => {
    let filtered = approvedUsers.filter(user => {
      const matchesSearch = !searchTerm || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.businessName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesTier = tierFilter === 'all' || user.subscriptionTier === tierFilter;
      
      return matchesSearch && matchesStatus && matchesTier;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
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
        case 'comparisonsUsed':
          aValue = a.comparisonsUsed;
          bValue = b.comparisonsUsed;
          break;
        case 'approvedAt':
        default:
          aValue = new Date(a.approvedAt || a.createdAt);
          bValue = new Date(b.approvedAt || b.createdAt);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [approvedUsers, searchTerm, statusFilter, tierFilter, sortBy, sortOrder]);

  // Authentication check
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!skipAuth && (!user || user.email !== 'davisricart@gmail.com')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className={`p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            notification.type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{notification.title}</h4>
                <p className="text-sm">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-white hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{confirmDialog.title}</h3>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog({ ...confirmDialog, isOpen: false });
                }}
                className={`px-4 py-2 rounded text-white ${confirmDialog.confirmStyle}`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600">Manage users, monitor usage, and oversee system operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Users</p>
                <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved Users</p>
                <p className="text-2xl font-bold text-gray-900">{approvedUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiPlay className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ready for Testing</p>
                <p className="text-2xl font-bold text-gray-900">{readyForTestingUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Trash2 className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deleted Users</p>
                <p className="text-2xl font-bold text-gray-900">{deletedUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'pending', label: 'Pending Users', icon: Clock },
              { id: 'ready', label: 'Ready for Testing', icon: FiPlay },
              { id: 'deleted', label: 'Deleted Users', icon: Trash2 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'users' && (
            <div className="p-6">
              {/* Filters and Search */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by email or business name..."
                      className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Tiers</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-');
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="approvedAt-desc">Newest Approved</option>
                    <option value="approvedAt-asc">Oldest Approved</option>
                    <option value="email-asc">Email A-Z</option>
                    <option value="email-desc">Email Z-A</option>
                    <option value="comparisonsUsed-desc">Most Usage</option>
                    <option value="comparisonsUsed-asc">Least Usage</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedApprovedUsers.map((user) => {
                      const usagePercentage = (user.comparisonsUsed / user.comparisonsLimit) * 100;
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500">
                                  Approved: {new Date(user.approvedAt || user.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.businessName || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{user.businessType || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.comparisonsUsed}/{user.comparisonsLimit}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  usagePercentage > 80 ? 'bg-red-500' : 
                                  usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {user.subscriptionTier?.charAt(0).toUpperCase() + user.subscriptionTier?.slice(1) || 'N/A'} Plan
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'approved' ? 'bg-green-100 text-green-800' :
                              user.status === 'deactivated' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Delete User',
                                    message: `Are you sure you want to delete ${user.email}? This will move them to deleted users.`,
                                    confirmText: 'Delete',
                                    confirmStyle: 'bg-red-600 hover:bg-red-700',
                                    onConfirm: () => deleteUser(user.id)
                                  });
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {filteredAndSortedApprovedUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filter criteria.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pending' && (
            <PendingUsersTab 
              pendingUsers={pendingUsers}
              onApprove={approvePendingUser}
              onReject={rejectPendingUser}
              onRefresh={fetchPendingUsers}
            />
          )}

          {activeTab === 'ready' && (
            <ReadyForTestingTab 
              readyForTestingUsers={readyForTestingUsers}
              onRefresh={fetchReadyForTestingUsers}
            />
          )}

          {activeTab === 'deleted' && (
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Deleted Users</h3>
                <p className="text-sm text-gray-500">{deletedUsers.length} users</p>
              </div>
              
              {deletedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No deleted users</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Users that are deleted will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deleted At
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
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-red-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500">
                                  Originally approved: {new Date(user.approvedAt || user.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.businessName || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{user.businessType || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Restore User',
                                    message: `Are you sure you want to restore ${user.email}? They will be moved back to approved users.`,
                                    confirmText: 'Restore',
                                    confirmStyle: 'bg-green-600 hover:bg-green-700',
                                    onConfirm: () => restoreUser(user.id)
                                  });
                                }}
                                className="text-green-600 hover:text-green-900"
                                title="Restore User"
                              >
                                <FiRotateCcw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Permanently Delete User',
                                    message: `Are you sure you want to permanently delete ${user.email}? This action cannot be undone and will remove all user data.`,
                                    confirmText: 'Delete Forever',
                                    confirmStyle: 'bg-red-600 hover:bg-red-700',
                                    onConfirm: () => permanentlyDeleteUser(user.id)
                                  });
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Permanently Delete User"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;