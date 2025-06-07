const fs = require('fs');
const path = require('path');

const responseFile = path.join(__dirname, 'public', 'claude-communication', 'claude-comm-response-1749298312437-xdstqy-0.js');
const content = fs.readFileSync(responseFile, 'utf8');

// Count braces to understand the issue
const openBraces = (content.match(/\{/g) || []).length;
const closeBraces = (content.match(/\}/g) || []).length;

console.log('Open braces:', openBraces);
console.log('Close braces:', closeBraces);

// Let's manually find the correct end of the JSON object
const startIndex = content.indexOf('window.claudeResponse = {');
if (startIndex !== -1) {
  const objectStart = content.indexOf('{', startIndex);
  let braceCount = 0;
  let endIndex = -1;
  
  for (let i = objectStart; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') braceCount--;
    
    if (braceCount === 0) {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex !== -1) {
    const correctJson = content.substring(objectStart, endIndex + 1);
    console.log('\nCorrect JSON object:');
    console.log(correctJson);
    
    try {
      const parsed = JSON.parse(correctJson);
      console.log('\n✅ Manual parsing successful!');
      console.log('Keys:', Object.keys(parsed));
    } catch (e) {
      console.log('\n❌ Manual parsing failed:', e.message);
    }
  }
}

// Try a better regex that handles nested braces
const betterRegex = /window\.(?:claudeResponse|aiResponse)\s*=\s*(\{(?:[^{}]|\{[^{}]*\})*\});/;
const betterMatch = content.match(betterRegex);

console.log('\n--- Better Regex Test ---');
if (betterMatch) {
  console.log('Better regex matched!');
  console.log('Length:', betterMatch[1].length);
  try {
    const parsed = JSON.parse(betterMatch[1]);
    console.log('✅ Better regex parsing successful!');
  } catch (e) {
    console.log('❌ Better regex parsing failed:', e.message);
  }
} else {
  console.log('Better regex did not match');
}