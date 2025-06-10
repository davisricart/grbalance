import React, { useState } from 'react';
import { Globe, Settings, Shield, Plus } from 'lucide-react';
import { AdminTab } from '../../../types/admin';
import SoftwareProfilesTab from './SoftwareProfilesTab';
import ProfileEditorTab from './ProfileEditorTab';
import AccountSettingsTab from './AccountSettingsTab';

interface DeploymentManagerProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isLoading: boolean;
}

export default function DeploymentManager({
  activeTab,
  setActiveTab,
  isLoading
}: DeploymentManagerProps) {
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profiles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="inline w-4 h-4 mr-2" />
            Software Profiles
          </button>
          <button
            onClick={() => setActiveTab('dynamic-profiles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dynamic-profiles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Plus className="inline w-4 h-4 mr-2" />
            Profile Editor
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

      {/* Tab Content */}
      {activeTab === 'profiles' && (
        <SoftwareProfilesTab isLoading={isLoading} />
      )}

      {activeTab === 'dynamic-profiles' && (
        <ProfileEditorTab isLoading={isLoading} />
      )}

      {activeTab === 'settings' && (
        <AccountSettingsTab isLoading={isLoading} />
      )}
    </div>
  );
}