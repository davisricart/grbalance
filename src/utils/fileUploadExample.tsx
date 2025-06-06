// Complete Example: How to Use Robust File Validation in React Components
// This shows the proper pattern for bulletproof file upload validation

import React, { useState } from 'react';
import RobustFileValidator from './robustFileValidator';

export const FileUploadExample: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (!selectedFile) {
      setFile(null);
      setError('');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Use the robust file validator
      const validation = await RobustFileValidator.validateFile(selectedFile);
      
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        setFile(null);
        event.target.value = ''; // Clear the input
        return;
      }

      // File is valid - proceed with your logic
      setFile(selectedFile);
      setError('');
      
      // Your file processing logic here...
      console.log('✅ File is valid:', selectedFile.name);
      
    } catch (error) {
      setError('File validation failed. Please try again.');
      setFile(null);
      event.target.value = '';
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="p-4">
      <label className="block text-sm font-medium mb-2">
        Upload Spreadsheet
      </label>
      
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        disabled={isValidating}
        className="block w-full text-sm text-gray-500 
          file:mr-4 file:py-2 file:px-4 
          file:rounded-full file:border-0 
          file:text-sm file:font-semibold 
          file:bg-blue-50 file:text-blue-700 
          hover:file:bg-blue-100"
      />
      
      {isValidating && (
        <p className="mt-2 text-sm text-blue-600">
          🔍 Validating file...
        </p>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">
          ❌ {error}
        </p>
      )}
      
      {file && !error && (
        <p className="mt-2 text-sm text-green-600">
          ✅ File uploaded: {file.name}
        </p>
      )}
    </div>
  );
};

// Pattern for Drag & Drop with Validation
export const DragDropFileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const validateAndSetFile = async (file: File) => {
    setError('');
    
    try {
      const validation = await RobustFileValidator.validateFile(file);
      
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return false;
      }
      
      setFile(file);
      return true;
    } catch (error) {
      setError('File validation failed');
      return false;
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      await validateAndSetFile(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed p-8 text-center rounded-lg transition-colors ${
        isDragging 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <p className="text-gray-600 mb-2">
        Drag & drop your spreadsheet here, or click to browse
      </p>
      
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) validateAndSetFile(file);
        }}
        className="hidden"
        id="file-input"
      />
      
      <label
        htmlFor="file-input"
        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
      >
        Choose File
      </label>
      
      {error && (
        <p className="mt-4 text-sm text-red-600">❌ {error}</p>
      )}
      
      {file && !error && (
        <p className="mt-4 text-sm text-green-600">✅ {file.name}</p>
      )}
    </div>
  );
};

export default FileUploadExample;