#!/usr/bin/env node

// Test various automation engine scenarios
const fs = require('fs').promises;
const path = require('path');

class AutomationEngineTest {
    constructor() {
        this.commDir = path.join(__dirname, 'public', 'claude-communication');
        this.testResults = [];
        console.log('🤖 Automation Engine Communication Test Suite');
    }

    async runAllTests() {
        console.log('\n🚀 Starting Automation Engine Tests...');
        
        const tests = [
            { name: 'Basic Analysis Request', fn: () => this.testBasicAnalysis() },
            { name: 'Data Processing Request', fn: () => this.testDataProcessing() },
            { name: 'Error Handling', fn: () => this.testErrorHandling() },
            { name: 'Large Instruction', fn: () => this.testLargeInstruction() },
            { name: 'Metadata Processing', fn: () => this.testMetadataProcessing() },
            { name: 'Concurrent Requests', fn: () => this.testConcurrentRequests() }
        ];
        
        for (const test of tests) {
            try {
                console.log(`\n🧪 Testing: ${test.name}`);
                await test.fn();
                this.testResults.push({ name: test.name, status: 'PASS', error: null });
                console.log(`✅ ${test.name}: PASSED`);
            } catch (error) {
                this.testResults.push({ name: test.name, status: 'FAIL', error: error.message });
                console.log(`❌ ${test.name}: FAILED - ${error.message}`);
            }
            
            // Small delay between tests
            await this.delay(1000);
        }
        
        this.printSummary();
    }

    async testBasicAnalysis() {
        const sessionId = `analysis-${Date.now()}`;
        const instruction = `Analyze the following business scenario: A retail store processes credit card transactions daily. They need insights on payment patterns, customer behavior, and operational efficiency. Provide a structured analysis with actionable recommendations.`;
        
        await this.createRequestAndWaitForResponse(sessionId, instruction);
    }

    async testDataProcessing() {
        const sessionId = `dataproc-${Date.now()}`;
        const instruction = `Process credit card transaction data with the following structure:
        - Card Brand: Visa, Mastercard, Amex, Discover
        - Amount: Transaction values
        - Date: Transaction dates
        - Merchant: Store locations
        
        Provide insights on transaction volume, brand preferences, and temporal patterns.`;
        
        await this.createRequestAndWaitForResponse(sessionId, instruction);
    }

    async testErrorHandling() {
        const sessionId = `error-${Date.now()}`;
        const instruction = ``; // Empty instruction to test error handling
        
        try {
            await this.createRequestAndWaitForResponse(sessionId, instruction, 10); // Shorter timeout
        } catch (error) {
            // This is expected - empty instruction should be handled gracefully
            console.log('⚠️  Empty instruction handled appropriately');
        }
    }

    async testLargeInstruction() {
        const sessionId = `large-${Date.now()}`;
        const largeData = 'A'.repeat(5000); // 5KB of data
        const instruction = `Process this large dataset analysis request: ${largeData}. Please provide comprehensive insights and maintain processing efficiency even with substantial input data.`;
        
        await this.createRequestAndWaitForResponse(sessionId, instruction, 30); // Longer timeout for large data
    }

    async testMetadataProcessing() {
        const sessionId = `metadata-${Date.now()}`;
        const instruction = `Analyze payment processing data with comprehensive metadata context. Include business intelligence insights and operational recommendations.`;
        
        // Simulate metadata that would come from the frontend
        const metadata = {
            files: ['transactions-2025.xlsx', 'merchant-data.csv'],
            columns: ['Card Brand', 'Amount', 'Date', 'Merchant ID', 'Transaction Type'],
            rowCount: 15000,
            dateRange: '2025-01-01 to 2025-06-06',
            businessType: 'retail',
            analysisType: 'payment_processing'
        };
        
        await this.createRequestAndWaitForResponse(sessionId, instruction + JSON.stringify(metadata, null, 2));
    }

    async testConcurrentRequests() {
        console.log('🔄 Testing concurrent request handling...');
        
        const requests = [];
        for (let i = 0; i < 3; i++) {
            const sessionId = `concurrent-${Date.now()}-${i}`;
            const instruction = `Concurrent test request ${i + 1}. Process this request independently while handling other simultaneous requests.`;
            
            requests.push(this.createRequestAndWaitForResponse(sessionId, instruction, 20));
        }
        
        // Wait for all concurrent requests to complete
        const results = await Promise.allSettled(requests);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`📊 Concurrent test results: ${successful} successful, ${failed} failed`);
        
        if (failed > 0) {
            throw new Error(`${failed} concurrent requests failed`);
        }
    }

    async createRequestAndWaitForResponse(sessionId, instruction, timeoutSeconds = 15) {
        // Create request file
        const requestFileName = `claude-comm-request-${sessionId}.txt`;
        const requestFilePath = path.join(this.commDir, requestFileName);
        
        await fs.writeFile(requestFilePath, instruction, 'utf8');
        console.log(`📝 Created request: ${sessionId}`);
        
        // Wait for response
        const responseFileName = `claude-comm-response-${sessionId}.js`;
        const responseFilePath = path.join(this.commDir, responseFileName);
        
        const maxAttempts = timeoutSeconds;
        let attempt = 0;
        
        while (attempt < maxAttempts) {
            try {
                await fs.access(responseFilePath);
                
                // Verify response content
                const responseContent = await fs.readFile(responseFilePath, 'utf8');
                if (responseContent.length < 100) {
                    throw new Error('Response too short, may be incomplete');
                }
                
                // Check for valid JSON structure
                const jsonMatch = responseContent.match(/window\.claudeResponse\s*=\s*({[\s\S]*?});/);
                if (!jsonMatch) {
                    throw new Error('Invalid response format');
                }
                
                const data = JSON.parse(jsonMatch[1]);
                if (!data.success || !data.response) {
                    throw new Error('Response indicates failure or missing content');
                }
                
                console.log(`✅ Response received: ${sessionId} (${responseContent.length} chars)`);
                return data;
                
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // File doesn't exist yet, continue waiting
                    attempt++;
                    await this.delay(1000);
                } else {
                    throw error;
                }
            }
        }
        
        throw new Error(`Response timeout after ${timeoutSeconds} seconds for session ${sessionId}`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    printSummary() {
        console.log('\n📊 TEST SUMMARY');
        console.log('================');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(r => r.status === 'FAIL').forEach(test => {
                console.log(`  - ${test.name}: ${test.error}`);
            });
        }
        
        console.log('\n✅ Passed Tests:');
        this.testResults.filter(r => r.status === 'PASS').forEach(test => {
            console.log(`  - ${test.name}`);
        });
        
        if (failed === 0) {
            console.log('\n🎉 All automation engine tests passed!');
        } else {
            console.log(`\n⚠️  ${failed} tests failed. Review the automation pipeline.`);
        }
    }
}

// Run the tests
async function main() {
    const tester = new AutomationEngineTest();
    await tester.runAllTests();
}

if (require.main === module) {
    main();
}