#!/usr/bin/env node

/**
 * Test Automation Helper for GR Balance
 * Generates test files and scenarios for comprehensive testing
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 GR Balance Test Automation Helper');
console.log('=====================================\n');

// Create test data directory if it doesn't exist
const testDataDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir);
    console.log('📁 Created test-data directory');
}

// Helper function to create CSV content
function createCSV(headers, rows) {
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    return csvContent;
}

// Test file generators
const testFileGenerators = {
    // P0 Critical Tests
    createEmptyFiles() {
        console.log('📝 Creating empty file test cases...');
        
        // Empty CSV
        fs.writeFileSync(path.join(testDataDir, 'empty.csv'), '');
        
        // Headers only CSV
        fs.writeFileSync(path.join(testDataDir, 'headers-only.csv'), 'Name,Amount,Date,Type\n');
        
        // Single row CSV
        fs.writeFileSync(path.join(testDataDir, 'single-row.csv'), 
            createCSV(['Name', 'Amount'], [['John Doe', '100.00']]));
    },

    createCorruptedFiles() {
        console.log('🔥 Creating corrupted file test cases...');
        
        // Truncated CSV
        fs.writeFileSync(path.join(testDataDir, 'truncated.csv'), 
            'Name,Amount,Date\nJohn Doe,100');
        
        // Invalid character encoding
        const invalidData = Buffer.from([0xFF, 0xFE, 0x00, 0x00, 0x41, 0x00]);
        fs.writeFileSync(path.join(testDataDir, 'invalid-encoding.csv'), invalidData);
        
        // Binary disguised as CSV
        const binaryData = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFF\x00\x00');
        fs.writeFileSync(path.join(testDataDir, 'malicious.csv'), binaryData);
    },

    createEdgeCaseFiles() {
        console.log('🎯 Creating edge case test files...');
        
        // CSV with special characters and formatting
        const specialCharsData = createCSV(
            ['Name', 'Description', 'Amount', 'Notes'],
            [
                ['"Smith, John"', 'Says "Hello World"', '$1,234.56', 'Line 1\nLine 2'],
                ['José García', 'Café & émojis 🎉', '€2.345,67', 'Special chars: áéíóú'],
                ['李小明', '中文测试', '¥1,000', 'Unicode test case'],
                ['', '', '', ''],  // Empty row
                ['Overflow Test', 'A'.repeat(1000), '999999999.99', 'Very long content']
            ]
        );
        fs.writeFileSync(path.join(testDataDir, 'special-characters.csv'), specialCharsData);
        
        // Wide file (many columns)
        const wideHeaders = Array.from({length: 50}, (_, i) => `Column_${i + 1}`);
        const wideRow = Array.from({length: 50}, (_, i) => `Value_${i + 1}`);
        const wideData = createCSV(wideHeaders, [wideRow, wideRow, wideRow]);
        fs.writeFileSync(path.join(testDataDir, 'wide-file.csv'), wideData);
    },

    createLargeFiles() {
        console.log('📊 Creating large file test cases...');
        
        // Medium size file (5,000 rows)
        const mediumHeaders = ['ID', 'Customer', 'Transaction_Date', 'Amount', 'Type', 'Status'];
        const mediumRows = [];
        for (let i = 1; i <= 5000; i++) {
            mediumRows.push([
                i.toString(),
                `Customer_${i}`,
                `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                (Math.random() * 10000).toFixed(2),
                ['Credit', 'Debit', 'Transfer'][Math.floor(Math.random() * 3)],
                ['Completed', 'Pending', 'Failed'][Math.floor(Math.random() * 3)]
            ]);
        }
        const mediumData = createCSV(mediumHeaders, mediumRows);
        fs.writeFileSync(path.join(testDataDir, 'medium-5k-rows.csv'), mediumData);
        
        // Large size file (20,000 rows)
        const largeRows = [];
        for (let i = 1; i <= 20000; i++) {
            largeRows.push([
                i.toString(),
                `LargeCustomer_${i}`,
                `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
                (Math.random() * 50000).toFixed(2),
                ['Credit', 'Debit', 'Transfer', 'Fee', 'Interest'][Math.floor(Math.random() * 5)],
                ['Completed', 'Pending', 'Failed', 'Cancelled'][Math.floor(Math.random() * 4)]
            ]);
        }
        const largeData = createCSV(mediumHeaders, largeRows);
        fs.writeFileSync(path.join(testDataDir, 'large-20k-rows.csv'), largeData);
    },

    createSecurityTestFiles() {
        console.log('🛡️ Creating security test files...');
        
        // XSS injection attempts
        const xssData = createCSV(
            ['Name', 'Script_Test', 'HTML_Test'],
            [
                ['<script>alert("XSS")</script>', 'Normal data', 'Safe content'],
                ['javascript:alert(1)', '<img src=x onerror=alert(1)>', '<iframe src="javascript:alert(1)">'],
                ['${7*7}', '{{7*7}}', '<svg onload=alert(1)>'],
                ['Normal User', 'Safe Data', 'Regular Content']
            ]
        );
        fs.writeFileSync(path.join(testDataDir, 'xss-injection-test.csv'), xssData);
        
        // SQL injection attempts (even though we don't use SQL, good to test)
        const sqlData = createCSV(
            ['Customer_Name', 'Search_Query', 'Notes'],
            [
                ["'; DROP TABLE users; --", "1' OR '1'='1", "Robert'); DELETE FROM accounts; --"],
                ['Normal Customer', 'SELECT * FROM products', 'Standard search'],
                ['Union Test', "' UNION SELECT password FROM users --", 'Injection attempt']
            ]
        );
        fs.writeFileSync(path.join(testDataDir, 'sql-injection-test.csv'), sqlData);
    },

    createFormattingTestFiles() {
        console.log('📋 Creating formatting test files...');
        
        // Different delimiter tests
        const semicolonData = [
            'Name;Amount;Date;Type',
            'John Doe;100,50;2024-01-15;Credit',
            'Jane Smith;200,75;2024-01-16;Debit'
        ].join('\n');
        fs.writeFileSync(path.join(testDataDir, 'semicolon-delimited.csv'), semicolonData);
        
        // Tab delimited
        const tabData = [
            'Name\tAmount\tDate\tType',
            'John Doe\t100.50\t2024-01-15\tCredit',
            'Jane Smith\t200.75\t2024-01-16\tDebit'
        ].join('\n');
        fs.writeFileSync(path.join(testDataDir, 'tab-delimited.tsv'), tabData);
        
        // Mixed number formats
        const numberFormatData = createCSV(
            ['Item', 'Price_USD', 'Price_EUR', 'Quantity', 'Percentage'],
            [
                ['Product A', '$1,234.56', '€1.234,56', '1,000', '45.5%'],
                ['Product B', '2345.67', '2.345,67', '2000', '67,8%'],
                ['Product C', '(345.67)', '-345,67', '-100', '-12.3%']
            ]
        );
        fs.writeFileSync(path.join(testDataDir, 'number-formats.csv'), numberFormatData);
    }
};

// Test scenario descriptions
const testScenarios = {
    fileUpload: {
        name: "File Upload Edge Cases",
        tests: [
            "Upload empty.csv - should show 'file appears to be empty' error",
            "Upload headers-only.csv - should load with 0 data rows",
            "Upload single-row.csv - should load successfully",
            "Upload special-characters.csv - should handle Unicode correctly",
            "Upload wide-file.csv - should show horizontal scroll",
            "Upload medium-5k-rows.csv - should load with progress",
            "Upload large-20k-rows.csv - should use virtual scrolling",
            "Upload truncated.csv - should show parsing error",
            "Upload malicious.csv - should be blocked by security"
        ]
    },
    
    security: {
        name: "Security Testing",
        tests: [
            "Upload xss-injection-test.csv - all script content should be escaped",
            "Upload sql-injection-test.csv - injection attempts should be harmless",
            "Try uploading malicious.csv - should be blocked with security warning",
            "Test filename with script tags - should sanitize display",
            "Enter script in analysis instruction - should be sanitized"
        ]
    },
    
    performance: {
        name: "Performance Testing",
        tests: [
            "Load medium-5k-rows.csv - should complete in < 5 seconds",
            "Load large-20k-rows.csv - should show progress indicator",
            "Process complex instruction on large file - monitor memory usage",
            "Open multiple files simultaneously - should handle gracefully",
            "Create 10+ processing steps - UI should remain responsive"
        ]
    },
    
    ui: {
        name: "UI State Management",
        tests: [
            "Double-click upload button rapidly - prevent duplicate uploads",
            "Switch files during processing - should handle gracefully",
            "Use browser back button during upload - should show warning",
            "Refresh page during processing - should offer recovery",
            "Create steps, revert to middle, continue - verify state consistency"
        ]
    }
};

// Generate all test files
function generateAllTestFiles() {
    console.log('🚀 Generating comprehensive test files...\n');
    
    Object.values(testFileGenerators).forEach(generator => {
        generator();
    });
    
    console.log('\n✅ Test file generation complete!');
    console.log(`📁 Test files created in: ${testDataDir}`);
    
    // List generated files
    const files = fs.readdirSync(testDataDir);
    console.log('\n📋 Generated test files:');
    files.forEach(file => {
        const stats = fs.statSync(path.join(testDataDir, file));
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`   ${file} (${sizeKB} KB)`);
    });
}

// Generate test execution report template
function generateTestReport() {
    const reportPath = path.join(__dirname, 'TEST_EXECUTION_REPORT.md');
    const reportContent = `# 🧪 Test Execution Report

**Date:** ${new Date().toISOString().split('T')[0]}
**Tester:** [Your Name]
**Environment:** [Dev/Staging/Production]
**Browser:** [Browser and Version]

## 📊 Test Summary

| Priority | Total Tests | Passed | Failed | Skipped | Pass Rate |
|----------|-------------|--------|--------|---------|-----------|
| P0 (Critical) | 0 | 0 | 0 | 0 | 0% |
| P1 (High) | 0 | 0 | 0 | 0 | 0% |
| P2 (Medium) | 0 | 0 | 0 | 0 | 0% |
| P3 (Low) | 0 | 0 | 0 | 0 | 0% |

## 🎯 Test Scenarios

${Object.entries(testScenarios).map(([key, scenario]) => `
### ${scenario.name}

${scenario.tests.map((test, index) => `
#### Test ${index + 1}: ${test}
- **Status:** ⭕ Not Tested / ✅ Passed / ❌ Failed
- **Notes:** 
- **Screenshots:** 
- **Performance:** 

`).join('')}
`).join('')}

## 🐛 Issues Found

| Issue ID | Priority | Description | Steps to Reproduce | Expected | Actual | Status |
|----------|----------|-------------|-------------------|----------|--------|---------|
| | | | | | | |

## 📈 Performance Metrics

| Operation | Target Time | Actual Time | Memory Usage | Status |
|-----------|-------------|-------------|--------------|---------|
| File Upload (1MB) | < 3s | | | |
| Step Processing | < 5s | | | |
| Large File Load | < 10s | | | |

## 🌐 Browser Compatibility

| Browser | Version | File Upload | Processing | Visual Builder | Overall |
|---------|---------|-------------|------------|----------------|---------|
| Chrome | | | | | |
| Firefox | | | | | |
| Safari | | | | | |
| Edge | | | | | |

## 📱 Mobile Testing

| Device | Screen Size | Core Features | Issues Found |
|---------|-------------|---------------|--------------|
| iPhone | | | |
| Android Phone | | | |
| iPad | | | |
| Android Tablet | | | |

## 🔐 Security Testing Results

| Test Case | Result | Notes |
|-----------|--------|-------|
| XSS Prevention | | |
| File Upload Security | | |
| Input Sanitization | | |
| Session Management | | |

## 📝 Additional Notes

- 
- 
- 

## ✅ Sign-off

- [ ] All P0 tests passed
- [ ] All P1 tests passed or have accepted workarounds
- [ ] Performance targets met
- [ ] Security vulnerabilities addressed
- [ ] Browser compatibility confirmed
- [ ] Mobile experience acceptable

**Tester Signature:** _________________ **Date:** _________
**Approval:** _________________ **Date:** _________
`;

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📋 Test execution report template created: ${reportPath}`);
}

// Main execution
function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'generate':
        case 'gen':
            generateAllTestFiles();
            break;
            
        case 'report':
            generateTestReport();
            break;
            
        case 'all':
            generateAllTestFiles();
            generateTestReport();
            break;
            
        default:
            console.log('Usage: node test-automation-helper.cjs [command]');
            console.log('');
            console.log('Commands:');
            console.log('  generate, gen  - Generate test files');
            console.log('  report         - Generate test report template');  
            console.log('  all           - Generate files and report');
            console.log('');
            console.log('Examples:');
            console.log('  node test-automation-helper.cjs generate');
            console.log('  node test-automation-helper.cjs report');
            console.log('  node test-automation-helper.cjs all');
            break;
    }
}

main();