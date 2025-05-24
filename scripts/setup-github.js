import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Initialize Git if not already initialized
try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  console.log('Git repository already initialized');
} catch {
  console.log('Initializing Git repository...');
  execSync('git init');
}

// Create .gitignore if it doesn't exist
const gitignorePath = join(process.cwd(), '.gitignore');
const gitignoreContent = `
node_modules/
dist/
.env
.DS_Store
*.log
.vscode/
coverage/
build/
.idea/
*.local
`;

try {
  writeFileSync(gitignorePath, gitignoreContent.trim());
  console.log('Created .gitignore file');
} catch (error) {
  console.error('Error creating .gitignore:', error);
  process.exit(1);
}

// Add all files and create initial commit
try {
  execSync('git add .');
  execSync('git commit -m "Initial commit"');
  console.log('Created initial commit');
} catch (error) {
  console.error('Error creating initial commit:', error);
  process.exit(1);
}

console.log('\nNext steps:');
console.log('1. Create a new repository on GitHub');
console.log('2. Run these commands to push your code:');
console.log('   git remote add origin <your-github-repo-url>');
console.log('   git branch -M main');
console.log('   git push -u origin main');