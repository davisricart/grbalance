#!/usr/bin/env node

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
        console.log('=====================\n');
        
        const results = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            checks: {}
        };

        // Check frontend URLs
        for (const [env, config] of Object.entries(this.config.environments)) {
            console.log(`🌍 Checking ${env} environment...`);
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
        console.log('\n📋 Health Check Summary');
        console.log('========================');
        
        let allHealthy = true;
        
        for (const [env, checks] of Object.entries(results.checks)) {
            if (env === 'fileSystem' || env === 'testData') continue;
            
            const frontendStatus = checks.frontend?.status || 'UNKNOWN';
            const backendStatus = checks.backend?.status || 'N/A';
            
            console.log(`${env.padEnd(12)}: Frontend ${frontendStatus}, Backend ${backendStatus}`);
            
            if (frontendStatus !== 'UP') allHealthy = false;
        }

        console.log(`File System : ${results.checks.fileSystem ? 'OK' : 'ISSUES'}`);
        console.log(`Test Data   : ${Object.values(results.checks.testData).every(f => f.exists) ? 'OK' : 'MISSING FILES'}`);

        console.log(`\n${allHealthy ? '✅' : '❌'} Overall Status: ${allHealthy ? 'HEALTHY' : 'ISSUES DETECTED'}`);
        
        // Save detailed report
        const reportPath = path.join('test-reports', `health-check-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`\n📄 Detailed report saved: ${reportPath}`);
    }
}

if (require.main === module) {
    const checker = new HealthChecker();
    checker.checkAll().catch(console.error);
}

module.exports = HealthChecker;
