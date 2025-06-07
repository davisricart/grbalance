// Test the minimal response code execution
const responseCode = "return [{\"Analysis\":\"Test Success\",\"Message\":\"This is a test result\",\"Row\":1,\"Status\":\"Working\"},{\"Analysis\":\"Test Success\",\"Message\":\"Second test result\",\"Row\":2,\"Status\":\"Working\"},{\"Analysis\":\"Test Success\",\"Message\":\"Third test result\",\"Row\":3,\"Status\":\"Working\"}];";

console.log('Testing minimal response code execution...');

try {
  // Test as StepBuilderDemo would: new Function('workingData', code)
  const transformFunction = new Function('workingData', responseCode);
  
  // Test with sample data (even though this code ignores workingData)
  const sampleData = [{ test: 'data' }];
  const result = transformFunction(sampleData);
  
  console.log('✅ Code execution successful!');
  console.log('📊 Result type:', typeof result);
  console.log('📊 Result is array:', Array.isArray(result));
  console.log('📊 Result length:', result?.length);
  console.log('📊 First result object:', result?.[0]);
  console.log('📊 Full result:', JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('❌ Code execution failed:', error.message);
}