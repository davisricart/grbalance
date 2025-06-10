import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { Client } from '../../../types/admin';

interface UploadScriptModalProps {
  clients: Client[];
  selectedClientId: string;
  onUploadScript: (clientId: string, scriptFile: File, scriptName: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export default function UploadScriptModal({
  clients,
  selectedClientId,
  onUploadScript,
  onClose,
  isLoading
}: UploadScriptModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scriptName, setScriptName] = useState('');
  const [clientId, setClientId] = useState(selectedClientId);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.js') && !file.name.endsWith('.ts')) {
        setError('Please select a JavaScript (.js) or TypeScript (.ts) file');
        return;
      }

      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        setError('File size must be less than 1MB');
        return;
      }

      setSelectedFile(file);
      setError('');
      
      // Auto-fill script name from filename
      if (!scriptName) {
        const nameWithoutExtension = file.name.replace(/\.(js|ts)$/, '');
        setScriptName(nameWithoutExtension);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!clientId) {
      setError('Please select a client');
      return;
    }

    if (!selectedFile) {
      setError('Please select a script file');
      return;
    }

    if (!scriptName.trim()) {
      setError('Please enter a script name');
      return;
    }

    setIsUploading(true);
    try {
      await onUploadScript(clientId, selectedFile, scriptName.trim());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload script');
    } finally {
      setIsUploading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === clientId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Upload Script</h3>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Client *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={isUploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              required
            >
              <option value="">Choose a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Script Name *
            </label>
            <input
              type="text"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              disabled={isUploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Enter script name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Script File *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <div className="flex justify-center">
                  {selectedFile ? (
                    <FileText className="h-8 w-8 text-green-600" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="script-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>{selectedFile ? 'Change file' : 'Upload a file'}</span>
                    <input
                      id="script-upload"
                      name="script-upload"
                      type="file"
                      accept=".js,.ts"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  {selectedFile ? (
                    <span className="text-green-600 font-medium">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    'JS or TS files up to 1MB'
                  )}
                </p>
              </div>
            </div>
          </div>

          {selectedClient && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Target Client:</strong> {selectedClient.name}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Current scripts: {selectedClient.scripts?.length || 0}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !clientId || !selectedFile || !scriptName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Script
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}