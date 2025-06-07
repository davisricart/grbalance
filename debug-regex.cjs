const fs = require('fs');
const path = require('path');

const responseFile = path.join(__dirname, 'public', 'claude-communication', 'claude-comm-response-1749298312437-xdstqy-0.js');
const content = fs.readFileSync(responseFile, 'utf8');

console.log('Full file content:');
console.log('==================');
console.log(content);
console.log('\n==================');

// Test the regex
const regex = /window\.(?:claudeResponse|aiResponse)\s*=\s*({[\s\S]*?});/;
const match = content.match(regex);

if (match) {
  console.log('Regex found match!');
  console.log('Match[0] (full match):');
  console.log(match[0]);
  console.log('\nMatch[1] (captured group):');
  console.log(match[1]);
  console.log('\nMatch[1] length:', match[1].length);
  
  // Test JSON parsing
  try {
    const parsed = JSON.parse(match[1]);
    console.log('\n✅ JSON parsing successful!');
  } catch (e) {
    console.log('\n❌ JSON parsing failed:', e.message);
  }
} else {
  console.log('❌ Regex did not match');
}