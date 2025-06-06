// Inline File Protection - Activated in Components
// This runs directly in components to ensure protection is active

import React, { useEffect } from 'react';

// Global protection state
let protectionEnabled = false;
let originalXLSXRead: any = null;

const enableInlineProtection = () => {
  if (protectionEnabled) return;
  
  try {
    console.log('🔒 INLINE PROTECTION: Activating...');
    
    // Check if XLSX is available
    const XLSX = (window as any).XLSX;
    if (!XLSX || !XLSX.read) {
      console.warn('⚠️ XLSX library not yet available - will retry');
      return false;
    }
    
    // Store original function
    originalXLSXRead = XLSX.read;
    
    // Replace with protected version
    XLSX.read = (...args: any[]) => {
      const stack = new Error().stack || '';
      const caller = extractCaller(stack);
      
      console.log('🚨 XLSX.read INTERCEPTED from:', caller);
      
      // Check if call is from a validated source
      const validSources = [
        'bulletproofFileValidator',
        'universalFileValidator',
        'safeLoadFile',
        'processFileWithChunking',
        'handleFileUpload'
      ];
      
      const isValidated = validSources.some(source => caller.includes(source));
      
      if (!isValidated) {
        const blockMessage = `🚨 INLINE PROTECTION: XLSX.read BLOCKED!
        
Caller: ${caller}

All files must be validated before processing.
This call was blocked because it didn't come from a validated source.`;
        
        console.error(blockMessage);
        alert(blockMessage);
        throw new Error('XLSX.read blocked by inline protection');
      }
      
      console.log('✅ XLSX.read ALLOWED from validated source:', caller);
      return originalXLSXRead.apply(XLSX, args);
    };
    
    protectionEnabled = true;
    console.log('✅ INLINE PROTECTION: Successfully activated');
    return true;
    
  } catch (error) {
    console.error('❌ INLINE PROTECTION: Failed to activate:', error);
    return false;
  }
};

const extractCaller = (stack: string): string => {
  const lines = stack.split('\n');
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('inlineFileProtection') && 
        !line.includes('enableInlineProtection')) {
      return line.trim();
    }
  }
  return 'unknown caller';
};

// React hook to enable protection
export const useInlineFileProtection = () => {
  useEffect(() => {
    // Try to enable protection immediately
    if (!enableInlineProtection()) {
      // If XLSX not available yet, retry every 100ms for up to 5 seconds
      let attempts = 0;
      const maxAttempts = 50;
      
      const retryInterval = setInterval(() => {
        attempts++;
        
        if (enableInlineProtection()) {
          clearInterval(retryInterval);
          console.log('✅ INLINE PROTECTION: Activated after', attempts, 'attempts');
        } else if (attempts >= maxAttempts) {
          clearInterval(retryInterval);
          console.error('❌ INLINE PROTECTION: Failed to activate after', maxAttempts, 'attempts');
        }
      }, 100);
      
      return () => clearInterval(retryInterval);
    }
  }, []);
  
  return { protectionEnabled };
};

// Component to add to your app
export const InlineFileProtectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { protectionEnabled } = useInlineFileProtection();
  
  return (
    <>
      {children}
      {/* Visual indicator */}
      {protectionEnabled && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: '#ff0000',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}>
          🔒 FILE PROTECTION ACTIVE
        </div>
      )}
    </>
  );
};

// Manual activation function (call from console)
(window as any).enableInlineProtection = enableInlineProtection;
(window as any).disableInlineProtection = () => {
  if (originalXLSXRead && (window as any).XLSX) {
    (window as any).XLSX.read = originalXLSXRead;
    protectionEnabled = false;
    console.log('🔓 INLINE PROTECTION: Disabled');
  }
};

(window as any).checkInlineProtection = () => {
  console.log('🔍 INLINE PROTECTION STATUS:', {
    enabled: protectionEnabled,
    xlsxAvailable: typeof (window as any).XLSX?.read,
    originalStored: typeof originalXLSXRead
  });
};

export default InlineFileProtectionProvider;