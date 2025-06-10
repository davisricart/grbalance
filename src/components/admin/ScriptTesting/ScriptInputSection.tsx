import React from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { ScriptInputMethod } from './ScriptTesting';

interface ScriptInputSectionProps {
  scriptInputMethod: ScriptInputMethod;
  onScriptInputMethodChange: (method: ScriptInputMethod) => void;
  testScript: string;
  testScriptText: string;
  testScriptFileName: string;
  onTestScriptTextChange: (text: string) => void;
  onScriptUpload: (file: File) => void;
  onClearScript: () => void;
  isLoading: boolean;
}

export default function ScriptInputSection({
  scriptInputMethod,
  onScriptInputMethodChange,
  testScript,
  testScriptText,
  testScriptFileName,
  onTestScriptTextChange,
  onScriptUpload,
  onClearScript,
  isLoading
}: ScriptInputSectionProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.js') && !file.name.endsWith('.ts')) {
        alert('Please select a JavaScript (.js) or TypeScript (.ts) file');
        return;
      }
      onScriptUpload(file);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Test Script
      </label>
      
      {/* Tab selector for script input method */}
      <div className="flex mb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => {
            onScriptInputMethodChange('paste');
            onClearScript();
          }}
          disabled={isLoading}
          className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors disabled:opacity-50 ${
            scriptInputMethod === 'paste'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Copy & Paste
        </button>
        <button
          type="button"
          onClick={() => {
            onScriptInputMethodChange('upload');
            onClearScript();
          }}
          disabled={isLoading}
          className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors disabled:opacity-50 ${
            scriptInputMethod === 'upload'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Upload File
        </button>
      </div>

      {/* Copy/Paste Script */}
      {scriptInputMethod === 'paste' && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={testScriptText}
              onChange={(e) => onTestScriptTextChange(e.target.value)}
              disabled={isLoading}
              placeholder="Paste your Claude-generated script here..."
              className="w-full h-40 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm disabled:opacity-50"
            />
            {testScriptText && (
              <button
                type="button"
                onClick={() => onTestScriptTextChange('')}
                disabled={isLoading}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Paste your JavaScript reconciliation script here
          </p>
          {testScriptText && (
            <p className="text-xs text-green-600">
              ✓ Script ready ({testScriptText.length} characters)
            </p>
          )}
        </div>
      )}

      {/* Upload Script File */}
      {scriptInputMethod === 'upload' && (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group">
            <input
              type="file"
              id="test-script-file"
              accept=".js,.ts"
              disabled={isLoading}
              className="hidden"
              onChange={handleFileUpload}
            />
            <label 
              htmlFor="test-script-file" 
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <div className="flex justify-center">
                {testScript ? (
                  <FileText className="w-8 h-8 text-green-500" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                )}
              </div>
              <div className="text-sm">
                <span className="text-blue-600 font-medium group-hover:text-blue-700">
                  {testScript ? 'Change Script File' : 'Choose Script File'}
                </span>
              </div>
              <p className="text-xs text-gray-500">or drag and drop a .js file</p>
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Upload a .js file containing your script
          </p>
          
          {/* Script Upload Status */}
          {testScript && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <h5 className="font-medium text-green-900 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                ✓ Script Loaded
              </h5>
              <p className="text-sm text-green-700 mt-1">
                {testScriptFileName && <strong>{testScriptFileName}</strong>} loaded successfully 
                <span className="ml-1">({testScript.length} characters)</span>
              </p>
              <button
                onClick={onClearScript}
                disabled={isLoading}
                className="mt-2 text-xs text-green-600 hover:text-green-800 underline disabled:opacity-50"
              >
                Clear script
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}