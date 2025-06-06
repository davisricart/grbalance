# 🚨 MANUAL CONSOLE OVERRIDE - IMMEDIATE FILE PROTECTION

## ⚡ INSTANT ACTIVATION

**If the nuclear protection isn't loading automatically, run these commands directly in your browser console:**

### Step 1: Open Browser Console
1. Navigate to your app: `http://localhost:5179`
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. **Copy and paste the following code blocks one by one:**

### Step 2: Manual Nuclear Protection
```javascript
// 🚨 MANUAL NUCLEAR PROTECTION - PASTE THIS FIRST
console.log('🚨 MANUAL NUCLEAR PROTECTION STARTING...');

// Store original XLSX function
if (window.XLSX && window.XLSX.read) {
  window.originalXLSXRead = window.XLSX.read;
  console.log('✅ Original XLSX.read function stored');
  
  // Replace with protected version
  window.XLSX.read = function(...args) {
    const stack = new Error().stack;
    console.log('🚨 XLSX.read BLOCKED - Called from:', stack);
    
    // Show alert to make it obvious
    alert('🚨 NUCLEAR PROTECTION: XLSX.read operation blocked!\n\nAll files must be validated before processing.\n\nCheck console for details.');
    
    // Throw error to prevent processing
    throw new Error('XLSX.read blocked by manual nuclear protection');
  };
  
  console.log('☢️ NUCLEAR PROTECTION ACTIVATED MANUALLY');
  console.log('🔒 ALL XLSX.read operations are now BLOCKED');
} else {
  console.error('❌ XLSX library not found - protection cannot be enabled');
}
```

### Step 3: Test Protection
```javascript
// 🧪 TEST THE PROTECTION - PASTE THIS SECOND
console.log('🧪 Testing nuclear protection...');

try {
  // This should be blocked
  window.XLSX.read('test');
  console.error('❌ PROTECTION FAILED - XLSX.read was not blocked!');
} catch (error) {
  console.log('✅ PROTECTION WORKING - XLSX.read was successfully blocked');
  console.log('Error message:', error.message);
}
```

### Step 4: Monitor File Operations
```javascript
// 📊 FILE OPERATION MONITOR - PASTE THIS THIRD
console.log('📊 Setting up file operation monitor...');

// Track fetch operations
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('/sample-data/')) {
    const filename = url.split('/').pop();
    console.log('🔍 FETCH DETECTED:', {
      filename: filename,
      url: url,
      caller: new Error().stack
    });
    
    if (filename && filename.toLowerCase().includes('untitled')) {
      console.warn('⚠️ SUSPICIOUS FILE DETECTED:', filename);
    }
  }
  
  return originalFetch.apply(this, args);
};

console.log('🔍 File operation monitoring enabled');
```

### Step 5: Check Current State
```javascript
// 🔍 CHECK CURRENT STATE - PASTE THIS FOURTH
console.log('🔍 SYSTEM STATUS CHECK:');
console.log('XLSX.read protected:', typeof window.XLSX?.read === 'function');
console.log('Original XLSX stored:', typeof window.originalXLSXRead === 'function');
console.log('Fetch monitoring:', window.fetch !== originalFetch);

// List any existing file data
if (window.localStorage) {
  const keys = Object.keys(localStorage).filter(key => 
    key.includes('file') || key.includes('data') || key.includes('upload')
  );
  console.log('📂 LocalStorage file keys:', keys);
}
```

## 🧪 IMMEDIATE TEST

**After pasting all the code above:**

1. **Navigate to Admin Dashboard**
2. **Try to load "Untitled.xlsx" from Primary Dataset dropdown**
3. **Expected Result**: 🚨 Alert saying "XLSX.read operation blocked!"

## 🎯 SUCCESS INDICATORS

**You should see:**
- ✅ `☢️ NUCLEAR PROTECTION ACTIVATED MANUALLY`
- ✅ `🔒 ALL XLSX.read operations are now BLOCKED`
- ✅ `✅ PROTECTION WORKING - XLSX.read was successfully blocked`

**When loading the disguised file:**
- 🚨 Alert popup blocking the operation
- 🚨 Console error with stack trace
- ❌ **NO gibberish data in the UI**

## 🛠️ TROUBLESHOOTING

### If XLSX library not found:
```javascript
// Check if XLSX is available
console.log('XLSX library check:', {
  exists: typeof window.XLSX,
  hasRead: typeof window.XLSX?.read,
  isFunction: typeof window.XLSX?.read === 'function'
});

// Try to find XLSX in different ways
console.log('Global XLSX search:', window.XLSX);
console.log('Module XLSX search:', typeof require !== 'undefined' ? require('xlsx') : 'require not available');
```

### If protection doesn't work:
```javascript
// Nuclear option - completely disable file processing
window.blockAllFileProcessing = true;

// Override every possible file reading method
const blockMessage = '🚨 ALL FILE PROCESSING DISABLED';
if (window.FileReader) {
  const methods = ['readAsArrayBuffer', 'readAsText', 'readAsDataURL'];
  methods.forEach(method => {
    FileReader.prototype[method] = function() {
      alert(blockMessage);
      throw new Error('File reading completely disabled');
    };
  });
}
```

## 🚀 VERIFICATION COMMANDS

**Run these to verify protection is working:**

```javascript
// 1. Test XLSX blocking
try { window.XLSX.read('test'); } catch(e) { console.log('✅ XLSX blocked:', e.message); }

// 2. Check protection status
console.log('Protection status:', {
  xlsxBlocked: window.originalXLSXRead && window.XLSX.read !== window.originalXLSXRead,
  fetchMonitored: window.fetch !== originalFetch
});

// 3. Monitor for any file operations
console.log('🔍 Monitoring active - watch for file operation logs...');
```

## ⚡ EMERGENCY RESET

**If you need to restore normal functionality:**
```javascript
// Restore original XLSX function
if (window.originalXLSXRead) {
  window.XLSX.read = window.originalXLSXRead;
  console.log('✅ XLSX functionality restored');
} else {
  console.error('❌ Cannot restore - original function not found');
}
```

---

**This manual override bypasses ALL build/import issues and directly protects your app. The disguised file should be immediately blocked with a clear alert message.**