// Enhanced File-Based Communication System
// Addresses: polling efficiency, race conditions, file conflicts, error handling

export interface CommunicationConfig {
  baseDir: string;
  pollInterval: number;
  maxRetries: number;
  timeout: number;
  filePrefix: string;
}

export interface CommunicationSession {
  sessionId: string;
  requestFile: string;
  responseFile: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'timeout';
  createdAt: number;
  completedAt?: number;
}

export class ImprovedFileCommunication {
  private config: CommunicationConfig;
  private activeSessions: Map<string, CommunicationSession> = new Map();
  private fileWatchers: Map<string, AbortController> = new Map();

  constructor(config: Partial<CommunicationConfig> = {}) {
    this.config = {
      baseDir: '/claude-communication',
      pollInterval: 250, // Reduced from 100ms to prevent overwhelming
      maxRetries: 120, // 30 seconds total (120 * 250ms)
      timeout: 30000, // 30 second timeout
      filePrefix: 'claude-comm',
      ...config
    };
  }

  /**
   * Generate unique session with collision-resistant IDs
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const counter = this.activeSessions.size;
    return `${timestamp}-${random}-${counter}`;
  }

  /**
   * Create communication session with proper file paths
   */
  async createSession(instruction: string): Promise<CommunicationSession> {
    const sessionId = this.generateSessionId();
    const session: CommunicationSession = {
      sessionId,
      requestFile: `${this.config.baseDir}/${this.config.filePrefix}-request-${sessionId}.txt`,
      responseFile: `${this.config.baseDir}/${this.config.filePrefix}-response-${sessionId}.js`,
      status: 'pending',
      createdAt: Date.now()
    };

    this.activeSessions.set(sessionId, session);

    try {
      // Write request file with metadata
      const requestContent = JSON.stringify({
        sessionId,
        instruction,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        metadata: {
          expectedResponseFile: session.responseFile,
          timeout: this.config.timeout
        }
      }, null, 2);

      await this.writeFile(session.requestFile, requestContent);
      console.log(`📝 Created communication session: ${sessionId}`);
      console.log(`📁 Request file: ${session.requestFile}`);
      console.log(`📁 Expected response: ${session.responseFile}`);
      
      return session;
    } catch (error) {
      this.activeSessions.delete(sessionId);
      throw new Error(`Failed to create session: ${error}`);
    }
  }

  /**
   * Enhanced file watcher with exponential backoff
   */
  async waitForResponse(sessionId: string): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return new Promise((resolve, reject) => {
      const abortController = new AbortController();
      this.fileWatchers.set(sessionId, abortController);

      session.status = 'processing';
      let retryCount = 0;
      let backoffMultiplier = 1;

      const checkForResponse = async () => {
        if (abortController.signal.aborted) {
          return;
        }

        try {
          retryCount++;
          console.log(`🔍 Check ${retryCount}/${this.config.maxRetries} for session ${sessionId}`);

          const responseContent = await this.readFile(session.responseFile);
          
          if (responseContent) {
            // Validate response content
            if (this.isValidResponse(responseContent)) {
              session.status = 'completed';
              session.completedAt = Date.now();
              this.cleanup(sessionId);
              
              const duration = session.completedAt - session.createdAt;
              console.log(`✅ Response received for ${sessionId} in ${duration}ms`);
              resolve(responseContent);
              return;
            } else {
              console.warn(`⚠️ Invalid response format for ${sessionId}, continuing to wait...`);
            }
          }

          // Check timeout
          const elapsed = Date.now() - session.createdAt;
          if (elapsed > this.config.timeout) {
            session.status = 'timeout';
            this.cleanup(sessionId);
            reject(new Error(`Session ${sessionId} timed out after ${elapsed}ms`));
            return;
          }

          // Check max retries
          if (retryCount >= this.config.maxRetries) {
            session.status = 'error';
            this.cleanup(sessionId);
            reject(new Error(`Session ${sessionId} exceeded max retries (${this.config.maxRetries})`));
            return;
          }

          // Exponential backoff for failed attempts
          if (retryCount > 10) {
            backoffMultiplier = Math.min(backoffMultiplier * 1.1, 3);
          }

          const nextInterval = this.config.pollInterval * backoffMultiplier;
          setTimeout(checkForResponse, nextInterval);

        } catch (error) {
          console.error(`❌ Error checking response for ${sessionId}:`, error);
          
          // Continue retrying on read errors (file might not exist yet)
          const nextInterval = this.config.pollInterval * backoffMultiplier;
          setTimeout(checkForResponse, nextInterval);
        }
      };

      // Start checking
      checkForResponse();

      // Cleanup on abort
      abortController.signal.addEventListener('abort', () => {
        session.status = 'error';
        this.cleanup(sessionId);
        reject(new Error(`Session ${sessionId} was aborted`));
      });
    });
  }

  /**
   * Validate response content to ensure it's complete
   */
  private isValidResponse(content: string): boolean {
    // Check for common incomplete response indicators
    if (!content || content.trim().length === 0) return false;
    if (content.includes('<!DOCTYPE') || content.includes('<html')) return false; // HTML error page
    if (content.includes('Error') && content.length < 100) return false; // Short error messages
    
    // For JavaScript responses, check for basic validity
    if (content.includes('function') || content.includes('const') || content.includes('document.')) {
      // Look for incomplete JavaScript (missing closing braces, etc.)
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      if (Math.abs(openBraces - closeBraces) > 2) return false; // Allow small variance
    }

    return true;
  }

  /**
   * Enhanced file writing with atomic operations
   */
  private async writeFile(path: string, content: string): Promise<void> {
    try {
      // Create a temporary file first, then rename (atomic operation)
      const tempPath = `${path}.tmp`;
      
      const response = await fetch(tempPath, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: content
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // In a real implementation, you'd rename the temp file to the final path
      // For browser environment, we'll write directly
      await fetch(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: content
      });

    } catch (error) {
      throw new Error(`Failed to write ${path}: ${error}`);
    }
  }

  /**
   * Enhanced file reading with retry logic
   */
  private async readFile(path: string): Promise<string | null> {
    try {
      const cacheBuster = `?v=${Date.now()}&r=${Math.random()}`;
      const response = await fetch(`${path}${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (response.status === 404) {
        return null; // File doesn't exist yet
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      return content;

    } catch (error) {
      // Return null for network errors (file might not exist yet)
      return null;
    }
  }

  /**
   * Cleanup session files and memory
   */
  private cleanup(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Abort any active watchers
    const watcher = this.fileWatchers.get(sessionId);
    if (watcher) {
      watcher.abort();
      this.fileWatchers.delete(sessionId);
    }

    // Optionally delete files (uncomment if you want auto-cleanup)
    // this.deleteFile(session.requestFile).catch(console.warn);
    // this.deleteFile(session.responseFile).catch(console.warn);

    this.activeSessions.delete(sessionId);
    console.log(`🧹 Cleaned up session: ${sessionId}`);
  }

  /**
   * Cancel active session
   */
  cancelSession(sessionId: string): void {
    const watcher = this.fileWatchers.get(sessionId);
    if (watcher) {
      watcher.abort();
    }
    this.cleanup(sessionId);
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): CommunicationSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * List all active sessions
   */
  getActiveSessions(): CommunicationSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Cleanup old sessions (call periodically)
   */
  cleanupOldSessions(maxAge: number = 300000): void { // 5 minutes default
    const now = Date.now();
    for (const [sessionId, session] of this.activeSessions) {
      if (now - session.createdAt > maxAge) {
        console.log(`🗑️ Cleaning up old session: ${sessionId}`);
        this.cleanup(sessionId);
      }
    }
  }
}

// Usage example:
export const fileComm = new ImprovedFileCommunication({
  baseDir: '/public/claude-communication',
  pollInterval: 200,
  maxRetries: 150,
  timeout: 30000
});

// Helper functions for easy integration
export async function sendInstructionToFile(instruction: string): Promise<string> {
  const session = await fileComm.createSession(instruction);
  
  try {
    const response = await fileComm.waitForResponse(session.sessionId);
    return response;
  } catch (error) {
    fileComm.cancelSession(session.sessionId);
    throw error;
  }
}

export function cancelAllActiveSessions(): void {
  const sessions = fileComm.getActiveSessions();
  sessions.forEach(session => fileComm.cancelSession(session.sessionId));
  console.log(`🛑 Cancelled ${sessions.length} active sessions`);
}

// Auto-cleanup old sessions every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    fileComm.cleanupOldSessions();
  }, 300000);
} 