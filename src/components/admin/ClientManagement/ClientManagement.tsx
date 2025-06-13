import React, { useState } from 'react';
import { User, Plus, Upload, Trash2 } from 'lucide-react';
import { Client } from '../../../types/admin';
import ClientTable from './ClientTable';
import AddClientModal from './AddClientModal';
import UploadScriptModal from './UploadScriptModal';

interface ClientManagementProps {
  clients: Client[];
  onAddClient: (clientData: NewClientData) => Promise<void>;
  onDeleteClient: (clientId: string) => Promise<void>;
  onUploadScript: (clientId: string, scriptFile: File, scriptName: string) => Promise<void>;
  isLoading: boolean;
}

export interface NewClientData {
  email: string;
  businessName: string;
  businessType: string;
  subscriptionTier: string;
  billingCycle: string;
}

export default function ClientManagement({
  clients,
  onAddClient,
  onDeleteClient,
  onUploadScript,
  isLoading
}: ClientManagementProps) {
  const [showAddClient, setShowAddClient] = useState(false);
  const [showUploadScript, setShowUploadScript] = useState(false);
  const [selectedClientForScript, setSelectedClientForScript] = useState<string>('');

  const handleAddClient = async (clientData: NewClientData) => {
    try {
      await onAddClient(clientData);
      setShowAddClient(false);
    } catch (error) {
      console.error('Failed to add client:', error);
      throw error;
    }
  };

  const handleUploadScript = async (clientId: string, scriptFile: File, scriptName: string) => {
    try {
      await onUploadScript(clientId, scriptFile, scriptName);
      setShowUploadScript(false);
      setSelectedClientForScript('');
    } catch (error) {
      console.error('Failed to upload script:', error);
      throw error;
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
      try {
        await onDeleteClient(clientId);
      } catch (error) {
        console.error('Failed to delete client:', error);
        throw error;
      }
    }
  };

  const handleUploadScriptForClient = (clientId: string) => {
    setSelectedClientForScript(clientId);
    setShowUploadScript(true);
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={() => setShowAddClient(true)}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </button>
        <button
          onClick={() => setShowUploadScript(true)}
          disabled={isLoading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Script
        </button>
      </div>

      {/* Clients Table */}
      <ClientTable
        clients={clients}
        onDeleteClient={handleDeleteClient}
        onUploadScript={handleUploadScriptForClient}
        isLoading={isLoading}
      />

      {/* Add Client Modal */}
      {showAddClient && (
        <AddClientModal
          onAddClient={handleAddClient}
          onClose={() => setShowAddClient(false)}
          isLoading={isLoading}
        />
      )}

      {/* Upload Script Modal */}
      {showUploadScript && (
        <UploadScriptModal
          clients={clients}
          selectedClientId={selectedClientForScript}
          onUploadScript={handleUploadScript}
          onClose={() => {
            setShowUploadScript(false);
            setSelectedClientForScript('');
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}