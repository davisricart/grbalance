// Bulletproof File Upload Component
// Demonstrates content-first validation that prevents double extension attacks

import React, { useState, useCallback } from 'react';
import { bulletproofValidateFile } from './bulletproofFileValidator';

interface UploadState {
  file: File | null;
  error: string;
  securityWarning: string;
  isValidating: boolean;
  validationDetails: string;
}

export const BulletproofFileUpload: React.FC = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    error: '',
    securityWarning: '',
    isValidating: false,
    validationDetails: ''
  });

  const resetState = useCallback(() => {
    setUploadState({
      file: null,
      error: '',
      securityWarning: '',
      isValidating: false,
      validationDetails: ''
    });
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (!selectedFile) {
      resetState();
      return;
    }

    // Start validation immediately
    setUploadState(prev => ({
      ...prev,
      isValidating: true,
      error: '',
      securityWarning: '',
      validationDetails: 'Analyzing file content...'
    }));

    try {
      // BULLETPROOF VALIDATION - Content first, filename ignored
      const validation = await bulletproofValidateFile(selectedFile);
      
      if (!validation.isValid) {
        setUploadState(prev => ({
          ...prev,
          file: null,
          error: validation.error || 'Invalid file',
          securityWarning: validation.securityWarning || '',
          isValidating: false,
          validationDetails: ''
        }));
        
        // Clear the input to prevent retry with same file
        event.target.value = '';
        return;
      }

      // File is valid and safe
      setUploadState(prev => ({
        ...prev,
        file: selectedFile,
        error: '',
        securityWarning: '',
        isValidating: false,
        validationDetails: 'File validated successfully - content matches spreadsheet format'
      }));
      
      // Your file processing logic here...
      console.log('✅ Safe to process:', selectedFile.name);
      
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        file: null,
        error: 'Validation failed. Please try again.',
        securityWarning: '',
        isValidating: false,
        validationDetails: ''
      }));
      event.target.value = '';
    }
  }, [resetState]);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    
    const droppedFile = event.dataTransfer.files[0];
    if (!droppedFile) return;

    // Create a synthetic event for consistency
    const syntheticEvent = {
      target: { files: [droppedFile], value: '' }
    } as any;

    await handleFileUpload(syntheticEvent);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Bulletproof File Upload</h3>
      
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
      >
        <div className="space-y-4">
          <div className="text-gray-600">
            <p className="font-medium">Content-First Validation</p>
            <p className="text-sm">Ignores filenames, analyzes actual content</p>
          </div>
          
          <label className="inline-block">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={uploadState.isValidating}
              className="hidden"
            />
            <span className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer inline-block">
              {uploadState.isValidating ? 'Validating...' : 'Choose File'}
            </span>
          </label>
          
          <p className="text-xs text-gray-500">
            Drag & drop or click to upload Excel/CSV files
          </p>
        </div>
      </div>

      {/* Validation Status */}
      {uploadState.isValidating && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm text-blue-700">{uploadState.validationDetails}</span>
          </div>
        </div>
      )}

      {/* Security Warning */}
      {uploadState.securityWarning && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <div className="flex items-start space-x-2">
            <span className="text-red-500 text-lg">🚨</span>
            <div>
              <p className="text-sm font-medium text-red-800">Security Alert</p>
              <p className="text-sm text-red-700">{uploadState.securityWarning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadState.error && !uploadState.securityWarning && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <div className="flex items-start space-x-2">
            <span className="text-red-500">❌</span>
            <p className="text-sm text-red-700">{uploadState.error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadState.file && !uploadState.error && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <div className="flex items-start space-x-2">
            <span className="text-green-500">✅</span>
            <div>
              <p className="text-sm font-medium text-green-800">File Validated</p>
              <p className="text-sm text-green-700">{uploadState.file.name}</p>
              <p className="text-xs text-green-600 mt-1">{uploadState.validationDetails}</p>
            </div>
          </div>
        </div>
      )}

      {/* Security Features List */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Protection Features:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>✅ Magic number detection (ignores filename)</li>
          <li>✅ Double extension attack prevention</li>
          <li>✅ Binary data pattern recognition</li>
          <li>✅ Image file detection (JPEG, PNG, GIF, etc.)</li>
          <li>✅ Code injection attempt detection</li>
          <li>✅ Spreadsheet structure validation</li>
        </ul>
      </div>
    </div>
  );
};

// Hook version for easier integration
export const useBulletproofFileUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    error: '',
    securityWarning: '',
    isValidating: false,
    validationDetails: ''
  });

  const validateAndSetFile = useCallback(async (file: File) => {
    setUploadState(prev => ({
      ...prev,
      isValidating: true,
      error: '',
      securityWarning: '',
      validationDetails: 'Analyzing file content...'
    }));

    try {
      const validation = await bulletproofValidateFile(file);
      
      if (!validation.isValid) {
        setUploadState(prev => ({
          ...prev,
          file: null,
          error: validation.error || 'Invalid file',
          securityWarning: validation.securityWarning || '',
          isValidating: false,
          validationDetails: ''
        }));
        return false;
      }

      setUploadState(prev => ({
        ...prev,
        file,
        error: '',
        securityWarning: '',
        isValidating: false,
        validationDetails: 'File validated successfully'
      }));
      return true;
      
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        file: null,
        error: 'Validation failed',
        securityWarning: '',
        isValidating: false,
        validationDetails: ''
      }));
      return false;
    }
  }, []);

  const resetUpload = useCallback(() => {
    setUploadState({
      file: null,
      error: '',
      securityWarning: '',
      isValidating: false,
      validationDetails: ''
    });
  }, []);

  return {
    ...uploadState,
    validateAndSetFile,
    resetUpload
  };
};

export default BulletproofFileUpload;