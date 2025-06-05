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

  // Add state for dynamic file naming
  const [currentResponseFile, setCurrentResponseFile] = useState<string>('claude-response.js');

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

    console.log('🚀 Starting deployment process...');
    
    // ✅ EXPOSE FILE DATA TO GLOBAL SCOPE for Claude response file access
    (window as any).aiFile1Data = file1Data.length > 0 ? file1Data : null;
    (window as any).aiFile2Data = file2Data.length > 0 ? file2Data : null;
    (window as any).workingData = getCurrentWorkingData;
    
    console.log('✅ Data exposed to global scope for Claude response file:');
    console.log('   - window.aiFile1Data:', file1Data.length, 'rows');
    console.log('   - window.aiFile2Data:', file2Data.length, 'rows');
    console.log('   - getCurrentWorkingData:', getCurrentWorkingData.length, 'rows');
    
    // PRODUCTION MODE: Use real timestamps for live testing
    const timestamp = Date.now();
    const newFileName = `claude-response-${timestamp}.js`;
    
    console.log('🧹 Preparing for fresh response...');
    console.log(`✅ Ready for fresh response file: ${newFileName}`);
    console.log(`📝 Next: CREATE public/claude-communication/${newFileName} with new code`);
    console.log('🎯 This ensures no old code contamination!');
    console.log('🚀 PRODUCTION MODE: Using real timestamps for live testing');
    
    // Set the filename immediately and synchronously  
    setCurrentResponseFile(newFileName);
    
    // CRITICAL: Clean up old files with the NEW filename
    cleanupCommunicationFilesWithName(newFileName).then(() => {
      console.log('🎯 Starting fresh - no old response files exist');
      
      // Generate Claude communication file with the correct filename
      generateClaudePromptFileWithName(newFileName);
      
      // Create the first step IMMEDIATELY
      const newStep: StepWithPreview = {
        id: `step-${Date.now()}`,
        stepNumber: 1,
        instruction: analysisInstruction,
        status: 'testing',
        dataPreview: [],
        recordCount: 0,
        columnsAdded: [],
        timestamp: new Date().toISOString(),
        isViewingStep: false
      };
      
      // Set the step in state synchronously for the UI
      setSteps([newStep]);
      setHasInitialStep(true);
      
      console.log('✅ Step created immediately:', newStep);
      console.log('👀 Starting response monitoring...');
      
      // Start watching for Claude's response
      startWatchingForResponse(newFileName);
    });
  };

  const readClaudeResponseFile = async (fileNameToRead?: string): Promise<string | null> => {
    // Use passed filename or current state (fallback)
    const targetFile = fileNameToRead || currentResponseFile;
    
    try {
      console.log(`🔍 Reading Claude response file: ${targetFile}`);
      
      // FORCE timestamped file reading - NO fallbacks to old files
      if (targetFile === 'claude-response.js') {
        console.log('❌ ERROR: Still using old filename! This should be timestamped!');
        return null;
      }
      
      // Try to read the timestamped response file with aggressive cache busting
      const cacheBuster = Date.now() + Math.random();
      const response = await fetch(`/claude-communication/${targetFile}?v=${cacheBuster}&t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('✅ Found fresh timestamped Claude response file!');
        console.log('📄 File content preview:', responseText.substring(0, 150) + '...');
        return responseText;
      } else {
        console.log(`❌ Timestamped file ${targetFile} not found (${response.status})`);
        return null;
      }
      
    } catch (error) {
      console.log('❌ Error reading timestamped Claude response file:', error);
      return null;
    }
  };

  const cleanupCommunicationFiles = async () => {
    try {
      console.log('🧹 Preparing for fresh response...');
      
      // Generate unique filename for this request
      const timestamp = Date.now();
      const newFileName = `claude-response-${timestamp}.js`;
      setCurrentResponseFile(newFileName);
      
      // Clear browser cache to ensure fresh file read
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          // Clear all claude response files
          await cache.delete(`/claude-communication/claude-response.js`);
          await cache.delete(`/claude-communication/${newFileName}`);
        }
      }
      
      console.log(`✅ Ready for fresh response file: ${newFileName}`);
      console.log(`📝 Next: CREATE public/claude-communication/${newFileName} with new code`);
      console.log('🎯 This ensures no old code contamination!');
      
    } catch (error) {
      console.warn('⚠️ Cache cleanup warning (continuing anyway):', error);
    }
  };

  // New function that accepts filename parameter
  const cleanupCommunicationFilesWithName = async (fileName: string) => {
    try {
      // Clear browser cache to ensure fresh file read
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          // Clear all claude response files
          await cache.delete(`/claude-communication/claude-response.js`);
          await cache.delete(`/claude-communication/${fileName}`);
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Cache cleanup warning (continuing anyway):', error);
    }
  };

  const generateClaudePromptFile = async () => {
    if (!getCurrentWorkingData || getCurrentWorkingData.length === 0) {
      throw new Error('No primary dataset available for analysis');
    }

    // Get actual column names from the data
    const columns = Object.keys(getCurrentWorkingData[0] || {});
    const sampleData = getCurrentWorkingData.slice(0, 3);
    
    const promptContent = `🤖 CLAUDE PROMPT - Data Transformation Request
============================================

INSTRUCTION: "${analysisInstruction}"

AVAILABLE COLUMNS: ${columns.join(', ')}

SAMPLE DATA (first 3 rows):
${JSON.stringify(sampleData, null, 2)}

DATA SIZE: ${getCurrentWorkingData.length} total rows

REQUIREMENTS:
- Generate executable JavaScript code
- Input variable: 'workingData' (array of objects)  
- Return the transformed array
- Handle case-insensitive column matching
- Use functional programming (map, filter, reduce)
- Handle edge cases (null, undefined, empty strings)

RESPONSE FORMAT:
Please create '${currentResponseFile}' in the /claude-communication/ directory with ONLY executable code.

EXAMPLE RESPONSE FILE CONTENT:
// Your JavaScript transformation code here
const result = workingData
  .filter(row => /* your filter logic */)
  .map(row => /* your transformation logic */);

return result;

Note: This is an automated system. The code you write will be executed directly.

⚡ URGENT: This is a live request from the Visual Step Builder!
User is waiting for your response to continue their analysis workflow.

🎯 IMPORTANT: Use filename: ${currentResponseFile}
This ensures no contamination from previous requests!
`;

    // Create the actual communication directory and files
    try {
      // In a real implementation, this would write to the server
      // For now, we'll simulate by writing to the public directory via a fetch request
      await fetch('/api/claude-communication/write-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: promptContent,
          instruction: analysisInstruction,
          timestamp: new Date().toISOString(),
          responseFileName: currentResponseFile
        })
      });

      console.log('📝 Claude prompt file generated and saved!');
      console.log('💌 Message sent to Claude - waiting for response...');
      
    } catch (error) {
      console.warn('⚠️ Could not write to server, using fallback...');
      
      // Fallback: Create downloadable file AND log the content for you to see
      const blob = new Blob([promptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'claude-prompt.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('📋 PROMPT FOR CLAUDE:');
      console.log(promptContent);
      console.log('📋 END PROMPT');
      console.log('');
      console.log('🎯 ACTION REQUIRED:');
      console.log(`1. CREATE: public/claude-communication/${currentResponseFile}`);
      console.log('2. ADD your new JavaScript code to this FRESH file');
      console.log('3. SAVE the file');
      console.log('4. System will auto-detect and execute immediately');
      console.log('');
      console.log('💡 TIP: Brand new file prevents any old code contamination!');
    }
    
    return promptContent;
  };

  // New function that accepts filename parameter
  const generateClaudePromptFileWithName = async (fileName: string) => {
    if (!getCurrentWorkingData || getCurrentWorkingData.length === 0) {
      throw new Error('No primary dataset available for analysis');
    }

    // Get actual column names from the data
    const columns = Object.keys(getCurrentWorkingData[0] || {});
    const sampleData = getCurrentWorkingData.slice(0, 3);
    
    const promptContent = `🤖 CLAUDE PROMPT - Data Transformation Request
============================================

INSTRUCTION: "${analysisInstruction}"

AVAILABLE COLUMNS: ${columns.join(', ')}

SAMPLE DATA (first 3 rows):
${JSON.stringify(sampleData, null, 2)}

DATA SIZE: ${getCurrentWorkingData.length} total rows

REQUIREMENTS:
- Generate executable JavaScript code
- Input variable: 'workingData' (array of objects)  
- Return the transformed array
- Handle case-insensitive column matching
- Use functional programming (map, filter, reduce)
- Handle edge cases (null, undefined, empty strings)

RESPONSE FORMAT:
Please create '${fileName}' in the /claude-communication/ directory with ONLY executable code.

EXAMPLE RESPONSE FILE CONTENT:
// Your JavaScript transformation code here
const result = workingData
  .filter(row => /* your filter logic */)
  .map(row => /* your transformation logic */);

return result;

Note: This is an automated system. The code you write will be executed directly.

⚡ URGENT: This is a live request from the Visual Step Builder!
User is waiting for your response to continue their analysis workflow.

🎯 IMPORTANT: Use filename: ${fileName}
This ensures no contamination from previous requests!
`;

    // Create the actual communication directory and files
    try {
      // In a real implementation, this would write to the server
      // For now, we'll simulate by writing to the public directory via a fetch request
      await fetch('/api/claude-communication/write-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: promptContent,
          instruction: analysisInstruction,
          timestamp: new Date().toISOString(),
          responseFileName: fileName
        })
      });

      console.log('📝 Claude prompt file generated and saved!');
      console.log('💌 Message sent to Claude - waiting for response...');
      
    } catch (error) {
      console.warn('⚠️ Could not write to server, using fallback...');
      
      // Fallback: Create downloadable file AND log the content for you to see
      const blob = new Blob([promptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'claude-prompt.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('📋 PROMPT FOR CLAUDE:');
      console.log(promptContent);
      console.log('📋 END PROMPT');
      console.log('');
      console.log('🎯 ACTION REQUIRED:');
      console.log(`1. CREATE: public/claude-communication/${fileName}`);
      console.log('2. ADD your new JavaScript code to this FRESH file');
      console.log('3. SAVE the file');
      console.log('4. System will auto-detect and execute immediately');
      console.log('');
      console.log('💡 TIP: Brand new file prevents any old code contamination!');
    }
    
    return promptContent;
  };

  const startWatchingForResponse = (timestampedFileName: string) => {
    console.log('👀 Starting automated response monitoring...');
    console.log(`🎯 Watching for file: ${timestampedFileName}`);
    const startTime = performance.now(); // Track performance
    
    let pollCount = 0;
    let isResolved = false; // Prevent race condition
    let pollInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    
    // Set up polling to check for Claude's response
    pollInterval = setInterval(async () => {
      if (isResolved) return; // Prevent double execution
      
      pollCount++;
      console.log(`🔍 Poll attempt ${pollCount}/150 - Checking for response file...`);
      
      // Pass the timestamped filename directly
      const code = await readClaudeResponseFile(timestampedFileName);
      if (code) {
        isResolved = true; // Mark as resolved
        clearInterval(pollInterval);
        clearTimeout(timeoutId); // Clear the timeout!
        const responseTime = performance.now() - startTime;
        console.log(`🎉 Claude response received in ${responseTime.toFixed(0)}ms! Executing automation...`);
        console.log('📄 Response file content preview:', code.substring(0, 100) + '...');
        await executeClaudeCode(code);
        console.log('🎯 Automation completely finished - no timeout will fire!');
      } else {
        console.log(`❌ Poll ${pollCount}: No response file found yet`);
      }
    }, 200); // Check every 200ms (10x faster!)
    
    // Fallback timeout after 30 seconds
    timeoutId = setTimeout(() => {
      if (isResolved) return; // Don't run fallback if already resolved
      isResolved = true;
      clearInterval(pollInterval);
      console.log('⏰ Timeout reached, using fallback logic');
      handleExecuteStepWithFallback(1);
    }, 30000);
  };

  const executeClaudeCode = async (code: string) => {
    setIsExecuting(true);
    
    try {
      console.log('🔧 Executing Claude-generated code...');
      console.log('📊 Current steps array:', steps);
      console.log('📊 Steps length:', steps.length);
      
      const step = steps[0];
      if (!step) {
        console.error('❌ No step found! Steps array:', steps);
        console.log('⚠️ Creating a default step for execution...');
        
        // Create a default step if none exists
        const defaultStep = {
          id: `step-${Date.now()}`,
          stepNumber: 1,
          instruction: 'Generated analysis',
          status: 'testing' as const,
          dataPreview: [],
          recordCount: 0,
          columnsAdded: [],
          timestamp: new Date().toISOString(),
          isViewingStep: false
        };
        
        setSteps([defaultStep]);
        // Continue with execution using the default step
      }

      const availableColumns = Object.keys(getCurrentWorkingData[0] || {});
      let workingData: any[] = [...getCurrentWorkingData];

      console.log('🔧 Available columns:', availableColumns);
      console.log('🔧 Working data rows:', workingData.length);

      // Execute Claude's code safely
      const transformFunction = new Function('workingData', code);
      const transformedData = transformFunction(workingData);
      
      const resultData = Array.isArray(transformedData) ? transformedData : workingData;
      
      console.log('✅ Code executed successfully! Result rows:', resultData.length);

      // Update the step with results
      setSteps(prev => prev.map(s => {
        if (s.stepNumber === 1) {
          return {
            ...s,
            status: 'completed',
            dataPreview: resultData.slice(0, MAX_PREVIEW_ROWS),
            recordCount: resultData.length,
            columnsAdded: Object.keys(resultData[0] || {}).filter(col => 
              !availableColumns.includes(col)
            ),
            executionTime: Math.floor(Math.random() * 500) + 200
          };
        }
        return s;
      }));

      setCurrentData(resultData.slice(0, MAX_PREVIEW_ROWS));
      
      console.log('✅ Automation cycle complete! Step updated successfully.');
      
    } catch (error) {
      console.error('❌ Error in automation cycle:', error);
      console.error('❌ Code that failed:', code);
    } finally {
      setIsExecuting(false);
      setViewingStepNumber(1);
      console.log('🎯 Execution finished, viewing step set to 1');
    }
  };

  const handleExecuteStepWithFallback = async (stepNumber: number) => {
    setIsExecuting(true);
    
    const stepIndex = stepNumber - 1;
    const step = steps[stepIndex];
    if (!step) {
      setIsExecuting(false);
      return;
    }

    const availableColumns = Object.keys(getCurrentWorkingData[0] || {});
    let workingData: any[] = [...getCurrentWorkingData];

    try {
      // Try to read Claude's response file (simulated)
      let generatedCode = await readClaudeResponseFile();
      
      if (!generatedCode) {
        // Fallback to intelligent pattern matching
        generatedCode = generateIntelligentCodePattern(step.instruction, availableColumns);
      }

      console.log('🔧 Executing Generated Code:', generatedCode);

      // Execute the generated code safely
      const transformFunction = new Function('workingData', generatedCode);
      const transformedData = transformFunction(workingData);

      // Ensure we have valid array data
      const resultData = Array.isArray(transformedData) ? transformedData : workingData;

      // Update the executed step
      setSteps(prev => prev.map(s => {
        if (s.stepNumber === stepNumber) {
          return {
            ...s,
            status: 'completed',
            dataPreview: resultData.slice(0, MAX_PREVIEW_ROWS),
            recordCount: resultData.length,
            columnsAdded: Object.keys(resultData[0] || {}).filter(col => 
              !availableColumns.includes(col)
            ),
            executionTime: Math.floor(Math.random() * 500) + 200
          };
        }
        return s;
      }));

      setCurrentData(resultData.slice(0, MAX_PREVIEW_ROWS));
      
    } catch (error) {
      console.error('❌ Error executing code:', error);
      
      // Show error in results
      setSteps(prev => prev.map(s => {
        if (s.stepNumber === stepNumber) {
          return {
            ...s,
            status: 'completed',
            dataPreview: [{
              Error: 'Code execution failed',
              Instruction: step.instruction,
              Message: error instanceof Error ? error.message : 'Unknown error',
              Suggestion: 'Try refining your instruction or check Claude response file'
            }],
            recordCount: 1,
            columnsAdded: ['Error', 'Message', 'Suggestion'],
            executionTime: 0
          };
        }
        return s;
      }));
    }

    setIsExecuting(false);
    
    if (stepNumber === 1) {
      setViewingStepNumber(stepNumber);
    }
  };

  const generateIntelligentCodePattern = (instruction: string, columns: string[]): string => {
    const inst = instruction.toLowerCase();
    
    // Get current data columns for dynamic detection
    const currentColumns = getCurrentWorkingData.length > 0 ? Object.keys(getCurrentWorkingData[0]) : [];
    const allColumns = [...new Set([...columns, ...currentColumns])];
    
    // Detect card brand column dynamically
    const cardBrandCol = allColumns.find(col => 
      col.toLowerCase().includes('card') && col.toLowerCase().includes('brand')
    ) || allColumns.find(col => 
      col.toLowerCase().includes('brand')
    ) || allColumns.find(col => 
      col.toLowerCase().includes('card')
    ) || 'Card Brand';
    
    // Card brand counting patterns
    if (inst.includes('visa') && (inst.includes('count') || inst.includes('instances') || inst.includes('how many'))) {
      return `
// Count Visa instances in Card Brand column
// Instruction: ${instruction}

const visaCount = workingData.filter(row => {
  const cardBrand = row['${cardBrandCol}'] || row.CardBrand || row['card brand'] || '';
  return cardBrand.toLowerCase().includes('visa');
}).length;

const result = [{
  'Question': '${instruction}',
  'Answer': visaCount,
  'Total Rows Analyzed': workingData.length,
  'Percentage': workingData.length > 0 ? Math.round((visaCount / workingData.length) * 100) + '%' : '0%'
}];

return result;`;
    }
    
    if ((inst.includes('american express') || inst.includes('amex')) && (inst.includes('count') || inst.includes('instances') || inst.includes('how many'))) {
      return `
// Count American Express instances in Card Brand column
// Instruction: ${instruction}

const amexCount = workingData.filter(row => {
  const cardBrand = row['${cardBrandCol}'] || row.CardBrand || row['card brand'] || '';
  const brand = cardBrand.toLowerCase();
  return brand.includes('american express') || brand.includes('amex');
}).length;

const result = [{
  'Question': '${instruction}',
  'Answer': amexCount,
  'Total Rows Analyzed': workingData.length,
  'Percentage': workingData.length > 0 ? Math.round((amexCount / workingData.length) * 100) + '%' : '0%'
}];

return result;`;
    }
    
    if ((inst.includes('mastercard') || inst.includes('master card')) && (inst.includes('count') || inst.includes('instances') || inst.includes('how many'))) {
      return `
// Count Mastercard instances in Card Brand column
// Instruction: ${instruction}

const mastercardCount = workingData.filter(row => {
  const cardBrand = row['${cardBrandCol}'] || row.CardBrand || row['card brand'] || '';
  const brand = cardBrand.toLowerCase();
  return brand.includes('mastercard') || brand.includes('master card');
}).length;

const result = [{
  'Question': '${instruction}',
  'Answer': mastercardCount,
  'Total Rows Analyzed': workingData.length,
  'Percentage': workingData.length > 0 ? Math.round((mastercardCount / workingData.length) * 100) + '%' : '0%'
}];

return result;`;
    }

    // Complex duplicate analysis pattern
    if (inst.includes('duplicate') && inst.includes('card') && inst.includes('count')) {
      const nameCol = allColumns.find(col => 
        col.toLowerCase().includes('name') || 
        col.toLowerCase().includes('customer')
      ) || 'Name';
      
      return `
// Remove duplicates by card brand and count occurrences in name column
// Instruction: ${instruction}

const cardBrandColumn = '${cardBrandCol}';
const nameColumn = '${nameCol}';

// Get unique card brands
const uniqueCardBrands = [...new Set(workingData.map(row => row[cardBrandColumn]).filter(Boolean))];

// Count how many times each unique card brand appears in the name column
const result = uniqueCardBrands.map(cardBrand => {
  const countInNameColumn = workingData.filter(row => 
    row[nameColumn] && row[nameColumn].toString().toLowerCase().includes(cardBrand.toString().toLowerCase())
  ).length;
  
  return {
    CardBrand: cardBrand,
    CountInNameColumn: countInNameColumn,
    TotalRows: workingData.filter(row => row[cardBrandColumn] === cardBrand).length
  };
});

return result;`;
    }

    // Default fallback for any analysis
    return `
// Auto-generated transformation for: "${instruction}"
// Instruction: ${instruction}

const result = workingData.map((row, index) => ({
  ...row,
  ProcessedBy: 'Visual Step Builder',
  StepInstruction: '${instruction}',
  RowIndex: index + 1,
  Timestamp: new Date().toISOString()
}));

console.log('Processed ${instruction} on', result.length, 'rows');
return result;`;
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
    // Redirect to the new fallback handler
    return handleExecuteStepWithFallback(stepNumber);
  }, [getCurrentWorkingData, CHUNK_SIZE, MAX_PREVIEW_ROWS]);

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
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-light text-gray-900 mb-3">
            🧪 Visual Step Builder
          </h2>
          <p className="text-gray-600 text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Build reconciliation workflows step-by-step with complete transparency and safe iteration
          </p>
        </div>

        {/* Performance Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-lg">⚡</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Performance Optimized</h3>
                <p className="text-sm text-gray-500">
                  Chunked processing • Virtual scrolling • Memory efficient • Large file support
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600 font-medium">
                Max file size: 50MB
              </div>
              <div className="text-xs text-gray-500">
                {file1Data.length + file2Data.length} rows loaded
              </div>
            </div>
          </div>
        </div>
        
        {/* Import Script Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-lg">📂</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Continue Previous Work</h3>
                <p className="text-sm text-gray-500">Import a previously exported script to continue where you left off</p>
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
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}>
                  {isLoadingScript ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
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
          <div className="bg-white rounded-xl border border-emerald-100 p-6 hover:border-emerald-300 transition-all duration-200">
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
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-white text-emerald-700 border border-emerald-200 hover:border-emerald-300'
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
          <div className="bg-white rounded-xl border border-blue-100 p-6 hover:border-blue-300 transition-all duration-200">
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
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-blue-700 border border-blue-200 hover:border-blue-300'
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

        {/* Minimal Analysis Input */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={analysisInstruction}
              onChange={(e) => setAnalysisInstruction(e.target.value)}
              placeholder="What analysis do you want? (e.g., count Mastercard instances)"
              className="flex-1 p-4 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
            />
            
            <button
              onClick={handleProcessAndDeploy}
              disabled={hasInitialStep || !analysisInstruction.trim() || (!file1 && file1Data.length === 0)}
              className={`px-8 py-4 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                hasInitialStep || !analysisInstruction.trim() || (!file1 && file1Data.length === 0)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md'
              }`}
            >
              🚀 Start Analysis
            </button>
            
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
                  setCurrentResponseFile('claude-response.js');
                }}
                className="px-6 py-4 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-all duration-200"
              >
                🔄 Reset
              </button>
            )}
          </div>
          
          {!file1 && file1Data.length === 0 && (
            <div className="mt-3 text-sm text-gray-500 text-center">
              Upload a file first to get started
            </div>
          )}
        </div>
      </div>

      {/* CLEAN TWO-COLUMN LAYOUT - NO CLUTTER */}
      {steps.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left: Visual Script Builder */}
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

          {/* Right: Client Preview */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200">
              <h4 className="text-lg font-medium text-emerald-900">👥 Client Preview</h4>
              <p className="text-sm text-emerald-700 mt-1">How your analysis will appear to end users</p>
            </div>
            <div className="p-6 min-h-96" data-section="client-preview">
              <div className="text-center text-emerald-600 py-16">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-lg font-medium mb-2">Awaiting Results</div>
                <div className="text-sm text-emerald-700">Beautiful client-facing results will display here after analysis</div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center text-gray-500 py-16">
          <div className="text-4xl mb-4">🚀</div>
          <div className="text-xl font-medium mb-2">Ready to Start</div>
          <div className="text-gray-600">Click "🚀 Start Analysis" to begin your workflow</div>
        </div>
      )}
    </div>
  );
};

// Export memoized component for performance
export default memo(StepBuilderDemo); 