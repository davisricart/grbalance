const fs = require('fs').promises;
const path = require('path');

class WorkflowDiagnostic {
    constructor() {
        this.communicationDir = path.join(__dirname, 'public', 'claude-communication');
        this.testSessionId = `test-${Date.now()}`;
    }

    async runDiagnostic() {
        console.log('🔍 Starting Workflow Diagnostic');
        try {
            await this.checkDirectoryStructure();
            await this.simulateRequest();
            await this.waitForResponse();
            console.log('✅ Diagnostic completed successfully!');
        } catch (error) {
            console.error('❌ Diagnostic failed:', error);
        }
    }

    async checkDirectoryStructure() {
        console.log('📁 Checking directory structure...');
        try {
            await fs.access(this.communicationDir);
            console.log('✅ Communication directory exists');
        } catch (error) {
            console.log('Creating directory...');
            await fs.mkdir(this.communicationDir, { recursive: true });
        }
    }

    async simulateRequest() {
        console.log('📝 Simulating request...');
        const requestFile = path.join(this.communicationDir, `claude-comm-request-${this.testSessionId}.txt`);
        const requestContent = `Test instruction at ${new Date().toISOString()}`;
        await fs.writeFile(requestFile, requestContent);
        console.log(`✅ Request file created: ${path.basename(requestFile)}`);
    }

    async waitForResponse() {
        console.log('⏳ Waiting for response...');
        const responseFile = path.join(this.communicationDir, `claude-comm-response-${this.testSessionId}.js`);
        const maxWaitTime = 30000;
        const checkInterval = 1000;
        let elapsed = 0;
        while (elapsed < maxWaitTime) {
            try {
                await fs.access(responseFile);
                console.log('✅ Response file found!');
                return;
            } catch (error) {
                process.stdout.write('.');
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                elapsed += checkInterval;
            }
        }
        throw new Error('Response file not created within 30 seconds');
    }
}

new WorkflowDiagnostic().runDiagnostic();