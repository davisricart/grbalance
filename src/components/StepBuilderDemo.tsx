import React, { useState, useMemo, useCallback, memo } from 'react';
import { VisualStepBuilder } from './VisualStepBuilder';
import { VirtualTable } from './VirtualTable';
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
  const [debouncedInstruction, setDebouncedInstruction] = useState('');

  // Performance optimization constants
  const CHUNK_SIZE = 1000; // Process data in chunks for large files
  const MAX_PREVIEW_ROWS = 100; // Limit preview rows for performance
  const DEBOUNCE_DELAY = 300; // Debounce user input

  // Debounce effect for analysis instruction
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInstruction(analysisInstruction);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [analysisInstruction, DEBOUNCE_DELAY]);

  // Performance monitoring
  React.useEffect(() => {
    const logPerformance = () => {
      const memoryUsage = (performance as any).memory;
      if (memoryUsage) {
        console.log('Memory Usage:', {
          used: Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(memoryUsage.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(memoryUsage.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        });
      }
    };

    const interval = setInterval(logPerformance, 30000); // Log every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Memory cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Clear large data sets when component unmounts
      setFile1Data([]);
      setFile2Data([]);
      setCurrentData([]);
      setSteps([]);
    };
  }, []);

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

  // File processing functions - optimized for large files
  const processExcelFile = useCallback(async (file: File): Promise<{ data: any[], headers: string[] }> => {
    return new Promise((resolve, reject) => {
      // Check file size and warn for very large files
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxFileSize) {
        if (!confirm(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB. Large files may take time to process. Continue?`)) {
          reject(new Error('File processing cancelled'));
          return;
        }
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Use XLSX streaming for large files
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
          
          if (jsonData.length === 0) {
            reject(new Error('File is empty'));
            return;
          }
          
          const headers = jsonData[0] as string[];
          
          // Process data in chunks to avoid blocking UI
          const processChunk = (startIdx: number): Promise<any[]> => {
            return new Promise((resolveChunk) => {
              const endIdx = Math.min(startIdx + CHUNK_SIZE, jsonData.length);
              const chunk = jsonData.slice(startIdx, endIdx);
              
              const processedChunk = chunk.map((row: any) => {
                const obj: any = {};
                headers.forEach((header, index) => {
                  obj[header] = row[index] || '';
                });
                return obj;
              }).filter(row => Object.values(row).some(val => val !== ''));
              
              // Use setTimeout to yield control back to the browser
              setTimeout(() => resolveChunk(processedChunk), 0);
            });
          };

          // Process all chunks
          const processAllChunks = async () => {
            const allData: any[] = [];
            for (let i = 1; i < jsonData.length; i += CHUNK_SIZE) {
              const chunk = await processChunk(i);
              allData.push(...chunk);
              
              // Update progress for large files
              if (jsonData.length > CHUNK_SIZE * 5) {
                const progress = Math.round((i / jsonData.length) * 100);
                console.log(`Processing: ${progress}%`);
              }
            }
            return allData;
          };

          processAllChunks()
            .then(processedData => resolve({ data: processedData, headers }))
            .catch(reject);
            
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }, [CHUNK_SIZE]);

  const handleFileUpload = useCallback(async (file: File, fileNumber: 1 | 2) => {
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
      
      // Memory optimization: limit data size in state
      const limitedData = fileData.length > MAX_PREVIEW_ROWS * 10 
        ? fileData.slice(0, MAX_PREVIEW_ROWS * 10) 
        : fileData;
      
      if (fileNumber === 1) {
        // Clear previous data to free memory
        setFile1Data([]);
        setSelectedHeaders1([]);
        
        // Set new data
        setFile1(file);
        setFile1Data(limitedData);
        setFile1Headers(headers);
      } else {
        // Clear previous data to free memory
        setFile2Data([]);
        setSelectedHeaders2([]);
        
        // Set new data
        setFile2(file);
        setFile2Data(limitedData);
        setFile2Headers(headers);
      }
      
      // Log performance metrics
      console.log(`File processed: ${fileData.length} rows, ${headers.length} columns, ${(file.size / 1024).toFixed(1)}KB`);
      
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [processExcelFile, MAX_PREVIEW_ROWS]);

  // Get current working data (combine both files or use primary) - memoized for performance
  const getCurrentWorkingData = useMemo(() => {
    if (file1Data.length > 0) {
      return file1Data;
    }
    return sampleData; // Fallback to sample data for demo
  }, [file1Data, sampleData]);

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

  const handleExecuteStep = useCallback(async (stepNumber: number) => {
    setIsExecuting(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const stepIndex = stepNumber - 1;
    let workingData: any[] = [...getCurrentWorkingData];

    // Process large datasets in chunks to avoid blocking UI
    const processDataInChunks = async (data: any[], transformFn: (item: any) => any): Promise<any[]> => {
      const result: any[] = [];
      
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        const processedChunk = chunk.map(transformFn);
        result.push(...processedChunk);
        
        // Yield control to browser for large datasets
        if (data.length > CHUNK_SIZE * 2) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      return result;
    };

    // Apply transformations based on step instructions
    for (let i = 0; i <= stepIndex; i++) {
      const step = steps[i];
      if (!step) continue;

      const instruction = step.instruction.toLowerCase();

      if (instruction.includes('filter') && instruction.includes('completed')) {
        workingData = workingData.filter(row => 
          row.Status === 'Completed' || row.status === 'completed' || 
          row.STATUS === 'COMPLETED' || row.State === 'Completed'
        );
      } else if (instruction.includes('calculate') && instruction.includes('fee')) {
        workingData = await processDataInChunks(workingData, (row) => {
          const amount = parseFloat(row.Amount || row.amount || row.AMOUNT || '0');
          return {
            ...row,
            Fee: (amount * 0.029).toFixed(2),
            NetAmount: (amount * 0.971).toFixed(2)
          };
        });
      } else if (instruction.includes('group') && instruction.includes('type')) {
        const grouped = workingData.reduce((acc: any, row) => {
          const key = row.Type || row.type || row.TYPE || row.PaymentMethod || row.Category || 'Unknown';
          if (!acc[key]) {
            acc[key] = { Type: key, Count: 0, TotalAmount: 0 };
          }
          acc[key].Count++;
          const amount = parseFloat(row.Amount || row.amount || row.AMOUNT || '0');
          acc[key].TotalAmount += amount;
          return acc;
        }, {});
        workingData = Object.values(grouped);
      } else if (instruction.includes('sort') && instruction.includes('amount')) {
        workingData = workingData.sort((a, b) => {
          const amountA = parseFloat(a.Amount || a.amount || a.AMOUNT || '0');
          const amountB = parseFloat(b.Amount || b.amount || b.AMOUNT || '0');
          return amountB - amountA;
        });
      } else if (instruction.includes('total') || instruction.includes('summary')) {
        const totalAmount = workingData.reduce((sum, row) => {
          const amount = parseFloat(row.Amount || row.amount || row.AMOUNT || '0');
          return sum + amount;
        }, 0);
        const completedCount = workingData.filter(row => 
          row.Status === 'Completed' || row.status === 'completed' || 
          row.STATUS === 'COMPLETED' || row.State === 'Completed'
        ).length;
        
        const summary = {
          TotalTransactions: workingData.length,
          TotalAmount: totalAmount.toFixed(2),
          AverageAmount: (totalAmount / workingData.length).toFixed(2),
          CompletedCount: completedCount
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
          dataPreview: workingData.slice(0, MAX_PREVIEW_ROWS), // Limit preview for performance
          recordCount: workingData.length,
          columnsAdded: Object.keys(workingData[0] || {}).filter(col => 
            !Object.keys(getCurrentWorkingData[0] || {}).includes(col)
          ),
          executionTime: Math.floor(Math.random() * 500) + 200
        };
      }
      return step;
    }));

    setCurrentData(workingData.slice(0, MAX_PREVIEW_ROWS)); // Limit current data for performance
    setIsExecuting(false);
    
    // Show continue option after first execution
    if (stepNumber === 1) {
      setViewingStepNumber(stepNumber);
    }
  }, [steps, getCurrentWorkingData, CHUNK_SIZE, MAX_PREVIEW_ROWS]);

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

        {/* Performance Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">⚡</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Performance Optimized</h3>
                <p className="text-sm text-gray-600">
                  Chunked processing • Virtual scrolling • Memory efficient • Large file support
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-600 font-medium">
                Max file size: 50MB
              </div>
              <div className="text-xs text-gray-500">
                {file1Data.length + file2Data.length} rows loaded
              </div>
            </div>
          </div>
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

      {/* Data Preview - Performance Optimized */}
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
        
        <VirtualTable 
          data={getCurrentWorkingData} 
          maxRows={MAX_PREVIEW_ROWS}
          className="performance-optimized-table"
        />
      </div>
    </div>
  );
};

// Export memoized component for performance
export default memo(StepBuilderDemo); 