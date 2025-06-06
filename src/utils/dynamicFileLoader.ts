// Dynamic file loader utility for sample data
export interface FileInfo {
  name: string;
  type: 'excel' | 'csv' | 'javascript' | 'text';
  size?: number;
  lastModified?: string;
}

export async function fetchAvailableFiles(): Promise<string[]> {
  try {
    // Try to fetch a directory listing from the server
    // This requires server-side support, but we'll implement a client-side fallback
    const response = await fetch('/api/sample-files');
    
    if (response.ok) {
      const files = await response.json();
      return files;
    }
  } catch (error) {
    console.log('🔍 Server API not available, using fallback file detection...');
  }

  // Fallback: try to load known file types by attempting to fetch them
  const potentialFiles = [
    'upload1.xlsx',
    'upload2.xlsx', 
    'Correct.xlsx',
    'Sales Totals.xlsx',
    'Payments Hub Transaction.xlsx',
    'incorrect-results.csv',
    'generated-reconciliation-script.js',
    'ClaudeVersion.txt',
    'Cursor.txt'
  ];

  const availableFiles: string[] = [];

  // Test each file to see if it exists
  await Promise.all(
    potentialFiles.map(async (fileName) => {
      try {
        const response = await fetch(`/sample-data/${fileName}`, { method: 'HEAD' });
        if (response.ok) {
          availableFiles.push(fileName);
        }
      } catch (error) {
        // File doesn't exist or not accessible
        console.log(`❌ File not found: ${fileName}`);
      }
    })
  );

  // If no files found with HEAD requests, try a different approach
  if (availableFiles.length === 0) {
    console.log('🔄 HEAD requests failed, trying GET requests for file detection...');
    
    for (const fileName of potentialFiles) {
      try {
        const response = await fetch(`/sample-data/${fileName}`);
        if (response.ok) {
          availableFiles.push(fileName);
          console.log(`✅ Found file: ${fileName}`);
        }
      } catch (error) {
        // File doesn't exist
      }
    }
  }

  console.log(`📁 Dynamic file detection found ${availableFiles.length} files:`, availableFiles);
  return availableFiles;
}

export function categorizeFile(fileName: string): FileInfo {
  const extension = fileName.toLowerCase().split('.').pop();
  
  let type: FileInfo['type'] = 'text';
  
  switch (extension) {
    case 'xlsx':
    case 'xls':
      type = 'excel';
      break;
    case 'csv':
      type = 'csv';
      break;
    case 'js':
      type = 'javascript';
      break;
    case 'txt':
      type = 'text';
      break;
  }

  return {
    name: fileName,
    type
  };
} 