import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMUNICATION_DIR = path.join(__dirname, 'public', 'claude-communication');

async function runDiagnostics() {
    console.log('🔍 Running diagnostics...\n');

    // Test 1: Check communication directory
    try {
        await fs.access(COMMUNICATION_DIR);
        console.log('✅ Communication directory exists');
    } catch (error) {
        console.error('❌ Communication directory not found:', error.message);
        return;
    }

    // Test 2: Create test request file
    const testRequest = {
        type: 'test',
        timestamp: new Date().toISOString(),
        content: 'This is a test request'
    };

    const requestPath = path.join(COMMUNICATION_DIR, 'claude-comm-request-test.txt');
    try {
        await fs.writeFile(requestPath, JSON.stringify(testRequest, null, 2));
        console.log('✅ Test request file created');
    } catch (error) {
        console.error('❌ Failed to create test request:', error.message);
        return;
    }

    // Test 3: Wait for response
    console.log('\n⏳ Waiting for watcher to process request (30 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Test 4: Check for response file
    const responsePath = path.join(COMMUNICATION_DIR, 'claude-comm-response-test.txt');
    try {
        const responseContent = await fs.readFile(responsePath, 'utf-8');
        const response = JSON.parse(responseContent);
        console.log('✅ Response file received:', response);
    } catch (error) {
        console.error('❌ No response file found:', error.message);
        return;
    }

    // Cleanup
    try {
        await fs.unlink(requestPath);
        await fs.unlink(responsePath);
        console.log('\n🧹 Test files cleaned up');
    } catch (error) {
        console.warn('⚠️ Cleanup warning:', error.message);
    }

    console.log('\n✨ All tests completed!');
}

runDiagnostics().catch(console.error);