// Test the enhanced response code execution
const responseCode = "return [{\"Analysis Type\":\"Mastercard Count Analysis\",\"Total Transactions\":150,\"Mastercard Transactions\":37,\"Percentage\":\"24.7%\",\"Column Analyzed\":\"Card Brand\",\"Processing Time\":new Date().toISOString(),\"Status\":\"Completed Successfully\"},{\"Analysis Type\":\"Summary Statistics\",\"Total Amount\":\"$45,672.50\",\"Average Amount\":\"$304.48\",\"Highest Transaction\":\"$2,450.00\",\"Lowest Transaction\":\"$12.50\",\"Processing Time\":new Date().toISOString(),\"Status\":\"Analysis Complete\"},{\"Analysis Type\":\"Card Brand Distribution\",\"Mastercard\":\"37 (24.7%)\",\"Visa\":\"68 (45.3%)\",\"American Express\":\"28 (18.7%)\",\"Discover\":\"17 (11.3%)\",\"Processing Time\":new Date().toISOString(),\"Status\":\"Distribution Complete\"},{\"Analysis Type\":\"Transaction Trends\",\"Peak Hour\":\"2:00 PM - 3:00 PM\",\"Peak Day\":\"Friday\",\"Average Daily Volume\":\"42 transactions\",\"Trend\":\"Increasing 15% month-over-month\",\"Processing Time\":new Date().toISOString(),\"Status\":\"Trend Analysis Complete\"},{\"Analysis Type\":\"Risk Assessment\",\"High Risk Transactions\":\"3 (2.0%)\",\"Medium Risk\":\"12 (8.0%)\",\"Low Risk\":\"135 (90.0%)\",\"Risk Score\":\"Low Overall Risk\",\"Processing Time\":new Date().toISOString(),\"Status\":\"Risk Analysis Complete\"}];";

console.log('Testing enhanced response code execution...');

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
  console.log('📊 First result object keys:', Object.keys(result?.[0] || {}));
  console.log('📊 Sample result object:');
  console.log(JSON.stringify(result?.[0], null, 2));
  
} catch (error) {
  console.error('❌ Code execution failed:', error.message);
}