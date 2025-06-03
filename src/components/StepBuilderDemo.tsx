import React, { useState } from 'react';
import { VisualStepBuilder } from './VisualStepBuilder';
import * as XLSX from 'xlsx';

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

export const StepBuilderDemo: React.FC = () => {
  const [steps, setSteps] = useState<any[]>([]);
  const [currentData, setCurrentData] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [viewingStepNumber, setViewingStepNumber] = useState<number | null>(null);
  const [analysisInstruction, setAnalysisInstruction] = useState('');
  const [hasInitialStep, setHasInitialStep] = useState(false);
  const [selectedHeaders1, setSelectedHeaders1] = useState<string[]>([]);
  const [selectedHeaders2, setSelectedHeaders2] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // File handling state
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [file1Data, setFile1Data] = useState<any[]>([]);
  const [file2Data, setFile2Data] = useState<any[]>([]);
  const [file1Headers, setFile1Headers] = useState<string[]>([]);
  const [file2Headers, setFile2Headers] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Script import state
  const [showScriptImport, setShowScriptImport] = useState(false);
  const [isLoadingScript, setIsLoadingScript] = useState(false);

  // Sample data to simulate file uploads
  const sampleData = [
    { Date: '2024-01-15', Customer: 'John Doe', Amount: 150.00, Type: 'Credit Card', Status: 'Completed' },
    { Date: '2024-01-15', Customer: 'Jane Smith', Amount: 75.50, Type: 'Debit Card', Status: 'Completed' },
    { Date: '2024-01-16', Customer: 'Bob Johnson', Amount: 220.00, Type: 'Credit Card', Status: 'Pending' },
    { Date: '2024-01-16', Customer: 'Alice Brown', Amount: 95.25, Type: 'Cash', Status: 'Completed' },
    { Date: '2024-01-17', Customer: 'Charlie Davis', Amount: 180.75, Type: 'Credit Card', Status: 'Failed' }
  ];

  // Script import functions
  const processScriptFile = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const scriptContent = e.target?.result as string;
          
          // Extract script metadata using regex
          const stepsMatch = scriptContent.match(/\/\/ Steps: (\d+)/);
          const configMatch = scriptContent.match(/const config = ({[\s\S]*?});/);
          const stepsArrayMatch = scriptContent.match(/const steps = \[([\s\S]*?)\];/);
          
          if (!stepsMatch || !configMatch || !stepsArrayMatch) {
            throw new Error('Invalid script format. This does not appear to be a Visual Step Builder script.');
          }
          
          const stepCount = parseInt(stepsMatch[1]);
          
          // Parse config (safely)
          let config: any = {};
          try {
            const configStr = configMatch[1].replace(/(\w+):/g, '"$1":');
            config = JSON.parse(configStr);
          } catch {
            config = { selectedHeaders: { file1: [], file2: [] } };
          }
          
          // Parse steps array
          const stepsStr = stepsArrayMatch[1];
          const stepMatches = stepsStr.match(/{[\s\S]*?}/g) || [];
          
          const parsedSteps = stepMatches.map((stepStr, index) => {
            const instructionMatch = stepStr.match(/instruction: ["']([^"']+)["']/);
            const recordCountMatch = stepStr.match(/recordCount: (\d+)/);
            const executionTimeMatch = stepStr.match(/executionTime: (\d+)/);
            
            return {
              id: `step-${Date.now()}-${index}`,
              stepNumber: index + 1,
              instruction: instructionMatch ? instructionMatch[1] : `Step ${index + 1}`,
              status: 'draft' as const,
              dataPreview: [],
              recordCount: recordCountMatch ? parseInt(recordCountMatch[1]) : 0,
              columnsAdded: [],
              timestamp: new Date().toISOString(),
              isViewingStep: false,
              executionTime: executionTimeMatch ? parseInt(executionTimeMatch[1]) : 0
            };
          });
          
          resolve({
            steps: parsedSteps,
            config,
            stepCount,
            originalScript: scriptContent
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read script file'));
      reader.readAsText(file);
    });
  };

  const handleScriptImport = async (file: File) => {
    if (!file.name.endsWith('.js')) {
      alert('Please upload a valid JavaScript (.js) script file');
      return;
    }
    
    setIsLoadingScript(true);
    
    try {
      const { steps: importedSteps, config } = await processScriptFile(file);
      
      // Restore the workflow state
      setSteps(importedSteps);
      setHasInitialStep(true);
      setAnalysisInstruction(importedSteps[0]?.instruction || '');
      setSelectedHeaders1(config.selectedHeaders?.file1 || []);
      setSelectedHeaders2(config.selectedHeaders?.file2 || []);
      setShowScriptImport(false);
      
      // Show the first step
      if (importedSteps.length > 0) {
        setViewingStepNumber(1);
      }
      
      alert(`Successfully imported workflow with ${importedSteps.length} steps! You can continue working from where you left off.`);
    } catch (error) {
      console.error('Error importing script:', error);
      alert(`Error importing script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingScript(false);
    }
  };

  // File processing functions
  const processExcelFile = async (file: File): Promise<{ data: any[], headers: string[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            reject(new Error('File is empty'));
            return;
          }
          
          const headers = jsonData[0] as string[];
          const processedData = jsonData.slice(1).map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          }).filter(row => Object.values(row).some(val => val !== ''));
          
          resolve({ data: processedData, headers });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (file: File, fileNumber: 1 | 2) => {
    if (!file) return;
    
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Please upload a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }
    
    setIsLoadingFiles(true);
    
    try {
      const { data: fileData, headers } = await processExcelFile(file);
      
      if (fileNumber === 1) {
        setFile1(file);
        setFile1Data(fileData);
        setFile1Headers(headers);
        setSelectedHeaders1([]); // Reset selection
      } else {
        setFile2(file);
        setFile2Data(fileData);
        setFile2Headers(headers);
        setSelectedHeaders2([]); // Reset selection
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Get current working data (combine both files or use primary)
  const getCurrentWorkingData = () => {
    if (file1Data.length > 0) {
      return file1Data;
    }
    return sampleData; // Fallback to sample data for demo
  };

  const handleProcessAndDeploy = () => {
    if (!analysisInstruction.trim()) {
      alert('Please enter analysis instructions first');
      return;
    }

    // Create the first step
    handleAddStep(analysisInstruction);
    setHasInitialStep(true);
    
    // Auto-execute the first step
    setTimeout(() => {
      handleExecuteStep(1);
    }, 100);
  };

  const handleAddStep = (instruction: string) => {
    const newStep: StepWithPreview = {
      id: `step-${Date.now()}`,
      stepNumber: steps.length + 1,
      instruction,
      status: 'draft',
      dataPreview: [],
      recordCount: 0,
      columnsAdded: [],
      timestamp: new Date().toISOString(),
      isViewingStep: false
    };

    setSteps(prev => [...prev, newStep]);
  };

  const handleExecuteStep = async (stepNumber: number) => {
    setIsExecuting(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const stepIndex = stepNumber - 1;
    let workingData: any[] = [...sampleData];

    // Apply transformations based on step instructions
    for (let i = 0; i <= stepIndex; i++) {
      const step = steps[i];
      if (!step) continue;

      const instruction = step.instruction.toLowerCase();

      if (instruction.includes('filter') && instruction.includes('completed')) {
        workingData = workingData.filter(row => row.Status === 'Completed');
      } else if (instruction.includes('calculate') && instruction.includes('fee')) {
        workingData = workingData.map(row => ({
          ...row,
          Fee: (row.Amount * 0.029).toFixed(2),
          NetAmount: (row.Amount * 0.971).toFixed(2)
        }));
      } else if (instruction.includes('group') && instruction.includes('type')) {
        const grouped = workingData.reduce((acc: any, row) => {
          const key = row.Type;
          if (!acc[key]) {
            acc[key] = { Type: key, Count: 0, TotalAmount: 0 };
          }
          acc[key].Count++;
          acc[key].TotalAmount += row.Amount;
          return acc;
        }, {});
        workingData = Object.values(grouped);
      } else if (instruction.includes('sort') && instruction.includes('amount')) {
        workingData = workingData.sort((a, b) => b.Amount - a.Amount);
      } else if (instruction.includes('total') || instruction.includes('summary')) {
        const summary = {
          TotalTransactions: workingData.length,
          TotalAmount: workingData.reduce((sum, row) => sum + (row.Amount || 0), 0).toFixed(2),
          AverageAmount: (workingData.reduce((sum, row) => sum + (row.Amount || 0), 0) / workingData.length).toFixed(2),
          CompletedCount: workingData.filter(row => row.Status === 'Completed').length
        };
        workingData = [summary];
      } else {
        // Default: show all data for first step or basic analysis
        workingData = workingData;
      }
    }

    // Update the executed step
    setSteps(prev => prev.map(step => {
      if (step.stepNumber === stepNumber) {
        return {
          ...step,
          status: 'completed',
          dataPreview: workingData.slice(0, 10), // Show first 10 rows
          recordCount: workingData.length,
          columnsAdded: Object.keys(workingData[0] || {}).filter(col => 
            !Object.keys(sampleData[0] || {}).includes(col)
          ),
          executionTime: Math.floor(Math.random() * 500) + 200
        };
      }
      return step;
    }));

    setCurrentData(workingData);
    setIsExecuting(false);
    
    // Show continue option after first execution
    if (stepNumber === 1) {
      setViewingStepNumber(stepNumber);
    }
  };

  const handleRevertToStep = (stepNumber: number) => {
    setSteps(prev => prev.slice(0, stepNumber));
    setViewingStepNumber(stepNumber > 1 ? stepNumber : null);
  };

  const handleViewStep = (stepNumber: number) => {
    const step = steps.find(s => s.stepNumber === stepNumber);
    if (step?.dataPreview) {
      setCurrentData(step.dataPreview);
    }
  };

  const handleFinishScript = () => {
    setViewingStepNumber(null);
    alert(`Script completed with ${steps.length} steps! Ready for deployment.`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-light text-emerald-900 mb-3">
            🧪 Visual Step Builder
          </h2>
          <p className="text-emerald-700 text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Build reconciliation workflows step-by-step with complete transparency and safe iteration
          </p>
        </div>

        {/* Import Script Section */}
        <div className="bg-white rounded-xl border border-amber-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 text-lg">📂</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Continue Previous Work</h3>
                <p className="text-sm text-gray-600">Import a previously exported script to continue where you left off</p>
              </div>
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".js"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      handleScriptImport(selectedFile);
                    }
                  }}
                  className="hidden"
                  disabled={isLoadingScript}
                />
                <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isLoadingScript 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm hover:shadow-md'
                }`}>
                  {isLoadingScript ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
                      <span>Importing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>📥</span>
                      <span>Import Script</span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
        
        {/* File Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* File 1 Card */}
          <div className="bg-white rounded-xl border border-emerald-100 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Primary Dataset</h3>
                <p className="text-sm text-gray-500">
                  {file1 ? file1.name : 'No file selected'}
                </p>
              </div>
            </div>

            {/* File Upload Section */}
            {!file1 ? (
              <div className="mb-4">
                <label className="block">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        handleFileUpload(selectedFile, 1);
                      }
                    }}
                    className="hidden"
                    disabled={isLoadingFiles}
                  />
                  <div className="border-2 border-dashed border-emerald-200 rounded-lg p-6 text-center hover:border-emerald-300 transition-colors cursor-pointer">
                    {isLoadingFiles ? (
                      <div className="text-emerald-600">
                        <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <span className="text-sm">Processing...</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-emerald-600 text-2xl mb-2">📄</div>
                        <div className="text-sm font-medium text-emerald-700 mb-1">
                          Click to upload Excel or CSV
                        </div>
                        <div className="text-xs text-gray-500">
                          Supports .xlsx, .xls, .csv files
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-lg p-3 mb-4 text-sm text-emerald-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{file1Data.length}</strong> rows • <strong>{file1Headers.length}</strong> columns
                  </div>
                  <button
                    onClick={() => {
                      setFile1(null);
                      setFile1Data([]);
                      setFile1Headers([]);
                      setSelectedHeaders1([]);
                    }}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            
            {/* Header Selection for File 1 */}
            {file1Headers.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">Available Columns</div>
                <div className="flex flex-wrap gap-2">
                  {file1Headers.map((header) => (
                    <button
                      key={header}
                      type="button"
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                        selectedHeaders1.includes(header) 
                          ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600' 
                          : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
                      }`}
                      onClick={() => {
                        setSelectedHeaders1((prev) =>
                          prev.includes(header)
                            ? prev.filter((h) => h !== header)
                            : [...prev, header]
                        );
                      }}
                    >
                      {header}
                    </button>
                  ))}
                </div>
                {selectedHeaders1.length > 0 && (
                  <div className="mt-3 text-sm text-emerald-600 font-medium">
                    ✓ {selectedHeaders1.length} columns selected
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* File 2 Card */}
          <div className="bg-white rounded-xl border border-blue-100 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Secondary Dataset</h3>
                <p className="text-sm text-gray-500">
                  {file2 ? file2.name : 'Optional - for comparisons'}
                </p>
              </div>
            </div>

            {/* File Upload Section */}
            {!file2 ? (
              <div className="mb-4">
                <label className="block">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0];
                      if (selectedFile) {
                        handleFileUpload(selectedFile, 2);
                      }
                    }}
                    className="hidden"
                    disabled={isLoadingFiles}
                  />
                  <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center hover:border-blue-300 transition-colors cursor-pointer">
                    {isLoadingFiles ? (
                      <div className="text-blue-600">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <span className="text-sm">Processing...</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-blue-600 text-2xl mb-2">📄</div>
                        <div className="text-sm font-medium text-blue-700 mb-1">
                          Click to upload Excel or CSV
                        </div>
                        <div className="text-xs text-gray-500">
                          Optional comparison file
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>
            ) : (
              <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{file2Data.length}</strong> rows • <strong>{file2Headers.length}</strong> columns
                  </div>
                  <button
                    onClick={() => {
                      setFile2(null);
                      setFile2Data([]);
                      setFile2Headers([]);
                      setSelectedHeaders2([]);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            
            {/* Header Selection for File 2 */}
            {file2Headers.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3">Available Columns</div>
                <div className="flex flex-wrap gap-2">
                  {file2Headers.map((header) => (
                    <button
                      key={header}
                      type="button"
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                        selectedHeaders2.includes(header) 
                          ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' 
                          : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        setSelectedHeaders2((prev) =>
                          prev.includes(header)
                            ? prev.filter((h) => h !== header)
                            : [...prev, header]
                        );
                      }}
                    >
                      {header}
                    </button>
                  ))}
                </div>
                {selectedHeaders2.length > 0 && (
                  <div className="mt-3 text-sm text-blue-600 font-medium">
                    ✓ {selectedHeaders2.length} columns selected
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Instructions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-lg font-medium text-gray-900 mb-4">
            Analysis Instructions
          </label>
          <textarea
            value={analysisInstruction}
            onChange={(e) => setAnalysisInstruction(e.target.value)}
            placeholder="Describe your reconciliation workflow... (e.g., 'Compare transaction amounts between datasets and identify discrepancies')"
            className="w-full p-4 border border-gray-200 rounded-xl resize-none h-24 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
          />
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleProcessAndDeploy}
              disabled={hasInitialStep || !analysisInstruction.trim() || (!file1 && file1Data.length === 0)}
              className={`px-8 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                hasInitialStep || !analysisInstruction.trim() || (!file1 && file1Data.length === 0)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md'
              }`}
            >
              🚀 Start Analysis
            </button>
            
            {!file1 && file1Data.length === 0 && (
              <div className="text-sm text-gray-500">
                Upload a file first to get started
              </div>
            )}
            
            {hasInitialStep && (
              <button
                onClick={() => {
                  setSteps([]);
                  setHasInitialStep(false);
                  setViewingStepNumber(null);
                  setCurrentData([]);
                  setAnalysisInstruction('');
                  setSelectedHeaders1([]);
                  setSelectedHeaders2([]);
                  setShowSuccessModal(false);
                  setIsFinished(false);
                }}
                className="px-6 py-3 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-all duration-200"
              >
                🔄 Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visual Step Builder Results */}
      {steps.length > 0 ? (
        <VisualStepBuilder
          steps={steps}
          onExecuteStep={handleExecuteStep}
          onRevertToStep={handleRevertToStep}
          onAddStep={handleAddStep}
          onViewStep={handleViewStep}
          currentStepData={currentData}
          isExecuting={isExecuting}
          onFinishScript={handleFinishScript}
        />
      ) : (
        !hasInitialStep && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-900">📊 Script Testing Results</h4>
              <p className="text-sm text-gray-600 mt-1">Live processing results will appear here</p>
            </div>
            <div className="p-6 min-h-32">
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📋</div>
                <div className="text-lg font-medium mb-2">Ready for Processing</div>
                <div className="text-sm">Enter analysis instructions and click "🚀 Start Analysis"</div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Sample Data Preview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <span className="text-emerald-600 text-lg">📊</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {file1 ? `Data Preview: ${file1.name}` : 'Sample Transaction Data'}
            </h3>
            <p className="text-sm text-gray-500">
              {file1 ? 'Preview of your uploaded file' : 'Simulating uploaded files for demonstration'}
            </p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {Object.keys(getCurrentWorkingData()[0] || {}).map(col => (
                  <th key={col} className="px-4 py-3 text-left font-medium text-gray-700 bg-gray-50 first:rounded-l-lg last:rounded-r-lg">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getCurrentWorkingData().slice(0, 5).map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="px-4 py-3 text-gray-600">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {getCurrentWorkingData().length > 5 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing 5 of {getCurrentWorkingData().length} rows
          </div>
        )}
      </div>
    </div>
  );
}; 