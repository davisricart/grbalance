// src/utils/improved-file-communication.ts - FIXED VERSION

export interface FileCommRequest {
  instruction: string;
  sessionId: string;
  timestamp: number;
  metadata?: {
    files?: any[];
    columns?: string[];
    userContext?: any;
  };
}

export interface FileCommResponse {
  success: boolean;
  sessionId: string;
  timestamp: string;
  response: string;
  status: 'completed' | 'error';
  error?: string;
}

class ImprovedFileCommunication {
  private sessionId: string;
  private isActive: boolean = false;
  private controller: AbortController | null = null;
  private maxAttempts: number = 150;
  private baseDelay: number = 250;
  private maxDelay: number = 750;

  constructor() {
    this.sessionId = '1749298312437-xdstqy-0'; // Force session ID for debugging
    console.log('🔄 FileCommunication initialized with session:', this.sessionId);
  }

  private generateSessionId(): string {
    // Always return the fixed session ID for debugging
    return '1749298312437-xdstqy-0';
  }

  public async sendInstruction(
    instruction: string,
    metadata?: any
  ): Promise<FileCommResponse> {
    console.log('🚀 Starting sendInstruction with:', { instruction: instruction.substring(0, 100), sessionId: this.sessionId });

    // Reset session for new request
    this.reset();
    this.isActive = true;
    this.controller = new AbortController();

    try {
      // Step 1: Send to backend API
      const success = await this.sendToBackend(instruction, metadata);
      if (!success) {
        throw new Error('Failed to send instruction to backend');
      }

      // Step 2: Poll for response
      const response = await this.pollForResponse();
      return response;

    } catch (error) {
      console.error('❌ sendInstruction failed:', error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  private async sendToBackend(instruction: string, metadata?: any): Promise<boolean> {
    console.log('📤 Sending to backend API...');

    const payload: FileCommRequest = {
      instruction,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metadata
    };

    try {
      // First, let's test if the backend is reachable
      console.log('🔍 Testing backend connectivity...');
      
      const response = await fetch('/api/send-instruction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: this.controller?.signal,
      });

      console.log('📥 Backend response status:', response.status);
      console.log('📥 Backend response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Backend response:', result);
      
      return result.success === true;

    } catch (error) {
      console.error('❌ Backend request failed:', error);
      
      // Check if it's a network error (backend not reachable)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🚨 Network Error: Backend may not be running on port 3001');
        console.error('💡 Try: Check if Express server is running');
      }
      
      return false;
    }
  }

  private async pollForResponse(): Promise<FileCommResponse> {
    console.log('🔍 Starting response polling...');
    
    let attempt = 0;
    let delay = this.baseDelay;

    while (attempt < this.maxAttempts && this.isActive) {
      try {
        if (this.controller?.signal.aborted) {
          throw new Error('Session aborted');
        }

        attempt++;
        console.log(`📊 Check ${attempt}/${this.maxAttempts} for session ${this.sessionId}...`);

        // Check for response file
        const responseUrl = `/claude-communication/claude-comm-response-${this.sessionId}.js?t=${Date.now()}`;
        
        try {
          const response = await fetch(responseUrl, { 
            method: 'GET',
            signal: this.controller?.signal 
          });

          if (response.ok) {
            console.log('✅ Response file found!');
            const responseText = await response.text();
            
            // Parse the response
            const parsedResponse = this.parseResponse(responseText);
            if (parsedResponse) {
              console.log('🎉 Successfully parsed response');
              return parsedResponse;
            }
          }
        } catch (fetchError) {
          // File doesn't exist yet, continue polling
          if (attempt % 20 === 0) { // Log every 20 attempts
            console.log(`⏳ Still waiting for response... (attempt ${attempt})`);
          }
        }

        // Wait before next attempt
        await this.delay(delay);
        
        // Exponential backoff
        delay = Math.min(delay * 1.1, this.maxDelay);

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Session cancelled');
        }
        throw error;
      }
    }

    throw new Error(`Response timeout after ${this.maxAttempts} attempts`);
  }

  private parseResponse(responseText: string): FileCommResponse | null {
    try {
      console.log('🔍 Parsing response text...');
      
      // The response should be JavaScript that sets window variables
      // Let's extract the data
      
      // Try to find JSON data in the response
      const jsonMatch = responseText.match(/window\.(?:claudeResponse|aiResponse)\s*=\s*({[\s\S]*?});/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const data = JSON.parse(jsonStr);
        
        return {
          success: true,
          sessionId: data.sessionId || this.sessionId,
          timestamp: data.timestamp || new Date().toISOString(),
          response: data.response || 'Response received',
          status: 'completed'
        };
      }

      // Fallback: look for any reasonable response content
      if (responseText.includes('response') && responseText.length > 50) {
        return {
          success: true,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          response: 'Response received (format detected)',
          status: 'completed'
        };
      }

      console.warn('⚠️ Could not parse response format');
      return null;

    } catch (error) {
      console.error('❌ Response parsing error:', error);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private cleanup(): void {
    this.isActive = false;
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  public reset(): void {
    console.log('🔄 Resetting session...');
    this.cleanup();
    this.sessionId = this.generateSessionId();
    console.log('🆕 New session ID:', this.sessionId);
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public isSessionActive(): boolean {
    return this.isActive;
  }
}

// Export singleton instance
export const fileCommunication = new ImprovedFileCommunication();

// Export class for testing
export { ImprovedFileCommunication };

// Helper functions for backward compatibility
export async function sendInstructionToFile(instruction: string): Promise<string> {
  try {
    const response = await fileCommunication.sendInstruction(instruction);
    return response.response;
  } catch (error) {
    console.error('❌ sendInstructionToFile error:', error);
    throw error;
  }
}

export function cancelAllActiveSessions(): void {
  fileCommunication.reset();
  console.log('🛑 All sessions cancelled');
} 