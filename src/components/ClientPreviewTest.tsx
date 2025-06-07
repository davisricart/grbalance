// Standalone test for ClientPreview component
import React, { useMemo } from 'react';
import { VirtualTable } from './VirtualTable';

const ClientPreviewTest: React.FC = () => {
  console.log('🚨 ClientPreviewTest component rendering');

  const testData = [
    { "Mastercard Count": 37, "Analysis": "Test Result 1" },
    { "Visa Count": 25, "Analysis": "Test Result 2" },
    { "Amex Count": 12, "Analysis": "Test Result 3" }
  ];

  return (
    <div style={{ border: '3px solid purple', padding: '20px', margin: '20px' }}>
      <h2 style={{ color: 'purple' }}>🧪 Standalone ClientPreview Test</h2>
      <p><strong>This is a minimal test to verify ClientPreview component works</strong></p>
      
      {/* Minimal ClientPreview implementation */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
          <h4 className="text-lg font-semibold">👥 Test Client Preview</h4>
          <p className="text-emerald-100 mt-1 text-sm">Minimal working example</p>
        </div>
        <div className="p-6">
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs">
            <strong>🔍 TEST DATA:</strong><br />
            • testData.length: {testData.length}<br />
            • Columns: {Object.keys(testData[0]).join(', ')}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2 bg-emerald-50 text-xs text-emerald-700 border-b">
              ✅ Test: Displaying {testData.length} rows of hardcoded data
            </div>
            <VirtualTable 
              data={testData} 
              maxRows={100}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPreviewTest;