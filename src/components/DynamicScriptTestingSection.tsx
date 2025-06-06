import React, { useState } from 'react';
import { DynamicFileDropdown } from './DynamicFileDropdown';

interface DynamicScriptTestingSectionProps {
  onFileSelect: (file1: string, file2: string) => void;
}

export const DynamicScriptTestingSection: React.FC<DynamicScriptTestingSectionProps> = ({
  onFileSelect
}) => {
  const [selectedFile1, setSelectedFile1] = useState<string>('');
  const [selectedFile2, setSelectedFile2] = useState<string>('');

  const handleFile1Select = (fileName: string) => {
    setSelectedFile1(fileName);
    onFileSelect(fileName, selectedFile2);
  };

  const handleFile2Select = (fileName: string) => {
    setSelectedFile2(fileName);
    onFileSelect(selectedFile1, fileName);
  };

  // Filter function for Excel files only
  const excelFilter = (filename: string) => {
    return filename.endsWith('.xlsx') || filename.endsWith('.xls');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧪 Script Testing - Dynamic File Loading
      </h3>
      
      <div className="space-y-6">
        {/* File Selection Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File 1 - All Sample Data */}
          <div className="flex-1">
            <DynamicFileDropdown
              label="📁 Select File 1 from Sample Data"
              value={selectedFile1}
              onChange={handleFile1Select}
            />
            {selectedFile1 && (
              <div className="mt-2 text-sm text-green-600">
                ✅ Selected: {selectedFile1}
              </div>
            )}
          </div>

          {/* File 2 - Excel Files Only */}
          <div className="flex-1">
            <DynamicFileDropdown
              label="📊 Select File 2 (Excel Files Only)"
              value={selectedFile2}
              onChange={handleFile2Select}
              filter={excelFilter}
            />
            {selectedFile2 && (
              <div className="mt-2 text-sm text-green-600">
                ✅ Selected: {selectedFile2}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            🚀 Dynamic File Loading Benefits:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Auto-detection:</strong> All files in /public/sample-data/ are detected automatically</li>
            <li>• <strong>No hardcoding:</strong> Add new files without code changes</li>
            <li>• <strong>Smart filtering:</strong> File 2 shows only Excel files</li>
            <li>• <strong>Real-time updates:</strong> File list updates when files.json changes</li>
          </ul>
        </div>

        {/* Status */}
        {selectedFile1 && selectedFile2 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-900 mb-2">
              ✅ Ready to Process:
            </div>
            <div className="text-sm text-green-800">
              <div>📄 File 1: <code>{selectedFile1}</code></div>
              <div>📄 File 2: <code>{selectedFile2}</code></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 