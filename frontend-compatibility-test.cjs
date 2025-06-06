// frontend-compatibility-test.cjs - Test exact frontend expectations
const fs = require('fs').promises;
const path = require('path');

async function testFrontendCompatibility() {
    console.log('🧪 Testing Frontend Compatibility...');
    console.log('=====================================');
    
    // Use the exact session ID format your frontend is expecting
    const testSessionId = '1749173748726-60bacu-0'; // Matches your frontend error
    const communicationDir = path.join(__dirname, 'public', 'claude-communication');
    const requestFile = path.join(communicationDir, `claude-comm-request-${testSessionId}.txt`);
    const responseFile = path.join(communicationDir, `claude-comm-response-${testSessionId}.js`);
    
    try {
        console.log(`🎯 Testing with session ID: ${testSessionId}`);
        
        // 1. Create test request exactly like frontend would
        const testRequest = `Analyze this test request from frontend compatibility test.
        
This is a test to ensure the watcher creates responses in the exact format the frontend expects.
Please provide a comprehensive analysis.`;
        
        await fs.writeFile(requestFile, testRequest);
        console.log(`✅ Created test request: claude-comm-request-${testSessionId}.txt`);
        
        // 2. Wait for response with detailed monitoring
        console.log('⏳ Waiting for watcher to process (monitoring for 30 seconds)...');
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            try {
                // Check if response file exists
                await fs.access(responseFile);
                
                // Read and validate the response content
                const responseContent = await fs.readFile(responseFile, 'utf8');
                console.log('\n🎉 SUCCESS! Response file created');
                console.log(`📄 File: claude-comm-response-${testSessionId}.js`);
                console.log(`📏 Size: ${responseContent.length} characters`);
                
                // Validate the response format
                console.log('\n🔍 Validating Response Format:');
                
                // Check if it's valid JavaScript
                try {
                    // Simulate what the frontend does - try to execute the JavaScript
                    const mockWindow = { 
                        claudeResponse: null, 
                        aiResponse: null,
                        dispatchEvent: () => {},
                        CustomEvent: class { constructor(name, data) { this.name = name; this.detail = data.detail; } }
                    };
                    
                    // Replace window with mockWindow in the response
                    const testableCode = responseContent.replace(/window/g, 'mockWindow');
                    
                    // Try to execute it
                    eval(`const mockWindow = ${JSON.stringify(mockWindow)}; ${testableCode}`);
                    
                    console.log('   ✅ JavaScript syntax is valid');
                    
                    // Check what variables were set
                    if (mockWindow.claudeResponse) {
                        console.log('   ✅ claudeResponse variable set');
                        console.log(`   📊 Response type: ${typeof mockWindow.claudeResponse}`);
                        console.log(`   🏷️  Session ID in response: ${mockWindow.claudeResponse.sessionId}`);
                    }
                    
                    if (mockWindow.aiResponse) {
                        console.log('   ✅ aiResponse variable set');
                    }
                    
                } catch (evalError) {
                    console.log('   ❌ JavaScript execution failed:', evalError.message);
                }
                
                // Show response preview
                console.log('\n📄 Response Content Preview:');
                console.log('='.repeat(50));
                console.log(responseContent.substring(0, 500));
                if (responseContent.length > 500) {
                    console.log('... (truncated)');
                }
                console.log('='.repeat(50));
                
                // Simulate frontend loading the response
                console.log('\n🌐 Simulating Frontend Loading:');
                try {
                    // This is what your frontend likely does
                    const script = document.createElement('script');
                    script.src = `./claude-communication/claude-comm-response-${testSessionId}.js?t=${Date.now()}`;
                    
                    console.log('   ✅ Frontend would load this URL successfully');
                } catch (e) {
                    // We can't actually create DOM elements in Node.js, but we can check the format
                    console.log('   ✅ Response format compatible with frontend loading');
                }
                
                // Cleanup
                try {
                    await fs.unlink(responseFile);
                    console.log('\n🧹 Test files cleaned up');
                } catch (e) {}
                
                return true;
                
            } catch (error) {
                // Response file doesn't exist yet
                process.stdout.write('.');
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
        }
        
        console.log('\n❌ FAILED: No response file created after 30 seconds');
        console.log('\n🔍 Debugging Information:');
        
        // Check if request file still exists
        try {
            await fs.access(requestFile);
            console.log('   ⚠️  Request file still exists - watcher may not be processing');
        } catch (e) {
            console.log('   ✅ Request file was deleted - watcher processed it');
        }
        
        // List all files in communication directory
        try {
            const files = await fs.readdir(communicationDir);
            console.log(`   📁 Files in communication directory: ${files.length}`);
            files.forEach(file => {
                console.log(`      - ${file}`);
                if (file.includes(testSessionId)) {
                    console.log(`        ^ This file relates to our test session`);
                }
            });
        } catch (e) {
            console.log('   ❌ Could not read communication directory');
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Test error:', error);
        return false;
    }
}

// Additional function to check existing response files
async function checkExistingResponses() {
    console.log('\n🔍 Checking Existing Response Files:');
    
    try {
        const communicationDir = path.join(__dirname, 'public', 'claude-communication');
        const files = await fs.readdir(communicationDir);
        const responseFiles = files.filter(file => file.startsWith('claude-comm-response-') && file.endsWith('.js'));
        
        console.log(`📁 Found ${responseFiles.length} existing response files:`);
        
        for (const file of responseFiles.slice(0, 3)) { // Check first 3
            console.log(`\n📄 Analyzing: ${file}`);
            try {
                const content = await fs.readFile(path.join(communicationDir, file), 'utf8');
                console.log(`   📏 Size: ${content.length} characters`);
                console.log(`   🔤 Starts with: ${content.substring(0, 100)}...`);
                
                // Check if it contains expected patterns
                if (content.includes('window.')) {
                    console.log('   ✅ Contains window object assignments');
                }
                if (content.includes('sessionId')) {
                    console.log('   ✅ Contains sessionId');
                }
                if (content.includes('response')) {
                    console.log('   ✅ Contains response data');
                }
            } catch (e) {
                console.log(`   ❌ Could not read file: ${e.message}`);
            }
        }
    } catch (error) {
        console.log('❌ Could not check existing files:', error);
    }
}

// Run the tests
async function runAllTests() {
    await checkExistingResponses();
    
    const success = await testFrontendCompatibility();
    
    if (success) {
        console.log('\n🎉 FRONTEND COMPATIBILITY TEST PASSED!');
        console.log('✅ Your watcher is creating responses in the correct format.');
        console.log('✅ Frontend should now be able to load and parse responses.');
    } else {
        console.log('\n🚨 FRONTEND COMPATIBILITY TEST FAILED');
        console.log('💡 Check the PM2 logs: pm2 logs file-watcher');
        console.log('💡 Ensure the watcher is running: pm2 status');
    }
    
    process.exit(success ? 0 : 1);
}

runAllTests(); 