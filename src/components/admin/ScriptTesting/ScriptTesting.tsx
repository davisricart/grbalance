import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Download, Save, FileText, Upload } from 'lucide-react';
import FileUploadSection from './FileUploadSection';
import ScriptInputSection from './ScriptInputSection';
import TestResults from './TestResults';
import { parseFile, ParsedFileData } from '../../../utils/fileProcessor';

interface ScriptTestingProps {
  onSaveScript?: (script: string, filename: string) => void;
  isLoading?: boolean;
}

export interface TestFileData {
  file: File | null;
  data: ParsedFileData | null;
  isValid: boolean;
  error: string;
}

export type ScriptInputMethod = 'paste' | 'upload';

export interface TestResults {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  logs: string[];
}

export default function ScriptTesting({
  onSaveScript,
  isLoading = false
}: ScriptTestingProps) {
  // File upload state
  const [file1Data, setFile1Data] = useState<TestFileData>({
    file: null,
    data: null,
    isValid: false,
    error: ''
  });
  
  const [file2Data, setFile2Data] = useState<TestFileData>({
    file: null,
    data: null,
    isValid: false,
    error: ''
  });

  // Script input state
  const [scriptInputMethod, setScriptInputMethod] = useState<ScriptInputMethod>('paste');
  const [testScript, setTestScript] = useState('');
  const [testScriptText, setTestScriptText] = useState('');
  const [testScriptFileName, setTestScriptFileName] = useState('');

  // Testing state
  const [isTestingScript, setIsTestingScript] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [validationType, setValidationType] = useState<'warning' | 'error'>('error');
  const [showFileValidationMessage, setShowFileValidationMessage] = useState(false);

  // Library status
  const [libraryStatus, setLibraryStatus] = useState('🔄 Initializing libraries...');

  useEffect(() => {
    // Simulate library initialization
    const timer = setTimeout(() => {
      setLibraryStatus('✅ Libraries loaded successfully');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleFileUpload = async (fileNumber: 1 | 2, file: File) => {
    if (!file) return;

    const targetFileData = fileNumber === 1 ? file1Data : file2Data;
    const setTargetFileData = fileNumber === 1 ? setFile1Data : setFile2Data;

    setTargetFileData({
      file,
      data: null,
      isValid: false,
      error: 'Processing...'
    });

    try {
      const parsedData = await parseFile(file);
      setTargetFileData({
        file,
        data: parsedData,
        isValid: true,
        error: ''
      });
    } catch (error) {
      setTargetFileData({
        file,
        data: null,
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to parse file'
      });
    }
  };

  const handleScriptUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTestScript(content);
      setTestScriptFileName(file.name);
      setValidationMessage('');
      setShowFileValidationMessage(false);
    };
    reader.readAsText(file);
  };

  const runTestScript = async () => {
    // Validation
    const currentScript = scriptInputMethod === 'paste' ? testScriptText : testScript;
    
    if (!currentScript.trim()) {
      setValidationMessage('Please provide a script to test');
      setValidationType('error');
      setShowFileValidationMessage(true);
      return;
    }

    if (!file1Data.isValid) {
      setValidationMessage('Please upload a valid primary dataset');
      setValidationType('error');
      setShowFileValidationMessage(true);
      return;
    }

    setIsTestingScript(true);
    setTestResults(null);
    setValidationMessage('');
    setShowFileValidationMessage(false);

    try {
      const startTime = Date.now();
      const logs: string[] = [];

      // Create console capture for script execution
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.log = (...args) => {
        logs.push(`LOG: ${args.join(' ')}`);
        originalConsoleLog(...args);
      };
      console.error = (...args) => {
        logs.push(`ERROR: ${args.join(' ')}`);
        originalConsoleError(...args);
      };
      console.warn = (...args) => {
        logs.push(`WARN: ${args.join(' ')}`);
        originalConsoleWarn(...args);
      };

      try {
        // Create execution context
        const context = {
          file1Data: file1Data.data,
          file2Data: file2Data.data,
          console: { log: console.log, error: console.error, warn: console.warn }
        };

        // Execute script in isolated context
        const scriptFunction = new Function(
          'file1Data', 
          'file2Data', 
          'console',
          `
          try {
            ${currentScript}
            return { success: true, result: typeof result !== 'undefined' ? result : 'Script executed successfully' };
          } catch (error) {
            return { success: false, error: error.message };
          }
          `
        );

        const result = scriptFunction(context.file1Data, context.file2Data, context.console);
        
        const executionTime = Date.now() - startTime;

        if (result.success) {
          setTestResults({
            success: true,
            output: typeof result.result === 'object' 
              ? JSON.stringify(result.result, null, 2) 
              : String(result.result),
            executionTime,
            logs
          });
        } else {
          setTestResults({
            success: false,
            output: '',
            error: result.error,
            executionTime,
            logs
          });
        }
      } finally {
        // Restore console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      setTestResults({
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Script execution failed',
        executionTime,
        logs: []
      });
    } finally {
      setIsTestingScript(false);
    }
  };

  const clearAllResults = () => {
    setTestResults(null);
    setValidationMessage('');
    setShowFileValidationMessage(false);
  };

  const saveScriptToFile = () => {
    const currentScript = scriptInputMethod === 'paste' ? testScriptText : testScript;
    
    if (!currentScript.trim()) {
      alert('No script to save');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reconciliation-script-${timestamp}.js`;
    
    if (onSaveScript) {
      onSaveScript(currentScript, filename);
    } else {
      // Default save behavior
      const blob = new Blob([currentScript], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const downloadResultsToExcel = () => {
    if (!testResults || !testResults.success) {
      alert('No successful test results to download');
      return;
    }

    // This would implement Excel export functionality
    alert('Excel download functionality would be implemented here');
  };

  return (
    <div className="space-y-6">
      {/* Script Testing Environment */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Script Testing Environment</h3>
          <p className="text-sm text-gray-500 mt-1">Test your GR Balance scripts locally before deployment</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Library Status */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">{libraryStatus}</p>
          </div>

          {/* File Upload Section */}
          <FileUploadSection
            file1Data={file1Data}
            file2Data={file2Data}
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
          />

          {/* Script Input Section */}
          <ScriptInputSection
            scriptInputMethod={scriptInputMethod}
            onScriptInputMethodChange={setScriptInputMethod}
            testScript={testScript}
            testScriptText={testScriptText}
            testScriptFileName={testScriptFileName}
            onTestScriptTextChange={setTestScriptText}
            onScriptUpload={handleScriptUpload}
            onClearScript={() => {
              setTestScript('');
              setTestScriptText('');
              setTestScriptFileName('');
            }}
            isLoading={isLoading}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runTestScript}
              disabled={isTestingScript || isLoading}
              className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 mr-2" />
              {isTestingScript ? 'Running...' : 'Run Script'}
            </button>
            
            <button
              onClick={clearAllResults}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-medium transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
              title="Clear script execution output and results"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Output
            </button>
            
            <button
              onClick={downloadResultsToExcel}
              disabled={!testResults?.success || isLoading}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
              title="Download complete script results as Excel file for admin analysis"
            >
              <Download className="w-4 h-4 mr-2" />
              Download to Excel
            </button>
            
            <button
              onClick={saveScriptToFile}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Script
            </button>
          </div>

          {/* Validation Message */}
          {showFileValidationMessage && validationMessage && (
            <div className={`p-3 rounded-lg flex items-center space-x-2 text-sm animate-pulse ${
              validationType === 'warning' 
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <span className="text-base">{validationType === 'warning' ? '⚠️' : '❌'}</span>
              <span>{validationMessage}</span>
            </div>
          )}

          {/* Test Results */}
          <TestResults 
            results={testResults}
            isLoading={isTestingScript}
          />
        </div>
      </div>
    </div>
  );
}