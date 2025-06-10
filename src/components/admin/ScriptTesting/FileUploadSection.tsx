import React from 'react';
import { Upload, CheckCircle, XCircle } from 'lucide-react';
import { TestFileData } from './ScriptTesting';

interface FileUploadSectionProps {
  file1Data: TestFileData;
  file2Data: TestFileData;
  onFileUpload: (fileNumber: 1 | 2, file: File) => void;
  isLoading: boolean;
}

export default function FileUploadSection({
  file1Data,
  file2Data,
  onFileUpload,
  isLoading
}: FileUploadSectionProps) {
  const FileUploadZone = ({ 
    fileNumber, 
    fileData, 
    title, 
    description, 
    color 
  }: { 
    fileNumber: 1 | 2;
    fileData: TestFileData;
    title: string;
    description: string;
    color: 'green' | 'blue';
  }) => {
    const colorClasses = {
      green: {
        border: 'border-green-300 hover:border-green-500',
        bg: 'hover:bg-green-50',
        text: 'text-green-600 group-hover:text-green-700',
        icon: 'text-green-400 group-hover:text-green-600',
        badge: 'bg-green-100 text-green-600',
        header: 'text-green-800',
        subtext: 'text-green-600'
      },
      blue: {
        border: 'border-blue-300 hover:border-blue-500',
        bg: 'hover:bg-blue-50',
        text: 'text-blue-600 group-hover:text-blue-700',
        icon: 'text-blue-400 group-hover:text-blue-600',
        badge: 'bg-blue-100 text-blue-600',
        header: 'text-blue-800',
        subtext: 'text-blue-600'
      }
    };

    const classes = colorClasses[color];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex items-center justify-center w-8 h-8 ${classes.badge} rounded-full font-semibold text-sm`}>
            {fileNumber}
          </div>
          <div>
            <h3 className={`text-sm font-medium ${classes.header}`}>{title}</h3>
            <p className={`text-xs ${classes.subtext}`}>{description}</p>
          </div>
        </div>
        
        <div className={`relative border-2 border-dashed ${classes.border} ${classes.bg} rounded-lg p-6 text-center transition-colors cursor-pointer group`}>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            disabled={isLoading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileUpload(fileNumber, file);
            }}
          />
          <div className="space-y-2">
            <div className="flex justify-center">
              {fileData.isValid ? (
                <CheckCircle className={`w-8 h-8 text-green-500`} />
              ) : fileData.error && fileData.error !== 'Processing...' ? (
                <XCircle className={`w-8 h-8 text-red-500`} />
              ) : (
                <Upload className={`w-8 h-8 ${classes.icon} transition-colors`} />
              )}
            </div>
            <div className="text-sm">
              {fileData.file ? (
                <span className={fileData.isValid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {fileData.file.name}
                </span>
              ) : (
                <span className={`${classes.text} font-medium transition-colors`}>
                  Click to upload Excel or CSV
                </span>
              )}
            </div>
            <p className={`text-xs ${classes.subtext}`}>
              {fileData.file ? (
                fileData.isValid ? (
                  `✅ ${fileData.data?.summary.totalRows || 0} rows loaded`
                ) : fileData.error === 'Processing...' ? (
                  '🔄 Processing...'
                ) : (
                  `❌ ${fileData.error}`
                )
              ) : (
                description
              )}
            </p>
          </div>
        </div>
        
        {/* File Details */}
        {fileData.isValid && fileData.data && (
          <div className="text-xs bg-gray-50 border border-gray-200 rounded p-3">
            <div className="font-medium text-gray-700 mb-1">File Details:</div>
            <div className="space-y-1 text-gray-600">
              <div>Rows: {fileData.data.summary.totalRows}</div>
              <div>Columns: {fileData.data.summary.columns}</div>
              <div>Headers: {fileData.data.headers.slice(0, 3).join(', ')}{fileData.data.headers.length > 3 ? '...' : ''}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FileUploadZone
        fileNumber={1}
        fileData={file1Data}
        title="Primary Dataset"
        description="Main data source for analysis"
        color="green"
      />
      
      <FileUploadZone
        fileNumber={2}
        fileData={file2Data}
        title="Secondary Dataset"
        description="Optional - for comparisons"
        color="blue"
      />
    </div>
  );
}