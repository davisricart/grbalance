#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking CSP Configuration Consistency...\n');

// Files to check
const files = [
  { name: 'index.html', path: './index.html' },
  { name: 'vite.config.js', path: './vite.config.js' },
  { name: 'netlify.toml', path: './netlify.toml' }
];

// Extract CSP from different file types
function extractCSP(content, filename) {
  if (filename.includes('index.html')) {
    const match = content.match(/Content-Security-Policy[^>]*content="([^"]+)"/);
    return match ? match[1] : null;
  } else if (filename.includes('vite.config.js')) {
    const match = content.match(/'Content-Security-Policy':\s*"([^"]+)"/);
    return match ? match[1] : null;
  } else if (filename.includes('netlify.toml')) {
    const match = content.match(/Content-Security-Policy\s*=\s*"([^"]+)"/);
    return match ? match[1] : null;
  }
  return null;
}

// Check if CSP contains unsafe-eval
function hasUnsafeEval(csp) {
  return csp && csp.includes("'unsafe-eval'");
}

let allConsistent = true;
const results = [];

files.forEach(file => {
  try {
    if (fs.existsSync(file.path)) {
      const content = fs.readFileSync(file.path, 'utf8');
      const csp = extractCSP(content, file.name);
      const hasEval = hasUnsafeEval(csp);
      
      results.push({
        file: file.name,
        hasCSP: !!csp,
        hasUnsafeEval: hasEval,
        csp: csp
      });
      
      console.log(`📄 ${file.name}:`);
      console.log(`   CSP Found: ${!!csp ? '✅' : '❌'}`);
      console.log(`   Has 'unsafe-eval': ${hasEval ? '✅' : '❌'}`);
      if (csp) {
        console.log(`   Script-src: ${csp.match(/script-src[^;]+/)?.[0] || 'Not found'}`);
      }
      console.log('');
    } else {
      console.log(`⚠️  ${file.name}: File not found`);
    }
  } catch (error) {
    console.log(`❌ Error reading ${file.name}: ${error.message}`);
    allConsistent = false;
  }
});

// Check consistency
const evalStatuses = results.filter(r => r.hasCSP).map(r => r.hasUnsafeEval);
const isConsistent = evalStatuses.length > 0 && evalStatuses.every(status => status === evalStatuses[0]);

console.log('📊 SUMMARY:');
console.log(`   Consistency: ${isConsistent ? '✅ All CSP configurations match' : '❌ CSP configurations differ'}`);
console.log(`   Script Testing: ${evalStatuses.every(s => s) ? '✅ Ready (unsafe-eval present)' : '❌ Will fail (unsafe-eval missing)'}`);

if (!isConsistent) {
  console.log('\n🔧 RECOMMENDATION: Update all CSP configurations to include "unsafe-eval" in script-src directive');
  allConsistent = false;
}

process.exit(allConsistent ? 0 : 1); 