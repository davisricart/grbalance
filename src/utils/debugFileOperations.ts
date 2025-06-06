// Comprehensive Debug System for File Operations
// This will help us track down EXACTLY where the bypass is happening

interface FileOperation {
  timestamp: string;
  operation: string;
  filename: string;
  source: string;
  validated: boolean;
  result: 'success' | 'blocked' | 'error';
  details: string;
}

class FileOperationTracker {
  private operations: FileOperation[] = [];
  private isEnabled = true;

  constructor() {
    console.log('🔍 FileOperationTracker initialized - monitoring ALL file operations');
    this.interceptXLSXRead();
    this.interceptFetch();
    this.interceptFileReader();
  }

  private log(operation: FileOperation) {
    if (!this.isEnabled) return;
    
    this.operations.push(operation);
    
    const emoji = operation.result === 'blocked' ? '🚨' : 
                 operation.result === 'error' ? '❌' : '✅';
    
    console.log(`${emoji} FILE OP: ${operation.operation}`, {
      filename: operation.filename,
      source: operation.source,
      validated: operation.validated,
      result: operation.result,
      details: operation.details
    });

    // Alert on unvalidated file operations
    if (!operation.validated && operation.result === 'success') {
      console.error('🚨 SECURITY BREACH: Unvalidated file operation detected!', operation);
      if (typeof window !== 'undefined') {
        const msg = `🚨 SECURITY ALERT: File "${operation.filename}" was processed without validation!\n\nSource: ${operation.source}\nOperation: ${operation.operation}`;
        alert(msg);
      }
    }
  }

  private interceptXLSXRead() {
    const originalXLSX = (window as any).XLSX;
    if (!originalXLSX) return;

    const originalRead = originalXLSX.read;
    originalXLSX.read = (...args: any[]) => {
      const stackTrace = new Error().stack || '';
      const caller = this.extractCaller(stackTrace);
      
      this.log({
        timestamp: new Date().toISOString(),
        operation: 'XLSX.read',
        filename: 'unknown',
        source: caller,
        validated: false, // We assume false unless proven otherwise
        result: 'success',
        details: `XLSX.read called from ${caller}`
      });

      return originalRead.apply(originalXLSX, args);
    };
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async (...args: any[]) => {
      const url = args[0];
      let filename = 'unknown';
      
      if (typeof url === 'string' && url.includes('/sample-data/')) {
        filename = url.split('/').pop() || 'unknown';
        const stackTrace = new Error().stack || '';
        const caller = this.extractCaller(stackTrace);
        
        this.log({
          timestamp: new Date().toISOString(),
          operation: 'fetch',
          filename,
          source: caller,
          validated: caller.includes('universalFileValidator') || caller.includes('safeLoadFile'),
          result: 'success',
          details: `Fetching ${url} from ${caller}`
        });
      }

      return originalFetch.apply(window, args);
    };
  }

  private interceptFileReader() {
    const originalFileReader = window.FileReader;
    
    class TrackedFileReader extends originalFileReader {
      constructor() {
        super();
        
        const originalReadAsArrayBuffer = this.readAsArrayBuffer;
        this.readAsArrayBuffer = (file: File) => {
          const stackTrace = new Error().stack || '';
          const caller = fileTracker.extractCaller(stackTrace);
          
          fileTracker.log({
            timestamp: new Date().toISOString(),
            operation: 'FileReader.readAsArrayBuffer',
            filename: file.name,
            source: caller,
            validated: caller.includes('validator') || caller.includes('validation'),
            result: 'success',
            details: `Reading ${file.name} as ArrayBuffer from ${caller}`
          });

          return originalReadAsArrayBuffer.call(this, file);
        };
      }
    }

    (window as any).FileReader = TrackedFileReader;
  }

  private extractCaller(stackTrace: string): string {
    const lines = stackTrace.split('\n');
    // Find the first line that's not from this debug file
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes('debugFileOperations') && 
          !line.includes('interceptXLSXRead') && 
          !line.includes('interceptFetch')) {
        return line.trim();
      }
    }
    return 'unknown caller';
  }

  public getOperations(): FileOperation[] {
    return [...this.operations];
  }

  public getUnvalidatedOperations(): FileOperation[] {
    return this.operations.filter(op => !op.validated && op.result === 'success');
  }

  public generateReport(): string {
    const total = this.operations.length;
    const unvalidated = this.getUnvalidatedOperations().length;
    const blocked = this.operations.filter(op => op.result === 'blocked').length;
    
    let report = `📊 FILE OPERATION REPORT\n`;
    report += `======================\n`;
    report += `Total Operations: ${total}\n`;
    report += `Validated: ${total - unvalidated}\n`;
    report += `⚠️  UNVALIDATED: ${unvalidated}\n`;
    report += `🚨 Blocked: ${blocked}\n\n`;
    
    if (unvalidated > 0) {
      report += `🚨 SECURITY BREACHES:\n`;
      this.getUnvalidatedOperations().forEach(op => {
        report += `  • ${op.operation} on "${op.filename}" from ${op.source}\n`;
      });
    } else {
      report += `✅ All file operations are properly validated!\n`;
    }
    
    return report;
  }

  public clear() {
    this.operations = [];
  }
}

// Create global tracker instance
const fileTracker = new FileOperationTracker();

// Export for console access
(window as any).fileTracker = fileTracker;

export default fileTracker;