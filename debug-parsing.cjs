// Debug the exact parsing issue
const fs = require('fs');

// Test the exact parseResponse logic from the frontend
function parseResponse(responseText) {
    try {
        console.log('🔍 Parsing response text...');
        console.log('📄 Response text length:', responseText.length);
        console.log('📄 First 200 chars:', responseText.substring(0, 200));
        
        // The response should be JavaScript that sets window variables
        // Let's extract the data
        
        // Try to find JSON data in the response
        const jsonMatch = responseText.match(/window\.(?:claudeResponse|aiResponse)\s*=\s*({[\s\S]*?});/);
        console.log('🔍 JSON match found:', !!jsonMatch);
        
        if (jsonMatch) {
            console.log('✅ JSON match found!');
            console.log('📄 Matched JSON string:', jsonMatch[1].substring(0, 100) + '...');
            
            const jsonStr = jsonMatch[1];
            const data = JSON.parse(jsonStr);
            
            console.log('✅ Successfully parsed JSON data:', {
                success: data.success,
                sessionId: data.sessionId,
                hasResponse: !!data.response,
                responseLength: data.response?.length
            });
            
            return {
                success: true,
                sessionId: data.sessionId || 'fallback-session',
                timestamp: data.timestamp || new Date().toISOString(),
                response: data.response || 'Response received',
                status: 'completed'
            };
        }

        // Fallback: look for any reasonable response content
        if (responseText.includes('response') && responseText.length > 50) {
            console.log('⚠️ Using fallback parsing');
            return {
                success: true,
                sessionId: 'fallback-session',
                timestamp: new Date().toISOString(),
                response: 'Response received (format detected)',
                status: 'completed'
            };
        }

        console.warn('⚠️ Could not parse response format');
        return null;

    } catch (error) {
        console.error('❌ Response parsing error:', error);
        return null;
    }
}

// Test with the actual response file
const responseFile = 'public/claude-communication/claude-comm-response-1749178623328-qdq6am-0.js';
const responseText = fs.readFileSync(responseFile, 'utf8');

console.log('🧪 Testing Frontend Parsing Logic');
console.log('='.repeat(50));

const result = parseResponse(responseText);
console.log('\n🎯 Final Result:', result);

if (result) {
    console.log('✅ PARSING SUCCESS!');
} else {
    console.log('❌ PARSING FAILED!');
} 