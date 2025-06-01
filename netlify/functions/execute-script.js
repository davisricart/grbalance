const multipart = require('lambda-multipart-parser');
const XLSX = require('xlsx');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = getFirestore();

// Software Profiles Configuration
const SOFTWARE_PROFILES = {
  'daysmart_salon': {
    id: 'daysmart_salon',
    name: 'daysmart_salon',
    displayName: 'DaySmart Salon Software',
    dataStructure: {
      dateColumn: ['Date', 'Transaction Date', 'Date Closed'],
      amountColumn: ['Total Transaction Amount', 'Amount', 'Transaction Amount'],
      customerColumn: ['Customer Name', 'Name', 'Client Name'],
      cardBrandColumn: ['Card Brand', 'Card Type', 'Payment Method'],
      feeColumn: ['Cash Discounting Amount', 'Processing Fee', 'Fee Amount']
    },
    insightsConfig: {
      showInsights: true,
      showPaymentTrends: true,
      showCustomerBehavior: true,
      showOperationalMetrics: true,
      showRiskFactors: true,
      showBusinessIntelligence: true
    }
  },
  'square_pos': {
    id: 'square_pos',
    name: 'square_pos',
    displayName: 'Square POS',
    dataStructure: {
      dateColumn: ['Date', 'Created at', 'Transaction Date'],
      amountColumn: ['Gross Sales', 'Amount Money', 'Total'],
      customerColumn: ['Customer Name', 'Buyer Name', 'Customer'],
      cardBrandColumn: ['Card Brand', 'Payment Type', 'Card Type'],
      feeColumn: ['Fees', 'Processing Fee', 'Square Fees']
    },
    insightsConfig: {
      showInsights: true,
      showPaymentTrends: true,
      showCustomerBehavior: false,
      showOperationalMetrics: true,
      showRiskFactors: true,
      showBusinessIntelligence: true
    }
  },
  'toast_pos': {
    id: 'toast_pos',
    name: 'toast_pos',
    displayName: 'Toast POS (Restaurant)',
    dataStructure: {
      dateColumn: ['Business Date', 'Date', 'Order Date'],
      amountColumn: ['Net Sales', 'Total', 'Order Total'],
      customerColumn: ['Guest Name', 'Customer', 'Party Name'],
      cardBrandColumn: ['Payment Type', 'Card Brand', 'Payment Method'],
      feeColumn: ['Processing Fees', 'Card Fees', 'Payment Fees']
    },
    insightsConfig: {
      showInsights: true,
      showPaymentTrends: true,
      showCustomerBehavior: false,
      showOperationalMetrics: true,
      showRiskFactors: true,
      showBusinessIntelligence: true
    }
  },
  'shopify_pos': {
    id: 'shopify_pos',
    name: 'shopify_pos',
    displayName: 'Shopify POS',
    dataStructure: {
      dateColumn: ['Created at', 'Date', 'Order Date'],
      amountColumn: ['Total Price', 'Subtotal', 'Total'],
      customerColumn: ['Customer Email', 'Billing Name', 'Customer'],
      cardBrandColumn: ['Payment Method', 'Gateway', 'Card Brand'],
      feeColumn: ['Transaction Fee', 'Gateway Fee', 'Processing Fee']
    },
    insightsConfig: {
      showInsights: true,
      showPaymentTrends: true,
      showCustomerBehavior: true,
      showOperationalMetrics: true,
      showRiskFactors: true,
      showBusinessIntelligence: true
    }
  },
  'custom_basic': {
    id: 'custom_basic',
    name: 'custom_basic',
    displayName: 'Custom/Basic Format',
    dataStructure: {
      dateColumn: ['Date', 'Transaction Date', 'Created Date'],
      amountColumn: ['Amount', 'Total', 'Transaction Amount'],
      customerColumn: ['Customer', 'Name', 'Client'],
      cardBrandColumn: ['Card Brand', 'Payment Type', 'Card Type'],
      feeColumn: ['Fee', 'Processing Fee', 'Charge']
    },
    insightsConfig: {
      showInsights: false,
      showPaymentTrends: false,
      showCustomerBehavior: false,
      showOperationalMetrics: false,
      showRiskFactors: false,
      showBusinessIntelligence: false
    }
  }
};

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
    console.log('🧪 MINIMAL TEST: Returning basic test data...');
    
    // MINIMAL TEST: Just return static test data
    const testData = [
      ['Card Brand', 'Count in File 1', 'Count in File 2'],
      ['Visa', 5, 7],
      ['Mastercard', 3, 4],
      ['American Express', 1, 2]
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        result: testData,
        message: 'MINIMAL TEST: Static data returned successfully',
        rowCount: testData.length,
        usedDynamicScript: false,
        softwareProfile: 'Test Mode'
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
    // Get all users and find the one with matching client ID
    const usageSnapshot = await db.collection('usage').get();
    
    for (const userDoc of usageSnapshot.docs) {
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
          
          // Create a more complete sandbox environment
          const sandbox = {
            XLSX: XLSX,
            console: console,
            String: String,
            Set: Set,
            Array: Array,
            Math: Math,
            parseInt: parseInt,
            parseFloat: parseFloat,
            Date: Date,
            RegExp: RegExp,
            JSON: JSON,
            Object: Object,
            Number: Number
          };
          
          try {
            // Execute the generated code in a controlled environment with timeout
            const vm = require('vm');
            const context = vm.createContext(sandbox);
            
            // Set a reasonable timeout for script execution (10 seconds)
            const timeout = 10000;
            
            // Execute the function definition with timeout
            vm.runInContext(generatedCode, context, { timeout });
            
            // Call the executeScript function if it exists
            if (typeof sandbox.executeScript === 'function') {
              console.log('🎯 Calling executeScript function...');
              const result = sandbox.executeScript(XLSX, file1Buffer, file2Buffer);
              
              // Validate result
              if (result && Array.isArray(result) && result.length > 0) {
                console.log('✅ Dynamic script executed successfully');
                return result;
              } else {
                console.log('⚠️ Script returned invalid result format');
                return null;
              }
            } else {
              console.log('⚠️ No executeScript function found, trying direct evaluation...');
              // Try to evaluate the code directly with timeout
              const result = vm.runInContext(`(${generatedCode})(XLSX, file1Buffer, file2Buffer)`, context, { timeout });
              
              // Validate result
              if (result && Array.isArray(result) && result.length > 0) {
                return result;
              } else {
                console.log('⚠️ Direct evaluation returned invalid result');
                return null;
              }
            }
          } catch (execError) {
            console.error('❌ Script execution error:', execError.message);
            if (execError.message.includes('timeout')) {
              console.log('⏰ Script execution timed out');
            }
            console.log('🔄 Falling back to simple comparison...');
            return null;
          }
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

// Get user's software profile from database
async function getUserSoftwareProfile(clientId) {
  try {
    console.log('🔍 Looking up software profile for clientId:', clientId);
    
    // Query usage collection for user with matching businessName or subdomain
    const usageRef = db.collection('usage');
    const snapshot = await usageRef.get();
    
    let userProfile = null;
    snapshot.forEach(doc => {
      const userData = doc.data();
      const userBusinessName = userData.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      
      if (userBusinessName === clientId || userData.subdomain === clientId) {
        userProfile = userData.softwareProfile;
        console.log('✅ Found user with software profile:', userProfile);
      }
    });
    
    return userProfile || 'daysmart_salon'; // Default to DaySmart if not set
  } catch (error) {
    console.error('❌ Error fetching user software profile:', error);
    return 'daysmart_salon'; // Default fallback
  }
}

// Enhanced simple comparison function with software-specific parsing
function simpleComparison(XLSX, file1, file2, softwareProfileId) {
    try {
        console.log('🔄 Using simple comparison logic with software profile:', softwareProfileId);
        const softwareProfile = SOFTWARE_PROFILES[softwareProfileId] || SOFTWARE_PROFILES['daysmart_salon'];
        
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
        console.log('🔧 Using profile data structure:', softwareProfile.dataStructure);

        // Smart column detection using software profile
        const findColumnIndex = (headers, possibleNames) => {
            for (const name of possibleNames) {
                const index = headers.findIndex(h => 
                    String(h).toLowerCase().includes(name.toLowerCase())
                );
                if (index >= 0) return index;
            }
            return -1;
        };

        // Find columns based on software profile
        const cardBrandIndex1 = findColumnIndex(headers1, softwareProfile.dataStructure.cardBrandColumn);
        const cardBrandIndex2 = findColumnIndex(headers2, softwareProfile.dataStructure.cardBrandColumn);
        
        console.log('🎯 Card brand column indices - File1:', cardBrandIndex1, 'File2:', cardBrandIndex2);

        // Count occurrences in both files
        const cardBrandCounts1 = {};
        const cardBrandCounts2 = {};

        // Process file 1
        if (cardBrandIndex1 >= 0) {
            rows1.forEach(row => {
                if (row && row[cardBrandIndex1]) {
                    const brand = String(row[cardBrandIndex1]).trim();
                    if (brand && !brand.toLowerCase().includes('cash')) {
                        cardBrandCounts1[brand] = (cardBrandCounts1[brand] || 0) + 1;
                    }
                }
            });
        }

        // Process file 2
        if (cardBrandIndex2 >= 0) {
            rows2.forEach(row => {
                if (row && row[cardBrandIndex2]) {
                    const brand = String(row[cardBrandIndex2]).trim();
                    if (brand && !brand.toLowerCase().includes('cash')) {
                        cardBrandCounts2[brand] = (cardBrandCounts2[brand] || 0) + 1;
                    }
                }
            });
        }

        // Get all unique card brands
        const allBrands = new Set([...Object.keys(cardBrandCounts1), ...Object.keys(cardBrandCounts2)]);
        
        // Create simple result table: [['Card Brand', 'Count in File 1', 'Count in File 2']]
        const results = [['Card Brand', 'Count in File 1', 'Count in File 2']];
        
        allBrands.forEach(brand => {
            const count1 = cardBrandCounts1[brand] || 0;
            const count2 = cardBrandCounts2[brand] || 0;
            results.push([brand, count1, count2]);
        });

        console.log('✅ Simple comparison completed successfully');
        console.log('📊 Results preview:', results.slice(0, 3));
        
        return results;
    } catch (error) {
        console.error('❌ Error in simple comparison:', error);
        // Return a basic error result
        return [
            ['Card Brand', 'Count in File 1', 'Count in File 2'],
            ['Error', 'Could not process files', 'Please check file format']
        ];
    }
} 