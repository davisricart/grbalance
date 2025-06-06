// Enhanced Error Handling Utilities for GRBalance
// Provides centralized error handling, logging, and user feedback

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: string;
  component?: string;
  userId?: string;
}

export interface NotificationOptions {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

// Centralized Logger
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  private log(level: LogLevel, message: string, context?: any, component?: string) {
    if (level < this.logLevel) return;
    
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      component
    };
    
    // Console logging with appropriate method
    const consoleMethods = [console.debug, console.info, console.warn, console.error];
    const emoji = ['🔍', 'ℹ️', '⚠️', '🚨'];
    
    consoleMethods[level](`${emoji[level]} [${component || 'App'}] ${message}`, context || '');
    
    // Send to external service in production
    if (process.env.NODE_ENV === 'production' && level >= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }
  
  private sendToExternalService(entry: LogEntry) {
    // Integration with logging service (implement as needed)
    console.log('Would send to external service:', entry);
  }
  
  debug(message: string, context?: any, component?: string) {
    this.log(LogLevel.DEBUG, message, context, component);
  }
  
  info(message: string, context?: any, component?: string) {
    this.log(LogLevel.INFO, message, context, component);
  }
  
  warn(message: string, context?: any, component?: string) {
    this.log(LogLevel.WARN, message, context, component);
  }
  
  error(message: string, context?: any, component?: string) {
    this.log(LogLevel.ERROR, message, context, component);
  }
}

// File validation utility
export const validateUploadedFile = async (file: File): Promise<FileValidationResult> => {
  const logger = Logger.getInstance();
  
  // Size validation
  if (file.size > 10 * 1024 * 1024) {
    logger.warn('File size exceeds limit', { size: file.size, limit: '10MB' }, 'FileValidator');
    return { isValid: false, error: "File size exceeds 10MB limit" };
  }
  
  // Format validation
  const allowedTypes = ['xlsx', 'xls', 'csv'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !allowedTypes.includes(extension)) {
    logger.warn('Invalid file format', { extension, allowedTypes }, 'FileValidator');
    return { isValid: false, error: "Please upload Excel (.xlsx, .xls) or CSV files only" };
  }
  
  // Magic number/content validation for common image types
  const magicNumbers: { [key: string]: number[] } = {
    jpg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    gif: [0x47, 0x49, 0x46, 0x38],
    bmp: [0x42, 0x4D],
    webp: [0x52, 0x49, 0x46, 0x46],
  };
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  for (const [type, sig] of Object.entries(magicNumbers)) {
    if (bytes.length >= sig.length && sig.every((b, i) => bytes[i] === b)) {
      logger.warn('File is actually an image (magic number detected)', { type, filename: file.name }, 'FileValidator');
      return { isValid: false, error: `File appears to be an image (${type.toUpperCase()}) and not a valid spreadsheet.` };
    }
  }
  
  // Structure validation (basic)
  try {
    const XLSX = await import('xlsx');
    const fullBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(fullBuffer, { type: 'array' });
    
    if (workbook.SheetNames.length === 0) {
      logger.error('File has no sheets', { filename: file.name }, 'FileValidator');
      return { isValid: false, error: "File appears to be empty or corrupted" };
    }
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) {
      logger.warn('File has insufficient data', { rows: data.length }, 'FileValidator');
      return { isValid: false, error: "File must contain at least a header row and one data row" };
    }
    
    logger.info('File validation successful', { filename: file.name, rows: data.length }, 'FileValidator');
    return { isValid: true };
  } catch (error) {
    logger.error('File validation failed', { error: (error as Error).message }, 'FileValidator');
    return { isValid: false, error: "File appears to be corrupted or in an unsupported format" };
  }
};

// Network request utility with retry
export interface APICallOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export const apiCallWithRetry = async (
  url: string, 
  options: RequestInit, 
  apiOptions: APICallOptions = {}
): Promise<Response> => {
  const { timeout = 30000, retries = 3, retryDelay = 1000 } = apiOptions;
  const logger = Logger.getInstance();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.debug(`API call attempt ${attempt}`, { url, attempt, retries }, 'NetworkUtils');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status >= 500 && attempt < retries) {
          logger.warn(`Server error, retrying`, { status: response.status, attempt }, 'NetworkUtils');
          // Retry server errors
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      logger.info('API call successful', { url, attempt }, 'NetworkUtils');
      return response;
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('AbortError') || errorMessage.includes('timeout')) {
        logger.error('Request timeout', { url, timeout, attempt }, 'NetworkUtils');
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      if (attempt === retries) {
        if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
          logger.error('Network error after all retries', { url, retries, error: errorMessage }, 'NetworkUtils');
          throw new Error('Network error. Please check your internet connection.');
        }
        logger.error('API call failed after all retries', { url, retries, error: errorMessage }, 'NetworkUtils');
        throw error;
      }
      
      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt - 1);
      logger.warn(`Retrying after delay`, { delay, attempt, error: errorMessage }, 'NetworkUtils');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Maximum retries exceeded');
};

// Error classification utility
export const classifyError = (error: any): {
  type: 'network' | 'validation' | 'authentication' | 'permission' | 'server' | 'unknown';
  message: string;
  userMessage: string;
  isRetryable: boolean;
} => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code;
  
  // Network errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return {
      type: 'network',
      message: errorMessage,
      userMessage: 'Network connection issue. Please check your internet connection and try again.',
      isRetryable: true
    };
  }
  
  // Authentication errors
  if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential' || errorMessage.includes('authentication')) {
    return {
      type: 'authentication',
      message: errorMessage,
      userMessage: 'Authentication failed. Please sign in again.',
      isRetryable: false
    };
  }
  
  // Permission errors
  if (errorCode === 'permission-denied' || errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return {
      type: 'permission',
      message: errorMessage,
      userMessage: 'You do not have permission to perform this action.',
      isRetryable: false
    };
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
    return {
      type: 'validation',
      message: errorMessage,
      userMessage: 'Please check your input and try again.',
      isRetryable: false
    };
  }
  
  // Server errors
  if (errorMessage.includes('500') || errorMessage.includes('server error') || errorMessage.includes('internal')) {
    return {
      type: 'server',
      message: errorMessage,
      userMessage: 'Server error. Please try again in a few moments.',
      isRetryable: true
    };
  }
  
  return {
    type: 'unknown',
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again.',
    isRetryable: false
  };
};

// Performance monitoring utility
export const measureOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  component?: string
): Promise<T> => {
  const logger = Logger.getInstance();
  const startTime = performance.now();
  
  try {
    logger.debug(`Starting operation: ${operationName}`, undefined, component);
    const result = await operation();
    const duration = performance.now() - startTime;
    
    logger.info(`Operation completed: ${operationName}`, {
      duration: `${duration.toFixed(2)}ms`,
      success: true
    }, component);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    logger.error(`Operation failed: ${operationName}`, {
      duration: `${duration.toFixed(2)}ms`,
      error: (error as Error).message
    }, component);
    
    throw error;
  }
};

// Export logger instance
export const logger = Logger.getInstance();