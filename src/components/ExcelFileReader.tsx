import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface ExcelFileReaderProps {
  onFileLoad: (fileData: any) => void;
  onError: (error: string) => void;
  files: string[];
  selectedFile: string;
  label: string;
}

export const ExcelFileReader: React.FC<ExcelFileReaderProps> = ({
  onFileLoad,
  onError,
  files,
  selectedFile,
  label
}) => {
  const [loading, setLoading] = useState(false);

  const loadFile = async (fileName: string) => {
    if (!fileName) return;
    
    setLoading(true);
    try {
      console.log(`📁 Loading file: ${fileName}`);
      
      // Fetch the file from public folder
      const response = await fetch(`/sample-data/${fileName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileName}`);
      }
      
      let headers: string[] = [];
      let data: any[] = [];
      
      if (fileName.toLowerCase().endsWith('.csv')) {
        // Handle CSV files
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          throw new Error('CSV file appears to be empty');
        }
        
        headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        
      } else {
        // Handle Excel files (.xlsx)
        const arrayBuffer = await response.arrayBuffer();
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
          const rowObj: any = {};
          headers.forEach((header, index) => {
            rowObj[header] = (row as any[])[index] || '';
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
      
      console.log(`✅ Successfully loaded ${fileName}:`, {
        type: fileName.toLowerCase().endsWith('.csv') ? 'CSV' : 'Excel',
        rows: data.length,
        columns: headers.length,
        headers: headers.join(', ')
      });
      
      onFileLoad(fileInfo);
      
    } catch (error: any) {
      console.error(`❌ Error loading ${fileName}:`, error);
      onError(error.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        onChange={(e) => loadFile(e.target.value)}
        value={selectedFile}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700"
      >
        <option value="">Select a file...</option>
        {files.map(file => (
          <option key={file} value={file}>
            {file} {file.toLowerCase().endsWith('.csv') ? '(CSV)' : '(Excel)'}
          </option>
        ))}
      </select>
      
      {loading && (
        <div className="text-xs text-emerald-600 mt-1 flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-emerald-600 border-t-transparent mr-1"></div>
          Loading real file data...
        </div>
      )}
    </div>
  );
}; 