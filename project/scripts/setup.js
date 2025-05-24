import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function updateClientConfig(config) {
  const configPath = join(__dirname, '../src/config/client.ts');
  let content = readFileSync(configPath, 'utf8');
  
  // Update only the name and title
  content = content.replace(
    /name: '.*?'/,
    `name: '${config.name}'`
  ).replace(
    /title: '.*?'/,
    `title: '${config.title}'`
  );

  writeFileSync(configPath, content);
}

// Read configuration from command line arguments
const config = JSON.parse(process.argv[2]);
updateClientConfig(config);