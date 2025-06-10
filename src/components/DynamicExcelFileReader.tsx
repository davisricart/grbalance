import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';

import { fetchAvailableFiles, categorizeFile } from '../utils/dynamicFileLoader';
import { FileRow, ValidationResult, ParsedFileData } from '../types';

interface DynamicExcelFileReaderProps {
  onFileLoad: (fileData: ParsedFileData) => void;
  onError: (error: string) => void;
  selectedFile: string;
  label: string;
  onFileListLoad?: (files: string[]) => void;
}

const DynamicExcelFileReader: React.FC<DynamicExcelFileReaderProps> = React.memo(({
  onFileLoad,
  onError,
  selectedFile,
  label,
  onFileListLoad
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);

  // Memoized function to load available files
  const loadAvailableFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const files = await fetchAvailableFiles();
      setAvailableFiles(files);
      
      // Notify parent component of the file list
      if (onFileListLoad) {
        onFileListLoad(files);
      }
    } catch (error: unknown) {
      onError('Failed to load available files: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoadingFiles(false);
    }
  }, [onError, onFileListLoad]);

  // Load available files on component mount
  useEffect(() => {
    loadAvailableFiles();
  }, [loadAvailableFiles]);

  const loadFile = useCallback(async (fileName: string) => {
    if (!fileName) return;
    
    setLoading(true);
    try {
      
      // BULLETPROOF VALIDATION - blocks ALL disguised files
      const { bulletproofValidateFile } = await import('../utils/bulletproofFileValidator');
      
      // Create a fake File object for validation since we're loading from URL
      const response = await fetch(`/sample-data/${fileName}`);
      const arrayBuffer = await response.arrayBuffer();
      const fakeFile = new File([arrayBuffer], fileName, {
        type: response.headers.get('content-type') || ''
      });
      
      const validation = await bulletproofValidateFile(fakeFile);
      
      if (!validation.isValid) {
        const errorMsg = validation.securityWarning 
          ? `🚨 SECURITY ALERT: ${validation.error}\n\n${validation.securityWarning}`
          : validation.error || 'File validation failed';
        onError(errorMsg);
        return;
      }
      
      
      let headers: string[] = [];
      let data: FileRow[] = [];
      
      if (fileName.toLowerCase().endsWith('.csv')) {
        // Handle validated CSV files
        const text = new TextDecoder().decode(validation.data as ArrayBuffer);
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          throw new Error('CSV file appears to be empty');
        }
        
        headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row: FileRow = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        
      } else if (fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls')) {
        // Handle validated Excel files
        const arrayBuffer = validation.data as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          throw new Error('Excel file appears to be empty');
        }
        
        headers = jsonData[0] as string[];
        const rawData = jsonData.slice(1);
        
        // Convert array format to object format
        data = rawData.map(row => {
          const rowObj: FileRow = {};
          headers.forEach((header, index) => {
            rowObj[header] = (row as (string | number)[])[index] || '';
          });
          return rowObj;
        });
      } else {
        // Handle validated text files (for preview only)
        const text = new TextDecoder().decode(validation.data as ArrayBuffer);
        headers = ['Content'];
        data = [{ Content: text.substring(0, 500) + (text.length > 500 ? '...' : '') }];
      }
      
      const fileInfo = {
        filename: fileName,
        headers,
        rows: data,
        summary: {
          totalRows: data.length,
          columns: headers.length,
          sampleData: data.slice(0, 3)
        }
      };
      
      
      onFileLoad(fileInfo);
      
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  }, [onFileLoad, onError]);

  // Memoized select change handler
  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    loadFile(e.target.value);
  }, [loadFile]);

  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        onChange={handleSelectChange}
        value={selectedFile}
        disabled={loadingFiles}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700 disabled:bg-gray-100"
      >
        <option value="">
          {loadingFiles ? 'Loading files...' : 'Select a file...'}
        </option>
        {availableFiles.map(file => {
          const fileInfo = categorizeFile(file);
          return (
            <option key={file} value={file}>
              {file} ({fileInfo.type.toUpperCase()})
            </option>
          );
        })}
      </select>
      
      {loadingFiles && (
        <div className="text-xs text-blue-600 mt-1 flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent mr-1"></div>
          Scanning for available files...
        </div>
      )}
      
      {loading && (
        <div className="text-xs text-emerald-600 mt-1 flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-emerald-600 border-t-transparent mr-1"></div>
          Loading file data...
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-1">
        {loadingFiles ? (
          'Detecting available files...'
        ) : (
          `Found ${availableFiles.length} files in sample-data folder`
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for performance
  return (
    prevProps.selectedFile === nextProps.selectedFile &&
    prevProps.label === nextProps.label &&
    prevProps.onFileLoad === nextProps.onFileLoad &&
    prevProps.onError === nextProps.onError &&
    prevProps.onFileListLoad === nextProps.onFileListLoad
  );
});

DynamicExcelFileReader.displayName = 'DynamicExcelFileReader';

export default DynamicExcelFileReader; 