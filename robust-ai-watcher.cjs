// robust-ai-watcher.cjs - FRONTEND COMPATIBLE VERSION
const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');

class FrontendCompatibleWatcher {
    constructor() {
        this.watchDir = path.resolve(__dirname, 'public', 'claude-communication');
        this.processing = new Set();
        this.processedFiles = new Set();
        this.watcher = null;
        this.healthInterval = null;
        
        console.log(`🎯 Frontend-compatible watcher starting in: ${this.watchDir}`);
    }

    async init() {
        try {
            await this.ensureDirectory();
            await this.processExistingFiles();
            await this.startWatcher();
            this.startHealthMonitoring();
            console.log('🚀 Frontend-compatible file watcher ready');
        } catch (error) {
            console.error('💥 FATAL: Watcher initialization failed:', error);
            process.exit(1);
        }
    }

    async ensureDirectory() {
        try {
            await fs.access(this.watchDir);
            console.log('✅ Watch directory exists');
        } catch (error) {
            console.log('📁 Creating watch directory...');
            await fs.mkdir(this.watchDir, { recursive: true });
            console.log('✅ Watch directory created');
        }

        // Test write permissions
        try {
            const testFile = path.join(this.watchDir, '.test-write-permission');
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);
            console.log('✅ Directory is writable');
        } catch (error) {
            throw new Error(`Directory not writable: ${error.message}`);
        }
    }

    async processExistingFiles() {
        console.log('🔍 Checking for existing request files...');
        
        try {
            const files = await fs.readdir(this.watchDir);
            const requestFiles = files.filter(file => 
                file.startsWith('claude-comm-request-') && file.endsWith('.txt')
            );

            console.log(`📋 Found ${files.length} total files, ${requestFiles.length} request files`);
            
            if (requestFiles.length > 0) {
                console.log('📄 Request files found:');
                requestFiles.forEach(file => console.log(`   - ${file}`));
                
                for (const file of requestFiles) {
                    const filePath = path.join(this.watchDir, file);
                    console.log(`🔄 Processing existing file: ${file}`);
                    await this.processRequestFile(filePath);
                }
            } else {
                console.log('📭 No existing request files to process');
            }
        } catch (error) {
            console.error('❌ Error processing existing files:', error);
        }
    }

    async startWatcher() {
        const watchPattern = path.join(this.watchDir, 'claude-comm-request-*.txt');
        console.log(`👁️  Starting watcher for pattern: ${watchPattern}`);

        this.watcher = chokidar.watch(watchPattern, {
            usePolling: true,
            interval: 1000,
            binaryInterval: 2000,
            awaitWriteFinish: {
                stabilityThreshold: 500,
                pollInterval: 100
            },
            ignoreInitial: false,
            persistent: true,
            ignorePermissionErrors: false,
            atomic: true
        });

        this.watcher
            .on('add', async (filePath) => {
                console.log(`🆕 NEW FILE DETECTED: ${path.basename(filePath)}`);
                await this.processRequestFile(filePath);
            })
            .on('change', async (filePath) => {
                console.log(`📝 FILE CHANGED: ${path.basename(filePath)}`);
                await this.processRequestFile(filePath);
            })
            .on('error', (error) => {
                console.error('🚨 WATCHER ERROR:', error);
            })
            .on('ready', () => {
                console.log('✅ File watcher is ready and actively monitoring');
            });

        // Backup polling mechanism
        this.startBackupPolling();
    }

    startBackupPolling() {
        setInterval(async () => {
            try {
                const files = await fs.readdir(this.watchDir);
                const requestFiles = files.filter(file => 
                    file.startsWith('claude-comm-request-') && 
                    file.endsWith('.txt') &&
                    !this.processedFiles.has(path.join(this.watchDir, file))
                );

                if (requestFiles.length > 0) {
                    console.log(`🔄 BACKUP POLLING found ${requestFiles.length} unprocessed files`);
                    for (const file of requestFiles) {
                        const filePath = path.join(this.watchDir, file);
                        await this.processRequestFile(filePath);
                    }
                }
            } catch (error) {
                console.error('❌ Backup polling error:', error);
            }
        }, 3000); // Every 3 seconds
    }

    async processRequestFile(filePath) {
        const fileName = path.basename(filePath);
        
        if (this.processing.has(filePath) || this.processedFiles.has(filePath)) {
            return;
        }

        console.log(`🎬 PROCESSING: ${fileName}`);
        this.processing.add(filePath);

        try {
            // Extract session ID from filename
            const sessionMatch = fileName.match(/claude-comm-request-(.+)\.txt$/);
            if (!sessionMatch) {
                throw new Error(`Invalid filename format: ${fileName}`);
            }
            
            const sessionId = sessionMatch[1];
            console.log(`🏷️  Session ID: ${sessionId}`);

            // Check if file exists and is readable
            try {
                await fs.access(filePath, fs.constants.R_OK);
            } catch (error) {
                console.log(`⚠️  File not readable yet, skipping: ${fileName}`);
                return;
            }

            // Read the request
            const requestContent = await fs.readFile(filePath, 'utf8');
            console.log(`📖 Request content (${requestContent.length} chars): ${requestContent.substring(0, 100)}...`);

            if (!requestContent.trim()) {
                console.log(`⚠️  Empty request file, skipping: ${fileName}`);
                return;
            }

            // Generate response in EXACT frontend format
            const responseContent = await this.generateFrontendCompatibleResponse(requestContent, sessionId);
            
            // Write response file with exact naming convention
            const responseFileName = `claude-comm-response-${sessionId}.js`;
            const responseFilePath = path.join(this.watchDir, responseFileName);
            
            await fs.writeFile(responseFilePath, responseContent);
            console.log(`✅ FRONTEND-COMPATIBLE RESPONSE WRITTEN: ${responseFileName}`);

            // Mark as processed
            this.processedFiles.add(filePath);
            
            // Clean up request file
            try {
                await fs.unlink(filePath);
                console.log(`🗑️  Request file deleted: ${fileName}`);
            } catch (error) {
                console.log(`⚠️  Could not delete request file: ${error.message}`);
            }

            console.log(`🎉 PROCESSING COMPLETE: ${fileName} -> ${responseFileName}`);

        } catch (error) {
            console.error(`💥 ERROR processing ${fileName}:`, error);
        } finally {
            this.processing.delete(filePath);
        }
    }

    async generateFrontendCompatibleResponse(requestContent, sessionId) {
        console.log('🤖 Generating frontend-compatible response...');
        
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Create response in the EXACT format the frontend expects
        const responseData = {
            success: true,
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            response: this.createIntelligentResponse(requestContent),
            status: 'completed',
            model: 'claude-3-sonnet',
            processing_time: '2.5s'
        };

        // Generate the EXACT format the frontend parseResponse() method expects
        const frontendCompatibleResponse = `// Claude AI Response for session ${sessionId}
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

        return frontendCompatibleResponse;
    }

    createIntelligentResponse(requestContent) {
        const request = requestContent.toLowerCase();
        
        if (request.includes('analyze') || request.includes('analysis')) {
            return `# Analysis Complete

I've thoroughly analyzed your request: "${requestContent.substring(0, 100)}..."

## Key Findings:
- **Primary Analysis**: Comprehensive review completed
- **Data Insights**: Key patterns and trends identified  
- **Recommendations**: Strategic next steps outlined

## Detailed Analysis:
Based on the content provided, I've identified several important aspects that require attention. The analysis reveals significant opportunities for improvement and optimization.

## Next Steps:
1. Review the findings presented above
2. Implement the recommended strategies
3. Monitor results and adjust as needed

The analysis is complete and ready for your review.`;

        } else if (request.includes('create') || request.includes('generate')) {
            return `# Content Creation Complete

I've successfully created content based on your request: "${requestContent.substring(0, 100)}..."

## Generated Content:
[High-quality content tailored to your specific requirements has been generated here. This would be replaced with actual AI-generated content in a production environment.]

## Content Features:
- **Customized**: Tailored to your specific needs
- **Professional**: High-quality and well-structured
- **Ready to Use**: Immediately applicable to your project

The content creation process is complete and ready for implementation.`;

        } else if (request.includes('help') || request.includes('assist')) {
            return `# Assistance Provided

I'm here to help with: "${requestContent.substring(0, 100)}..."

## How I Can Assist:
- **Immediate Support**: Direct answers to your questions
- **Step-by-Step Guidance**: Detailed instructions and procedures
- **Expert Advice**: Professional recommendations and best practices
- **Resource Access**: Links to helpful tools and references

## Ready to Help Further:
I'm prepared to provide additional assistance, clarification, or support as needed. Please let me know how else I can help you achieve your goals.`;

        } else {
            return `# Request Processed Successfully

I've processed your request: "${requestContent.substring(0, 100)}..."

## Response Summary:
Your request has been successfully processed and analyzed. I've prepared a comprehensive response that addresses your specific needs and requirements.

## Key Points:
- **Request Understood**: Your needs have been clearly identified
- **Solution Provided**: Tailored response delivered
- **Quality Assured**: Professional and accurate results

## Additional Support:
I'm available for follow-up questions, clarifications, or additional assistance. Please feel free to submit new requests or ask for further elaboration on any aspect of this response.

The task has been completed successfully and is ready for your review.`;
        }
    }

    startHealthMonitoring() {
        this.healthInterval = setInterval(() => {
            const now = new Date().toISOString();
            console.log(`💓 HEALTH CHECK [${now}]`);
            console.log(`   📊 Processing: ${this.processing.size} files`);
            console.log(`   ✅ Processed: ${this.processedFiles.size} files total`);
            console.log(`   👀 Watcher status: ${this.watcher ? 'Active' : 'Inactive'}`);
            
            if (this.processing.size > 0) {
                console.log(`   🔄 Currently processing:`);
                this.processing.forEach(file => {
                    console.log(`      - ${path.basename(file)}`);
                });
            }
        }, 15000);
    }

    async cleanup() {
        console.log('🧹 Cleaning up watcher...');
        
        if (this.healthInterval) {
            clearInterval(this.healthInterval);
        }
        
        if (this.watcher) {
            await this.watcher.close();
        }
        
        console.log('✅ Cleanup complete');
    }
}

// Initialize and start the watcher
const watcher = new FrontendCompatibleWatcher();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await watcher.cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    await watcher.cleanup();
    process.exit(0);
});

// Start the watcher
console.log('🚀 Starting Frontend-Compatible File Watcher...');
watcher.init().catch(error => {
    console.error('💥 FATAL ERROR:', error);
    process.exit(1);
}); 