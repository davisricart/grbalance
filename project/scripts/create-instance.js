import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function copyRecursive(src, dest) {
  try {
    if (existsSync(src)) {
      cpSync(src, dest, { recursive: true });
      console.log(`Successfully copied ${src} to ${dest}`);
    } else {
      console.warn(`Warning: Source path ${src} does not exist, skipping...`);
    }
  } catch (error) {
    console.error(`Error copying ${src} to ${dest}:`, error);
    throw error;
  }
}

function createInstance(configPath) {
  try {
    // Verify config file exists
    if (!existsSync(configPath)) {
      throw new Error(`Configuration file not found at ${configPath}`);
    }

    // Read the new configuration
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    
    if (!config.name) {
      throw new Error('Configuration must include a name property');
    }

    // Read package.json and update name
    const packageJsonPath = join(__dirname, '../package.json');
    if (!existsSync(packageJsonPath)) {
      throw new Error('package.json not found in source directory');
    }
    
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    packageJson.name = config.name;
    
    // Create new directory for the instance
    const instanceDir = join(__dirname, `../../${config.name}`);
    console.log(`Creating instance directory at ${instanceDir}`);
    
    mkdirSync(instanceDir, { recursive: true });
    
    // Copy all necessary files
    const filesToCopy = [
      'src',
      '.github',
      'scripts',
      'public',
      '.gitignore',
      'index.html',
      'postcss.config.js',
      'tailwind.config.js',
      'tsconfig.app.json',
      'tsconfig.json',
      'tsconfig.node.json',
      'vite.config.ts',
      'eslint.config.js',
      'supabase'
    ];
    
    for (const file of filesToCopy) {
      const sourcePath = join(__dirname, '..', file);
      const targetPath = join(instanceDir, file);
      
      try {
        if (existsSync(sourcePath)) {
          if (file === 'src' || file === '.github' || file === 'scripts' || file === 'public' || file === 'supabase') {
            copyRecursive(sourcePath, targetPath);
          } else {
            copyFileSync(sourcePath, targetPath);
            console.log(`Successfully copied ${file}`);
          }
        } else {
          console.warn(`Warning: ${file} not found in source directory, skipping...`);
        }
      } catch (error) {
        console.error(`Error copying ${file}:`, error);
        throw error;
      }
    }
    
    // Write updated package.json
    try {
      writeFileSync(
        join(instanceDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      console.log('Successfully wrote package.json');
    } catch (error) {
      console.error('Error writing package.json:', error);
      throw error;
    }
    
    // Update client config
    const sourceConfigPath = join(__dirname, '../src/config/client.ts');
    if (!existsSync(sourceConfigPath)) {
      throw new Error('Client config not found in source directory');
    }
    
    let clientConfig = readFileSync(sourceConfigPath, 'utf8');
    
    // Only update name and title
    clientConfig = clientConfig.replace(
      /name: '.*?'/,
      `name: '${config.name}'`
    ).replace(
      /title: '.*?'/,
      `title: '${config.title || config.name}'`
    );
    
    // Ensure the config directory exists before writing
    const configDir = join(instanceDir, 'src/config');
    mkdirSync(configDir, { recursive: true });
    
    // Write to the new instance directory
    try {
      const targetConfigPath = join(configDir, 'client.ts');
      writeFileSync(targetConfigPath, clientConfig);
      console.log('Successfully wrote client config');
    } catch (error) {
      console.error('Error writing client config:', error);
      throw error;
    }

    // Initialize Git repository
    try {
      process.chdir(instanceDir);
      const setupGithubPath = join(instanceDir, 'scripts/setup-github.js');
      if (existsSync(setupGithubPath)) {
        console.log('Initializing Git repository...');
        const { execSync } = require('child_process');
        execSync('node scripts/setup-github.js', { stdio: 'inherit' });
      }
    } catch (error) {
      console.error('Error initializing Git repository:', error);
    }
    
    console.log(`Instance created successfully at ${instanceDir}`);
    return instanceDir;
  } catch (error) {
    console.error('Error creating instance:', error);
    throw error;
  }
}

// Get config path from command line argument
const configPath = process.argv[2];
if (!configPath) {
  console.error('Please provide a path to the configuration file');
  process.exit(1);
}

try {
  createInstance(configPath);
} catch (error) {
  console.error('Failed to create instance:', error);
  process.exit(1);
}