import React, { useState, useCallback } from 'react';

// Module-level caching to prevent reloading XLSX every time
let xlsxCache: Promise<typeof import('xlsx')> | null = null;

interface LazyExcelReaderProps {
  onDataLoaded: (data: any[]) => void;
  onError: (error: string) => void;
}

export const useLazyExcelReader = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const getXLSX = useCallback(async () => {
    if (!xlsxCache) {
      console.log('🔄 Loading XLSX module for first time...');
      xlsxCache = import('xlsx');
    } else {
      console.log('⚡ Using cached XLSX module');
    }
    return xlsxCache;
  }, []);
  
  const readExcelFile = useCallback(async (file: File) => {
    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      const XLSX = await getXLSX();
      const processingStart = performance.now();
      
      const result = await processExcelData(XLSX, file);
      
      const totalTime = performance.now() - startTime;
      const processingTime = performance.now() - processingStart;
      
      console.log(`📊 Excel processing completed:
        - Total time: ${Math.round(totalTime)}ms
        - Processing time: ${Math.round(processingTime)}ms
        - Module load time: ${Math.round(totalTime - processingTime)}ms`);
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [getXLSX]);
  
  return { readExcelFile, isLoading };
};

// Utility function for clean separation and better error handling
const processExcelData = (XLSX: any, file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames.length) {
          throw new Error('No sheets found in Excel file');
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (!jsonData.length) {
          throw new Error('No data found in Excel sheet');
        }
        
        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Excel processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export default useLazyExcelReader; 