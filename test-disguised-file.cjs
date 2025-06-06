// Create a disguised JPEG file to test universal validation
const fs = require('fs');
const path = require('path');

console.log('🧪 Creating disguised JPEG file for testing universal validation');
console.log('===============================================================\n');

// Create a fake Excel file that's actually a JPEG
const jpegHeader = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, // JPEG magic number
  0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, // JFIF header
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, // More JPEG data
  0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, // Quantization table
  0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, // More JPEG data
  0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B,
  // Add some gibberish data that might confuse XLSX parser
  0x42, 0x69, 0x6E, 0x61, 0x72, 0x79, 0x20, 0x4A, // "Binary J"
  0x75, 0x6E, 0x6B, 0x20, 0x44, 0x61, 0x74, 0x61, // "unk Data"
]);

const sampleDataDir = path.join(__dirname, 'public', 'sample-data');
const testFilePath = path.join(sampleDataDir, 'Untitled.xlsx');

// Create sample-data directory if it doesn't exist
if (!fs.existsSync(sampleDataDir)) {
  fs.mkdirSync(sampleDataDir, { recursive: true });
  console.log('📁 Created sample-data directory');
}

// Write the disguised file
fs.writeFileSync(testFilePath, jpegHeader);
console.log(`✅ Created disguised JPEG file: ${testFilePath}`);

// Verify it's actually a JPEG by checking magic number
const fileBuffer = fs.readFileSync(testFilePath);
const isJpeg = fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8 && fileBuffer[2] === 0xFF;

console.log('\n🔍 File Analysis:');
console.log(`   File: ${path.basename(testFilePath)}`);
console.log(`   Size: ${fileBuffer.length} bytes`);
console.log(`   Magic Number: ${fileBuffer.slice(0, 4).toString('hex').toUpperCase()}`);
console.log(`   Actually JPEG: ${isJpeg ? '✅ YES' : '❌ NO'}`);
console.log(`   Disguised as: Excel (.xlsx)`);

console.log('\n🚨 EXPECTED BEHAVIOR:');
console.log('===================');
console.log('✅ Universal validator should REJECT this file');
console.log('✅ Admin Dashboard should NOT display gibberish data');
console.log('✅ All file loading components should show security alert');
console.log('✅ Error message should mention JPEG detection');

console.log('\n🧪 TESTING INSTRUCTIONS:');
console.log('========================');
console.log('1. Start your React app: npm run dev');
console.log('2. Navigate to Admin Dashboard');
console.log('3. Try to load "Untitled.xlsx" from Primary Dataset dropdown');
console.log('4. Should see: "🚨 SECURITY ALERT: File is actually JPEG, not a spreadsheet"');
console.log('5. Should NOT see any gibberish data in the UI');

console.log('\n🔧 TROUBLESHOOTING:');
console.log('==================');
console.log('If the file still loads and shows gibberish:');
console.log('• Check browser console for validation messages');
console.log('• Verify all components use universalFileValidator');
console.log('• Look for any remaining direct XLSX.read() calls');
console.log('• Check if localStorage has cached invalid data');

console.log('\n🧹 CLEANUP:');
console.log('===========');
console.log('To remove the test file:');
console.log(`rm "${testFilePath}"`);

console.log('\n✨ Test file created! Universal validation should now block ALL disguised files.');