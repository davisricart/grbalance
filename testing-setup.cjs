#!/usr/bin/env node

/**
 * Testing Setup and Environment Configuration
 * Prepares the GR Balance system for comprehensive testing
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 GR Balance Testing Setup');
console.log('============================\n');

class TestingSetup {
    constructor() {
        this.projectRoot = __dirname;
        this.testConfig = {
            environments: ['development', 'staging', 'production'],
            browsers: ['chrome', 'firefox', 'safari', 'edge'],
            testTypes: ['unit', 'integration', 'e2e', 'performance', 'security'],
            priorities: ['P0', 'P1', 'P2', 'P3']
        };
    }

    async setup() {
        console.log('🚀 Starting testing environment setup...\n');
        
        try {
            this.checkPrerequisites();
            this.createTestDirectories();
            this.setupTestConfig();
            this.generateTestingReadme();
            this.createEnvironmentChecks();
            this.setupBrowserCompatibilityTests();
            this.createSecurityTestScripts();
            this.setupPerformanceBaselines();
            
            console.log('\n✅ Testing setup complete!');
            this.displaySummary();
            
        } catch (error) {
            console.error('\n❌ Setup failed:', error.message);
            process.exit(1);
        }
    }

    checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        // Check Node.js version
        const nodeVersion = process.version;
        console.log(`   Node.js: ${nodeVersion}`);
        
        // Check if package.json exists
        const packagePath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(packagePath)) {
            throw new Error('package.json not found. Please run from project root.');
        }
        
        // Check if key directories exist
        const requiredDirs = ['src', 'public', 'netlify/functions'];
        requiredDirs.forEach(dir => {
            const dirPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(dirPath)) {
                console.warn(`⚠️  Directory missing: ${dir}`);
            } else {
                console.log(`   ✓ ${dir} directory exists`);
            }
        });
        
        console.log('   ✅ Prerequisites checked\n');
    }

    createTestDirectories() {
        console.log('📁 Creating test directory structure...');
        
        const testDirs = [
            'test-data',
            'test-results',
            'test-reports',
            'test-screenshots',
            'performance-logs',
            'security-logs'
        ];
        
        testDirs.forEach(dir => {
            const dirPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`   📁 Created: ${dir}`);
            } else {
                console.log(`   ✓ Exists: ${dir}`);
            }
        });
        
        console.log('   ✅ Test directories ready\n');
    }

    setupTestConfig() {
        console.log('⚙️  Creating test configuration...');
        
        const testConfig = {
            project: {
                name: "GR Balance",
                version: "1.0.0",
                testingStarted: new Date().toISOString()
            },
            environments: {
                development: {
                    url: "http://localhost:5180",
                    backend: "http://localhost:3001",
                    database: "development"
                },
                staging: {
                    url: "https://staging.grbalance.com",
                    backend: "https://staging-api.grbalance.com",
                    database: "staging"
                },
                production: {
                    url: "https://grbalance.com",
                    backend: "https://api.grbalance.com",
                    database: "production"
                }
            },
            testData: {
                sampleFiles: {
                    small: "test-data/small-sample.csv",
                    medium: "test-data/medium-5k-rows.csv",
                    large: "test-data/large-20k-rows.csv",
                    edge: "test-data/special-characters.csv",
                    security: "test-data/xss-injection-test.csv"
                }
            },
            performance: {
                targets: {
                    pageLoad: 3000, // ms
                    fileUpload: 5000, // ms
                    processing: 10000, // ms
                    memoryUsage: 500 // MB
                }
            },
            security: {
                xssTests: true,
                fileValidation: true,
                inputSanitization: true,
                sessionSecurity: true
            },
            browsers: {
                chrome: { minVersion: "90" },
                firefox: { minVersion: "85" },
                safari: { minVersion: "14" },
                edge: { minVersion: "90" }
            }
        };
        
        const configPath = path.join(this.projectRoot, 'test-config.json');
        fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
        console.log(`   ⚙️  Created: test-config.json`);
        console.log('   ✅ Test configuration ready\n');
    }

    generateTestingReadme() {
        console.log('📝 Generating testing documentation...');
        
        const readmeContent = `# 🧪 GR Balance Testing Guide

## Quick Start

1. **Setup Testing Environment**
   \`\`\`bash
   node testing-setup.cjs
   \`\`\`

2. **Generate Test Data**
   \`\`\`bash
   node test-automation-helper.cjs generate
   \`\`\`

3. **Run Comprehensive Tests**
   Follow the \`COMPREHENSIVE_TESTING_CHECKLIST.md\`

## Testing Tools

### 🔧 Available Scripts
- \`testing-setup.cjs\` - Environment setup
- \`test-automation-helper.cjs\` - Test data generation
- \`performance-monitor.js\` - Real-time performance monitoring

### 📁 Directory Structure
\`\`\`
testing/
├── test-data/          # Generated test files
├── test-results/       # Test execution results
├── test-reports/       # Generated reports
├── test-screenshots/   # UI test screenshots
├── performance-logs/   # Performance data
└── security-logs/      # Security test results
\`\`\`

## Testing Priorities

### P0 (Critical) - Must Pass
- [ ] File upload edge cases
- [ ] Data integrity validation
- [ ] Security vulnerability protection
- [ ] Core user workflows

### P1 (High) - Important
- [ ] Browser compatibility
- [ ] Performance targets
- [ ] Error handling
- [ ] UI responsiveness

### P2 (Medium) - Quality
- [ ] Advanced features
- [ ] Edge case handling
- [ ] Mobile experience

### P3 (Low) - Enhancement
- [ ] Future feature preparation
- [ ] Advanced edge cases

## Quick Test Commands

### Performance Testing
\`\`\`javascript
// In browser console
testHelpers.measure('fileUpload', () => {
    // Upload file here
});
testHelpers.report(); // View metrics
testHelpers.export(); // Download data
\`\`\`

### Memory Testing
\`\`\`javascript
testHelpers.memoryStressTest();
\`\`\`

## Environment URLs

- **Development:** http://localhost:5180
- **Staging:** https://staging.grbalance.com
- **Production:** https://grbalance.com

## Test Data Files

| File | Purpose | Size | Rows |
|------|---------|------|------|
| small-sample.csv | Basic functionality | <1KB | 3 |
| medium-5k-rows.csv | Performance testing | ~500KB | 5,000 |
| large-20k-rows.csv | Stress testing | ~2MB | 20,000 |
| special-characters.csv | Unicode handling | <10KB | 5 |
| xss-injection-test.csv | Security testing | <5KB | 4 |

## Reporting Issues

When reporting bugs, include:
1. **Priority level** (P0-P3)
2. **Steps to reproduce**
3. **Expected vs actual result**
4. **Browser and version**
5. **Screenshots/videos**
6. **Performance data** (if relevant)

## Contact

For testing questions or support:
- Documentation: \`COMPREHENSIVE_TESTING_CHECKLIST.md\`
- Performance: \`performance-monitor.js\`
- Test Data: \`test-automation-helper.cjs\`
`;

        const readmePath = path.join(this.projectRoot, 'TESTING_README.md');
        fs.writeFileSync(readmePath, readmeContent);
        console.log('   📝 Created: TESTING_README.md');
        console.log('   ✅ Testing documentation ready\n');
    }

    createEnvironmentChecks() {
        console.log('🔍 Creating environment health checks...');
        
        const healthCheckScript = `#!/usr/bin/env node

/**
 * Environment Health Check for GR Balance Testing
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class HealthChecker {
    constructor() {
        this.config = JSON.parse(fs.readFileSync('test-config.json', 'utf8'));
    }

    async checkAll() {
        console.log('🏥 Health Check Report');
        console.log('=====================\\n');
        
        const results = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            checks: {}
        };

        // Check frontend URLs
        for (const [env, config] of Object.entries(this.config.environments)) {
            console.log(\`🌍 Checking \${env} environment...\`);
            results.checks[env] = await this.checkEnvironment(config);
        }

        // Check file system
        console.log('📁 Checking file system...');
        results.checks.fileSystem = this.checkFileSystem();

        // Check test data
        console.log('📊 Checking test data...');
        results.checks.testData = this.checkTestData();

        this.generateHealthReport(results);
        return results;
    }

    async checkEnvironment(config) {
        const checks = {};
        
        // Check frontend
        checks.frontend = await this.checkUrl(config.url);
        
        // Check backend (if accessible)
        if (config.backend) {
            checks.backend = await this.checkUrl(config.backend);
        }

        return checks;
    }

    checkUrl(url) {
        return new Promise((resolve) => {
            const protocol = url.startsWith('https') ? https : http;
            const startTime = Date.now();
            
            const req = protocol.get(url, (res) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    status: 'UP',
                    statusCode: res.statusCode,
                    responseTime: responseTime,
                    headers: res.headers
                });
            });

            req.on('error', (error) => {
                resolve({
                    status: 'DOWN',
                    error: error.message,
                    responseTime: Date.now() - startTime
                });
            });

            req.setTimeout(5000, () => {
                req.destroy();
                resolve({
                    status: 'TIMEOUT',
                    responseTime: 5000
                });
            });
        });
    }

    checkFileSystem() {
        const checks = {};
        const requiredDirs = ['test-data', 'test-results', 'test-reports'];
        
        requiredDirs.forEach(dir => {
            checks[dir] = {
                exists: fs.existsSync(dir),
                writable: this.checkWritable(dir)
            };
        });

        return checks;
    }

    checkWritable(dir) {
        try {
            const testFile = path.join(dir, '.write-test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            return true;
        } catch {
            return false;
        }
    }

    checkTestData() {
        const checks = {};
        const expectedFiles = Object.values(this.config.testData.sampleFiles);
        
        expectedFiles.forEach(filePath => {
            const fileName = path.basename(filePath);
            checks[fileName] = {
                exists: fs.existsSync(filePath),
                size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
            };
        });

        return checks;
    }

    generateHealthReport(results) {
        console.log('\\n📋 Health Check Summary');
        console.log('========================');
        
        let allHealthy = true;
        
        for (const [env, checks] of Object.entries(results.checks)) {
            if (env === 'fileSystem' || env === 'testData') continue;
            
            const frontendStatus = checks.frontend?.status || 'UNKNOWN';
            const backendStatus = checks.backend?.status || 'N/A';
            
            console.log(\`\${env.padEnd(12)}: Frontend \${frontendStatus}, Backend \${backendStatus}\`);
            
            if (frontendStatus !== 'UP') allHealthy = false;
        }

        console.log(\`File System : \${results.checks.fileSystem ? 'OK' : 'ISSUES'}\`);
        console.log(\`Test Data   : \${Object.values(results.checks.testData).every(f => f.exists) ? 'OK' : 'MISSING FILES'}\`);

        console.log(\`\\n\${allHealthy ? '✅' : '❌'} Overall Status: \${allHealthy ? 'HEALTHY' : 'ISSUES DETECTED'}\`);
        
        // Save detailed report
        const reportPath = path.join('test-reports', \`health-check-\${Date.now()}.json\`);
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(\`\\n📄 Detailed report saved: \${reportPath}\`);
    }
}

if (require.main === module) {
    const checker = new HealthChecker();
    checker.checkAll().catch(console.error);
}

module.exports = HealthChecker;
`;

        const healthCheckPath = path.join(this.projectRoot, 'health-check.cjs');
        fs.writeFileSync(healthCheckPath, healthCheckScript);
        console.log('   🔍 Created: health-check.cjs');
        console.log('   ✅ Environment checks ready\n');
    }

    setupBrowserCompatibilityTests() {
        console.log('🌐 Setting up browser compatibility tests...');
        
        const browserTestScript = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GR Balance - Browser Compatibility Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .pass { color: green; } .fail { color: red; } .warn { color: orange; }
        .results { background: #f5f5f5; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🌐 Browser Compatibility Test</h1>
    <p>This page tests browser compatibility for GR Balance features.</p>
    
    <div class="test-section">
        <h3>Browser Information</h3>
        <div id="browser-info"></div>
    </div>
    
    <div class="test-section">
        <h3>Feature Support Tests</h3>
        <div id="feature-tests"></div>
    </div>
    
    <div class="test-section">
        <h3>File API Tests</h3>
        <div id="file-tests"></div>
        <input type="file" id="test-file-input" accept=".csv,.xlsx" style="margin: 10px 0;">
    </div>
    
    <div class="test-section">
        <h3>Performance API Tests</h3>
        <div id="performance-tests"></div>
    </div>
    
    <div class="test-section">
        <h3>CSS and Animation Tests</h3>
        <div id="css-tests"></div>
        <div id="animation-test" style="width: 50px; height: 50px; background: blue; transition: all 0.3s;"></div>
    </div>

    <script>
        class BrowserCompatibilityTester {
            constructor() {
                this.results = {};
                this.runAllTests();
            }

            runAllTests() {
                this.testBrowserInfo();
                this.testFeatureSupport();
                this.testFileAPI();
                this.testPerformanceAPI();
                this.testCSS();
                this.generateReport();
            }

            testBrowserInfo() {
                const info = {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                    cookieEnabled: navigator.cookieEnabled,
                    onLine: navigator.onLine,
                    hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown'
                };

                const browserInfoDiv = document.getElementById('browser-info');
                browserInfoDiv.innerHTML = Object.entries(info)
                    .map(([key, value]) => \`<strong>\${key}:</strong> \${value}<br>\`)
                    .join('');
            }

            testFeatureSupport() {
                const features = {
                    'ES6 Classes': typeof class {} === 'function',
                    'Arrow Functions': (() => true)(),
                    'Promises': typeof Promise !== 'undefined',
                    'Fetch API': typeof fetch !== 'undefined',
                    'Local Storage': typeof localStorage !== 'undefined',
                    'Session Storage': typeof sessionStorage !== 'undefined',
                    'Web Workers': typeof Worker !== 'undefined',
                    'Performance API': typeof performance !== 'undefined',
                    'File API': typeof File !== 'undefined'
                };

                const featureTestsDiv = document.getElementById('feature-tests');
                featureTestsDiv.innerHTML = Object.entries(features)
                    .map(([feature, supported]) => {
                        const status = supported ? 'pass' : 'fail';
                        const icon = supported ? '✅' : '❌';
                        return \`<div class="\${status}">\${icon} \${feature}: \${supported ? 'Supported' : 'Not Supported'}</div>\`;
                    })
                    .join('');

                this.results.features = features;
            }

            testFileAPI() {
                const fileTests = {
                    'File Constructor': typeof File !== 'undefined',
                    'FileReader': typeof FileReader !== 'undefined',
                    'Blob': typeof Blob !== 'undefined',
                    'FormData': typeof FormData !== 'undefined'
                };

                const fileTestsDiv = document.getElementById('file-tests');
                fileTestsDiv.innerHTML = Object.entries(fileTests)
                    .map(([test, supported]) => {
                        const status = supported ? 'pass' : 'fail';
                        const icon = supported ? '✅' : '❌';
                        return \`<div class="\${status}">\${icon} \${test}: \${supported ? 'Available' : 'Not Available'}</div>\`;
                    })
                    .join('');

                // Test actual file selection
                const fileInput = document.getElementById('test-file-input');
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        fileTestsDiv.innerHTML += \`<div class="pass">✅ File selection works: \${file.name} (\${file.size} bytes)</div>\`;
                    }
                });

                this.results.fileAPI = fileTests;
            }

            testPerformanceAPI() {
                const perfTests = {
                    'performance.now()': typeof performance.now === 'function',
                    'performance.memory': typeof performance.memory !== 'undefined',
                    'PerformanceObserver': typeof PerformanceObserver !== 'undefined',
                    'Navigation Timing': typeof performance.getEntriesByType === 'function'
                };

                const performanceTestsDiv = document.getElementById('performance-tests');
                performanceTestsDiv.innerHTML = Object.entries(perfTests)
                    .map(([test, supported]) => {
                        const status = supported ? 'pass' : 'warn';
                        const icon = supported ? '✅' : '⚠️';
                        return \`<div class="\${status}">\${icon} \${test}: \${supported ? 'Available' : 'Not Available'}</div>\`;
                    })
                    .join('');

                this.results.performance = perfTests;
            }

            testCSS() {
                const cssTests = {
                    'CSS Grid': CSS.supports('display', 'grid'),
                    'CSS Flexbox': CSS.supports('display', 'flex'),
                    'CSS Transitions': CSS.supports('transition', 'all 0.3s'),
                    'CSS Transforms': CSS.supports('transform', 'translateX(10px)'),
                    'CSS Variables': CSS.supports('color', 'var(--test)')
                };

                const cssTestsDiv = document.getElementById('css-tests');
                cssTestsDiv.innerHTML = Object.entries(cssTests)
                    .map(([test, supported]) => {
                        const status = supported ? 'pass' : 'warn';
                        const icon = supported ? '✅' : '⚠️';
                        return \`<div class="\${status}">\${icon} \${test}: \${supported ? 'Supported' : 'Not Supported'}</div>\`;
                    })
                    .join('');

                // Test animation
                const animationTest = document.getElementById('animation-test');
                animationTest.style.transform = 'translateX(100px)';
                
                this.results.css = cssTests;
            }

            generateReport() {
                const report = {
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    results: this.results,
                    summary: {
                        totalTests: 0,
                        passed: 0,
                        failed: 0
                    }
                };

                // Count results
                Object.values(this.results).forEach(category => {
                    Object.values(category).forEach(result => {
                        report.summary.totalTests++;
                        if (result) report.summary.passed++;
                        else report.summary.failed++;
                    });
                });

                console.log('🧪 Browser Compatibility Report:', report);
                
                // Show summary
                const passRate = (report.summary.passed / report.summary.totalTests * 100).toFixed(1);
                document.body.innerHTML += \`
                    <div class="test-section">
                        <h3>📊 Test Summary</h3>
                        <div class="results">
                            <strong>Pass Rate:</strong> \${passRate}% (\${report.summary.passed}/\${report.summary.totalTests})<br>
                            <strong>Timestamp:</strong> \${report.timestamp}<br>
                            <strong>Status:</strong> \${passRate >= 90 ? '✅ Excellent' : passRate >= 75 ? '⚠️ Good' : '❌ Poor'} compatibility
                        </div>
                    </div>
                \`;
            }
        }

        // Start tests when page loads
        window.addEventListener('load', () => {
            new BrowserCompatibilityTester();
        });
    </script>
</body>
</html>`;

        const browserTestPath = path.join(this.projectRoot, 'browser-compatibility-test.html');
        fs.writeFileSync(browserTestPath, browserTestScript);
        console.log('   🌐 Created: browser-compatibility-test.html');
        console.log('   ✅ Browser tests ready\n');
    }

    createSecurityTestScripts() {
        console.log('🛡️ Creating security test scripts...');
        
        const securityTestScript = `/**
 * Security Testing Module for GR Balance
 * Tests XSS prevention, input sanitization, and file security
 */

class SecurityTester {
    constructor() {
        this.testResults = {};
        this.vulnerabilities = [];
    }

    async runAllTests() {
        console.log('🛡️ Starting security tests...');
        
        await this.testXSSPrevention();
        await this.testInputSanitization();
        await this.testFileUploadSecurity();
        await this.testCSRFProtection();
        
        this.generateSecurityReport();
    }

    async testXSSPrevention() {
        console.log('🔍 Testing XSS Prevention...');
        
        const xssPayloads = [
            '<script>console.log("XSS")</script>',
            '<img src=x onerror=console.log(1)>',
            'javascript:console.log(1)',
            '<svg onload=console.log(1)>',
            '${console.log(1)}',
            '{{console.log(1)}}',
            '<iframe src="javascript:console.log(1)">',
            '<body onload=console.log(1)>'
        ];

        const results = {};
        
        for (const payload of xssPayloads) {
            const testDiv = document.createElement('div');
            testDiv.innerHTML = payload;
            
            // Check if script executed (it shouldn't)
            const hasScript = testDiv.querySelector('script') !== null;
            const hasOnEvent = payload.includes('on') && testDiv.innerHTML.includes('on');
            
            results[payload] = {
                safe: !hasScript && !hasOnEvent,
                sanitized: testDiv.innerHTML !== payload
            };
        }

        this.testResults.xss = results;
    }

    async testInputSanitization() {
        console.log('🧹 Testing Input Sanitization...');
        
        const maliciousInputs = [
            'DROP TABLE users;',
            "'; DELETE FROM accounts; --",
            '../../../etc/passwd',
            '..\\\\..\\\\..\\\\windows\\\\system32',
            '<script>document.cookie</script>',
            '${process.env.DATABASE_URL}'
        ];

        const results = {};
        
        maliciousInputs.forEach(input => {
            // Test if input gets properly escaped/sanitized
            const escaped = this.escapeHtml(input);
            results[input] = {
                original: input,
                escaped: escaped,
                safe: escaped !== input && !escaped.includes('<script>')
            };
        });

        this.testResults.inputSanitization = results;
    }

    async testFileUploadSecurity() {
        console.log('📁 Testing File Upload Security...');
        
        // Test dangerous file types
        const dangerousFiles = [
            { name: 'malicious.exe', type: 'application/x-msdownload' },
            { name: 'script.js', type: 'application/javascript' },
            { name: 'virus.bat', type: 'application/x-bat' },
            { name: 'trojan.com', type: 'application/x-msdownload' },
            { name: 'safe.csv', type: 'text/csv' },
            { name: 'data.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        ];

        const results = {};
        
        dangerousFiles.forEach(file => {
            const isAllowed = this.isFileTypeAllowed(file.type, file.name);
            results[file.name] = {
                type: file.type,
                allowed: isAllowed,
                safe: file.name.includes('safe') || file.name.includes('data') ? isAllowed : !isAllowed
            };
        });

        this.testResults.fileUpload = results;
    }

    async testCSRFProtection() {
        console.log('🔐 Testing CSRF Protection...');
        
        // Check for CSRF tokens in forms
        const forms = document.querySelectorAll('form');
        const results = {
            formsFound: forms.length,
            csrfTokensPresent: 0,
            protection: 'unknown'
        };

        forms.forEach(form => {
            const csrfToken = form.querySelector('input[name*="csrf"], input[name*="token"]');
            if (csrfToken) {
                results.csrfTokensPresent++;
            }
        });

        if (forms.length === 0) {
            results.protection = 'not_applicable';
        } else if (results.csrfTokensPresent === forms.length) {
            results.protection = 'good';
        } else if (results.csrfTokensPresent > 0) {
            results.protection = 'partial';
        } else {
            results.protection = 'none';
        }

        this.testResults.csrf = results;
    }

    isFileTypeAllowed(type, filename) {
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        const allowedExtensions = ['.csv', '.xls', '.xlsx'];
        const hasAllowedExtension = allowedExtensions.some(ext => 
            filename.toLowerCase().endsWith(ext)
        );
        
        return allowedTypes.includes(type) && hasAllowedExtension;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            testResults: this.testResults,
            vulnerabilities: this.vulnerabilities,
            summary: {
                xssProtection: this.calculateXSSScore(),
                inputSanitization: this.calculateSanitizationScore(),
                fileUploadSecurity: this.calculateFileUploadScore(),
                csrfProtection: this.testResults.csrf?.protection || 'unknown'
            }
        };

        // Calculate overall security score
        const scores = Object.values(report.summary).filter(s => typeof s === 'number');
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        report.summary.overallScore = Math.round(avgScore);

        console.log('🛡️ Security Test Report:', report);
        
        // Display results
        this.displaySecurityResults(report);
        
        return report;
    }

    calculateXSSScore() {
        const xssResults = this.testResults.xss || {};
        const total = Object.keys(xssResults).length;
        const safe = Object.values(xssResults).filter(r => r.safe).length;
        return total > 0 ? Math.round((safe / total) * 100) : 0;
    }

    calculateSanitizationScore() {
        const sanitizationResults = this.testResults.inputSanitization || {};
        const total = Object.keys(sanitizationResults).length;
        const safe = Object.values(sanitizationResults).filter(r => r.safe).length;
        return total > 0 ? Math.round((safe / total) * 100) : 0;
    }

    calculateFileUploadScore() {
        const fileResults = this.testResults.fileUpload || {};
        const total = Object.keys(fileResults).length;
        const safe = Object.values(fileResults).filter(r => r.safe).length;
        return total > 0 ? Math.round((safe / total) * 100) : 0;
    }

    displaySecurityResults(report) {
        const resultsDiv = document.createElement('div');
        resultsDiv.innerHTML = \`
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3>🛡️ Security Test Results</h3>
                <p><strong>Overall Score:</strong> \${report.summary.overallScore}/100</p>
                <p><strong>XSS Protection:</strong> \${report.summary.xssProtection}%</p>
                <p><strong>Input Sanitization:</strong> \${report.summary.inputSanitization}%</p>
                <p><strong>File Upload Security:</strong> \${report.summary.fileUploadSecurity}%</p>
                <p><strong>CSRF Protection:</strong> \${report.summary.csrfProtection}</p>
                <p><strong>Status:</strong> \${report.summary.overallScore >= 90 ? '✅ Secure' : 
                                                report.summary.overallScore >= 70 ? '⚠️ Moderate' : '❌ Vulnerable'}</p>
            </div>
        \`;
        
        document.body.appendChild(resultsDiv);
    }
}

// Export for testing
if (typeof window !== 'undefined') {
    window.SecurityTester = SecurityTester;
}

if (typeof module !== 'undefined') {
    module.exports = SecurityTester;
}`;

        const securityTestPath = path.join(this.projectRoot, 'security-tests.js');
        fs.writeFileSync(securityTestPath, securityTestScript);
        console.log('   🛡️ Created: security-tests.js');
        console.log('   ✅ Security tests ready\n');
    }

    setupPerformanceBaselines() {
        console.log('⚡ Setting up performance baselines...');
        
        const performanceBaselines = {
            project: "GR Balance",
            version: "1.0.0",
            baseline_date: new Date().toISOString(),
            targets: {
                page_load: {
                    target_ms: 3000,
                    acceptable_ms: 5000,
                    description: "Time for page to become interactive"
                },
                file_upload: {
                    target_ms: 5000,
                    acceptable_ms: 10000,
                    description: "Time to upload and process 1MB file"
                },
                step_processing: {
                    target_ms: 2000,
                    acceptable_ms: 5000,
                    description: "Time to process single step with 1000 rows"
                },
                ui_responsiveness: {
                    target_ms: 100,
                    acceptable_ms: 300,
                    description: "Time for UI to respond to user interaction"
                }
            },
            memory: {
                initial_mb: 50,
                max_growth_mb: 200,
                description: "Memory usage limits"
            },
            throughput: {
                rows_per_second: 1000,
                files_per_minute: 10,
                description: "Processing throughput targets"
            }
        };

        const baselinesPath = path.join(this.projectRoot, 'performance-baselines.json');
        fs.writeFileSync(baselinesPath, JSON.stringify(performanceBaselines, null, 2));
        console.log('   ⚡ Created: performance-baselines.json');
        console.log('   ✅ Performance baselines ready\n');
    }

    displaySummary() {
        console.log('📋 Testing Setup Summary');
        console.log('========================');
        console.log('✅ Test directories created');
        console.log('✅ Test configuration generated');
        console.log('✅ Documentation created');
        console.log('✅ Health checks configured');
        console.log('✅ Browser compatibility tests ready');
        console.log('✅ Security tests prepared');
        console.log('✅ Performance baselines established');
        console.log('');
        console.log('🚀 Next Steps:');
        console.log('1. Run: node test-automation-helper.cjs generate');
        console.log('2. Run: node health-check.cjs');
        console.log('3. Open: browser-compatibility-test.html');
        console.log('4. Follow: COMPREHENSIVE_TESTING_CHECKLIST.md');
        console.log('');
        console.log('📚 Documentation:');
        console.log('- TESTING_README.md - Quick start guide');
        console.log('- COMPREHENSIVE_TESTING_CHECKLIST.md - Detailed test cases');
        console.log('- test-config.json - Configuration settings');
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new TestingSetup();
    setup.setup().catch(console.error);
}

module.exports = TestingSetup;