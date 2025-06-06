// ===== ULTRA-ROBUST WATCHER SCRIPT =====
// robust-ai-watcher.js

const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const winston = require('winston');

class RobustAIWatcher {
  constructor(options = {}) {
    this.commDir = path.join(process.cwd(), 'public', 'claude-communication');
    this.processing = new Set();
    this.watcher = null;
    this.processingQueue = [];
    this.maxConcurrentProcessing = options.maxConcurrent || 3;
    this.retryAttempts = options.retryAttempts || 3;
    // Setup logging
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'ai-watcher.log' })
      ]
    });
    // Health check interval
    this.healthCheckInterval = setInterval(() => this.healthCheck(), 30000);
    // Graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('uncaughtException', (err) => {
      this.logger.error('Uncaught exception:', err);
      this.restart();
    });
  }

  async start() {
    try {
      await this.ensureDirectories();
      await this.startWatcher();
      await this.processExistingFiles();
      this.logger.info('AI Watcher started successfully');
      this.logger.info(`Monitoring: ${this.commDir}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to start watcher:', error);
      return false;
    }
  }

  async ensureDirectories() {
    const dirs = [
      this.commDir,
      path.join(this.commDir, 'processed'),
      path.join(this.commDir, 'errors'),
      './logs'
    ];
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        this.logger.info(`Created directory: ${dir}`);
      }
    }
  }

  async startWatcher() {
    this.watcher = chokidar.watch(
      path.join(this.commDir, '*-request-*.txt'),
      {
        ignored: /^\./,
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 1000,
          pollInterval: 100
        },
        usePolling: true,
        interval: 1000
      }
    );
    this.watcher.on('add', (filepath) => {
      this.logger.info(`[chokidar] add: ${filepath}`);
      this.logger.info(`New instruction detected: ${path.basename(filepath)}`);
      this.queueProcessing(filepath);
    });
    this.watcher.on('change', (filepath) => {
      this.logger.info(`[chokidar] change: ${filepath}`);
    });
    this.watcher.on('unlink', (filepath) => {
      this.logger.info(`[chokidar] unlink: ${filepath}`);
    });
    this.watcher.on('error', (error) => {
      this.logger.error('Watcher error:', error);
      this.restart();
    });
    setInterval(() => this.processQueue(), 2000);
  }

  async processExistingFiles() {
    try {
      const files = await fs.readdir(this.commDir);
      const requestFiles = files.filter(f => f.includes('-request-') && f.endsWith('.txt'));
      
      for (const file of requestFiles) {
        try {
          const filepath = path.join(this.commDir, file);
          const sessionId = this.extractSessionId(file);
          
          if (!sessionId) {
            this.logger.warn(`Skipping file with invalid format: ${file}`);
            continue;
          }
          
          const responseFile = path.join(this.commDir, `claude-comm-response-${sessionId}.js`);
          const responseExists = await fs.access(responseFile).then(() => true).catch(() => false);
          
          if (!responseExists) {
            this.logger.info(`Processing existing file: ${file}`);
            this.queueProcessing(filepath);
          }
        } catch (fileError) {
          this.logger.error(`Error processing file ${file}:`, fileError);
          continue;
        }
      }
    } catch (error) {
      this.logger.error('Error processing existing files:', error);
    }
  }

  queueProcessing(filepath) {
    const filename = path.basename(filepath);
    if (!this.processing.has(filename) && !this.processingQueue.includes(filepath)) {
      this.processingQueue.push(filepath);
      this.logger.info(`Queued for processing: ${filename}`);
    }
  }

  async processQueue() {
    while (this.processingQueue.length > 0 && this.processing.size < this.maxConcurrentProcessing) {
      const filepath = this.processingQueue.shift();
      const filename = path.basename(filepath);
      if (!this.processing.has(filename)) {
        this.processing.add(filename);
        this.processInstruction(filepath).finally(() => {
          this.processing.delete(filename);
        });
      }
    }
  }

  async processInstruction(filepath, attempt = 1) {
    const filename = path.basename(filepath);
    try {
      this.logger.info(`Processing ${filename} (attempt ${attempt})`);
      const sessionId = this.extractSessionId(filename);
      if (!sessionId) {
        throw new Error('Invalid filename format');
      }
      const instruction = await this.readFileWithRetry(filepath);
      const startTime = Date.now();
      const response = await this.processWithAI(instruction, sessionId);
      const processingTime = Date.now() - startTime;
      await this.writeResponse(sessionId, response, instruction);
      await this.archiveProcessedFile(filepath, sessionId);
      this.logger.info(`Successfully processed ${filename} in ${processingTime}ms`);
    } catch (error) {
      this.logger.error(`Error processing ${filename} (attempt ${attempt}):`, error);
      if (attempt < this.retryAttempts) {
        setTimeout(() => {
          this.processInstruction(filepath, attempt + 1);
        }, Math.pow(2, attempt) * 1000);
      } else {
        await this.handleProcessingError(filepath, error);
      }
    }
  }

  extractSessionId(filename) {
    const match = filename.match(/claude-comm-request-(.+)\.txt$/);
    return match ? match[1] : null;
  }

  async readFileWithRetry(filepath, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const content = await fs.readFile(filepath, 'utf8');
        return content.trim();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }
  }

  async processWithAI(instruction, sessionId) {
    try {
      // For now, just echo the instruction and create a simple data transformation
      const response = `
// Response to: ${instruction}
function processData(data) {
  // Keep only the Card Brand column
  return data.map(row => ({
    'Card Brand': row['Card Brand'] || ''
  }));
}

// Get the data from global scope
const workingData = window.workingData || [];

// Process the data
const result = processData(workingData);

// Update the preview
if (typeof window !== 'undefined') {
  window.previewData = result.slice(0, 5);
  window.fullResult = result;
}

console.log('Processed:', result.length, 'rows');
`;
      return response;
    } catch (error) {
      this.logger.error('Error in AI processing:', error);
      throw error;
    }
  }

  async writeResponse(sessionId, response, originalInstruction) {
    const responseFilename = `claude-comm-response-${sessionId}.js`;
    const responsePath = path.join(this.commDir, responseFilename);
    const fullResponse = `// AI Generated Response\n// Original instruction: ${originalInstruction.replace(/\*\//g, '*\\/')}\n// Generated at: ${new Date().toISOString()}\n\n${response}`;
    await fs.writeFile(responsePath, fullResponse, 'utf8');
    this.logger.info(`Response written: ${responseFilename}`);
  }

  async archiveProcessedFile(filepath, sessionId) {
    const filename = path.basename(filepath);
    const archivePath = path.join(this.commDir, 'processed', `${Date.now()}-${filename}`);
    try {
      await fs.rename(filepath, archivePath);
    } catch (error) {
      this.logger.warn('Could not archive processed file:', error);
      try {
        await fs.unlink(filepath);
      } catch (deleteError) {
        this.logger.warn('Could not delete processed file:', deleteError);
      }
    }
  }

  async handleProcessingError(filepath, error) {
    const filename = path.basename(filepath);
    const errorPath = path.join(this.commDir, 'errors', `${Date.now()}-${filename}`);
    try {
      await fs.rename(filepath, errorPath);
      const sessionId = this.extractSessionId(filename);
      if (sessionId) {
        const parts = sessionId.split('-');
        const errorResponsePath = path.join(this.commDir, `${parts[0]}-response-${parts[1]}.js`);
        const errorResponse = `// Processing Error\nconsole.error('AI processing failed:', '${error.message.replace(/'/g, "\\'")}');\n\nwindow.aiError = {\n  error: '${error.message.replace(/'/g, "\\'")}',\n  sessionId: '${sessionId}',\n  timestamp: '${new Date().toISOString()}',\n  retryAvailable: true\n};\n\n// Display error message\nif (typeof document !== 'undefined') {\n  const errorDiv = document.createElement('div');\n  errorDiv.style.cssText = 'padding: 15px; margin: 10px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;';\n  errorDiv.innerHTML = '<strong>Processing Error:</strong> ' + '${error.message.replace(/'/g, "\\'")}';\n  document.body.appendChild(errorDiv);\n}`;
        await fs.writeFile(errorResponsePath, errorResponse, 'utf8');
      }
      this.logger.error(`Moved failed file to errors: ${filename}`);
    } catch (archiveError) {
      this.logger.error('Could not archive error file:', archiveError);
    }
  }

  async healthCheck() {
    try {
      await fs.access(this.commDir);
      if (!this.watcher) {
        this.logger.warn('Watcher is null, restarting...');
        await this.restart();
      }
      this.logger.info(`Health check: Processing ${this.processing.size} files, Queue: ${this.processingQueue.length}`);
    } catch (error) {
      this.logger.error('Health check failed:', error);
      await this.restart();
    }
  }

  async restart() {
    this.logger.info('Restarting AI Watcher...');
    try {
      if (this.watcher) {
        await this.watcher.close();
        this.watcher = null;
      }
      this.processing.clear();
      this.processingQueue.length = 0;
      setTimeout(async () => {
        const success = await this.start();
        if (success) {
          this.logger.info('AI Watcher restarted successfully');
        } else {
          this.logger.error('Failed to restart AI Watcher');
        }
      }, 5000);
    } catch (error) {
      this.logger.error('Error during restart:', error);
    }
  }

  async shutdown() {
    this.logger.info('Shutting down AI Watcher...');
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.watcher) {
      await this.watcher.close();
    }
    this.logger.info('AI Watcher shutdown complete');
    process.exit(0);
  }
}

if (require.main === module) {
  const watcher = new RobustAIWatcher({
    maxConcurrent: 3,
    retryAttempts: 3
  });
  watcher.start().then(success => {
    if (success) {
      console.log('✅ Robust AI Watcher started successfully');
      console.log('📁 Monitoring directory for instruction files...');
      console.log('🔄 Auto-restart enabled');
      console.log('📝 Logs available in ai-watcher.log');
    } else {
      console.error('❌ Failed to start AI Watcher');
      process.exit(1);
    }
  });
}

module.exports = RobustAIWatcher; 