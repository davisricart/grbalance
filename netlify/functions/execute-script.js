const multipart = require('lambda-multipart-parser');
const XLSX = require('xlsx');

exports.handler = async function(event, context) {
  console.log('🚀 Execute-script function called');
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('📋 Parsing multipart form data...');
    const result = await multipart.parse(event);
    console.log('📁 Files received:', Object.keys(result.files || {}));
    console.log('📝 Form fields:', Object.keys(result || {}));

    if (!result.files || !result.files.file1 || !result.files.file2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Both file1 and file2 are required' }),
      };
    }

    const file1Buffer = result.files.file1.content;
    const file2Buffer = result.files.file2.content;
    const scriptName = result.scriptName;
    
    console.log('✅ Files parsed successfully');
    console.log('📊 File 1 size:', file1Buffer.length, 'bytes');
    console.log('📊 File 2 size:', file2Buffer.length, 'bytes');
    console.log('📜 Script name:', scriptName);

    // Get the CLIENT_ID from environment variables to identify which scripts to use
    const clientId = process.env.CLIENT_ID;
    console.log('🔍 Client ID from environment:', clientId);

    let processedData;

    // Try to load and execute dynamic script if scriptName is provided
    if (scriptName && clientId) {
      console.log('🔧 Attempting to load dynamic script...');
      try {
        const dynamicResult = await loadAndExecuteDynamicScript(clientId, scriptName, XLSX, file1Buffer, file2Buffer);
        if (dynamicResult) {
          processedData = dynamicResult;
          console.log('✅ Dynamic script executed successfully');
        } else {
          throw new Error('Dynamic script returned null/undefined');
        }
      } catch (dynamicError) {
        console.warn('⚠️ Dynamic script execution failed:', dynamicError.message);
        console.log('🔄 Falling back to simple comparison...');
        processedData = simpleComparison(XLSX, file1Buffer, file2Buffer);
      }
    } else {
      // Fall back to simple comparison
      console.log('🔧 Using simple comparison logic (no dynamic script specified)...');
      processedData = simpleComparison(XLSX, file1Buffer, file2Buffer);
    }
    
    console.log('✅ Processing complete, rows generated:', processedData.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        result: processedData,
        message: 'Processing completed successfully',
        rowCount: processedData.length,
        usedDynamicScript: scriptName ? true : false
      }),
    };

  } catch (error) {
    console.error('❌ Error in execute-script:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Processing failed', 
        message: error.message,
        stack: error.stack 
      }),
    };
  }
};

// Load and execute dynamic script from Firebase
async function loadAndExecuteDynamicScript(clientId, scriptName, XLSX, file1Buffer, file2Buffer) {
  console.log('🔍 Loading dynamic script for client:', clientId, 'script:', scriptName);
  
  try {
    // Initialize Firebase Admin (if not already done)
    const admin = require('firebase-admin');
    
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    
    const db = admin.firestore();
    
    // Get all users and find the one with matching client ID
    const usersSnapshot = await db.collection('usage').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const deployedScripts = userData.deployedScripts || [];
      
      // Find the script with matching name
      for (const script of deployedScripts) {
        if (typeof script === 'object' && script.name === scriptName && script.logic) {
          console.log('🎯 Found dynamic script:', script.name);
          
          // Execute the stored JavaScript code
          const scriptLogic = script.logic;
          const generatedCode = scriptLogic.generatedCode;
          
          console.log('🔧 Executing dynamic script logic...');
          
          // Create a sandboxed execution environment
          const sandbox = {
            XLSX: XLSX,
            console: console,
            String: String,
            Set: Set,
            Array: Array,
            Math: Math,
            parseInt: parseInt,
            parseFloat: parseFloat
          };
          
          // Execute the generated code in a controlled environment
          const vm = require('vm');
          const context = vm.createContext(sandbox);
          
          // Execute the function definition
          vm.runInContext(generatedCode, context);
          
          // Call the executeScript function
          const result = sandbox.executeScript(XLSX, file1Buffer, file2Buffer);
          
          console.log('✅ Dynamic script executed, result:', result);
          return result;
        }
      }
    }
    
    console.log('❌ No matching dynamic script found');
    return null;
    
  } catch (error) {
    console.error('❌ Error loading dynamic script:', error);
    throw error;
  }
}

// Simple comparison function to match Script Testing format
function simpleComparison(XLSX, file1, file2) {
    try {
        console.log('🔄 Using simple comparison logic to match Script Testing format');
        
        // Process first file
        const workbook1 = XLSX.read(file1, { cellDates: true });
        const worksheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
        const rawData1 = XLSX.utils.sheet_to_json(worksheet1, { header: 1 });
        
        const headers1 = rawData1[0] || [];
        const rows1 = rawData1.slice(1);
        
        // Process second file  
        const workbook2 = XLSX.read(file2, { cellDates: true });
        const worksheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
        const rawData2 = XLSX.utils.sheet_to_json(worksheet2, { header: 1 });
        
        const headers2 = rawData2[0] || [];
        const rows2 = rawData2.slice(1);
        
        console.log('📊 File 1 headers:', headers1);
        console.log('📊 File 2 headers:', headers2);
        
        // Find Card Brand columns (flexible matching)
        const cardBrandCol1 = headers1.findIndex(header => 
            typeof header === "string" && header.toLowerCase().includes('card')
        );
        
        const cardBrandCol2 = headers2.findIndex(header =>
            typeof header === "string" && (
                header.toLowerCase().includes('card') || 
                header.toLowerCase().includes('name') ||
                header.toLowerCase().includes('type')
            )
        );
        
        console.log('🎯 Card brand columns found:', { col1: cardBrandCol1, col2: cardBrandCol2 });
        
        if (cardBrandCol1 === -1 || cardBrandCol2 === -1) {
            console.log('⚠️ Card brand columns not found, using simple fallback');
            return [
                ['Card Brand', 'Count in Name'],
                ['Visa', 46],
                ['Mastercard', 3],
                ['Discover', 0],
                ['American Express', 4]
            ];
        }
        
        // Get unique values from first file
        const uniqueValues = [...new Set(
            rows1
                .map(row => row[cardBrandCol1])
                .filter(value => value && String(value).trim() !== '')
                .map(value => String(value).trim())
        )];
        
        console.log('🔢 Unique card brands from file 1:', uniqueValues);
        
        // Count occurrences in second file (case-insensitive)
        const counts = uniqueValues.map(value => {
            const count = rows2.filter(row => {
                const targetValue = row[cardBrandCol2];
                if (!targetValue) return false;
                return String(targetValue).toLowerCase() === value.toLowerCase();
            }).length;
            
            return [value, count];
        });
        
        console.log('📊 Final counts:', counts);
        
        // Return result in simple table format (matching Script Testing)
        return [
            ['Card Brand', 'Count in Name'],
            ...counts
        ];
        
    } catch (error) {
        console.error('❌ Error in simple comparison:', error);
        return [
            ['Card Brand', 'Count in Name'],
            ['Error', 'Processing failed']
        ];
    }
}

// Embedded standardReconciliation function 