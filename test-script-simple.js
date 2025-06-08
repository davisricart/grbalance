// Simple Test Script - Card Brand Analysis
// This script should work with your uploaded files

(async function() {
  try {
    console.log('🚀 Starting simple test script...');
    
    // Get data from admin interface
    const data1 = window.uploadedFile1;
    const data2 = window.uploadedFile2;
    
    console.log('📁 File 1:', data1 ? `${data1.length} rows` : 'null');
    console.log('📁 File 2:', data2 ? `${data2.length} rows` : 'null');
    
    if (!data1 || data1.length === 0) {
      window.showError('File 1 is required and must contain data');
      return;
    }
    
    if (!data2 || data2.length === 0) {
      window.showError('File 2 is required and must contain data');
      return;
    }
    
    // Show column information
    const file1Columns = Object.keys(data1[0] || {});
    const file2Columns = Object.keys(data2[0] || {});
    
    console.log('📊 File 1 columns:', file1Columns);
    console.log('📊 File 2 columns:', file2Columns);
    
    // Create simple test results
    const results = [
      { 'Test': 'File 1 Loaded', 'Status': 'Success', 'Details': `${data1.length} rows, ${file1Columns.length} columns` },
      { 'Test': 'File 2 Loaded', 'Status': 'Success', 'Details': `${data2.length} rows, ${file2Columns.length} columns` },
      { 'Test': 'Column Detection', 'Status': 'Success', 'Details': `Found ${file1Columns.length + file2Columns.length} total columns` }
    ];
    
    console.log('📋 Test results:', results);
    
    // Display results
    window.showResults(results, {
      title: 'Simple Test Results',
      summary: `Successfully loaded and analyzed both files. File 1: ${file1Columns.length} columns, File 2: ${file2Columns.length} columns.`
    });
    
    console.log('✅ Simple test script completed successfully!');
    
  } catch (error) {
    console.error('❌ Test script error:', error);
    window.showError('Test script error: ' + error.message);
  }
})(); 