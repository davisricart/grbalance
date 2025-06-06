// Universal File Validation Wrapper
// Ensures ALL file access points are validated, including server-side fetches

import { bulletproofValidateFile } from './bulletproofFileValidator';

export interface UniversalValidationResult {
  isValid: boolean;
  error?: string;
  securityWarning?: string;
  data?: ArrayBuffer | string;
  filename?: string;
}

/**
 * Universal validation for ANY file source - fetch, File object, or ArrayBuffer
 * This ensures no disguised files can ever bypass validation
 */
export class UniversalFileValidator {
  
  /**
   * Validate and fetch a file from URL (e.g., /sample-data/filename)
   * This replaces direct fetch() calls to sample-data
   */
  static async validateAndFetch(url: string): Promise<UniversalValidationResult> {
    try {
      const filename = url.split('/').pop() || 'unknown';
      console.log(`🔍 Universal validation for: ${filename} from ${url}`);
      
      // Step 1: Fetch the file
      const response = await fetch(url);
      if (!response.ok) {
        return {
          isValid: false,
          error: `Failed to fetch ${filename} (Status: ${response.status})`,
          filename
        };
      }
      
      // Step 2: Get the raw data
      const arrayBuffer = await response.arrayBuffer();
      
      // Step 3: Create a temporary File object for validation
      const blob = new Blob([arrayBuffer]);
      const tempFile = new File([blob], filename);
      
      // Step 4: Run bulletproof validation
      const validation = await bulletproofValidateFile(tempFile);
      
      if (!validation.isValid) {
        console.error(`🚨 BLOCKED: ${filename} failed validation:`, validation.error);
        return {
          isValid: false,
          error: validation.error,
          securityWarning: validation.securityWarning,
          filename
        };
      }
      
      console.log(`✅ VALIDATED: ${filename} passed content verification`);
      return {
        isValid: true,
        data: arrayBuffer,
        filename
      };
      
    } catch (error) {
      const filename = url.split('/').pop() || 'unknown';
      return {
        isValid: false,
        error: `Validation failed: ${(error as Error).message}`,
        filename
      };
    }
  }
  
  /**
   * Validate an ArrayBuffer directly (for server responses)
   */
  static async validateArrayBuffer(buffer: ArrayBuffer, filename: string): Promise<UniversalValidationResult> {
    try {
      // Create a temporary File object for validation
      const blob = new Blob([buffer]);
      const tempFile = new File([blob], filename);
      
      // Run bulletproof validation
      const validation = await bulletproofValidateFile(tempFile);
      
      if (!validation.isValid) {
        return {
          isValid: false,
          error: validation.error,
          securityWarning: validation.securityWarning,
          filename
        };
      }
      
      return {
        isValid: true,
        data: buffer,
        filename
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: `Buffer validation failed: ${(error as Error).message}`,
        filename
      };
    }
  }
  
  /**
   * Validate text content (for CSV files)
   */
  static async validateTextContent(text: string, filename: string): Promise<UniversalValidationResult> {
    try {
      // Create a temporary File object for validation
      const blob = new Blob([text], { type: 'text/plain' });
      const tempFile = new File([blob], filename);
      
      // Run bulletproof validation
      const validation = await bulletproofValidateFile(tempFile);
      
      if (!validation.isValid) {
        return {
          isValid: false,
          error: validation.error,
          securityWarning: validation.securityWarning,
          filename
        };
      }
      
      return {
        isValid: true,
        data: text,
        filename
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: `Text validation failed: ${(error as Error).message}`,
        filename
      };
    }
  }
}

/**
 * Safe file loading utility - replaces direct fetch calls
 * Usage: const result = await safeLoadFile('/sample-data/file.xlsx')
 */
export async function safeLoadFile(url: string): Promise<UniversalValidationResult> {
  return UniversalFileValidator.validateAndFetch(url);
}

/**
 * Safe Excel parsing - validates before XLSX.read()
 * Usage: const result = await safeParseExcel(buffer, 'filename.xlsx')
 */
export async function safeParseExcel(buffer: ArrayBuffer, filename: string): Promise<UniversalValidationResult> {
  return UniversalFileValidator.validateArrayBuffer(buffer, filename);
}

/**
 * Safe CSV parsing - validates before processing
 * Usage: const result = await safeParseCSV(text, 'filename.csv')
 */
export async function safeParseCSV(text: string, filename: string): Promise<UniversalValidationResult> {
  return UniversalFileValidator.validateTextContent(text, filename);
}

export default UniversalFileValidator;