// test-response-format.cjs - Verify the response format works

const fs = require('fs').promises;
const path = require('path');

async function testResponseFormat() {
    console.log('🧪 Testing Response Format Compatibility...');
    
    const sessionId = 'test-format-123';
    const communicationDir = path.join(__dirname, 'public', 'claude-communication');
    
    // Create test response in the exact format
    const responseData = {
        success: true,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        response: 'This is a test response for format validation.',
        status: 'completed',
        model: 'claude-3-sonnet',
        processing_time: '1.5s'
    };

    const responseContent = `// Claude AI Response for session ${sessionId}
// Generated at ${new Date().toISOString()}

window.claudeResponse = ${JSON.stringify(responseData, null, 2)};

// Optional: Also set aiResponse for fallback compatibility
window.aiResponse = window.claudeResponse;

// Dispatch event for advanced listeners
if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('claudeResponseReady', { 
        detail: window.claudeResponse 
    }));
}

console.log('✅ Claude response loaded for session:', '${sessionId}');`;

    // Write test response file
    const responseFile = path.join(communicationDir, `claude-comm-response-${sessionId}.js`);
    await fs.writeFile(responseFile, responseContent);
    
    console.log('✅ Test response file created');
    console.log('📄 Content preview:');
    console.log(responseContent.substring(0, 300) + '...');
    
    // Test parsing (simulate what frontend does)
    try {
        const mockWindow = { claudeResponse: null, aiResponse: null };
        
        // Replace window with mockWindow for testing
        const testableCode = responseContent.replace(/window/g, 'mockWindow');
        eval(testableCode);
        
        console.log('✅ Response successfully parsed');
        console.log('📊 Parsed data:', mockWindow.claudeResponse);
        
        // Check required fields
        const required = ['success', 'sessionId', 'timestamp', 'response', 'status'];
        const missing = required.filter(field => !mockWindow.claudeResponse[field]);
        
        if (missing.length === 0) {
            console.log('🎉 All required fields present!');
        } else {
            console.log('❌ Missing fields:', missing);
        }
        
    } catch (error) {
        console.error('❌ Parsing failed:', error);
    }
    
    // Cleanup
    try {
        await fs.unlink(responseFile);
        console.log('🧹 Test file cleaned up');
    } catch (e) {}
}

testResponseFormat().catch(console.error); 