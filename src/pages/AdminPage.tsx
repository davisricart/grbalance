import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../config/supabase';
import { FiUsers, FiUserCheck, FiUserX, FiShield, FiCode, FiSettings, FiEye, FiTrash2, FiRotateCcw, FiUserMinus, FiUserPlus, FiEdit3, FiSave, FiX, FiRefreshCw, FiDownload, FiUpload, FiPlay, FiDatabase, FiBarChart, FiPieChart, FiTrendingUp, FiGrid, FiLock, FiUser, FiMail, FiKey } from 'react-icons/fi';
import { 
  User, Users, Plus, Download, Search, Filter, Edit, 
  Trash2, Check, X, Clock, AlertTriangle, Eye, EyeOff, ArrowLeft,
  UserCheck, Shield, Settings, Database, PieChart, TrendingUp, Grid, Lock, Mail, Key, HelpCircle, Upload, Copy } from 'lucide-react';
import { VisualStepBuilder } from '../components/VisualStepBuilder';
// Removed useAdminVerification - using AuthProvider only
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
  deletedAt?: string;
  updatedAt?: string;
  softwareProfile?: string;
  showInsights?: boolean;
  
  // Minimal consultation tracking
  consultationCompleted?: boolean;
  scriptReady?: boolean;
  consultationNotes?: string;
}

const AdminPage: React.FC = () => {
  const { user, authLoading, isAuthenticated, isApproved } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [readyForTestingUsers, setReadyForTestingUsers] = useState<ReadyForTestingUser[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<ApprovedUser[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('approvedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Refs
  const hasLoadedInitialData = useRef(false);
  
  // Check authentication and admin access using AuthProvider only
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Admin access is granted by AuthProvider for davisricart@gmail.com
  if (!user || !isAuthenticated || user.email !== 'davisricart@gmail.com') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  // Helper function for retrying database requests
  const retryRequest = async <T,>(
    requestFn: () => Promise<T>, 
    requestName: string, 
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 ${requestName} - Attempt ${attempt}/${maxRetries}`);
        const result = await requestFn();
        console.log(`✅ ${requestName} - Success on attempt ${attempt}`);
        return result;
      } catch (error: any) {
        const isNetworkError = error.message?.includes('Failed to fetch') || 
                              error.message?.includes('ERR_INSUFFICIENT_RESOURCES') ||
                              error.code === 'ECONNRESET' ||
                              error.name === 'NetworkError';
        
        const isSchemaError = error.code === '42P01' || 
                             error.code === '42703' || 
                             error.message?.includes('does not exist');
        
        if (isSchemaError) {
          console.warn(`⚠ ${requestName} - Schema error, skipping retries:`, {
            code: error.code,
            message: error.message,
            table: error.message?.match(/relation "([^"]+)"/)?.[1] || 'unknown'
          });
          return null;
        }
        
        if (isNetworkError && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(`⚠ ${requestName} - Network error on attempt ${attempt}, retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error(`🚨 ${requestName} - Failed after ${attempt} attempts:`, {
            code: error.code,
            message: error.message,
            authState: user ? 'authenticated' : 'not authenticated',
            userEmail: user?.email
          });
          
          if (attempt === maxRetries) {
            return null;
          }
        }
      }
    }
    return null;
  };

  // Fetch pending users
  const fetchPendingUsers = async () => {
    const result = await retryRequest(
      async () => {
        const { data: users, error } = await supabase
          .from('pendingUsers')
          .select('*')
          .order('createdAt', { ascending: false });
        
        if (error) throw error;
        return users || [];
      },
      'fetchPendingUsers'
    );
    
    if (result !== null) {
      setPendingUsers(result);
    } else {
      setPendingUsers([]);
    }
  };

  // Fetch ready-for-testing users
  const fetchReadyForTestingUsers = async () => {
    console.warn('⚠ fetchReadyForTestingUsers - Table "ready-for-testing" does not exist, using empty array');
    setReadyForTestingUsers([]);
    return;
  };

  // Fetch approved users
  const fetchApprovedUsers = async () => {
    const result = await retryRequest(
      async () => {
        const { data: users, error } = await supabase
          .from('usage')
          .select('*')
          .in('status', ['approved', 'deactivated', 'deleted'])
          .order('approvedAt', { ascending: false });
        
        if (error) throw error;
        return users || [];
      },
      'fetchApprovedUsers'
    );
    
    if (result !== null) {
      const approvedUsersData: ApprovedUser[] = [];
      const deletedUsersData: ApprovedUser[] = [];
      
      result.forEach((user: any) => {
        const userData: ApprovedUser = {
          id: user.id,
          email: user.email,
          businessName: user.businessName,
          businessType: user.businessType,
          subscriptionTier: user.subscriptionTier,
          billingCycle: user.billingCycle,
          comparisonsUsed: user.comparisonsUsed || 0,
          comparisonsLimit: user.comparisonsLimit || 0,
          status: user.status,
          approvedAt: user.approvedAt || user.createdAt,
          createdAt: user.createdAt,
          deletedAt: user.deletedAt,
          updatedAt: user.updatedAt,
          softwareProfile: user.softwareProfile,
          showInsights: user.showInsights,
          consultationCompleted: user.consultationCompleted,
          scriptReady: user.scriptReady,
          consultationNotes: user.consultationNotes
        };
        
        if (user.status === 'deleted') {
          deletedUsersData.push(userData);
        } else {
          approvedUsersData.push(userData);
        }
      });
      
      setApprovedUsers(approvedUsersData);
      setDeletedUsers(deletedUsersData);
    } else {
      setApprovedUsers([]);
      setDeletedUsers([]);
    }
  };

  // Fetch clients
  const fetchClients = async () => {
    const result = await retryRequest(
      async () => {
        const { data: clientsData, error } = await supabase
          .from('clients')
          .select('*')
          .order('createdAt', { ascending: false });
        
        if (error) throw error;
        return clientsData || [];
      },
      'fetchClients'
    );
    
    if (result !== null) {
      setClients(result);
    } else {
      setClients([]);
    }
  };

  // Update pending user
  const updatePendingUser = async (userId: string, updates: Partial<PendingUser>) => {
    try {
      console.log('🔄 Updating pending user:', { userId, updates });
      
      // Filter out fields that don't exist in database schema
      const { consultationCompleted, scriptReady, consultationNotes, ...dbUpdates } = updates;
      
      // Always update state immediately for UI responsiveness
      setPendingUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, ...updates, updatedAt: new Date().toISOString() }
            : user
        )
      );

      // Only update database if there are valid fields to update
      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('pendingUsers')
          .update({
            ...dbUpdates,
            updatedAt: new Date().toISOString()
          })
          .eq('id', userId);
        
        if (error) {
          console.error('❌ Database update failed:', error);
          await fetchPendingUsers();
          throw error;
        }
      }
      
      // For consultation/script fields, just keep them in local state
      if (consultationCompleted !== undefined || scriptReady !== undefined || consultationNotes !== undefined) {
        console.log('📝 Consultation/script status updated in local state only');
      }
      
      console.log('✅ Pending user updated successfully');
      
    } catch (error) {
      console.error('Error updating pending user:', error);
      throw error;
    }
  };

  // Approve pending user
  const approvePendingUser = async (userId: string) => {
    try {
      const pendingUser = pendingUsers.find(user => user.id === userId);
      if (!pendingUser) {
        console.error('🚨 Pending user not found');
        return;
      }

      const comparisonLimit = TIER_LIMITS[pendingUser.subscriptionTier as keyof typeof TIER_LIMITS] || 50;

      // Create approved user in usage table
      const { error: insertError } = await supabase
        .from('usage')
        .insert([{
          id: userId,
          email: pendingUser.email,
          businessName: pendingUser.businessName,
          businessType: pendingUser.businessType,
          subscriptionTier: pendingUser.subscriptionTier,
          billingCycle: pendingUser.billingCycle,
          comparisonsUsed: 0,
          comparisonsLimit: comparisonLimit,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          createdAt: pendingUser.createdAt,
          updatedAt: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      // Remove from pending users
      const { error: deleteError } = await supabase
        .from('pendingUsers')
        .delete()
        .eq('id', userId);
      
      if (deleteError) throw deleteError;

      // Refresh data
      await fetchPendingUsers();
      await fetchApprovedUsers();
      
      console.log('✅ User approved successfully');
      
    } catch (error: any) {
      console.error('Error approving user:', error);
      throw error;
    }
  };

  // Reject pending user
  const rejectPendingUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('pendingUsers')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;

      await fetchPendingUsers();
      console.log('✅ User rejected successfully');
      
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  };

  // Move to testing
  const moveToTesting = async (userId: string, userData: Partial<ReadyForTestingUser>) => {
    try {
      const pendingUser = pendingUsers.find(user => user.id === userId);
      if (!pendingUser) {
        console.error('🚨 Pending user not found');
        return;
      }
      
      if (!pendingUser.consultationCompleted || !pendingUser.scriptReady) {
        throw new Error('User must complete consultation and have script ready before moving to testing.');
      }
      
      // For now, just move directly to approved since ready-for-testing table doesn't exist
      await approvePendingUser(userId);
      
    } catch (error: any) {
      console.error('Error moving user to testing:', error);
      throw error;
    }
  };

  // Load data when user is authenticated
  useEffect(() => {
    if (!user || authLoading) {
      console.log('🔒 Waiting for auth...', { hasUser: !!user, authLoading });
      return;
    }
    
    if (hasLoadedInitialData.current) {
      console.log('📊 Data already loaded');
      return;
    }
    
    console.log('🔒 Loading admin data for authenticated user:', user.email);
    setLoading(true);
    hasLoadedInitialData.current = false;
    
    const loadDataSequentially = async () => {
      try {
        console.log('📊 Loading admin data sequentially...');
        
        await fetchPendingUsers();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await fetchReadyForTestingUsers();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await fetchApprovedUsers();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await fetchClients();
        
        console.log('✅ All admin data loaded successfully');
        
      } catch (error) {
        console.error('🚨 Error loading admin data:', error);
      }
    };
    
    loadDataSequentially().finally(() => {
      setLoading(false);
      hasLoadedInitialData.current = true;
      console.log('📊 Initial data load completed');
    });
  }, [user, authLoading]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let users = [...approvedUsers];
    
    if (searchTerm) {
      users = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (tierFilter) {
      users = users.filter(user => user.subscriptionTier === tierFilter);
    }
    
    if (statusFilter) {
      users = users.filter(user => user.status === statusFilter);
    }
    
    return users.sort((a, b) => {
      const aValue = a[sortBy as keyof ApprovedUser] as string;
      const bValue = b[sortBy as keyof ApprovedUser] as string;
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [approvedUsers, searchTerm, tierFilter, statusFilter, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    totalUsers: approvedUsers.length,
    pendingUsers: pendingUsers.length,
    deletedUsers: deletedUsers.length,
    readyForTesting: readyForTestingUsers.length
  }), [approvedUsers.length, pendingUsers.length, deletedUsers.length, readyForTestingUsers.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage users, monitor system health, and oversee operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingUsers}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready for Testing</p>
                <p className="text-2xl font-bold text-green-600">{stats.readyForTesting}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Deleted Users</p>
                <p className="text-2xl font-bold text-red-600">{stats.deletedUsers}</p>
              </div>
              <Trash2 className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow rounded-lg">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { id: 'pending', name: 'Pending Users', count: stats.pendingUsers },
                { id: 'users', name: 'Approved Users', count: stats.totalUsers },
                { id: 'ready-for-testing', name: 'Ready for Testing', count: stats.readyForTesting },
                { id: 'deleted', name: 'Deleted Users', count: stats.deletedUsers }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  {tab.name}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'pending' && (
              <PendingUsersTab
                pendingUsers={pendingUsers}
                onMoveToTesting={moveToTesting}
                onRejectUser={rejectPendingUser}
                onUpdatePendingUser={updatePendingUser}
                isLoading={loading}
              />
            )}

            {activeTab === 'ready-for-testing' && (
              <ReadyForTestingTab
                readyForTestingUsers={readyForTestingUsers}
                onApproveUser={approvePendingUser}
                onRejectUser={rejectPendingUser}
                isLoading={loading}
              />
            )}

            {activeTab === 'users' && (
              <div>
                {/* Search and Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                    />
                  </div>
                  
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Tiers</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="business">Business</option>
                  </select>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                  
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order as 'asc' | 'desc');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="approvedAt-desc">Newest First</option>
                    <option value="approvedAt-asc">Oldest First</option>
                    <option value="email-asc">Email A-Z</option>
                    <option value="email-desc">Email Z-A</option>
                  </select>
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
                          Subscription
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approved
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500">{user.businessName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 capitalize">{user.subscriptionTier}</div>
                            <div className="text-sm text-gray-500">{user.billingCycle}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.comparisonsUsed} / {user.comparisonsLimit}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min((user.comparisonsUsed / user.comparisonsLimit) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.approvedAt ? new Date(user.approvedAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filter criteria.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deleted' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Deleted Users</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deleted At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscription
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deletedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500">{user.businessName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 capitalize">{user.subscriptionTier}</div>
                            <div className="text-sm text-gray-500">{user.billingCycle}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {deletedUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No deleted users</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Deleted users will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;