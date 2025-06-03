import React, { useState } from 'react';
import { DynamicFileDropdown } from '../components/DynamicFileDropdown';
import { DynamicScriptTestingSection } from '../components/DynamicScriptTestingSection';

const FileTestPage: React.FC = () => {
  const [file1, setFile1] = useState<string>('');
  const [file2, setFile2] = useState<string>('');
  const [testFile1, setTestFile1] = useState<string>('');
  const [testFile2, setTestFile2] = useState<string>('');

  const excelFilter = (filename: string) => {
    return filename.endsWith('.xlsx') || filename.endsWith('.xls');
  };

  const handleScriptTestingFileSelect = (selectedFile1: string, selectedFile2: string) => {
    setTestFile1(selectedFile1);
    setTestFile2(selectedFile2);
    console.log('Script Testing Files Selected:', { selectedFile1, selectedFile2 });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Dynamic File Loading Test
        </h1>

        {/* Original Test Section */}
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Basic Dynamic File Dropdown Tests
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <DynamicFileDropdown
                  label="File 1 - All Files"
                  value={file1}
                  onChange={setFile1}
                />
              </div>

              <div>
                <DynamicFileDropdown
                  label="File 2 - Excel Files Only"
                  value={file2}
                  onChange={setFile2}
                  filter={excelFilter}
                />
              </div>
            </div>

            {(file1 || file2) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Selected Files:</h3>
                <div className="text-sm text-gray-700">
                  <div>File 1: <span className="font-mono">{file1 || 'None'}</span></div>
                  <div>File 2: <span className="font-mono">{file2 || 'None'}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* New Script Testing Section Replacement */}
          <DynamicScriptTestingSection onFileSelect={handleScriptTestingFileSelect} />

          {/* Integration Status */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">
              🔧 AdminPage Integration Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-sm">Dynamic file loading system working</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-sm">Components created and tested</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-sm">Drop-in replacement component ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-orange-500">⏳</span>
                <span className="text-sm">Manual integration needed (AdminPage.tsx safe from corruption)</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Copy the DynamicScriptTestingSection component</li>
                <li>2. Manually replace the hardcoded Script Testing section in AdminPage.tsx</li>
                <li>3. Add import: <code className="bg-blue-100 px-1 rounded">import {`{DynamicScriptTestingSection}`} from '../components/DynamicScriptTestingSection';</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileTestPage; 