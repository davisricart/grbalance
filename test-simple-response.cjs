// Test the simple response code execution
const responseCode = "return [{'Mastercard Count': 37}];";

console.log('Testing simple response code execution...');

try {
  // Test as StepBuilderDemo would: new Function('workingData', code)
  const transformFunction = new Function('workingData', responseCode);
  
  // Test with sample data (this code ignores workingData and returns static result)
  const sampleData = [{ test: 'data' }];
  const result = transformFunction(sampleData);
  
  console.log('✅ Code execution successful!');
  console.log('📊 Result type:', typeof result);
  console.log('📊 Result is array:', Array.isArray(result));
  console.log('📊 Result length:', result?.length);
  console.log('📊 Result object keys:', Object.keys(result?.[0] || {}));
  console.log('📊 Full result:', JSON.stringify(result, null, 2));
  
} catch (error) {
  console.error('❌ Code execution failed:', error.message);
}