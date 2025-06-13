import React, { useState, useCallback, useMemo } from 'react';
import { Edit, Trash2, Eye, EyeOff, Check, X } from 'lucide-react';
import { ApprovedUser, TIER_LIMITS } from '../../../types/admin';

interface ApprovedUsersTabProps {
  users: ApprovedUser[];
  onDeleteUser: (userId: string, reason?: string) => Promise<void>;
  onUpdateUser: (userId: string, updates: Partial<ApprovedUser>) => Promise<void>;
  isLoading: boolean;
}

const ApprovedUsersTab = React.memo(({
  users,
  onDeleteUser,
  onUpdateUser,
  isLoading
}: ApprovedUsersTabProps) => {
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ApprovedUser>>({});
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  const handleEdit = useCallback((user: ApprovedUser) => {
    setEditingUser(user.id);
    setEditData({
      businessName: user.businessName,
      subscriptionTier: user.subscriptionTier,
      comparisonsLimit: user.comparisonsLimit,
      showInsights: user.showInsights
    });
  }, []);

  const handleSave = useCallback(async (userId: string) => {
    setProcessingUser(userId);
    try {
      // Update comparison limit based on tier if tier changed
      let updates = { ...editData };
      if (editData.subscriptionTier) {
        const tierLimit = TIER_LIMITS[editData.subscriptionTier as keyof typeof TIER_LIMITS];
        if (tierLimit) {
          updates.comparisonsLimit = tierLimit;
        }
      }
      
      await onUpdateUser(userId, updates);
      setEditingUser(null);
      setEditData({});
    } finally {
      setProcessingUser(null);
    }
  }, [editData, onUpdateUser]);

  const handleCancel = useCallback(() => {
    setEditingUser(null);
    setEditData({});
  }, []);

  const handleDelete = useCallback(async (userId: string, email: string) => {
    const reason = prompt(`Delete user ${email}? Enter reason:`);
    if (reason) {
      setProcessingUser(userId);
      try {
        await onDeleteUser(userId, reason);
      } finally {
        setProcessingUser(null);
      }
    }
  }, [onDeleteUser]);

  const toggleInsights = useCallback(async (userId: string, currentValue: boolean) => {
    setProcessingUser(userId);
    try {
      await onUpdateUser(userId, { showInsights: !currentValue });
    } finally {
      setProcessingUser(null);
    }
  }, [onUpdateUser]);

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Approved Users</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          <p>No approved users found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Approved Users</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage approved user accounts and their subscription details
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="hidden sm:inline">Subscription</span>
                <span className="sm:hidden">Plan</span>
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Insights
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none" title={user.email}>{user.email}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(user.approvedAt).toLocaleDateString()}
                    </div>
                    <div className="sm:hidden text-xs text-gray-500 mt-1">
                      {user.businessName || 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                  {editingUser === user.id ? (
                    <input
                      type="text"
                      value={editData.businessName || ''}
                      onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 py-1 w-full min-h-[44px] touch-manipulation"
                      placeholder="Business name"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{user.businessName || 'N/A'}</div>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  {editingUser === user.id ? (
                    <select
                      value={editData.subscriptionTier || user.subscriptionTier || ''}
                      onChange={(e) => setEditData({ ...editData, subscriptionTier: e.target.value })}
                      className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 min-h-[44px] touch-manipulation"
                    >
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="business">Business</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full ${
                      user.subscriptionTier === 'business' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.subscriptionTier === 'professional'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      <span className="hidden sm:inline">{user.subscriptionTier || 'N/A'}</span>
                      <span className="sm:hidden">
                        {user.subscriptionTier === 'business' ? 'Bus' : 
                         user.subscriptionTier === 'professional' ? 'Pro' : 'Str'}
                      </span>
                    </span>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div className="text-xs sm:text-sm text-gray-900">
                    <span className="hidden sm:inline">{user.comparisonsUsed} / {user.comparisonsLimit}</span>
                    <span className="sm:hidden">{user.comparisonsUsed}/{user.comparisonsLimit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 sm:h-2 mt-1">
                    <div
                      className={`h-1 sm:h-2 rounded-full ${
                        (user.comparisonsUsed / user.comparisonsLimit) > 0.8 
                          ? 'bg-red-500' 
                          : (user.comparisonsUsed / user.comparisonsLimit) > 0.6 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min((user.comparisonsUsed / user.comparisonsLimit) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleInsights(user.id, user.showInsights || false)}
                    disabled={processingUser === user.id}
                    className={`min-w-[44px] min-h-[44px] p-2 rounded touch-manipulation ${
                      user.showInsights 
                        ? 'text-green-600 hover:text-green-800' 
                        : 'text-gray-400 hover:text-gray-600'
                    } disabled:opacity-50`}
                    title={user.showInsights ? 'Insights Enabled' : 'Insights Disabled'}
                  >
                    {user.showInsights ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingUser === user.id ? (
                    <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handleSave(user.id)}
                        disabled={processingUser === user.id}
                        className="text-green-600 hover:text-green-900 min-w-[44px] min-h-[44px] p-2 disabled:opacity-50 touch-manipulation flex items-center justify-center"
                        title="Save Changes"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={processingUser === user.id}
                        className="text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px] p-2 disabled:opacity-50 touch-manipulation flex items-center justify-center"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                      {/* Mobile: Show insights toggle here if hidden */}
                      <button
                        onClick={() => toggleInsights(user.id, user.showInsights || false)}
                        disabled={processingUser === user.id}
                        className={`lg:hidden min-w-[44px] min-h-[44px] p-2 rounded touch-manipulation ${
                          user.showInsights 
                            ? 'text-green-600 hover:text-green-800' 
                            : 'text-gray-400 hover:text-gray-600'
                        } disabled:opacity-50`}
                        title={user.showInsights ? 'Insights Enabled' : 'Insights Disabled'}
                      >
                        {user.showInsights ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        disabled={processingUser === user.id}
                        className="text-blue-600 hover:text-blue-900 min-w-[44px] min-h-[44px] p-2 disabled:opacity-50 touch-manipulation flex items-center justify-center"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        disabled={processingUser === user.id}
                        className="text-red-600 hover:text-red-900 min-w-[44px] min-h-[44px] p-2 disabled:opacity-50 touch-manipulation flex items-center justify-center"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.users === nextProps.users &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.onDeleteUser === nextProps.onDeleteUser &&
    prevProps.onUpdateUser === nextProps.onUpdateUser
  );
});

ApprovedUsersTab.displayName = 'ApprovedUsersTab';

export default ApprovedUsersTab;