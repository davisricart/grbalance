import React, { useState } from 'react';
import { Check, X, Eye, Clock, AlertTriangle } from 'lucide-react';
import { PendingUser, ApprovedUser, TIER_LIMITS } from '../../../types/admin';

interface PendingUsersTabProps {
  pendingUsers: PendingUser[];
  onApproveUser: (userId: string, userData: Partial<ApprovedUser>) => Promise<void>;
  onRejectUser: (userId: string, reason?: string) => Promise<void>;
  isLoading: boolean;
}

export default function PendingUsersTab({
  pendingUsers,
  onApproveUser,
  onRejectUser,
  isLoading
}: PendingUsersTabProps) {
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<PendingUser | null>(null);

  const handleApprove = async (user: PendingUser) => {
    setProcessingUser(user.id);
    try {
      const tierLimit = TIER_LIMITS[user.subscriptionTier as keyof typeof TIER_LIMITS] || 50;
      await onApproveUser(user.id, {
        email: user.email,
        businessName: user.businessName,
        businessType: user.businessType,
        subscriptionTier: user.subscriptionTier,
        billingCycle: user.billingCycle,
        comparisonsUsed: 0,
        comparisonsLimit: tierLimit,
        status: 'active',
        approvedAt: new Date().toISOString(),
        createdAt: user.createdAt
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    setProcessingUser(userId);
    try {
      await onRejectUser(userId, reason || undefined);
    } finally {
      setProcessingUser(null);
    }
  };

  if (pendingUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Pending User Approvals</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No pending user approvals</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Pending User Approvals</h3>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve new user registrations
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.businessName}</div>
                      <div className="text-sm text-gray-500">{user.businessType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.subscriptionTier === 'business' 
                          ? 'bg-purple-100 text-purple-800'
                          : user.subscriptionTier === 'professional'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.subscriptionTier}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">{user.billingCycle}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setViewingUser(user)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleApprove(user)}
                        disabled={processingUser === user.id || isLoading}
                        className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
                        title="Approve User"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        disabled={processingUser === user.id || isLoading}
                        className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                        title="Reject User"
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
      </div>

      {/* User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">User Details</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{viewingUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <p className="mt-1 text-sm text-gray-900">{viewingUser.businessName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Type</label>
                <p className="mt-1 text-sm text-gray-900">{viewingUser.businessType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subscription Tier</label>
                <p className="mt-1 text-sm text-gray-900">{viewingUser.subscriptionTier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
                <p className="mt-1 text-sm text-gray-900">{viewingUser.billingCycle}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Submitted</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(viewingUser.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApprove(viewingUser);
                  setViewingUser(null);
                }}
                disabled={processingUser === viewingUser.id || isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}