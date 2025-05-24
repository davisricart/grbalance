import JSZip from 'jszip';
import { writeFileSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const zip = new JSZip();

function addFilesToZip(startPath, zip) {
  const files = readdirSync(startPath);
  
  for (const file of files) {
    const filePath = join(startPath, file);
    const stat = statSync(filePath);
    
    if (file === 'node_modules' || file === '.git' || file === 'dist') {
      continue;
    }

    if (stat.isDirectory()) {
      addFilesToZip(filePath, zip.folder(file));
    } else {
      const fileContent = readFileSync(filePath);
      const relativePath = relative(process.cwd(), filePath);
      zip.file(relativePath, fileContent);
    }
  }
}

// Add all project files to zip
addFilesToZip(process.cwd(), zip);

// Generate zip file
zip.generateAsync({ type: "nodebuffer" })
  .then(content => {
    writeFileSync('project-files.zip', content);
    console.log('Project files have been zipped to project-files.zip');
  });