// Bulletproof Content-First File Validator
// Prioritizes file content analysis over filename/extension validation
// Prevents double extension attacks like "malicious.xlsx.jpg"

import * as XLSX from 'xlsx';

export interface BulletproofValidationResult {
  isValid: boolean;
  error?: string;
  detectedType?: string;
  actualExtension?: string;
  filename?: string;
  confidence?: number;
  securityWarning?: string;
}

// Comprehensive magic number signatures
const MAGIC_SIGNATURES = {
  // Images (PRIMARY THREATS)
  jpeg: [
    [0xFF, 0xD8, 0xFF, 0xE0], // JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // EXIF
    [0xFF, 0xD8, 0xFF, 0xE2], // Canon
    [0xFF, 0xD8, 0xFF, 0xE3], // Samsung
    [0xFF, 0xD8, 0xFF, 0xE8], // SPIFF
    [0xFF, 0xD8, 0xFF, 0xDB], // JPEG raw
  ],
  png: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  bmp: [[0x42, 0x4D]],
  webp: [[0x52, 0x49, 0x46, 0x46]], // Must be followed by WEBP at offset 8
  tiff: [
    [0x49, 0x49, 0x2A, 0x00], // Little endian
    [0x4D, 0x4D, 0x00, 0x2A]  // Big endian
  ],
  ico: [[0x00, 0x00, 0x01, 0x00]],
  
  // Audio/Video (ALSO THREATS)
  mp3: [
    [0x49, 0x44, 0x33], // ID3v2
    [0xFF, 0xFB],       // MP3 frame
    [0xFF, 0xF3],       // MP3 frame
    [0xFF, 0xF2]        // MP3 frame
  ],
  mp4: [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
    [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70]
  ],
  avi: [[0x52, 0x49, 0x46, 0x46]], // Followed by AVI signature
  
  // Documents that could be confused
  pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  zip: [
    [0x50, 0x4B, 0x03, 0x04], // Standard ZIP
    [0x50, 0x4B, 0x05, 0x06], // Empty ZIP
    [0x50, 0x4B, 0x07, 0x08]  // Spanned ZIP
  ],
  rar: [[0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]], // Rar!
  sevenZ: [[0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C]], // 7z
  
  // Executables
  exe: [[0x4D, 0x5A]], // MZ
  
  // VALID spreadsheet formats
  xls: [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // OLE2
  // xlsx is ZIP-based, so we need special handling
} as const;

export class BulletproofFileValidator {
  
  /**
   * CONTENT-FIRST validation - ignores filename completely
   * This prevents double extension attacks like "malicious.xlsx.jpg"
   */
  static async validateFile(file: File): Promise<BulletproofValidationResult> {
    const filename = file.name;
    
    try {
      // Step 1: Basic size check (still important)
      if (file.size === 0) {
        return {
          isValid: false,
          error: 'File is empty',
          filename
        };
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        return {
          isValid: false,
          error: 'File size exceeds 50MB limit',
          filename
        };
      }
      
      // Step 2: READ CONTENT FIRST - this is the key difference
      const headerBuffer = await this.readFileHeader(file, 128); // Read more bytes for better detection
      
      // Step 3: IMMEDIATE magic number detection (BEFORE any filename checks)
      const magicCheck = this.detectFileTypeByContent(headerBuffer, file);
      
      if (magicCheck.detectedType && !this.isAllowedType(magicCheck.detectedType)) {
        return {
          isValid: false,
          error: `File is actually ${magicCheck.detectedType.toUpperCase()}, not a spreadsheet. Upload rejected for security.`,
          detectedType: magicCheck.detectedType,
          filename,
          confidence: magicCheck.confidence,
          securityWarning: this.generateSecurityWarning(filename, magicCheck.detectedType)
        };
      }
      
      // Step 4: If it passes magic number check, validate structure
      const structureCheck = await this.validateSpreadsheetStructure(file, magicCheck.detectedType);
      
      return structureCheck;
      
    } catch (error) {
      return {
        isValid: false,
        error: `Validation failed: ${(error as Error).message}`,
        filename
      };
    }
  }
  
  private static async readFileHeader(file: File, size: number): Promise<Uint8Array> {
    const buffer = await file.slice(0, size).arrayBuffer();
    return new Uint8Array(buffer);
  }
  
  private static detectFileTypeByContent(header: Uint8Array, file: File): {
    detectedType?: string;
    confidence: number;
    actualExtension?: string;
  } {
    // Check all magic signatures
    for (const [fileType, signatures] of Object.entries(MAGIC_SIGNATURES)) {
      for (const signature of signatures) {
        if (this.matchesSignature(header, signature)) {
          
          // Special handling for WebP (needs additional check)
          if (fileType === 'webp') {
            if (header.length >= 12) {
              const webpSignature = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
              const hasWebpSignature = webpSignature.every((byte, i) => header[8 + i] === byte);
              if (!hasWebpSignature) continue;
            }
          }
          
          // Special handling for AVI (RIFF format, needs additional check)
          if (fileType === 'avi' && header.length >= 12) {
            const aviSignature = [0x41, 0x56, 0x49, 0x20]; // "AVI "
            const hasAviSignature = aviSignature.every((byte, i) => header[8 + i] === byte);
            if (!hasAviSignature) continue;
          }
          
          const confidence = signature.length / 16; // Longer signatures = higher confidence
          
          // Special handling for ZIP files - they could be Excel files
          if (fileType === 'zip') {
            return {
              detectedType: 'zip-based', // Could be XLSX
              confidence: 0.7,
              actualExtension: 'zip'
            };
          }
          
          return {
            detectedType: fileType,
            confidence,
            actualExtension: fileType
          };
        }
      }
    }
    
    // Check if it's a ZIP file (potential XLSX)
    if (this.isZipFile(header)) {
      return {
        detectedType: 'zip-based', // Could be XLSX or just ZIP
        confidence: 0.7,
        actualExtension: 'zip'
      };
    }
    
    // Check if it's text-based (potential CSV)
    if (this.isTextFile(header)) {
      return {
        detectedType: 'text-based', // Could be CSV
        confidence: 0.6,
        actualExtension: 'txt'
      };
    }
    
    return { confidence: 0 };
  }
  
  private static matchesSignature(header: Uint8Array, signature: number[]): boolean {
    if (header.length < signature.length) return false;
    return signature.every((byte, index) => header[index] === byte);
  }
  
  private static isZipFile(header: Uint8Array): boolean {
    return MAGIC_SIGNATURES.zip.some(sig => this.matchesSignature(header, sig));
  }
  
  private static isTextFile(header: Uint8Array): boolean {
    // Check if most bytes are printable ASCII/UTF-8
    let printableCount = 0;
    const sampleSize = Math.min(header.length, 512);
    
    for (let i = 0; i < sampleSize; i++) {
      const byte = header[i];
      // Printable ASCII + common whitespace
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
        printableCount++;
      }
    }
    
    return sampleSize > 0 && (printableCount / sampleSize) > 0.8;
  }
  
  private static isAllowedType(detectedType: string): boolean {
    const allowedTypes = ['xls', 'zip-based', 'text-based'];
    return allowedTypes.includes(detectedType);
  }
  
  private static async validateSpreadsheetStructure(
    file: File, 
    detectedType?: string
  ): Promise<BulletproofValidationResult> {
    
    try {
      let workbook: XLSX.WorkBook;
      
      if (detectedType === 'text-based') {
        // Handle as CSV
        const text = await file.text();
        
        // Additional text validation
        const textValidation = this.validateTextAsCSV(text);
        if (!textValidation.isValid) {
          return textValidation;
        }
        
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        // Handle as binary (Excel or ZIP-based)
        const buffer = await file.arrayBuffer();
        
        // For ZIP-based files, verify it's actually Excel
        if (detectedType === 'zip-based') {
          const excelValidation = await this.validateZipAsExcel(buffer);
          if (!excelValidation.isValid) {
            return excelValidation;
          }
        }
        
        workbook = XLSX.read(buffer, { type: 'array' });
      }
      
      // Validate workbook structure
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return {
          isValid: false,
          error: 'File does not contain valid spreadsheet data',
          detectedType,
          filename: file.name
        };
      }
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length < 2) {
        return {
          isValid: false,
          error: 'Spreadsheet must contain at least a header row and one data row',
          detectedType,
          filename: file.name
        };
      }
      
      // Final check for binary junk in the data
      const binaryCheck = this.checkForBinaryJunk(data);
      if (!binaryCheck.isValid) {
        return {
          ...binaryCheck,
          detectedType,
          filename: file.name,
          securityWarning: 'File contains binary data that suggests it may be a disguised non-spreadsheet file'
        };
      }
      
      return {
        isValid: true,
        detectedType: detectedType || 'spreadsheet',
        filename: file.name,
        confidence: 0.95
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: 'File cannot be parsed as a valid spreadsheet',
        detectedType,
        filename: file.name
      };
    }
  }
  
  private static validateTextAsCSV(text: string): BulletproofValidationResult {
    // Check for non-CSV patterns
    const suspiciousPatterns = [
      { pattern: /<\s*html\s*>|<\s*!doctype\s+html/i, type: 'HTML' },
      { pattern: /<\?xml\s+version/i, type: 'XML' },
      { pattern: /^\s*[\{\[]/m, type: 'JSON' },
      { pattern: /^\s*(?:function|var|const|let|import|export|class)/m, type: 'JavaScript' },
      { pattern: /^\s*#include|^\s*int\s+main/m, type: 'C/C++' },
      { pattern: /^\s*package\s+|^\s*import\s+java/m, type: 'Java' },
    ];
    
    for (const { pattern, type } of suspiciousPatterns) {
      if (pattern.test(text)) {
        return {
          isValid: false,
          error: `File appears to be ${type} code, not CSV data`,
          detectedType: type.toLowerCase(),
          securityWarning: `Potential code injection attempt detected`
        };
      }
    }
    
    // Basic CSV structure check
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      return {
        isValid: false,
        error: 'CSV file must have at least 2 lines (header + data)'
      };
    }
    
    // Check for reasonable CSV structure
    const firstLineCommas = (lines[0].match(/,/g) || []).length;
    if (firstLineCommas === 0) {
      return {
        isValid: false,
        error: 'File does not appear to be comma-separated (CSV)'
      };
    }
    
    return { isValid: true };
  }
  
  private static async validateZipAsExcel(buffer: ArrayBuffer): Promise<BulletproofValidationResult> {
    // For a proper Excel file, we should be able to find Excel-specific files in the ZIP
    // This is a simplified check - in production, you might want more thorough ZIP inspection
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      // If XLSX can parse it as Excel, it's likely legitimate
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'ZIP file is not a valid Excel document',
        securityWarning: 'File may be a disguised ZIP archive'
      };
    }
  }
  
  private static checkForBinaryJunk(data: any[]): BulletproofValidationResult {
    // Look for patterns that suggest binary data was interpreted as text
    const sampleSize = Math.min(data.length, 10);
    const headerRow = data[0] || [];
    const dataRows = data.slice(1, sampleSize);
    
    const allText = [
      JSON.stringify(headerRow),
      ...dataRows.map(row => JSON.stringify(row))
    ].join('');
    
    // Pattern checks for binary junk
    const binaryPatterns = [
      { pattern: /[^\x20-\x7E\s]{20,}/, desc: 'long sequences of non-printable characters' },
      { pattern: /\x00{3,}/, desc: 'multiple null bytes' },
      { pattern: /[\x01-\x08\x0B\x0C\x0E-\x1F]{10,}/, desc: 'control character sequences' },
      { pattern: /[�]{3,}/, desc: 'replacement character sequences' },
    ];
    
    for (const { pattern, desc } of binaryPatterns) {
      if (pattern.test(allText)) {
        return {
          isValid: false,
          error: `File contains binary data (${desc}). This usually indicates a non-spreadsheet file with a fake extension.`,
          securityWarning: 'Binary data pattern detected - possible file type spoofing'
        };
      }
    }
    
    return { isValid: true };
  }
  
  private static generateSecurityWarning(filename: string, detectedType: string): string {
    const extensions = filename.split('.');
    if (extensions.length > 2) {
      return `SECURITY ALERT: File "${filename}" has multiple extensions and is actually ${detectedType.toUpperCase()}. This is a common attack vector.`;
    }
    return `File type mismatch: Claims to be a spreadsheet but is actually ${detectedType.toUpperCase()}.`;
  }
}

// Convenience function for React components
export const bulletproofValidateFile = async (file: File): Promise<{
  isValid: boolean;
  error?: string;
  securityWarning?: string;
}> => {
  const result = await BulletproofFileValidator.validateFile(file);
  return {
    isValid: result.isValid,
    error: result.error,
    securityWarning: result.securityWarning
  };
};

export default BulletproofFileValidator;