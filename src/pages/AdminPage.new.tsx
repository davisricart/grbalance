import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../main';
import { User } from 'lucide-react';
import { 
  UserManagement, 
  ClientManagement, 
  DeploymentManager, 
  ScriptTesting,
  AdminTab,
  Client,
  PendingUser,
  ApprovedUser,
  DeletedUser
} from '../components/admin';
import type { NewClientData } from '../components/admin/ClientManagement';

export default function AdminPage() {
  // State management
  const [activeTab, setActiveTab] = useState<AdminTab>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all data from Firebase
      // This would be implemented with your existing Firebase logic
      console.log('Loading admin data...');
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Client Management Handlers
  const handleAddClient = async (clientData: NewClientData) => {
    // Implementation for adding client
    console.log('Adding client:', clientData);
  };

  const handleDeleteClient = async (clientId: string) => {
    // Implementation for deleting client
    console.log('Deleting client:', clientId);
  };

  const handleUploadScript = async (clientId: string, scriptFile: File, scriptName: string) => {
    // Implementation for uploading script
    console.log('Uploading script:', { clientId, scriptFile, scriptName });
  };

  // User Management Handlers
  const handleApproveUser = async (userId: string, userData: Partial<ApprovedUser>) => {
    // Implementation for approving user
    console.log('Approving user:', userId, userData);
  };

  const handleRejectUser = async (userId: string, reason?: string) => {
    // Implementation for rejecting user
    console.log('Rejecting user:', userId, reason);
  };

  const handleDeleteUser = async (userId: string, reason?: string) => {
    // Implementation for deleting user
    console.log('Deleting user:', userId, reason);
  };

  const handleRestoreUser = async (userId: string) => {
    // Implementation for restoring user
    console.log('Restoring user:', userId);
  };

  const handleUpdateUser = async (userId: string, updates: Partial<ApprovedUser>) => {
    // Implementation for updating user
    console.log('Updating user:', userId, updates);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('clients')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'clients'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="inline w-4 h-4 mr-2" />
                Client Management ({clients.length})
              </button>
              
              {/* User Management Tabs */}
              {['pending', 'approved', 'deleted'].includes(activeTab) && (
                <span className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
                  User Management
                </span>
              )}
              
              {/* Other tabs would be added here */}
              
              <button
                onClick={() => setActiveTab('script-testing')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'script-testing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Script Testing
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Client Management */}
            {activeTab === 'clients' && (
              <ClientManagement
                clients={clients}
                onAddClient={handleAddClient}
                onDeleteClient={handleDeleteClient}
                onUploadScript={handleUploadScript}
                isLoading={isLoading}
              />
            )}

            {/* User Management */}
            {['pending', 'approved', 'deleted'].includes(activeTab) && (
              <UserManagement
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                pendingUsers={pendingUsers}
                approvedUsers={approvedUsers}
                deletedUsers={deletedUsers}
                onApproveUser={handleApproveUser}
                onRejectUser={handleRejectUser}
                onDeleteUser={handleDeleteUser}
                onRestoreUser={handleRestoreUser}
                onUpdateUser={handleUpdateUser}
                isLoading={isLoading}
              />
            )}

            {/* Deployment Manager */}
            {['profiles', 'dynamic-profiles', 'settings'].includes(activeTab) && (
              <DeploymentManager
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isLoading={isLoading}
              />
            )}

            {/* Script Testing */}
            {activeTab === 'script-testing' && (
              <ScriptTesting
                onSaveScript={(script, filename) => {
                  console.log('Saving script:', filename);
                  // Save script implementation
                }}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}