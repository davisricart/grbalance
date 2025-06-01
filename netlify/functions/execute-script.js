const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Simplified Firebase initialization - make it optional to avoid crashes
const admin = require('firebase-admin');

let db = null;
try {
  if (!admin.apps.length) {
    // Only initialize if environment variables are available
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
      });
      db = getFirestore();
    }
  } else {
    db = getFirestore();
  }
} catch (error) {
  console.log('⚠️ Firebase initialization failed, proceeding without database:', error.message);
}

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
  console.log('🌐 Request origin:', event.headers.origin || event.headers.Origin || 'none');
  console.log('🔧 Request method:', event.httpMethod);
  console.log('📦 Event body preview:', event.body ? event.body.substring(0, 100) + '...' : 'empty');
  
  // PERMISSIVE CORS: Allow all Netlify apps and localhost
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Max-Age': '86400',
  };

  console.log('✅ CORS headers set for all origins');

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('🔄 Handling CORS preflight request');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('📋 Parsing JSON request data...');
    let requestData;
    
    if (!event.body) {
      console.log('❌ No request body provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No request body provided' }),
      };
    }
    
    try {
      requestData = JSON.parse(event.body);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    console.log('📝 Request data keys:', Object.keys(requestData || {}));

    if (!requestData.file1Data || !requestData.file2Data) {
      console.log('❌ Missing required data fields');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Both file1Data and file2Data are required' }),
      };
    }

    const file1Data = requestData.file1Data;
    const file2Data = requestData.file2Data;
    const scriptName = requestData.script;
    
    console.log('✅ JSON data parsed successfully');
    console.log('📊 File 1 rows:', file1Data.length);
    console.log('📊 File 2 rows:', file2Data.length);
    console.log('📜 Script name:', scriptName);

    // Get the CLIENT_ID from environment variables to identify which scripts to use
    const clientId = process.env.CLIENT_ID;
    console.log('🔍 Client ID from environment:', clientId);

    // Get user's software profile
    console.log('🔄 Looking up software profile...');
    const softwareProfileId = await getUserSoftwareProfile(clientId);
    const softwareProfile = SOFTWARE_PROFILES[softwareProfileId] || SOFTWARE_PROFILES['daysmart_salon'];
    console.log('✅ Using software profile:', softwareProfile.displayName);

    let processedData;

    // FORCE simple comparison for now to avoid dynamic script issues
    console.log('🔄 Starting simple comparison...');
    processedData = simpleComparisonFromData(file1Data, file2Data, softwareProfile.id);
    
    console.log('✅ Processing complete, rows generated:', processedData.length);

    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        result: processedData,
        message: 'Processing completed successfully',
        rowCount: processedData.length,
        usedDynamicScript: false,
        softwareProfile: softwareProfile.displayName,
        insightsConfig: softwareProfile.insightsConfig
      }),
    };

    console.log('✅ Sending successful response');
    return response;

  } catch (error) {
    console.error('❌ Error in execute-script:', error);
    console.error('❌ Stack trace:', error.stack);
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

// Get user's software profile from database (with fallback if database unavailable)
async function getUserSoftwareProfile(clientId) {
  try {
    console.log('🔍 Looking up software profile for clientId:', clientId);
    
    // If database is not available, return default
    if (!db) {
      console.log('⚠️ Database not available, using default profile');
      return 'daysmart_salon';
    }
    
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

// Enhanced simple comparison function with software-specific parsing for JSON data
function simpleComparisonFromData(file1Data, file2Data, softwareProfileId) {
    try {
        console.log('🔄 Using simple comparison logic with software profile:', softwareProfileId);
        const softwareProfile = SOFTWARE_PROFILES[softwareProfileId] || SOFTWARE_PROFILES['daysmart_salon'];
        
        console.log('📊 File 1 sample:', file1Data[0]);
        console.log('📊 File 2 sample:', file2Data[0]);
        console.log('🔧 Using profile data structure:', softwareProfile.dataStructure);

        // Smart column detection using software profile
        const findColumnInObject = (obj, possibleNames) => {
            for (const name of possibleNames) {
                for (const key of Object.keys(obj)) {
                    if (String(key).toLowerCase().includes(name.toLowerCase())) {
                        return key;
                    }
                }
            }
            return null;
        };

        // Find columns based on software profile using first row as sample
        const cardBrandKey1 = file1Data.length > 0 ? findColumnInObject(file1Data[0], softwareProfile.dataStructure.cardBrandColumn) : null;
        const cardBrandKey2 = file2Data.length > 0 ? findColumnInObject(file2Data[0], softwareProfile.dataStructure.cardBrandColumn) : null;
        
        console.log('🎯 Card brand column keys - File1:', cardBrandKey1, 'File2:', cardBrandKey2);

        // Count occurrences in both files
        const cardBrandCounts1 = {};
        const cardBrandCounts2 = {};

        // Process file 1
        if (cardBrandKey1) {
            file1Data.forEach(row => {
                if (row && row[cardBrandKey1]) {
                    const brand = String(row[cardBrandKey1]).trim();
                    if (brand && !brand.toLowerCase().includes('cash')) {
                        cardBrandCounts1[brand] = (cardBrandCounts1[brand] || 0) + 1;
                    }
                }
            });
        }

        // Process file 2
        if (cardBrandKey2) {
            file2Data.forEach(row => {
                if (row && row[cardBrandKey2]) {
                    const brand = String(row[cardBrandKey2]).trim();
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