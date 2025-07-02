import React from 'react';
import { AlertCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

import { logger } from '../utils/errorHandling';
import { ErrorInfo } from '../types';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error Boundary Caught Error', { 
      error: error.message, 
      stack: error.stack,
      errorInfo 
    }, 'ErrorBoundary');
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-lg w-full text-center">
            <AlertCircle className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We're having trouble loading this page. Please try refreshing or contact support if the problem persists.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
              >
                Refresh Page
              </button>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors duration-200"
              >
                <Home className="h-5 w-5 mr-2" />
                Return Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  retry?: () => void;
}

export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, retry }) => (
  <div className="error-boundary-fallback p-6 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto mt-8">
    <div className="flex items-center mb-4">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
      </div>
    </div>
    
    <div className="text-sm text-red-700 mb-4">
      <p>We've encountered an unexpected error. This issue has been automatically reported.</p>
    </div>
    
    {process.env.NODE_ENV === 'development' && error && (
      <details className="text-sm text-red-700 mb-4">
        <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
        <pre className="mt-2 whitespace-pre-wrap text-xs bg-red-100 p-2 rounded border overflow-auto max-h-32">
          {error.message}
          {error.stack && '\n\nStack trace:\n' + error.stack}
        </pre>
      </details>
    )}
    
    <div className="flex space-x-3">
      {retry && (
        <button 
          onClick={retry}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Try Again
        </button>
      )}
      <button 
        onClick={() => window.location.reload()} 
        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

// Specialized Error Boundaries for different sections
export const FileUploadErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    fallback={({ error, retry }) => (
      <div className="error-boundary-fallback p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center mb-3">
          <svg className="h-5 w-5 text-orange-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-sm font-medium text-orange-800">File Upload Error</h3>
        </div>
        <p className="text-sm text-orange-700 mb-3">
          There was an error processing your file upload. Please try selecting a different file.
        </p>
        {retry && (
          <button 
            onClick={retry}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
          >
            Try Again
          </button>
        )}
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export const AnalysisErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    fallback={({ error, retry }) => (
      <div className="error-boundary-fallback p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center mb-3">
          <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-sm font-medium text-blue-800">Analysis Error</h3>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          There was an error during the analysis process. Your data is safe and you can try again.
        </p>
        {retry && (
          <button 
            onClick={retry}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retry Analysis
          </button>
        )}
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}