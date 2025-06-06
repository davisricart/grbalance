// Bulletproof File Validation Utility
// Prevents images and other binary files from being parsed as spreadsheets

import * as XLSX from 'xlsx';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: string;
  confidence?: number;
}

// Comprehensive magic number detection
const FILE_SIGNATURES = {
  // Images
  jpeg: [[0xFF, 0xD8, 0xFF]],
  png: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  gif: [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  bmp: [[0x42, 0x4D]],
  webp: [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF + WEBP
  tiff: [[0x49, 0x49, 0x2A, 0x00], [0x4D, 0x4D, 0x00, 0x2A]],
  ico: [[0x00, 0x00, 0x01, 0x00]],
  
  // Documents that might be confused with spreadsheets
  pdf: [[0x25, 0x50, 0x44, 0x46]],
  zip: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]],
  rar: [[0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]],
  sevenZ: [[0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C]],
  
  // Audio/Video
  mp3: [[0x49, 0x44, 0x33], [0xFF, 0xFB]],
  mp4: [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]],
  avi: [[0x52, 0x49, 0x46, 0x46], [0x41, 0x56, 0x49, 0x20]],
  
  // Executables
  exe: [[0x4D, 0x5A]],
  
  // Valid spreadsheet formats (for positive identification)
  xlsx: [[0x50, 0x4B, 0x03, 0x04]], // ZIP-based (Excel 2007+)
  xls: [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // OLE2 format
} as const;

// Text-based file detection patterns
const TEXT_PATTERNS = {
  csv: /^[\w\s"',.-]+(?:,[\w\s"',.-]*)*(?:\r?\n|$)/,
  html: /<\s*html\s*>|<\s*!doctype\s+html/i,
  xml: /<\?xml\s+version/i,
  json: /^\s*[\{\[]/,
  javascript: /^\s*(?:function|var|const|let|import|export)/,
  css: /^\s*[\w\-\.#\[\]]+\s*\{/,
};

export class RobustFileValidator {
  
  /**
   * Main validation function - call this for all file uploads
   */
  static async validateFile(file: File): Promise<ValidationResult> {
    try {
      // Step 1: Basic checks
      const basicCheck = this.validateBasicFileProperties(file);
      if (!basicCheck.isValid) return basicCheck;
      
      // Step 2: Read file header for magic number detection
      const headerBuffer = await this.readFileHeader(file, 64);
      
      // Step 3: Check for known binary file types
      const binaryCheck = this.detectBinaryFileType(headerBuffer);
      if (binaryCheck.fileType && binaryCheck.fileType !== 'xlsx' && binaryCheck.fileType !== 'xls') {
        return {
          isValid: false,
          error: `File is detected as ${binaryCheck.fileType.toUpperCase()}, not a spreadsheet. Please upload only Excel (.xlsx, .xls) or CSV files.`,
          fileType: binaryCheck.fileType,
          confidence: binaryCheck.confidence
        };
      }
      
      // Step 4: For ZIP-based files (including XLSX), verify it's actually a spreadsheet
      if (binaryCheck.fileType === 'xlsx' || this.isZipFile(headerBuffer)) {
        const xlsxCheck = await this.validateXLSXStructure(file);
        if (!xlsxCheck.isValid) return xlsxCheck;
      }
      
      // Step 5: For text-based files, validate CSV format
      if (this.isTextFile(headerBuffer) || file.name.toLowerCase().endsWith('.csv')) {
        const csvCheck = await this.validateCSVStructure(file);
        if (!csvCheck.isValid) return csvCheck;
      }
      
      // Step 6: Final spreadsheet content validation
      const contentCheck = await this.validateSpreadsheetContent(file);
      return contentCheck;
      
    } catch (error) {
      return {
        isValid: false,
        error: `File validation failed: ${(error as Error).message}`,
        fileType: 'unknown'
      };
    }
  }
  
  private static validateBasicFileProperties(file: File): ValidationResult {
    // Size check (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'File size exceeds 10MB limit' };
    }
    
    // Empty file check
    if (file.size === 0) {
      return { isValid: false, error: 'File is empty' };
    }
    
    // Extension check (permissive - we'll validate content)
    const allowedExtensions = ['xlsx', 'xls', 'csv'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return { 
        isValid: false, 
        error: 'File must have .xlsx, .xls, or .csv extension' 
      };
    }
    
    return { isValid: true };
  }
  
  private static async readFileHeader(file: File, size: number): Promise<Uint8Array> {
    const buffer = await file.slice(0, size).arrayBuffer();
    return new Uint8Array(buffer);
  }
  
  private static detectBinaryFileType(header: Uint8Array): { fileType?: string; confidence: number } {
    for (const [fileType, signatures] of Object.entries(FILE_SIGNATURES)) {
      for (const signature of signatures) {
        if (this.matchesSignature(header, signature)) {
          const confidence = signature.length / header.length;
          return { fileType, confidence };
        }
      }
    }
    return { confidence: 0 };
  }
  
  private static matchesSignature(header: Uint8Array, signature: number[]): boolean {
    if (header.length < signature.length) return false;
    return signature.every((byte, index) => header[index] === byte);
  }
  
  private static isZipFile(header: Uint8Array): boolean {
    return this.matchesSignature(header, [0x50, 0x4B, 0x03, 0x04]) ||
           this.matchesSignature(header, [0x50, 0x4B, 0x05, 0x06]) ||
           this.matchesSignature(header, [0x50, 0x4B, 0x07, 0x08]);
  }
  
  private static isTextFile(header: Uint8Array): boolean {
    // Check if most bytes are printable ASCII
    let printableCount = 0;
    const sampleSize = Math.min(header.length, 512);
    
    for (let i = 0; i < sampleSize; i++) {
      const byte = header[i];
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
        printableCount++;
      }
    }
    
    return printableCount / sampleSize > 0.85; // 85% printable characters
  }
  
  private static async validateXLSXStructure(file: File): Promise<ValidationResult> {
    try {
      // Read the file as a ZIP and check for Excel-specific files
      const buffer = await file.arrayBuffer();
      
      // Try to parse with XLSX library
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return {
          isValid: false,
          error: 'File does not contain valid Excel sheets',
          fileType: 'invalid-xlsx'
        };
      }
      
      // Additional checks for Excel-specific structures
      // XLSX files should have specific internal structure
      return { isValid: true, fileType: 'xlsx' };
      
    } catch (error) {
      return {
        isValid: false,
        error: 'File appears to be corrupted or is not a valid Excel file',
        fileType: 'corrupted'
      };
    }
  }
  
  private static async validateCSVStructure(file: File): Promise<ValidationResult> {
    try {
      // Read first 1KB to validate CSV structure
      const headerText = await file.slice(0, 1024).text();
      
      // Check for common non-CSV patterns
      if (TEXT_PATTERNS.html.test(headerText)) {
        return { isValid: false, error: 'File appears to be HTML, not CSV', fileType: 'html' };
      }
      
      if (TEXT_PATTERNS.xml.test(headerText)) {
        return { isValid: false, error: 'File appears to be XML, not CSV', fileType: 'xml' };
      }
      
      if (TEXT_PATTERNS.json.test(headerText)) {
        return { isValid: false, error: 'File appears to be JSON, not CSV', fileType: 'json' };
      }
      
      if (TEXT_PATTERNS.javascript.test(headerText)) {
        return { isValid: false, error: 'File appears to be JavaScript, not CSV', fileType: 'javascript' };
      }
      
      // Check for reasonable CSV structure
      const lines = headerText.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) {
        return { isValid: false, error: 'CSV file must have at least 2 lines (header + data)' };
      }
      
      // Check if lines have consistent comma-separated structure
      const firstLineCommas = (lines[0].match(/,/g) || []).length;
      if (firstLineCommas === 0) {
        return { isValid: false, error: 'File does not appear to be comma-separated (CSV)' };
      }
      
      return { isValid: true, fileType: 'csv' };
      
    } catch (error) {
      return {
        isValid: false,
        error: 'Unable to read file as text',
        fileType: 'unreadable'
      };
    }
  }
  
  private static async validateSpreadsheetContent(file: File): Promise<ValidationResult> {
    try {
      const buffer = await file.arrayBuffer();
      let workbook: XLSX.WorkBook;
      
      // Handle different file types
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        workbook = XLSX.read(buffer, { type: 'array' });
      }
      
      if (!workbook.SheetNames.length) {
        return { isValid: false, error: 'File contains no data sheets' };
      }
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length < 2) {
        return { 
          isValid: false, 
          error: 'File must contain at least a header row and one data row' 
        };
      }
      
      // Check for reasonable column structure
      const headerRow = data[0] as any[];
      const dataRow = data[1] as any[];
      
      if (!headerRow || headerRow.length === 0) {
        return { isValid: false, error: 'File must have column headers' };
      }
      
      if (!dataRow || dataRow.length === 0) {
        return { isValid: false, error: 'File must have data rows' };
      }
      
      // Check for binary junk (common when images are parsed as spreadsheets)
      const headerText = headerRow.join('').toLowerCase();
      const dataText = dataRow.join('').toLowerCase();
      
      // Look for patterns that suggest binary data
      const binaryPatterns = [
        /[^\x20-\x7E\s]{10,}/, // Long sequences of non-printable characters
        /\x00{5,}/, // Null bytes
        /[\x01-\x08\x0B\x0C\x0E-\x1F]{5,}/, // Control characters
      ];
      
      for (const pattern of binaryPatterns) {
        if (pattern.test(headerText) || pattern.test(dataText)) {
          return {
            isValid: false,
            error: 'File contains binary data and is not a valid spreadsheet. This often happens when image files are renamed with spreadsheet extensions.',
            fileType: 'binary'
          };
        }
      }
      
      return { isValid: true, fileType: 'spreadsheet' };
      
    } catch (error) {
      return {
        isValid: false,
        error: 'Unable to parse file as spreadsheet',
        fileType: 'unparseable'
      };
    }
  }
}

// Convenience function for backward compatibility
export const validateUploadedFile = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
  const result = await RobustFileValidator.validateFile(file);
  return {
    isValid: result.isValid,
    error: result.error
  };
};

// Export the main validator
export default RobustFileValidator;