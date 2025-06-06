#!/usr/bin/env node

/**
 * Enhanced Session Logger for GRBalance Development
 * Automatically captures system state, timestamps, and context
 * Run: node session-logger.js [action] [description]
 * Examples:
 *   node session-logger.js start "Beginning new development session"
 *   node session-logger.js update "Fixed AdminPage.tsx corruption issue"
 *   node session-logger.js complete "Successfully tested automation engine"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const LOG_FILE = 'SESSION_ENHANCED_LOG.md';
const MAX_SESSIONS = 50;
const TIMEZONE = 'America/New_York'; // Adjust as needed

// Helper to get current timestamp
function getCurrentTimestamp() {
    return new Date().toISOString().replace('T', 'T').substring(0, 19) + '-05:00';
}

// Helper to safely execute shell commands
function safeExec(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

// Gather comprehensive system state
function gatherSystemState() {
    const state = {
        timestamp: getCurrentTimestamp(),
        git: {
            status: safeExec('git status --porcelain'),
            branch: safeExec('git branch --show-current'),
            lastCommit: safeExec('git log -1 --oneline'),
            modified: safeExec('git diff --name-only').split('\n').filter(f => f.trim())
        },
        filesystem: {
            adminPageLines: safeExec('wc -l src/pages/AdminPage.tsx 2>/dev/null || echo "File not found"'),
            sampleDataCount: safeExec('ls -1 public/sample-data/ 2>/dev/null | wc -l || echo "0"'),
            recentModifications: safeExec('find . -name "*.tsx" -o -name "*.ts" -o -name "*.js" -mtime -1 2>/dev/null | head -10').split('\n').filter(f => f.trim())
        },
        environment: {
            node: safeExec('node --version'),
            npm: safeExec('npm --version'),
            processes: safeExec('ps aux | grep -E "(node|npm)" | grep -v grep || echo "No Node processes"'),
            ports: {
                5177: safeExec('lsof -ti:5177 >/dev/null 2>&1 && echo "OCCUPIED" || echo "FREE"'),
                5178: safeExec('lsof -ti:5178 >/dev/null 2>&1 && echo "OCCUPIED" || echo "FREE"')
            }
        },
        typescript: {
            compilation: safeExec('npx tsc --noEmit --skipLibCheck 2>&1 | tail -5 || echo "TypeScript check failed"')
        }
    };
    
    return state;
}

// Format system state for markdown
function formatSystemState(state) {
    return `
**Detailed Technical State**:
\`\`\`
✅ Timestamp: ${state.timestamp}
✅ Git Branch: ${state.git.branch}
✅ Git Status: ${state.git.status || 'Clean working directory'}
✅ Last Commit: ${state.git.lastCommit}
✅ AdminPage.tsx: ${state.filesystem.adminPageLines}
✅ Sample Files: ${state.filesystem.sampleDataCount} files in public/sample-data/
✅ Node Version: ${state.environment.node}
✅ Port 5177: ${state.environment.ports['5177']}
✅ TypeScript: ${state.typescript.compilation.includes('error') ? '❌ Errors found' : '✅ Compiles cleanly'}
\`\`\`

**Files Modified This Session**:
${state.git.modified.length > 0 ? state.git.modified.map(f => `- \`${f}\``).join('\n') : '- No files modified'}

**Recent File Changes**:
${state.filesystem.recentModifications.length > 0 ? 
  state.filesystem.recentModifications.map(f => `- \`${f}\``).join('\n') : 
  '- No recent modifications detected'}
`;
}

// Create a new session entry
function createSessionEntry(sessionNumber, action, description, context = '') {
    const state = gatherSystemState();
    const statusEmoji = action === 'start' ? '🟢' : action === 'complete' ? '✅' : action === 'error' ? '🔴' : '🟡';
    
    return `
### Session #${sessionNumber.toString().padStart(2, '0')} | ${state.timestamp}
**Duration**: ${action === 'complete' ? 'Completed' : 'Active'}  
**Status**: ${statusEmoji} ${action.toUpperCase()}  
**Trigger**: ${description}  
**Context**: ${context || 'Continuing development work'}

${formatSystemState(state)}

**Conversation Context**:
- Action: ${action}
- Description: ${description}
- Session State: ${action === 'start' ? 'Session initiated' : action === 'complete' ? 'Session completed successfully' : 'Session in progress'}

**Recovery Instructions If Session Resets**:
\`\`\`bash
cd C:\\Users\\Davis\\Documents\\grbalance
npm run dev
# System should be in state: ${action === 'complete' ? 'Ready for new work' : 'Continue current task'}
# Last action: ${description}
\`\`\`

---
`;
}

// Update the enhanced log file
function updateLogFile(action, description, context = '') {
    if (!fs.existsSync(LOG_FILE)) {
        console.error(`Error: ${LOG_FILE} not found. Please ensure it exists.`);
        process.exit(1);
    }
    
    let logContent = fs.readFileSync(LOG_FILE, 'utf8');
    
    // Find the session history section
    const sessionHistoryRegex = /## 📝 DETAILED SESSION HISTORY\n\n/;
    const match = logContent.match(sessionHistoryRegex);
    
    if (!match) {
        console.error('Error: Could not find session history section in log file.');
        process.exit(1);
    }
    
    // Count existing sessions
    const sessionMatches = logContent.match(/### Session #\d+/g) || [];
    const nextSessionNumber = sessionMatches.length + 1;
    
    // Create new session entry
    const newEntry = createSessionEntry(nextSessionNumber, action, description, context);
    
    // Update current session status
    const currentStatusRegex = /(## 🎯 CURRENT SESSION STATUS\n)([\s\S]*?)(\n---)/;
    const newStatus = `## 🎯 CURRENT SESSION STATUS
**Status**: ${action === 'complete' ? '✅ **COMPLETED**' : '🟢 **ACTIVE**'} - ${description}
**Timestamp**: ${getCurrentTimestamp()}
**Context**: ${context || 'Development session in progress'}
**Location**: ${action === 'complete' ? 'Task completed successfully' : 'Active development'}
**Next Action**: ${action === 'complete' ? 'Ready for new tasks' : 'Continue current work'}

---`;
    
    logContent = logContent.replace(currentStatusRegex, newStatus);
    
    // Insert new session entry after the session history header
    const insertPoint = match.index + match[0].length;
    logContent = logContent.slice(0, insertPoint) + newEntry + logContent.slice(insertPoint);
    
    // Write updated content
    fs.writeFileSync(LOG_FILE, logContent, 'utf8');
    
    console.log(`✅ Session log updated successfully!`);
    console.log(`📝 Action: ${action}`);
    console.log(`📝 Description: ${description}`);
    console.log(`📝 Timestamp: ${getCurrentTimestamp()}`);
    console.log(`📝 Session #${nextSessionNumber} logged`);
}

// Command line interface
function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log(`
Usage: node session-logger.js [action] [description] [context]

Actions:
  start     - Begin a new session
  update    - Log a significant update or change
  complete  - Mark current task/session as completed
  error     - Log an error or issue
  
Examples:
  node session-logger.js start "Beginning AdminPage debugging session"
  node session-logger.js update "Fixed TypeScript compilation errors"
  node session-logger.js complete "Successfully implemented enhanced logging system"
  node session-logger.js error "Encountered Git merge conflict"
        `);
        process.exit(1);
    }
    
    const [action, description, context] = args;
    const validActions = ['start', 'update', 'complete', 'error'];
    
    if (!validActions.includes(action)) {
        console.error(`Error: Invalid action '${action}'. Valid actions: ${validActions.join(', ')}`);
        process.exit(1);
    }
    
    updateLogFile(action, description, context);
}

// Auto-detection mode - can be called without CLI
function autoLog(action, description, context = '') {
    try {
        updateLogFile(action, description, context);
        return true;
    } catch (error) {
        console.error('Auto-logging failed:', error.message);
        return false;
    }
}

// Export for use as module
if (require.main === module) {
    main();
} else {
    module.exports = { autoLog, gatherSystemState, getCurrentTimestamp };
} 