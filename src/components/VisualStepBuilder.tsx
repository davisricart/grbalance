import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { FiPlay, FiPause, FiSkipBack, FiPlus, FiEye, FiTrash2, FiCheck, FiClock, FiArrowRight } from 'react-icons/fi';

interface StepWithPreview {
  id: string;
  stepNumber: number;
  instruction: string;
  status: 'draft' | 'testing' | 'completed' | 'current' | 'reverted';
  dataPreview: any[];
  recordCount: number;
  columnsAdded: string[];
  timestamp: string;
  isViewingStep: boolean;
  executionTime?: number;
}

interface VisualStepBuilderProps {
  steps: StepWithPreview[];
  onExecuteStep: (stepNumber: number) => Promise<void>;
  onRevertToStep: (stepNumber: number) => void;
  onAddStep: (instruction: string) => void;
  onViewStep: (stepNumber: number) => void;
  currentStepData: any[];
  isExecuting: boolean;
  onFinishScript: () => void;
}

export const VisualStepBuilder: React.FC<VisualStepBuilderProps> = ({
  steps,
  onExecuteStep,
  onRevertToStep,
  onAddStep,
  onViewStep,
  currentStepData,
  isExecuting,
  onFinishScript
}) => {
  const [newStepInstruction, setNewStepInstruction] = useState('');
  const [viewingStepNumbers, setViewingStepNumbers] = useState<Set<number>>(new Set());
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [confirmingRevert, setConfirmingRevert] = useState<number | null>(null);

  // Memoized step status functions for performance
  const getStepIcon = useCallback((step: StepWithPreview) => {
    switch (step.status) {
      case 'completed': return <FiCheck className="text-green-500" />;
      case 'testing': return <FiClock className="text-yellow-500 animate-spin" />;
      case 'current': return <FiPlay className="text-blue-500" />;
      case 'reverted': return <FiSkipBack className="text-gray-400" />;
      default: return <FiPause className="text-gray-400" />;
    }
  }, []);

  const getStepStatusColor = useCallback((step: StepWithPreview) => {
    switch (step.status) {
      case 'completed': return 'bg-green-100 border-green-300';
      case 'testing': return 'bg-yellow-100 border-yellow-300';
      case 'current': return 'bg-blue-100 border-blue-300';
      case 'reverted': return 'bg-gray-100 border-gray-300';
      default: return 'bg-gray-50 border-gray-200';
    }
  }, []);

  const handleViewStep = useCallback((stepNumber: number) => {
    if (viewingStepNumbers.has(stepNumber)) {
      setViewingStepNumbers(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepNumber);
        return newSet;
      });
    } else {
      setViewingStepNumbers(prev => {
        const newSet = new Set(prev);
        newSet.add(stepNumber);
        return newSet;
      });
      onViewStep(stepNumber);
    }
  }, [viewingStepNumbers, onViewStep]);

  const handleAddStep = useCallback(() => {
    if (newStepInstruction.trim()) {
      onAddStep(newStepInstruction.trim());
      setNewStepInstruction('');
      setIsAddingStep(false);
    }
  }, [newStepInstruction, onAddStep]);

  // Memoized data preview renderer for performance
  const renderDataPreview = useCallback((data: any[], stepNumber: number) => {
    if (!data || data.length === 0) return <div className="text-gray-500 text-sm">No data preview</div>;

    const columns = Object.keys(data[0] || {});
    const previewRows = data.slice(0, 3); // Show first 3 rows

    return (
      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-300">
            <tr>
              {columns.slice(0, 4).map(col => ( // Show first 4 columns
                <th key={col} className="px-2 py-1 text-left font-medium text-gray-700">
                  {col.length > 15 ? col.substring(0, 15) + '...' : col}
                </th>
              ))}
              {columns.length > 4 && <th className="px-2 py-1 text-gray-500">+{columns.length - 4} more</th>}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.slice(0, 4).map(col => (
                  <td key={col} className="px-2 py-1 text-gray-600">
                    {String(row[col] || '').length > 20 
                      ? String(row[col]).substring(0, 20) + '...' 
                      : String(row[col] || '')
                    }
                  </td>
                ))}
                {columns.length > 4 && <td className="px-2 py-1 text-gray-400">...</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 3 && (
          <div className="text-xs text-gray-500 mt-1">
            Showing 3 of {data.length} rows • {columns.length} columns
          </div>
        )}
      </div>
    );
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Visual Script Builder</h3>
        {steps.length > 0 && steps.some(step => step.status === 'completed') && (
          <button
            onClick={onFinishScript}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
          >
            🏁 Finish Script
          </button>
        )}
      </div>

      {/* Step Timeline */}
      <div className="space-y-4 mb-6">
        {steps.map((step, index) => (
          <div key={step.id} className={`border rounded-lg p-4 transition-all ${getStepStatusColor(step)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-white border-2 border-current flex items-center justify-center text-sm font-bold">
                    {step.stepNumber}
                  </span>
                  {getStepIcon(step)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{step.instruction}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {step.recordCount > 0 && `${step.recordCount} records`}
                    {step.columnsAdded.length > 0 && ` • +${step.columnsAdded.length} columns`}
                    {step.executionTime && ` • ${step.executionTime}ms`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {step.status === 'completed' && (
                  <>
                    <button
                      onClick={() => handleViewStep(step.stepNumber)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                      title="View data at this step"
                    >
                      <FiEye size={16} />
                    </button>
                    
                    {confirmingRevert === step.stepNumber ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            onRevertToStep(step.stepNumber);
                            setConfirmingRevert(null);
                          }}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          title="Confirm removal"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmingRevert(null)}
                          className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                          title="Cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingRevert(step.stepNumber)}
                        className="p-2 text-orange-600 hover:bg-orange-100 rounded"
                        title="Revert to this step"
                      >
                        <FiSkipBack size={16} />
                      </button>
                    )}
                  </>
                )}
                {step.status === 'draft' && (
                  <button
                    onClick={() => onExecuteStep(step.stepNumber)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded"
                    disabled={isExecuting}
                  >
                    <FiPlay size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Data Preview */}
            {viewingStepNumbers.has(step.stepNumber) && step.dataPreview && step.dataPreview.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiEye className="text-blue-500" />
                  <span className="font-medium text-gray-700">Data Preview - Step {step.stepNumber}</span>
                </div>
                {renderDataPreview(step.dataPreview, step.stepNumber)}
              </div>
            )}

            {/* Show connecting arrow for completed steps */}
            {index < steps.length - 1 && step.status === 'completed' && (
              <div className="flex justify-center mt-2">
                <FiArrowRight className="text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Step */}
      <div className="border-t pt-4">
        {!isAddingStep ? (
          <button
            onClick={() => setIsAddingStep(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium"
          >
            <FiPlus size={16} />
            Add Step {steps.length + 1}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                {steps.length + 1}
              </span>
              <span className="font-medium text-gray-700">Step {steps.length + 1}</span>
            </div>
            <textarea
              value={newStepInstruction}
              onChange={(e) => setNewStepInstruction(e.target.value)}
              placeholder="Describe the next step... (e.g., 'Filter transactions by date range', 'Calculate fees for each transaction', 'Group by payment method')"
              className="w-full p-3 border border-gray-300 rounded-md resize-none h-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                disabled={!newStepInstruction.trim()}
              >
                Add Step {steps.length + 1}
              </button>
              <button
                onClick={() => {
                  setIsAddingStep(false);
                  setNewStepInstruction('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Current Data Preview */}
      {currentStepData && currentStepData.length > 0 && viewingStepNumbers.size === 0 && (
        <div className="mt-6 border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-3">Current Working Data</h4>
          {renderDataPreview(currentStepData, steps.length)}
        </div>
      )}
    </div>
  );
};

// Memoized export for performance optimization
export default memo(VisualStepBuilder); 