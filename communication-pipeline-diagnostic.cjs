#!/usr/bin/env node

// Communication Pipeline Diagnostic Tool
const fs = require('fs').promises;
const path = require('path');

class PipelineDiagnostic {
    constructor() {
        this.commDir = path.join(__dirname, 'public', 'claude-communication');
        this.errorsDir = path.join(this.commDir, 'errors');
        this.processedDir = path.join(this.commDir, 'processed');
        this.issues = [];
        this.recommendations = [];
    }

    async runDiagnostic() {
        console.log('🔬 AI Communication Pipeline Diagnostic');
        console.log('=====================================\n');

        try {
            await this.checkDirectoryStructure();
            await this.analyzeFileMetrics();
            await this.checkResponseQuality();
            await this.detectStaleRequests();
            await this.analyzeErrorPatterns();
            await this.checkSystemPerformance();
            await this.validateResponseFormats();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Diagnostic failed:', error);
        }
    }

    async checkDirectoryStructure() {
        console.log('📁 Checking Directory Structure...');
        
        try {
            await fs.access(this.commDir);
            console.log('✅ Main communication directory exists');
        } catch {
            this.issues.push('Communication directory missing');
            console.log('❌ Main communication directory missing');
        }

        try {
            await fs.access(this.errorsDir);
            console.log('✅ Errors directory exists');
        } catch {
            console.log('⚠️  Errors directory missing (creating...)');
            await fs.mkdir(this.errorsDir, { recursive: true });
        }

        try {
            await fs.access(this.processedDir);
            console.log('✅ Processed directory exists');
        } catch {
            console.log('⚠️  Processed directory missing (creating...)');
            await fs.mkdir(this.processedDir, { recursive: true });
        }
    }

    async analyzeFileMetrics() {
        console.log('\n📊 Analyzing File Metrics...');
        
        try {
            const files = await fs.readdir(this.commDir);
            
            const requestFiles = files.filter(f => f.startsWith('claude-comm-request-'));
            const responseFiles = files.filter(f => f.startsWith('claude-comm-response-'));
            
            console.log(`📝 Active request files: ${requestFiles.length}`);
            console.log(`✅ Generated response files: ${responseFiles.length}`);
            
            if (requestFiles.length > 0) {
                this.issues.push(`${requestFiles.length} unprocessed request files found`);
                console.log('⚠️  Unprocessed requests detected:');
                for (const file of requestFiles.slice(0, 5)) {
                    const filePath = path.join(this.commDir, file);
                    const stats = await fs.stat(filePath);
                    const ageMinutes = (Date.now() - stats.mtime.getTime()) / (1000 * 60);
                    console.log(`     - ${file} (${ageMinutes.toFixed(1)} minutes old)`);
                }
                if (requestFiles.length > 5) {
                    console.log(`     ... and ${requestFiles.length - 5} more`);
                }
            }
            
            // Check response-to-request ratio
            const processedFiles = await fs.readdir(this.processedDir);
            const totalProcessed = processedFiles.length + responseFiles.length;
            
            if (totalProcessed > 0) {
                const successRate = (responseFiles.length / totalProcessed) * 100;
                console.log(`📈 Success rate: ${successRate.toFixed(1)}%`);
                
                if (successRate < 90) {
                    this.issues.push(`Low success rate: ${successRate.toFixed(1)}%`);
                }
            }
            
        } catch (error) {
            this.issues.push(`File metrics analysis failed: ${error.message}`);
        }
    }

    async checkResponseQuality() {
        console.log('\n🔍 Checking Response Quality...');
        
        try {
            const files = await fs.readdir(this.commDir);
            const responseFiles = files.filter(f => f.startsWith('claude-comm-response-')).slice(-10); // Check last 10
            
            let validResponses = 0;
            let totalSize = 0;
            let formatIssues = 0;
            
            for (const file of responseFiles) {
                const filePath = path.join(this.commDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                totalSize += content.length;
                
                // Check for valid format
                const hasClaudeResponse = content.includes('window.claudeResponse');
                const hasValidJSON = content.match(/window\.claudeResponse\s*=\s*({[\s\S]*?});/);
                
                if (hasClaudeResponse && hasValidJSON) {
                    try {
                        const data = JSON.parse(hasValidJSON[1]);
                        if (data.success && data.response && data.response.length > 50) {
                            validResponses++;
                        } else {
                            formatIssues++;
                        }
                    } catch {
                        formatIssues++;
                    }
                } else {
                    formatIssues++;
                }
            }
            
            const avgSize = responseFiles.length > 0 ? totalSize / responseFiles.length : 0;
            console.log(`📄 Average response size: ${avgSize.toFixed(0)} characters`);
            console.log(`✅ Valid responses: ${validResponses}/${responseFiles.length}`);
            
            if (formatIssues > 0) {
                this.issues.push(`${formatIssues} responses have format issues`);
                console.log(`⚠️  Format issues detected: ${formatIssues}`);
            }
            
            if (avgSize < 500) {
                this.issues.push(`Average response size is low: ${avgSize.toFixed(0)} chars`);
            }
            
        } catch (error) {
            this.issues.push(`Response quality check failed: ${error.message}`);
        }
    }

    async detectStaleRequests() {
        console.log('\n🕐 Detecting Stale Requests...');
        
        try {
            const files = await fs.readdir(this.commDir);
            const requestFiles = files.filter(f => f.startsWith('claude-comm-request-'));
            
            let staleCount = 0;
            const staleThreshold = 10 * 60 * 1000; // 10 minutes
            
            for (const file of requestFiles) {
                const filePath = path.join(this.commDir, file);
                const stats = await fs.stat(filePath);
                const age = Date.now() - stats.mtime.getTime();
                
                if (age > staleThreshold) {
                    staleCount++;
                    if (staleCount <= 3) {
                        console.log(`⏰ Stale request: ${file} (${(age / 1000 / 60).toFixed(1)} minutes old)`);
                    }
                }
            }
            
            if (staleCount > 0) {
                this.issues.push(`${staleCount} stale requests detected (>10 minutes old)`);
                this.recommendations.push('Check if AI watcher process is running');
                this.recommendations.push('Investigate file permission issues');
            } else {
                console.log('✅ No stale requests found');
            }
            
        } catch (error) {
            this.issues.push(`Stale request detection failed: ${error.message}`);
        }
    }

    async analyzeErrorPatterns() {
        console.log('\n⚠️  Analyzing Error Patterns...');
        
        try {
            const errorFiles = await fs.readdir(this.errorsDir).catch(() => []);
            
            if (errorFiles.length === 0) {
                console.log('✅ No error files found');
                return;
            }
            
            console.log(`📋 Found ${errorFiles.length} error files`);
            
            const errorPatterns = {};
            
            for (const file of errorFiles.slice(-20)) { // Analyze last 20 errors
                const filePath = path.join(this.errorsDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                
                // Extract error patterns
                const lines = content.split('\n');
                for (const line of lines) {
                    if (line.includes('error') || line.includes('Error') || line.includes('ERROR')) {
                        const pattern = line.substring(0, 100);
                        errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;
                    }
                }
            }
            
            const sortedPatterns = Object.entries(errorPatterns)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);
                
            if (sortedPatterns.length > 0) {
                console.log('🔍 Most common error patterns:');
                sortedPatterns.forEach(([pattern, count]) => {
                    console.log(`   ${count}x: ${pattern}...`);
                });
                
                this.issues.push(`${errorFiles.length} error files found`);
                this.recommendations.push('Review error logs for recurring issues');
            }
            
        } catch (error) {
            console.log(`⚠️  Error pattern analysis failed: ${error.message}`);
        }
    }

    async checkSystemPerformance() {
        console.log('\n⚡ Checking System Performance...');
        
        try {
            const files = await fs.readdir(this.commDir);
            const responseFiles = files.filter(f => f.startsWith('claude-comm-response-'));
            
            // Check recent response times
            const recentFiles = responseFiles.slice(-10);
            const responseTimes = [];
            
            for (const file of recentFiles) {
                const filePath = path.join(this.commDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                
                const timeMatch = content.match(/"processing_time":\s*"([^"]+)"/);
                if (timeMatch) {
                    const timeStr = timeMatch[1];
                    const timeValue = parseFloat(timeStr.replace(/[^0-9.]/g, ''));
                    if (!isNaN(timeValue)) {
                        responseTimes.push(timeValue);
                    }
                }
            }
            
            if (responseTimes.length > 0) {
                const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
                const maxTime = Math.max(...responseTimes);
                
                console.log(`⏱️  Average processing time: ${avgTime.toFixed(1)}s`);
                console.log(`⏱️  Maximum processing time: ${maxTime.toFixed(1)}s`);
                
                if (avgTime > 5) {
                    this.issues.push(`High average processing time: ${avgTime.toFixed(1)}s`);
                    this.recommendations.push('Consider optimizing AI processing pipeline');
                }
            }
            
            // Check file system performance
            const startTime = Date.now();
            const testFile = path.join(this.commDir, '.perf-test');
            await fs.writeFile(testFile, 'test');
            await fs.readFile(testFile);
            await fs.unlink(testFile);
            const fsLatency = Date.now() - startTime;
            
            console.log(`💾 File system latency: ${fsLatency}ms`);
            
            if (fsLatency > 100) {
                this.issues.push(`High file system latency: ${fsLatency}ms`);
                this.recommendations.push('Check disk performance and available space');
            }
            
        } catch (error) {
            this.issues.push(`Performance check failed: ${error.message}`);
        }
    }

    async validateResponseFormats() {
        console.log('\n🔧 Validating Response Formats...');
        
        try {
            const files = await fs.readdir(this.commDir);
            const responseFiles = files.filter(f => f.startsWith('claude-comm-response-')).slice(-5);
            
            const formatChecks = {
                hasWindowVariable: 0,
                hasValidJSON: 0,
                hasSuccessField: 0,
                hasResponseContent: 0,
                hasTimestamp: 0
            };
            
            for (const file of responseFiles) {
                const filePath = path.join(this.commDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                
                if (content.includes('window.claudeResponse')) formatChecks.hasWindowVariable++;
                
                const jsonMatch = content.match(/window\.claudeResponse\s*=\s*({[\s\S]*?});/);
                if (jsonMatch) {
                    formatChecks.hasValidJSON++;
                    
                    try {
                        const data = JSON.parse(jsonMatch[1]);
                        if (data.success !== undefined) formatChecks.hasSuccessField++;
                        if (data.response && data.response.length > 0) formatChecks.hasResponseContent++;
                        if (data.timestamp) formatChecks.hasTimestamp++;
                    } catch {
                        // JSON parse failed
                    }
                }
            }
            
            const total = responseFiles.length;
            console.log('📋 Format validation results:');
            console.log(`   Window variable: ${formatChecks.hasWindowVariable}/${total}`);
            console.log(`   Valid JSON: ${formatChecks.hasValidJSON}/${total}`);
            console.log(`   Success field: ${formatChecks.hasSuccessField}/${total}`);
            console.log(`   Response content: ${formatChecks.hasResponseContent}/${total}`);
            console.log(`   Timestamp: ${formatChecks.hasTimestamp}/${total}`);
            
            Object.entries(formatChecks).forEach(([check, count]) => {
                if (count < total && total > 0) {
                    this.issues.push(`Format issue: ${check} failed for ${total - count}/${total} responses`);
                }
            });
            
        } catch (error) {
            this.issues.push(`Format validation failed: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n📋 DIAGNOSTIC REPORT');
        console.log('===================\n');
        
        if (this.issues.length === 0) {
            console.log('🎉 No issues detected! Communication pipeline is healthy.');
        } else {
            console.log(`⚠️  Found ${this.issues.length} issues:\n`);
            this.issues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue}`);
            });
        }
        
        if (this.recommendations.length > 0) {
            console.log('\n💡 Recommendations:\n');
            this.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        }
        
        // Overall health score
        const maxIssues = 20; // Arbitrary max for scoring
        const healthScore = Math.max(0, 100 - (this.issues.length * 5));
        
        console.log(`\n📊 Overall Pipeline Health: ${healthScore}%`);
        
        if (healthScore >= 90) {
            console.log('✅ Excellent - Pipeline operating optimally');
        } else if (healthScore >= 70) {
            console.log('⚠️  Good - Minor issues detected');
        } else if (healthScore >= 50) {
            console.log('🔧 Fair - Several issues need attention');
        } else {
            console.log('❌ Poor - Critical issues require immediate attention');
        }
        
        console.log('\n🔍 For detailed troubleshooting, check:');
        console.log('   - AI watcher process logs');
        console.log('   - File permissions in communication directory');
        console.log('   - Available disk space');
        console.log('   - Network connectivity for API calls');
    }
}

// Run the diagnostic
async function main() {
    const diagnostic = new PipelineDiagnostic();
    await diagnostic.runDiagnostic();
}

if (require.main === module) {
    main();
}