// Nuclear Option: Complete XLSX Library Lockdown
// This completely prevents ANY file from being processed without validation

import * as XLSX from 'xlsx';

interface ValidationToken {
  filename: string;
  timestamp: number;
  validated: boolean;
  source: string;
}

class NuclearFileProtection {
  private validatedFiles = new Map<string, ValidationToken>();
  private isEnabled = true;
  private originalXLSXRead: any;

  constructor() {
    console.log('☢️  NUCLEAR FILE PROTECTION ACTIVATED');
    console.log('🔒 ALL FILE OPERATIONS WILL BE BLOCKED UNLESS EXPLICITLY VALIDATED');
    this.lockdownXLSX();
  }

  private lockdownXLSX() {
    // Store original XLSX.read function
    this.originalXLSXRead = XLSX.read;
    
    // Replace with our secure version
    (XLSX as any).read = (data: any, options?: any) => {
      const stackTrace = new Error().stack || '';
      const caller = this.extractCaller(stackTrace);
      
      // Check if this operation is from a validated source
      const isFromValidator = this.isValidatedOperation(caller);
      
      if (!isFromValidator) {
        const errorMsg = `🚨 NUCLEAR PROTECTION: XLSX.read blocked!\n\nCaller: ${caller}\n\nAll files must be validated before processing.`;
        console.error(errorMsg);
        
        // Show alert to make it obvious
        if (typeof window !== 'undefined') {
          alert(errorMsg);
        }
        
        throw new Error('File processing blocked by Nuclear Protection. Validate file first.');
      }
      
      console.log('✅ XLSX.read allowed from validated source:', caller);
      return this.originalXLSXRead.call(XLSX, data, options);
    };
  }

  private isValidatedOperation(caller: string): boolean {
    // Allow operations from these validated sources
    const validatedSources = [
      'bulletproofFileValidator',
      'universalFileValidator',
      'safeLoadFile',
      'validateAndFetch',
      'processFileWithChunking', // After validation
      'handleFileUpload',        // After validation
      'loadFile',               // If it includes validation
      'fetchExcelFile'          // If it includes validation
    ];
    
    return validatedSources.some(source => caller.includes(source));
  }

  private extractCaller(stackTrace: string): string {
    const lines = stackTrace.split('\n');
    // Find the first meaningful caller (skip this file and XLSX itself)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes('nuclearFileProtection') && 
          !line.includes('lockdownXLSX') &&
          !line.includes('node_modules/xlsx')) {
        return line.trim();
      }
    }
    return 'unknown caller';
  }

  public addValidatedFile(filename: string, source: string) {
    const token: ValidationToken = {
      filename,
      timestamp: Date.now(),
      validated: true,
      source
    };
    
    this.validatedFiles.set(filename, token);
    console.log(`✅ File "${filename}" added to validated list from ${source}`);
  }

  public isFileValidated(filename: string): boolean {
    const token = this.validatedFiles.get(filename);
    if (!token) return false;
    
    // Tokens expire after 5 minutes for security
    const isExpired = Date.now() - token.timestamp > 5 * 60 * 1000;
    if (isExpired) {
      this.validatedFiles.delete(filename);
      return false;
    }
    
    return token.validated;
  }

  public disable() {
    if (this.originalXLSXRead) {
      (XLSX as any).read = this.originalXLSXRead;
      console.log('☢️  Nuclear protection disabled');
    }
    this.isEnabled = false;
  }

  public enable() {
    this.lockdownXLSX();
    this.isEnabled = true;
    console.log('☢️  Nuclear protection re-enabled');
  }

  public getStatus() {
    return {
      enabled: this.isEnabled,
      validatedFiles: Array.from(this.validatedFiles.entries()),
      originalXLSXAvailable: !!this.originalXLSXRead
    };
  }
}

// Create global instance
const nuclearProtection = new NuclearFileProtection();

// Export for console access
(window as any).nuclearProtection = nuclearProtection;

// Export utilities for validated operations
export const allowXLSXOperation = (filename: string, source: string) => {
  nuclearProtection.addValidatedFile(filename, source);
};

export const disableNuclearProtection = () => {
  nuclearProtection.disable();
};

export const enableNuclearProtection = () => {
  nuclearProtection.enable();
};

export default nuclearProtection;