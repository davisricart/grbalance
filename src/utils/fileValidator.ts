/**
 * Consolidated File Validator
 * Combines all validation logic from bulletproof, robust, universal, and nuclear validators
 * Provides comprehensive file validation with security focus
 */

import * as XLSX from 'xlsx';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedType?: string;
  actualExtension?: string;
  filename?: string;
  confidence?: number;
  securityWarning?: string;
  fileType?: string;
}

interface FileSignature {
  signature: number[];
  offset?: number;
}

// Comprehensive magic number signatures for all file types
const FILE_SIGNATURES: Record<string, FileSignature[]> = {
  // Images (PRIMARY SECURITY THREATS)
  jpeg: [
    { signature: [0xFF, 0xD8, 0xFF, 0xE0] }, // JFIF
    { signature: [0xFF, 0xD8, 0xFF, 0xE1] }, // EXIF
    { signature: [0xFF, 0xD8, 0xFF, 0xE2] }, // Canon
    { signature: [0xFF, 0xD8, 0xFF, 0xE3] }, // Samsung
    { signature: [0xFF, 0xD8, 0xFF, 0xE8] }, // SPIFF
    { signature: [0xFF, 0xD8, 0xFF, 0xDB] }, // JPEG raw
  ],
  png: [{ signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  gif: [
    { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }  // GIF89a
  ],
  bmp: [{ signature: [0x42, 0x4D] }],
  webp: [
    { signature: [0x52, 0x49, 0x46, 0x46] },
    { signature: [0x57, 0x45, 0x42, 0x50], offset: 8 }
  ],
  tiff: [
    { signature: [0x49, 0x49, 0x2A, 0x00] }, // Little endian
    { signature: [0x4D, 0x4D, 0x00, 0x2A] }  // Big endian
  ],
  ico: [{ signature: [0x00, 0x00, 0x01, 0x00] }],
  
  // Audio/Video (SECURITY THREATS)
  mp3: [
    { signature: [0x49, 0x44, 0x33] }, // ID3v2
    { signature: [0xFF, 0xFB] },       // MP3 frame
    { signature: [0xFF, 0xF3] },       // MP3 frame
    { signature: [0xFF, 0xF2] }        // MP3 frame
  ],
  mp4: [
    { signature: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70] },
    { signature: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70] }
  ],
  avi: [
    { signature: [0x52, 0x49, 0x46, 0x46] },
    { signature: [0x41, 0x56, 0x49, 0x20], offset: 8 }
  ],
  mov: [{ signature: [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74] }],
  
  // Archives and Documents
  pdf: [{ signature: [0x25, 0x50, 0x44, 0x46] }],
  zip: [
    { signature: [0x50, 0x4B, 0x03, 0x04] },
    { signature: [0x50, 0x4B, 0x05, 0x06] },
    { signature: [0x50, 0x4B, 0x07, 0x08] }
  ],
  rar: [{ signature: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00] }],
  sevenZ: [{ signature: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C] }],
  
  // Executables (CRITICAL SECURITY THREATS)
  exe: [{ signature: [0x4D, 0x5A] }],
  dll: [{ signature: [0x4D, 0x5A] }],
  
  // Valid spreadsheet formats (ALLOWED)
  xlsx: [{ signature: [0x50, 0x4B, 0x03, 0x04] }], // ZIP-based Excel 2007+
  xls: [{ signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] }], // OLE2 format
  ods: [{ signature: [0x50, 0x4B, 0x03, 0x04] }], // OpenDocument Spreadsheet
};

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.ods'];
const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.oasis.opendocument.spreadsheet'
];

// Text-based file detection patterns
const TEXT_PATTERNS = {
  csv: /^[\w\s"',.-]+(?:,[\w\s"',.-]*)*(?:\r?\n|$)/,
  html: /<\s*html\s*>|<\s*!doctype\s+html/i,
  xml: /<\?xml\s+version/i,
  json: /^\s*[\{\[]/,
  javascript: /^\s*(?:function|var|const|let|import|export)/,
  css: /^\s*[\w\-\.#\[\]]+\s*\{/,
};

/**
 * Detects file type based on magic number signatures
 */
function detectFileType(buffer: ArrayBuffer): { type: string; confidence: number } {
  const uint8Array = new Uint8Array(buffer.slice(0, 512)); // Check first 512 bytes
  
  for (const [fileType, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const { signature, offset = 0 } of signatures) {
      if (uint8Array.length >= offset + signature.length) {
        const matches = signature.every((byte, index) => 
          uint8Array[offset + index] === byte
        );
        
        if (matches) {
          // Special handling for WEBP
          if (fileType === 'webp' && offset === 0) {
            // Check for WEBP signature at offset 8
            const webpSig = [0x57, 0x45, 0x42, 0x50];
            const hasWebpSig = webpSig.every((byte, index) => 
              uint8Array[8 + index] === byte
            );
            if (hasWebpSig) {
              return { type: fileType, confidence: 0.95 };
            }
          } else {
            return { type: fileType, confidence: 0.9 };
          }
        }
      }
    }
  }
  
  return { type: 'unknown', confidence: 0 };
}

/**
 * Validates file extension
 */
function validateExtension(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Validates MIME type
 */
function validateMimeType(file: File): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type);
}

/**
 * Detects double extension attacks
 */
function detectDoubleExtension(filename: string): boolean {
  const suspiciousPatterns = [
    /\.(exe|scr|bat|cmd|com|pif|vbs|js|jar|app|deb|dmg|iso|msi)\.(csv|xlsx|xls|txt)$/i,
    /\.(jpg|jpeg|png|gif|bmp|webp|tiff|ico)\.(csv|xlsx|xls)$/i,
    /\.(mp3|mp4|avi|mov|wmv|flv|webm)\.(csv|xlsx|xls)$/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(filename));
}

/**
 * Attempts to parse file as spreadsheet to verify it's actually a valid document
 */
async function validateSpreadsheetContent(file: File): Promise<{ isValid: boolean; error?: string }> {
  try {
    const buffer = await file.arrayBuffer();
    
    // Try to parse with XLSX
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { isValid: false, error: 'No valid sheets found in file' };
    }
    
    // Try to get at least one cell to verify it's actually readable
    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];
    
    if (!firstSheet) {
      return { isValid: false, error: 'Unable to read sheet content' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: `Failed to parse as spreadsheet: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Validates CSV content
 */
function validateCSVContent(content: string): { isValid: boolean; error?: string } {
  try {
    // Check for basic CSV structure
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      return { isValid: false, error: 'File appears to be empty' };
    }
    
    if (lines.length < 2) {
      return { isValid: false, error: 'CSV must have at least a header and one data row' };
    }
    
    // Check if first line looks like a header
    const firstLine = lines[0];
    if (!TEXT_PATTERNS.csv.test(firstLine)) {
      return { isValid: false, error: 'File does not appear to be valid CSV format' };
    }
    
    // Count columns in header vs data rows for consistency
    const headerColumns = firstLine.split(',').length;
    const dataLine = lines[1];
    const dataColumns = dataLine.split(',').length;
    
    if (Math.abs(headerColumns - dataColumns) > 1) {
      return { isValid: false, error: 'Inconsistent column count between header and data rows' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: `CSV validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Main file validation function
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  try {
    // Basic checks
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }
    
    if (file.size === 0) {
      return { isValid: false, error: 'File is empty' };
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return { isValid: false, error: 'File size exceeds 50MB limit' };
    }
    
    const filename = file.name;
    
    // Check for double extension attacks
    if (detectDoubleExtension(filename)) {
      return {
        isValid: false,
        error: 'Suspicious filename detected',
        securityWarning: 'Potential double extension attack',
        filename
      };
    }
    
    // Validate extension
    if (!validateExtension(filename)) {
      return {
        isValid: false,
        error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        filename
      };
    }
    
    // Get file content for magic number detection
    const buffer = await file.arrayBuffer();
    const { type: detectedType, confidence } = detectFileType(buffer);
    
    // Check for dangerous file types
    const dangerousTypes = ['jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'ico', 'mp3', 'mp4', 'avi', 'mov', 'exe', 'dll', 'pdf'];
    if (dangerousTypes.includes(detectedType)) {
      return {
        isValid: false,
        error: `File appears to be ${detectedType.toUpperCase()}, not a spreadsheet`,
        detectedType,
        securityWarning: `Potential security threat: ${detectedType.toUpperCase()} file disguised as spreadsheet`,
        filename,
        confidence
      };
    }
    
    // For CSV files, validate content
    if (filename.toLowerCase().endsWith('.csv')) {
      const text = await file.text();
      const csvValidation = validateCSVContent(text);
      
      if (!csvValidation.isValid) {
        return {
          isValid: false,
          error: csvValidation.error,
          filename,
          detectedType: 'text',
          fileType: 'csv'
        };
      }
    } else {
      // For Excel files, validate spreadsheet content
      const spreadsheetValidation = await validateSpreadsheetContent(file);
      
      if (!spreadsheetValidation.isValid) {
        return {
          isValid: false,
          error: spreadsheetValidation.error,
          filename,
          detectedType,
          confidence
        };
      }
    }
    
    // All validations passed
    return {
      isValid: true,
      filename,
      detectedType: detectedType === 'unknown' ? 'spreadsheet' : detectedType,
      confidence: confidence || 0.8,
      fileType: filename.toLowerCase().endsWith('.csv') ? 'csv' : 'spreadsheet'
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      filename: file?.name
    };
  }
}

/**
 * Legacy export for backward compatibility
 */
export const bulletproofValidateFile = validateFile;
export const robustValidateFile = validateFile;
export const universalValidateFile = validateFile;
export const nuclearValidateFile = validateFile;

// Type exports for backward compatibility
export type BulletproofValidationResult = FileValidationResult;
export type ValidationResult = FileValidationResult;