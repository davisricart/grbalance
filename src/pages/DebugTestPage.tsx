// Standalone debug test page to verify components work
import React from 'react';
import { VirtualTable } from '../components/VirtualTable';

const DebugTestPage: React.FC = () => {
  console.log('🚨🚨🚨 DEBUG TEST PAGE IS RENDERING 🚨🚨🚨');

  const testData = [
    { "Mastercard Count": 37, "Test": "This should ALWAYS work" },
    { "Visa Count": 25, "Test": "If you see this table, VirtualTable works" },
    { "Total": 62, "Test": "ClientPreview component should work too" }
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      {/* Always visible header */}
      <div style={{
        backgroundColor: 'red', 
        color: 'white', 
        padding: '20px', 
        marginBottom: '20px',
        border: '5px solid yellow'
      }}>
        <h1>🚨 DEBUG TEST PAGE 🚨</h1>
        <p><strong>This page should ALWAYS work if the code is synced!</strong></p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
        <p>If you see this red box, the code changes are working!</p>
      </div>

      {/* Test VirtualTable component */}
      <div style={{
        backgroundColor: 'blue', 
        color: 'white', 
        padding: '20px', 
        marginBottom: '20px'
      }}>
        <h2>🔵 VirtualTable Test</h2>
        <p>Testing VirtualTable component with hardcoded data:</p>
        
        <div style={{ backgroundColor: 'white', padding: '10px', marginTop: '10px' }}>
          <VirtualTable 
            data={testData}
            maxRows={100}
            className="w-full"
          />
        </div>
      </div>

      {/* Test ClientPreview-style component */}
      <div style={{
        backgroundColor: 'green', 
        color: 'white', 
        padding: '20px', 
        marginBottom: '20px'
      }}>
        <h2>🟢 ClientPreview Style Test</h2>
        <p>Testing the same layout as ClientPreview:</p>
        
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
            <h4 className="text-lg font-semibold">👥 Test Client Preview</h4>
            <p className="text-emerald-100 mt-1 text-sm">This should work if Tailwind CSS is loaded</p>
          </div>
          <div className="p-6">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <strong>🔍 DEBUG INFO:</strong><br />
              • testData.length: {testData.length}<br />
              • Columns: {Object.keys(testData[0]).join(', ')}<br />
              • Component: Working!
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-2 bg-emerald-50 text-xs text-emerald-700 border-b">
                ✅ Displaying {testData.length} rows of test data
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

      {/* Instructions */}
      <div style={{
        backgroundColor: 'purple', 
        color: 'white', 
        padding: '20px'
      }}>
        <h2>🟣 Instructions</h2>
        <p><strong>If you can see this page with colored boxes and data tables:</strong></p>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>✅ Code changes are synced correctly</li>
          <li>✅ VirtualTable component works</li>
          <li>✅ ClientPreview styling works</li>
          <li>✅ The issue is with AdminPage tab logic</li>
        </ul>
        
        <p style={{ marginTop: '15px' }}>
          <strong>If you DON'T see this page:</strong> There's a build/cache/routing issue.
        </p>
      </div>
    </div>
  );
};

export default DebugTestPage;