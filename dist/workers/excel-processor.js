// Web Worker for Excel processing to prevent UI blocking
self.onmessage = async function(e) {
  try {
    const { file, options = {} } = e.data;
    
    // Send progress update
    self.postMessage({ type: 'progress', message: 'Loading XLSX library...' });
    
    // Dynamic import XLSX in worker
    const XLSX = await import('https://cdn.skypack.dev/xlsx');
    
    self.postMessage({ type: 'progress', message: 'Reading file...' });
    
    // Process the file
    const arrayBuffer = await file.arrayBuffer();
    
    self.postMessage({ type: 'progress', message: 'Parsing Excel data...' });
    
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
      type: 'array',
      cellDates: true,
      ...options 
    });
    
    if (!workbook.SheetNames.length) {
      throw new Error('No sheets found in Excel file');
    }
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const result = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!result.length) {
      throw new Error('No data found in Excel sheet');
    }
    
    self.postMessage({ 
      type: 'success', 
      result,
      metadata: {
        sheetCount: workbook.SheetNames.length,
        rowCount: result.length,
        columnCount: result[0]?.length || 0
      }
    });
    
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error.message || 'Unknown error occurred'
    });
  }
}; 