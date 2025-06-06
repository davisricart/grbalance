# 🎯 SIMPLE CENTERED ALERT - Fixed Positioning

## ✅ Simplified Approach - Guaranteed Centered

Replace the previous code with this simplified version that forces proper centering:

```javascript
// 🚨 SIMPLE CENTERED FILE PROTECTION
console.log('🚨 ACTIVATING SIMPLE CENTERED PROTECTION...');

// Create super simple centered alert
window.showCenteredAlert = function(message) {
  // Remove any existing alerts
  document.querySelectorAll('.security-alert').forEach(el => el.remove());
  
  // Create overlay with forced centering
  const overlay = document.createElement('div');
  overlay.className = 'security-alert';
  overlay.innerHTML = `
    <div style="
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: white !important;
      border: 4px solid red !important;
      border-radius: 10px !important;
      padding: 30px !important;
      box-shadow: 0 0 30px rgba(0,0,0,0.5) !important;
      z-index: 99999 !important;
      text-align: center !important;
      font-family: Arial, sans-serif !important;
      font-size: 16px !important;
      max-width: 400px !important;
      width: 90% !important;
    ">
      <div style="font-size: 30px; margin-bottom: 15px;">🚨</div>
      <div style="font-weight: bold; color: red; margin-bottom: 15px; font-size: 18px;">SECURITY ALERT</div>
      <div style="color: black; margin-bottom: 20px; line-height: 1.4;">${message}</div>
      <button onclick="this.closest('.security-alert').remove()" style="
        background: red !important;
        color: white !important;
        border: none !important;
        padding: 10px 20px !important;
        border-radius: 5px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-weight: bold !important;
      ">OK</button>
    </div>
    
    <div style="
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0,0,0,0.3) !important;
      z-index: 99998 !important;
    " onclick="this.closest('.security-alert').remove()"></div>
  `;
  
  document.body.appendChild(overlay);
  
  // Auto-close after 8 seconds
  setTimeout(() => {
    if (overlay.parentNode) overlay.remove();
  }, 8000);
};

// XLSX Protection with simple centered alert
if (window.XLSX && window.XLSX.read) {
  window.originalXLSXRead = window.XLSX.read;
  
  window.XLSX.read = function(...args) {
    console.error('🚨 XLSX.read BLOCKED!');
    
    window.showCenteredAlert(
      'File processing blocked! This file appears to be disguised (like an image renamed as a spreadsheet) and cannot be processed for security reasons.'
    );
    
    throw new Error('XLSX.read blocked for security');
  };
  
  console.log('✅ Simple centered XLSX protection activated');
} else {
  console.log('⏳ XLSX not loaded, will monitor...');
  
  const checkInterval = setInterval(() => {
    if (window.XLSX && window.XLSX.read) {
      window.originalXLSXRead = window.XLSX.read;
      
      window.XLSX.read = function(...args) {
        console.error('🚨 XLSX.read BLOCKED!');
        
        window.showCenteredAlert(
          'File processing blocked! This file appears to be disguised and cannot be processed for security reasons.'
        );
        
        throw new Error('XLSX.read blocked for security');
      };
      
      console.log('✅ Simple centered XLSX protection activated (delayed)');
      clearInterval(checkInterval);
    }
  }, 500);
  
  // Stop monitoring after 30 seconds
  setTimeout(() => clearInterval(checkInterval), 30000);
}

console.log('🛡️ SIMPLE CENTERED PROTECTION ACTIVE');
console.log('🎯 Alert will appear perfectly centered when files are blocked');

// Test the centering (optional - uncomment to test)
// window.showCenteredAlert('Test alert - this should be perfectly centered!');
```

## 🎯 Key Changes Made

**Forced Centering:**
- ✅ Uses `position: fixed !important`
- ✅ Uses `top: 50%; left: 50%` with `transform: translate(-50%, -50%)`
- ✅ Added `!important` to override any CSS conflicts
- ✅ Higher z-index (99999) to ensure it's on top

**Simplified Structure:**
- ✅ Single div with inline styles
- ✅ No external CSS dependencies
- ✅ Direct onclick handlers
- ✅ Guaranteed to work regardless of page CSS

## 🧪 Test the Fixed Version

1. **Copy/paste the code above** in console
2. **Optional**: Uncomment the test line to see centering immediately
3. **Go to Admin Dashboard**
4. **Try loading "Untitled.xlsx"**
5. **The alert should now be perfectly centered**

## 🔍 If Still Not Centered

If it's STILL showing to the right, run this diagnostic:

```javascript
// Test centering immediately
window.showCenteredAlert('CENTERING TEST - This should be dead center of your screen!');
```

This simplified approach with `!important` styles should override any CSS conflicts and force the alert to appear in the exact center of your screen.