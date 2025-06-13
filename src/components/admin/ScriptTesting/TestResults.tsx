import React from 'react';
import { CheckCircle, XCircle, Clock, Terminal } from 'lucide-react';
import { TestResults as TestResultsType } from './ScriptTesting';

interface TestResultsProps {
  results: TestResultsType | null;
  isLoading: boolean;
}

export default function TestResults({ results, isLoading }: TestResultsProps) {
  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Running script...</span>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="text-center text-gray-500">
          <Terminal className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No test results yet. Upload files and run a script to see results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Execution Summary */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Execution Results</h4>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{results.executionTime}ms</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`flex items-center space-x-3 p-3 rounded-lg ${
          results.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {results.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <div>
            <p className={`font-medium ${
              results.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {results.success ? 'Script executed successfully' : 'Script execution failed'}
            </p>
            {results.error && (
              <p className="text-sm text-red-600 mt-1">{results.error}</p>
            )}
          </div>
        </div>

        {/* Script Output */}
        {results.success && results.output && (
          <div className="mt-4">
            <h5 className="font-medium text-gray-900 mb-2">Output:</h5>
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                {results.output}
              </pre>
            </div>
          </div>
        )}

        {/* Console Logs */}
        {results.logs.length > 0 && (
          <div className="mt-4">
            <h5 className="font-medium text-gray-900 mb-2">Console Output:</h5>
            <div className="bg-gray-900 text-green-400 font-mono text-xs rounded p-3 max-h-40 overflow-y-auto">
              {results.logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Information */}
      {results.success && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Next Steps:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Review the output to ensure it meets your expectations</li>
            <li>• Save the script if you're satisfied with the results</li>
            <li>• Deploy the script to a client site if ready for production</li>
            <li>• Download results to Excel for further analysis</li>
          </ul>
        </div>
      )}

      {!results.success && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h5 className="font-medium text-amber-900 mb-2">Troubleshooting Tips:</h5>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Check that your script syntax is valid JavaScript</li>
            <li>• Ensure all required variables and functions are defined</li>
            <li>• Verify that file data is properly referenced</li>
            <li>• Check the console output for additional error details</li>
          </ul>
        </div>
      )}
    </div>
  );
}