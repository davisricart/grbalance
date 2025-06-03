import React from 'react';
import { StepBuilderDemo } from '../components/StepBuilderDemo';

const StepBuilderTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Visual Step Builder Test
          </h1>
          <p className="text-gray-600">
            Interactive demonstration of the step-by-step reconciliation workflow
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Test URL: <code className="bg-gray-200 px-2 py-1 rounded">localhost:5177/step-builder-test</code>
          </div>
        </div>
        
        <StepBuilderDemo />
        
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-2xl mx-auto">
            <h3 className="font-bold text-gray-800 mb-2">🧪 How to Test</h3>
            <ol className="text-left text-sm text-gray-600 space-y-1">
              <li><strong>1.</strong> Click any "+ Add Step" button to create a new step</li>
              <li><strong>2.</strong> Click the ▶️ play icon to execute the step</li>
              <li><strong>3.</strong> Watch the data transform in real-time</li>
              <li><strong>4.</strong> Click the 👁️ eye icon to view data at that step</li>
              <li><strong>5.</strong> Click the ⏮️ revert icon to go back to any previous step</li>
              <li><strong>6.</strong> Add multiple steps to build complex logic</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepBuilderTestPage; 