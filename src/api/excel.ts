import * as XLSX from 'xlsx';

export async function fetchExcelFile(filename: string) {
  try {
    const response = await fetch(`/sample-data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
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