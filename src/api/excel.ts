import * as XLSX from 'xlsx';
import { safeLoadFile } from '../utils/universalFileValidator';

export async function fetchExcelFile(filename: string) {
  try {
    console.log(`🔒 Safe loading Excel file: ${filename}`);
    
    // Step 1: Universal validation before parsing
    const validation = await safeLoadFile(`/sample-data/${filename}`);
    
    if (!validation.isValid) {
      const errorMsg = validation.securityWarning 
        ? `🚨 SECURITY: ${validation.error} - ${validation.securityWarning}`
        : validation.error;
      console.error(`❌ Blocked ${filename}:`, errorMsg);
      return { 
        headers: [], 
        data: [], 
        error: errorMsg,
        blocked: true
      };
    }
    
    // Step 2: File is validated - safe to parse
    const arrayBuffer = validation.data as ArrayBuffer;
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      return { headers: [], data: [] };
    }
    
    const headers = jsonData[0] as string[];
    const data = jsonData.slice(1);
    
    console.log(`✅ Successfully loaded validated Excel: ${filename}`);
    return {
      headers,
      data,
      rowCount: data.length
    };
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { headers: [], data: [], error: errorMessage };
  }
} 