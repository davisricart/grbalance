// quick-test.js - Test the file watcher immediately
const fs = require('fs').promises;
const path = require('path');

async function testWatcher() {
    console.log('🧪 Testing File Watcher...');
    
    const testSessionId = `test-${Date.now()}`;
    const communicationDir = path.join(__dirname, 'public', 'claude-communication');
    const requestFile = path.join(communicationDir, `claude-comm-request-${testSessionId}.txt`);
    const responseFile = path.join(communicationDir, `claude-comm-response-${testSessionId}.js`);
    
    try {
        // 1. Create test request
        const testRequest = `Test request from quick-test.js at ${new Date().toISOString()}\nPlease analyze this test message.`;
        await fs.writeFile(requestFile, testRequest);
        console.log(`✅ Created test request: claude-comm-request-${testSessionId}.txt`);
        
        // 2. Wait for response
        console.log('⏳ Waiting for watcher to process...');
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds
        
        while (attempts < maxAttempts) {
            try {
                await fs.access(responseFile);
                const responseContent = await fs.readFile(responseFile, 'utf8');
                console.log('🎉 SUCCESS! Response file created:');
                console.log(`📄 Content preview: ${responseContent.substring(0, 300)}...`);
                
                // Cleanup
                try {
                    await fs.unlink(responseFile);
                    console.log('🧹 Test files cleaned up');
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
        console.log('Check PM2 logs: pm2 logs file-watcher');
        return false;
        
    } catch (error) {
        console.error('❌ Test error:', error);
        return false;
    }
}

// Run the test
testWatcher().then(success => {
    if (success) {
        console.log('\n🎉 File watcher is working correctly!');
        console.log('✅ Your frontend should now receive responses automatically.');
    } else {
        console.log('\n🚨 File watcher needs debugging.');
        console.log('💡 Check the PM2 logs for more details.');
    }
    process.exit(success ? 0 : 1);
}); 