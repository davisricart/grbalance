#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PORTS = [5177, 5178, 5179, 3001];

async function checkPorts() {
  console.log('🔍 Checking for port conflicts...');
  
  for (const port of PORTS) {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      if (stdout.trim()) {
        console.log(`⚠️  Port ${port} is in use`);
        const lines = stdout.trim().split('\n');
        const pids = [...new Set(lines.map(line => line.trim().split(/\s+/).pop()))];
        console.log(`   PIDs: ${pids.join(', ')}`);
      } else {
        console.log(`✅ Port ${port} is available`);
      }
    } catch (error) {
      console.log(`✅ Port ${port} is available`);
    }
  }
}

async function killPorts() {
  console.log('🧹 Cleaning up ports...');
  
  for (const port of PORTS) {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        const pids = [...new Set(lines.map(line => line.trim().split(/\s+/).pop()))];
        
        for (const pid of pids) {
          try {
            await execAsync(`taskkill /PID ${pid} /F`);
            console.log(`✅ Killed process ${pid} on port ${port}`);
          } catch (error) {
            console.log(`⚠️  Could not kill process ${pid}`);
          }
        }
      }
    } catch (error) {
      // Port not in use, which is good
    }
  }
}

async function startDev() {
  await killPorts();
  console.log('🚀 Starting development server...');
  
  // Start the dev server
  exec('npm run dev', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);
  });
}

const command = process.argv[2];

switch (command) {
  case 'check':
    checkPorts();
    break;
  case 'kill':
    killPorts();
    break;
  case 'start':
    startDev();
    break;
  default:
    console.log(`
🛠️  Development Helper

Usage:
  node scripts/dev-helper.js check  - Check which ports are in use
  node scripts/dev-helper.js kill   - Kill processes on development ports
  node scripts/dev-helper.js start  - Clean ports and start dev server

Or use the npm scripts:
  npm run start        - Clean start (recommended)
  npm run dev:clean    - Same as start
  npm run dev:force    - Force restart with cache clearing
  npm run kill-ports   - Just kill the ports
`);
} 