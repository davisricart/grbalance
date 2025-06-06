// Test script for double extension vulnerability
// Creates files specifically to test "filename.xlsx.jpg" type attacks

const fs = require('fs');
const path = require('path');

console.log('🚨 Testing Double Extension Attack Prevention');
console.log('=============================================\n');

// Double extension attack test files
const doubleExtensionFiles = {
  // JPEG disguised with spreadsheet extensions
  'Untitled.xlsx.jpg': Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
  ]),
  
  'Report.csv.png': Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01
  ]),
  
  'Data.xls.gif': Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00,
    0x00, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C
  ]),
  
  'Financial.xlsx.bmp': Buffer.from([
    0x42, 0x4D, 0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x36, 0x00,
    0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00
  ]),
  
  'Budget.csv.webp': Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x28, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    0x56, 0x50, 0x38, 0x20, 0x1C, 0x00, 0x00, 0x00, 0x30, 0x01
  ]),
  
  // Triple extension attack
  'Malicious.xlsx.csv.jpg': Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE1, 0x00, 0x16, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00
  ]),
  
  // Executable disguised as spreadsheet
  'Invoice.xlsx.exe': Buffer.from([
    0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0x00, 0x00, 0xB8, 0x00, 0x00, 0x00
  ]),
  
  // Audio file disguised
  'Music.csv.mp3': Buffer.from([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x54, 0x49,
    0x54, 0x32, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]),
  
  // Video file disguised  
  'Video.xlsx.mp4': Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
    0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6F, 0x6D
  ]),
  
  // Valid files for comparison
  'RealCSV.csv': Buffer.from('Name,Age,City\nJohn,30,New York\nJane,25,Boston\nBob,35,Chicago'),
  
  // Edge case: filename ends with valid extension but content is different
  'NotReallyExcel.xlsx': Buffer.from([
    0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00,
    // This is a ZIP file but not a valid Excel file
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ])
};

// Create test directory
const testDir = path.join(__dirname, 'double-extension-tests');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir);
}

console.log('📁 Creating double extension attack test files...');
for (const [filename, content] of Object.entries(doubleExtensionFiles)) {
  const filePath = path.join(testDir, filename);
  fs.writeFileSync(filePath, content);
  console.log(`   ✅ Created: ${filename}`);
}

console.log('\n🔍 Expected Results with Bulletproof Validation:');
console.log('================================================');

const expectedResults = {
  'Untitled.xlsx.jpg': '❌ REJECTED - JPEG detected (ignores .xlsx)',
  'Report.csv.png': '❌ REJECTED - PNG detected (ignores .csv)',
  'Data.xls.gif': '❌ REJECTED - GIF detected (ignores .xls)', 
  'Financial.xlsx.bmp': '❌ REJECTED - BMP detected (ignores .xlsx)',
  'Budget.csv.webp': '❌ REJECTED - WebP detected (ignores .csv)',
  'Malicious.xlsx.csv.jpg': '❌ REJECTED - JPEG detected + Security Alert',
  'Invoice.xlsx.exe': '❌ REJECTED - Executable detected + Security Alert',
  'Music.csv.mp3': '❌ REJECTED - MP3 detected (ignores .csv)',
  'Video.xlsx.mp4': '❌ REJECTED - MP4 detected (ignores .xlsx)',
  'RealCSV.csv': '✅ ACCEPTED - Valid CSV content',
  'NotReallyExcel.xlsx': '❌ REJECTED - ZIP but not valid Excel'
};

console.log('\nDetailed Expectations:');
for (const [filename, expected] of Object.entries(expectedResults)) {
  console.log(`${filename}:`);
  console.log(`   ${expected}`);
  
  if (filename.includes('Malicious') || filename.includes('Invoice')) {
    console.log(`   🚨 Should show SECURITY ALERT for multiple extensions`);
  }
}

console.log('\n🧪 TESTING INSTRUCTIONS:');
console.log('========================');
console.log('1. Update your file upload handlers to use bulletproofValidateFile()');
console.log('2. Start your React app: npm run dev');
console.log('3. Navigate to any file upload page');
console.log('4. Try uploading each test file from: ' + testDir);
console.log('5. Verify ALL files except RealCSV.csv are rejected');
console.log('6. Check that security warnings appear for multiple extensions');

console.log('\n💡 Key Testing Points:');
console.log('======================');
console.log('• "Untitled.xlsx.jpg" should be rejected as JPEG (not Excel)');
console.log('• Content analysis should happen BEFORE filename checking');
console.log('• Security warnings should appear for obvious attack patterns');
console.log('• Only RealCSV.csv should be accepted');

console.log('\n🧹 CLEANUP:');
console.log('===========');
console.log('To remove test files after testing:');
console.log(`rm -rf "${testDir}"`);

console.log('\n✨ The bulletproof validator should now prevent ALL these attacks!');
console.log('   Content-first validation ignores filenames completely.');
console.log('   Magic number detection happens immediately.');
console.log('   Security alerts warn about suspicious filename patterns.');