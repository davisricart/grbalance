import React, { useState } from 'react';
import { User, Mail, Key, Save } from 'lucide-react';

interface AccountSettingsTabProps {
  isLoading: boolean;
}

export default function AccountSettingsTab({ isLoading }: AccountSettingsTabProps) {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsUpdating(true);
    try {
      // Email update logic would go here
      alert('Email update functionality would be implemented here');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      alert('Please fill in all fields and ensure passwords match');
      return;
    }
    
    setIsUpdating(true);
    try {
      // Password update logic would go here
      alert('Password update functionality would be implemented here');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your admin account preferences and security settings
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Email Settings */}
          <div className="border-b border-gray-200 pb-8">
            <div className="flex items-center mb-4">
              <Mail className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="text-lg font-medium text-gray-900">Email Address</h4>
            </div>
            
            <form onSubmit={handleUpdateEmail} className="max-w-md">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isUpdating || isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Enter new email address"
                />
              </div>
              
              <button
                type="submit"
                disabled={!email || isUpdating || isLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdating ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>

          {/* Password Settings */}
          <div>
            <div className="flex items-center mb-4">
              <Key className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="text-lg font-medium text-gray-900">Password</h4>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isUpdating || isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isUpdating || isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Enter new password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isUpdating || isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Confirm new password"
                />
              </div>
              
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
              
              <button
                type="submit"
                disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || isUpdating || isLoading}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Key className="w-4 h-4 mr-2" />
                {isUpdating ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <User className="h-5 w-5 text-amber-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">Security Reminder</h3>
            <p className="mt-1 text-sm text-amber-700">
              Always use strong passwords and keep your account information secure. 
              Changes to email or password will require re-authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}