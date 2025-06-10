import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

import { FileRow, ValidationResult, ParsedFileData } from '../types';

interface ExcelFileReaderProps {
  onFileLoad: (fileData: ParsedFileData) => void;
  onError: (error: string) => void;
  files: string[];
  selectedFile: string;
  label: string;
}

const ExcelFileReader: React.FC<ExcelFileReaderProps> = React.memo(({
  onFileLoad,
  onError,
  files,
  selectedFile,
  label
}) => {
  const [loading, setLoading] = useState(false);

  const loadFile = useCallback(async (fileName: string) => {
    if (!fileName) return;
    
    setLoading(true);
    try {
      
      // UNIVERSAL VALIDATION - validates ALL files regardless of type
      const { safeLoadFile } = await import('../utils/universalFileValidator');
      const validation = await safeLoadFile(`/sample-data/${fileName}`);
      
      if (!validation.isValid) {
        const errorMsg = validation.securityWarning 
          ? `🚨 SECURITY ALERT: ${validation.error}\n\n${validation.securityWarning}`
          : validation.error || 'File validation failed';
        throw new Error(errorMsg);
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
        
      } else {
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
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700"
      >
        <option value="">Select a file...</option>
        {files.map(file => {
          const fileType = file.toLowerCase().endsWith('.csv') ? '(CSV)' : '(Excel)';
          return (
            <option key={file} value={file}>
              {file} {fileType}
            </option>
          );
        })}
      </select>
      
      {loading && (
        <div className="text-xs text-emerald-600 mt-1 flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-emerald-600 border-t-transparent mr-1"></div>
          Loading real file data...
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for performance
  return (
    prevProps.files === nextProps.files &&
    prevProps.selectedFile === nextProps.selectedFile &&
    prevProps.label === nextProps.label &&
    prevProps.onFileLoad === nextProps.onFileLoad &&
    prevProps.onError === nextProps.onError
  );
});

ExcelFileReader.displayName = 'ExcelFileReader';

export default ExcelFileReader; 