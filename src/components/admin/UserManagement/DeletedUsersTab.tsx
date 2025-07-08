import React, { useState } from 'react';
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { DeletedUser } from '../../../types/admin';

interface DeletedUsersTabProps {
  deletedUsers: DeletedUser[];
  onRestoreUser: (userId: string) => Promise<void>;
  isLoading: boolean;
}

export default function DeletedUsersTab({
  deletedUsers,
  onRestoreUser,
  isLoading
}: DeletedUsersTabProps) {
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  const handleRestore = async (userId: string, email: string) => {
    if (confirm(`Restore user ${email}? This will move them back to approved users.`)) {
      setProcessingUser(userId);
      try {
        await onRestoreUser(userId);
      } finally {
        setProcessingUser(null);
      }
    }
  };

  if (deletedUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Deleted Users</h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          <Trash2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No deleted users</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Deleted Users</h3>
        <p className="text-sm text-gray-600 mt-1">
          Users that have been deleted. You can restore them if needed.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-500">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deleted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deletedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">ID: {user.id}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.businessName || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">
                      {new Date(user.deletedAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">by {user.deletedBy}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={user.reason}>
                    {user.reason || 'No reason provided'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleRestore(user.id, user.email)}
                    disabled={processingUser === user.id || isLoading}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-emerald-600 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50"
                    title="Restore User"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Warning Notice */}
      <div className="px-6 py-4 bg-amber-50 border-t border-amber-200">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Restore with caution</p>
            <p className="mt-1">
              Restoring a user will move them back to approved users with their original subscription settings. 
              Their usage counters will be preserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}