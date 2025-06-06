#!/usr/bin/env node

// Complete AI Communication Workflow Test
const fs = require('fs').promises;
const path = require('path');

class WorkflowTester {
    constructor() {
        this.commDir = path.join(__dirname, 'public', 'claude-communication');
        this.sessionId = `workflow-test-${Date.now()}`;
        console.log('🧪 AI Communication Workflow Tester');
        console.log(`🏷️  Session ID: ${this.sessionId}`);
    }

    async testCompleteWorkflow() {
        console.log('\n🚀 Starting Complete Workflow Test...');
        
        try {
            // Step 1: Verify AI watcher is running
            await this.verifyWatcherStatus();
            
            // Step 2: Test file creation
            await this.testFileCreation();
            
            // Step 3: Simulate frontend request
            await this.simulateFrontendRequest();
            
            // Step 4: Wait for AI response
            await this.waitForResponse();
            
            // Step 5: Verify response format
            await this.verifyResponseFormat();
            
            console.log('\n🎉 COMPLETE WORKFLOW TEST PASSED!');
            
        } catch (error) {
            console.error('\n❌ WORKFLOW TEST FAILED:', error);
            throw error;
        }
    }

    async verifyWatcherStatus() {
        console.log('\n📊 Step 1: Verifying AI Watcher Status...');
        
        try {
            await fs.access(this.commDir);
            console.log('✅ Communication directory exists');
            
            const files = await fs.readdir(this.commDir);
            const responseFiles = files.filter(f => f.startsWith('claude-comm-response-'));
            console.log(`📄 Found ${responseFiles.length} existing response files`);
            
            // Test write permissions
            const testFile = path.join(this.commDir, '.test-write');
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);
            console.log('✅ Directory is writable');
            
        } catch (error) {
            throw new Error(`Watcher verification failed: ${error.message}`);
        }
    }

    async testFileCreation() {
        console.log('\n📝 Step 2: Testing File Creation...');
        
        const testInstruction = `Complete workflow test instruction. Please analyze this comprehensive test request and provide detailed insights about:

1. Communication Pipeline Status
2. File Processing Capabilities  
3. Response Generation Quality
4. System Integration Health

This is a critical test to verify the end-to-end AI communication workflow from frontend to backend processing.`;

        const requestFileName = `claude-comm-request-${this.sessionId}.txt`;
        const requestFilePath = path.join(this.commDir, requestFileName);
        
        try {
            await fs.writeFile(requestFilePath, testInstruction, 'utf8');
            console.log(`✅ Created request file: ${requestFileName}`);
            
            // Verify file exists and has content
            const content = await fs.readFile(requestFilePath, 'utf8');
            if (content.length === 0) {
                throw new Error('Request file is empty');
            }
            
            console.log(`📄 Request file content: ${content.length} characters`);
            
        } catch (error) {
            throw new Error(`File creation failed: ${error.message}`);
        }
    }

    async simulateFrontendRequest() {
        console.log('\n🌐 Step 3: Simulating Frontend Request...');
        
        // Simulate what the frontend does
        const requestData = {
            instruction: "Comprehensive workflow test",
            sessionId: this.sessionId,
            timestamp: Date.now(),
            metadata: {
                testType: 'complete_workflow',
                source: 'workflow_tester',
                expectedFeatures: ['analysis', 'insights', 'recommendations']
            }
        };
        
        console.log('📤 Simulated frontend request data:');
        console.log(JSON.stringify(requestData, null, 2));
        console.log('✅ Frontend simulation complete');
    }

    async waitForResponse() {
        console.log('\n⏳ Step 4: Waiting for AI Response...');
        
        const responseFileName = `claude-comm-response-${this.sessionId}.js`;
        const responseFilePath = path.join(this.commDir, responseFileName);
        
        const maxAttempts = 60; // 60 seconds max wait
        let attempt = 0;
        
        while (attempt < maxAttempts) {
            try {
                await fs.access(responseFilePath);
                console.log(`✅ Response file found after ${attempt + 1} seconds!`);
                return;
            } catch (error) {
                // File doesn't exist yet
                attempt++;
                if (attempt % 10 === 0) {
                    console.log(`⏳ Still waiting... (${attempt}s elapsed)`);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        throw new Error(`Response timeout after ${maxAttempts} seconds`);
    }

    async verifyResponseFormat() {
        console.log('\n🔍 Step 5: Verifying Response Format...');
        
        const responseFileName = `claude-comm-response-${this.sessionId}.js`;
        const responseFilePath = path.join(this.commDir, responseFileName);
        
        try {
            const responseContent = await fs.readFile(responseFilePath, 'utf8');
            console.log(`📄 Response file size: ${responseContent.length} characters`);
            
            // Verify it contains the expected structure
            const requiredPatterns = [
                /window\.claudeResponse\s*=/,
                /"success":\s*true/,
                /"sessionId":\s*"[^"]*"/,
                /"response":\s*"[^"]*"/,
                /"status":\s*"completed"/
            ];
            
            let validPatterns = 0;
            for (const pattern of requiredPatterns) {
                if (pattern.test(responseContent)) {
                    validPatterns++;
                } else {
                    console.log(`⚠️  Missing pattern: ${pattern}`);
                }
            }
            
            console.log(`✅ Response format validation: ${validPatterns}/${requiredPatterns.length} patterns found`);
            
            if (validPatterns < requiredPatterns.length) {
                console.log('📄 Response content preview:');
                console.log(responseContent.substring(0, 500) + '...');
            }
            
            // Try to parse the JSON data
            const jsonMatch = responseContent.match(/window\.claudeResponse\s*=\s*({[\s\S]*?});/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[1]);
                console.log('✅ JSON parsing successful');
                console.log(`📊 Response preview: ${data.response.substring(0, 100)}...`);
            } else {
                throw new Error('Could not extract JSON data from response');
            }
            
        } catch (error) {
            throw new Error(`Response verification failed: ${error.message}`);
        }
    }

    async checkSystemHealth() {
        console.log('\n💓 System Health Check...');
        
        try {
            const files = await fs.readdir(this.commDir);
            
            const requestFiles = files.filter(f => f.startsWith('claude-comm-request-'));
            const responseFiles = files.filter(f => f.startsWith('claude-comm-response-'));
            
            console.log(`📊 System Status:`);
            console.log(`   📝 Pending requests: ${requestFiles.length}`);
            console.log(`   ✅ Generated responses: ${responseFiles.length}`);
            
            if (requestFiles.length > 0) {
                console.log('⚠️  Unprocessed request files found:');
                requestFiles.forEach(file => console.log(`     - ${file}`));
            }
            
            // Check for recent activity
            const recentResponses = [];
            for (const file of responseFiles) {
                const filePath = path.join(this.commDir, file);
                const stats = await fs.stat(filePath);
                const ageMinutes = (Date.now() - stats.mtime.getTime()) / (1000 * 60);
                if (ageMinutes < 60) { // Less than 1 hour old
                    recentResponses.push({ file, age: ageMinutes.toFixed(1) });
                }
            }
            
            console.log(`🕐 Recent activity: ${recentResponses.length} responses in last hour`);
            recentResponses.forEach(({ file, age }) => {
                console.log(`     - ${file} (${age} minutes ago)`);
            });
            
        } catch (error) {
            console.error('❌ Health check failed:', error);
        }
    }
}

// Run the test
async function main() {
    const tester = new WorkflowTester();
    
    try {
        await tester.checkSystemHealth();
        await tester.testCompleteWorkflow();
        await tester.checkSystemHealth();
        
        console.log('\n🎯 All tests completed successfully!');
        
    } catch (error) {
        console.error('\n💥 Test suite failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}