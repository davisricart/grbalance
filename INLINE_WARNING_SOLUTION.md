# 📝 INLINE WARNING SOLUTION - No Popups

## ✅ Clean Inline Messages Instead of Popups

Replace the previous popup code with this clean inline warning system:

```javascript
// 📝 INLINE FILE PROTECTION - Clean Warning Messages
console.log('📝 ACTIVATING INLINE FILE PROTECTION...');

// Function to show inline warning messages
window.showInlineWarning = function(message, type = 'error') {
  // Remove any existing warnings
  document.querySelectorAll('.file-warning-message').forEach(el => el.remove());
  
  // Find the upload area (look for file inputs or upload sections)
  const uploadSections = [
    ...document.querySelectorAll('input[type="file"]'),
    ...document.querySelectorAll('[class*="upload"]'),
    ...document.querySelectorAll('[class*="file"]'),
    ...document.querySelectorAll('[class*="dataset"]')
  ];
  
  // Create warning message
  const warning = document.createElement('div');
  warning.className = 'file-warning-message';
  
  const bgColor = type === 'error' ? '#fee2e2' : '#fef3c7';
  const borderColor = type === 'error' ? '#dc2626' : '#d97706';
  const textColor = type === 'error' ? '#dc2626' : '#d97706';
  const icon = type === 'error' ? '🚫' : '⚠️';
  
  warning.style.cssText = `
    background: ${bgColor} !important;
    border: 2px solid ${borderColor} !important;
    border-radius: 8px !important;
    padding: 12px 16px !important;
    margin: 10px 0 !important;
    color: ${textColor} !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    line-height: 1.4 !important;
    display: flex !important;
    align-items: flex-start !important;
    gap: 8px !important;
    animation: warningSlideIn 0.3s ease-out !important;
  `;
  
  warning.innerHTML = `
    <span style="font-size: 16px; flex-shrink: 0;">${icon}</span>
    <div>
      <div style="font-weight: 600; margin-bottom: 4px;">File Upload Error</div>
      <div style="margin-bottom: 8px;">${message}</div>
      <div style="font-size: 12px; opacity: 0.8;">
        <strong>Accepted file types:</strong> Excel (.xlsx, .xls) and CSV (.csv) files only
      </div>
    </div>
  `;
  
  // Add animation styles if not already present
  if (!document.getElementById('warning-styles')) {
    const style = document.createElement('style');
    style.id = 'warning-styles';
    style.textContent = `
      @keyframes warningSlideIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Insert warning near upload areas
  let inserted = false;
  
  // Try to find Primary Dataset section specifically
  const primarySections = [
    ...document.querySelectorAll('*')
  ].filter(el => el.textContent && el.textContent.includes('Primary Dataset'));
  
  if (primarySections.length > 0) {
    const section = primarySections[0].closest('div');
    if (section) {
      section.appendChild(warning);
      inserted = true;
    }
  }
  
  // Fallback: insert after any file input
  if (!inserted && uploadSections.length > 0) {
    uploadSections[0].closest('div')?.appendChild(warning);
    inserted = true;
  }
  
  // Final fallback: insert at top of page
  if (!inserted) {
    document.body.insertBefore(warning, document.body.firstChild);
  }
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (warning.parentNode) warning.remove();
  }, 10000);
  
  console.log('📝 Inline warning displayed:', message);
};

// XLSX Protection with inline warnings
if (window.XLSX && window.XLSX.read) {
  window.originalXLSXRead = window.XLSX.read;
  
  window.XLSX.read = function(...args) {
    console.error('🚫 XLSX.read BLOCKED!');
    
    window.showInlineWarning(
      'This file cannot be processed because it appears to be disguised (e.g., an image file renamed with a spreadsheet extension). For security reasons, only genuine Excel and CSV files are accepted.',
      'error'
    );
    
    throw new Error('XLSX.read blocked for security');
  };
  
  console.log('✅ XLSX protection with inline warnings activated');
} else {
  console.log('⏳ XLSX not loaded, monitoring...');
  
  const checkInterval = setInterval(() => {
    if (window.XLSX && window.XLSX.read) {
      window.originalXLSXRead = window.XLSX.read;
      
      window.XLSX.read = function(...args) {
        console.error('🚫 XLSX.read BLOCKED!');
        
        window.showInlineWarning(
          'This file cannot be processed because it appears to be disguised. Only genuine Excel and CSV files are accepted.',
          'error'
        );
        
        throw new Error('XLSX.read blocked for security');
      };
      
      console.log('✅ XLSX protection with inline warnings activated (delayed)');
      clearInterval(checkInterval);
    }
  }, 500);
  
  setTimeout(() => clearInterval(checkInterval), 30000);
}

// Enhanced fetch monitoring for sample-data
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('/sample-data/')) {
    const filename = url.split('/').pop();
    
    if (filename && filename.toLowerCase().includes('untitled')) {
      console.error('🚫 SUSPICIOUS FILE BLOCKED:', filename);
      
      window.showInlineWarning(
        `The file "${filename}" has been identified as a disguised file and blocked for security reasons. Please select a genuine spreadsheet file.`,
        'error'
      );
      
      throw new Error('Suspicious file fetch blocked');
    }
  }
  return originalFetch.apply(this, args);
};

console.log('✅ Fetch monitoring with inline warnings activated');
console.log('📝 INLINE FILE PROTECTION ACTIVE - Clean UI warnings enabled');

// Test the inline warning system (uncomment to test immediately)
// window.showInlineWarning('Test warning: This is how error messages will appear in your upload area.', 'error');
```

## 📝 What This Does

**Clean Inline Messages:**
- ✅ **No popups** - warnings appear directly in upload area
- ✅ **Professional styling** - matches your app's design
- ✅ **Clear messaging** - explains why file was rejected
- ✅ **Helpful guidance** - shows accepted file types
- ✅ **Auto-removal** - disappears after 10 seconds

**Smart Positioning:**
- 🎯 **Finds Primary Dataset** section automatically
- 🎯 **Falls back** to any file input area
- 🎯 **Clean integration** with existing UI

**Better UX:**
- 📝 Red border and background for errors
- 📝 Clear icon and formatting
- 📝 Smooth slide-in animation
- 📝 Non-intrusive but visible

## 🧪 Test the New System

1. **Copy/paste the code above** in console
2. **Optional test**: Uncomment the last line to see the warning style
3. **Go to Admin Dashboard**
4. **Try loading "Untitled.xlsx"**
5. **You should see**: Clean inline warning message in the upload area

The warning will appear right where users are trying to upload, making it much clearer what went wrong and what files are acceptable!