// Centralized Error Handling Utilities
// Provides consistent error handling patterns across all services

import { sendAdminNotification } from '../services/notificationService';

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  context?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

/**
 * Create a service result for successful operations
 */
export function createSuccess<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data
  };
}

/**
 * Create a service result for failed operations
 */
export function createError<T>(error: ServiceError): ServiceResult<T> {
  return {
    success: false,
    error
  };
}

/**
 * Wrap async service functions with consistent error handling
 */
export function withErrorHandling<T extends any[], R>(
  serviceName: string,
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<ServiceResult<R>> => {
    try {
      const result = await fn(...args);
      console.log(`✅ ${serviceName}.${operation}: Success`);
      return createSuccess(result);
    } catch (error) {
      const serviceError = handleServiceError(error, serviceName, operation);
      console.error(`❌ ${serviceName}.${operation}: ${serviceError.message}`);
      
      // Send admin notification for critical errors
      if (serviceError.severity === 'critical') {
        await sendAdminNotification(
          `Critical Error in ${serviceName}`,
          `Operation: ${operation}\nError: ${serviceError.message}\nDetails: ${JSON.stringify(serviceError.details, null, 2)}`
        ).catch(notifError => {
          console.error('Failed to send admin notification:', notifError);
        });
      }
      
      return createError(serviceError);
    }
  };
}

/**
 * Convert various error types to ServiceError
 */
export function handleServiceError(error: any, context?: string, operation?: string): ServiceError {
  // Supabase database errors
  if (error?.code && error?.message) {
    return {
      code: `SUPABASE_${error.code}`,
      message: `Database error: ${error.message}`,
      details: {
        originalError: error,
        hint: error.hint,
        details: error.details
      },
      context: context ? `${context}.${operation}` : 'unknown',
      severity: getDatabaseErrorSeverity(error.code)
    };
  }
  
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
      details: { originalError: error.message },
      context: context ? `${context}.${operation}` : 'unknown',
      severity: 'medium'
    };
  }
  
  // Authentication errors
  if (error?.message?.includes('auth') || error?.message?.includes('unauthorized')) {
    return {
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
      details: { originalError: error.message },
      context: context ? `${context}.${operation}` : 'unknown',
      severity: 'high'
    };
  }
  
  // Generic errors
  return {
    code: 'UNKNOWN_ERROR',
    message: error?.message || 'An unexpected error occurred',
    details: { originalError: error },
    context: context ? `${context}.${operation}` : 'unknown',
    severity: 'medium'
  };
}

/**
 * Determine severity level for database errors
 */
function getDatabaseErrorSeverity(code: string): ServiceError['severity'] {
  switch (code) {
    case 'PGRST116': // Row not found
      return 'low';
    case '23505': // Unique violation
      return 'medium';
    case '23503': // Foreign key violation
      return 'medium';
    case '42P01': // Table does not exist
      return 'critical';
    case '42703': // Column does not exist
      return 'high';
    default:
      return 'medium';
  }
}

/**
 * Log error for debugging while maintaining user-friendly messages
 */
export function logError(error: ServiceError, userFriendlyMessage?: string): void {
  console.group(`🔍 Error Details: ${error.context || 'Unknown Context'}`);
  console.error('Code:', error.code);
  console.error('Message:', error.message);
  console.error('Severity:', error.severity);
  if (error.details) {
    console.error('Details:', error.details);
  }
  if (userFriendlyMessage) {
    console.info('User Message:', userFriendlyMessage);
  }
  console.groupEnd();
}

/**
 * Get user-friendly error message based on error code
 */
export function getUserFriendlyMessage(error: ServiceError): string {
  switch (error.code) {
    case 'SUPABASE_PGRST116':
      return 'The requested data was not found.';
    case 'SUPABASE_23505':
      return 'This operation conflicts with existing data.';
    case 'NETWORK_ERROR':
      return 'Unable to connect to the server. Please check your internet connection.';
    case 'AUTH_ERROR':
      return 'Please sign in again to continue.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Retry wrapper for operations that might fail temporarily
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Don't retry on authentication or client errors
      if (error?.message?.includes('auth') || error?.code?.startsWith('4')) {
        throw error;
      }
      
      console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
  
  throw lastError;
}

/**
 * Validate required parameters before service operations
 */
export function validateRequired(params: Record<string, any>, requiredFields: string[]): ServiceError | null {
  const missing = requiredFields.filter(field => 
    params[field] === undefined || 
    params[field] === null || 
    params[field] === ''
  );
  
  if (missing.length > 0) {
    return {
      code: 'VALIDATION_ERROR',
      message: `Missing required fields: ${missing.join(', ')}`,
      details: { missingFields: missing, providedParams: Object.keys(params) },
      context: 'validation',
      severity: 'medium'
    };
  }
  
  return null;
}