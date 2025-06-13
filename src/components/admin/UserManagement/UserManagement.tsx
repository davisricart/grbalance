import React, { useState } from 'react';
import { User, UserCheck, Settings, Trash2, Search, Filter } from 'lucide-react';
import { PendingUser, ApprovedUser, DeletedUser, AdminTab, TIER_LIMITS } from '../../../types/admin';
import PendingUsersTab from './PendingUsersTab';
import ApprovedUsersTab from './ApprovedUsersTab';
import DeletedUsersTab from './DeletedUsersTab';

interface UserManagementProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  pendingUsers: PendingUser[];
  approvedUsers: ApprovedUser[];
  deletedUsers: DeletedUser[];
  onApproveUser: (userId: string, userData: Partial<ApprovedUser>) => Promise<void>;
  onRejectUser: (userId: string, reason?: string) => Promise<void>;
  onDeleteUser: (userId: string, reason?: string) => Promise<void>;
  onRestoreUser: (userId: string) => Promise<void>;
  onUpdateUser: (userId: string, updates: Partial<ApprovedUser>) => Promise<void>;
  isLoading: boolean;
}

export default function UserManagement({
  activeTab,
  setActiveTab,
  pendingUsers,
  approvedUsers,
  deletedUsers,
  onApproveUser,
  onRejectUser,
  onDeleteUser,
  onRestoreUser,
  onUpdateUser,
  isLoading
}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');

  const filteredUsers = approvedUsers.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) || '';
    const matchesTier = filterTier === 'all' || user.subscriptionTier === filterTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
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
            <Trash2 className="inline w-4 h-4 mr-2" />
            Deleted Users ({deletedUsers.length})
          </button>
        </nav>
      </div>

      {/* Search and Filter Controls for Approved Users */}
      {activeTab === 'approved' && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by email or business name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Tiers</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'pending' && (
        <PendingUsersTab
          pendingUsers={pendingUsers}
          onApproveUser={onApproveUser}
          onRejectUser={onRejectUser}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'approved' && (
        <ApprovedUsersTab
          users={filteredUsers}
          onDeleteUser={onDeleteUser}
          onUpdateUser={onUpdateUser}
          isLoading={isLoading}
        />
      )}

      {activeTab === 'deleted' && (
        <DeletedUsersTab
          deletedUsers={deletedUsers}
          onRestoreUser={onRestoreUser}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}