import * as XLSX from 'xlsx';

export interface ParsedFileData {
  filename: string;
  headers: string[];
  rows: { [key: string]: any }[];
  summary: {
    totalRows: number;
    columns: number;
    sampleData: { [key: string]: any }[];
  };
}

export async function parseFile(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          workbook = XLSX.read(data, { type: 'binary' });
        } else {
          // Parse Excel
          workbook = XLSX.read(data, { type: 'array' });
        }
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (jsonData.length === 0) {
          throw new Error('File appears to be empty');
        }
        
        // First row is headers
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1) as any[][];
        
        // Convert to objects
        const rows = dataRows.map((row: any[]) => {
          const obj: { [key: string]: any } = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        const result: ParsedFileData = {
          filename: file.name,
          headers,
          rows,
          summary: {
            totalRows: rows.length,
            columns: headers.length,
            sampleData: rows.slice(0, 5) // First 5 rows as sample
          }
        };
        
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (file.name.endsWith('.csv')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

export function generateComparisonPrompt(
  file1Data: ParsedFileData, 
  file2Data: ParsedFileData, 
  comparisonRequest?: string
): string {
  const defaultRequest = "Compare these two files and show me discrepancies in payment amounts by card type";
  const request = comparisonRequest || defaultRequest;
  
  return `I need to analyze two data files and generate results in the exact GR Balance format shown in the interface.

**FILE 1: ${file1Data.filename}**
Columns: ${file1Data.headers.join(', ')}
Total Rows: ${file1Data.summary.totalRows}
Sample Data:
${file1Data.summary.sampleData.slice(0, 3).map(row => 
  file1Data.headers.map(h => `${h}: ${row[h]}`).join(' | ')
).join('\n')}

**FILE 2: ${file2Data.filename}**
Columns: ${file2Data.headers.join(', ')}
Total Rows: ${file2Data.summary.totalRows}
Sample Data:
${file2Data.summary.sampleData.slice(0, 3).map(row => 
  file2Data.headers.map(h => `${h}: ${row[h]}`).join(' | ')
).join('\n')}

**COMPARISON REQUEST:**
${request}

**REQUIRED OUTPUT:**
Please generate JavaScript code that will:
1. Parse this data and perform the requested comparison
2. Update the GR Balance interface with results in these specific elements:
   - #payment-stats (Payment Method Distribution)
   - #detailed-results-table (Detailed transaction table)
   - #summary-table (Summary comparison table)

The results should match the exact format and styling shown in the GR Balance interface.`;
}

export interface FileComparison {
  file1: ParsedFileData;
  file2: ParsedFileData;
  comparisonType: string;
}

// Store for parsed files
export class FileStore {
  private static files: Map<string, ParsedFileData> = new Map();
  
  static store(key: string, data: ParsedFileData) {
    this.files.set(key, data);
  }
  
  static get(key: string): ParsedFileData | undefined {
    return this.files.get(key);
  }
  
  static clear() {
    this.files.clear();
  }
  
  static getComparison(): FileComparison | null {
    const file1 = this.get('file1');
    const file2 = this.get('file2');
    
    if (!file1 || !file2) return null;
    
    return {
      file1,
      file2,
      comparisonType: 'standard'
    };
  }
} 