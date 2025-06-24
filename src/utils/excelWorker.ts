// Utility for processing Excel files in Web Workers to prevent UI blocking

interface ExcelWorkerResult {
  result: any[];
  metadata: {
    sheetCount: number;
    rowCount: number;
    columnCount: number;
  };
}

interface ExcelWorkerProgress {
  message: string;
}

export const processExcelInWorker = (
  file: File, 
  options: any = {},
  onProgress?: (progress: ExcelWorkerProgress) => void
): Promise<ExcelWorkerResult> => {
  return new Promise((resolve, reject) => {
    // Check file size - use worker for files > 1MB
    const shouldUseWorker = file.size > 1024 * 1024;
    
    if (!shouldUseWorker) {
      // For small files, process directly to avoid worker overhead
      return processExcelDirectly(file, options).then(resolve).catch(reject);
    }
    
    // Create worker with module support
    const worker = new Worker('/workers/excel-processor.js', { type: 'module' });
    
    // Set timeout for large files (30 seconds)
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Excel processing timeout - file may be too large'));
    }, 30000);
    
    worker.postMessage({ file, options });
    
    worker.onmessage = (e) => {
      const { type, result, metadata, message, error } = e.data;
      
      switch (type) {
        case 'progress':
          onProgress?.({ message });
          break;
          
        case 'success':
          clearTimeout(timeout);
          worker.terminate();
          resolve({ result, metadata });
          break;
          
        case 'error':
          clearTimeout(timeout);
          worker.terminate();
          reject(new Error(error));
          break;
      }
    };
    
    worker.onerror = (error) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error(`Worker error: ${error.message}`));
    };
  });
};

// Fallback for small files or when workers aren't supported
const processExcelDirectly = async (file: File, options: any = {}): Promise<ExcelWorkerResult> => {
  // Dynamic import for fallback processing
  const XLSX = await import('xlsx');
  
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
    type: 'array',
    cellDates: true,
    ...options 
  });
  
  if (!workbook.SheetNames.length) {
    throw new Error('No sheets found in Excel file');
  }
  
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('No sheet names found in workbook');
  }
  
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    throw new Error('Could not read worksheet data');
  }
  
  const result = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (!result.length) {
    throw new Error('No data found in Excel sheet');
  }
  
  return {
    result,
    metadata: {
      sheetCount: workbook.SheetNames.length,
      rowCount: result.length,
      columnCount: Array.isArray(result[0]) ? result[0].length : 0
    }
  };
}; 