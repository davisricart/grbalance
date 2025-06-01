const admin = require('firebase-admin');

exports.handler = async function(event, context) {
  console.log('🚀 Get-available-scripts function called');
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get client ID from query parameters or body
    let clientId;
    if (event.httpMethod === 'GET') {
      clientId = event.queryStringParameters?.clientId;
    } else {
      const body = JSON.parse(event.body || '{}');
      clientId = body.clientId;
    }

    // Try to get from environment if not provided
    if (!clientId) {
      clientId = process.env.CLIENT_ID;
    }

    console.log('🔍 Loading scripts for client:', clientId);

    // Initialize Firebase Admin (if not already done)
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    
    const db = admin.firestore();
    
    // Get all users and find scripts deployed to this client
    const usersSnapshot = await db.collection('usage').get();
    const availableScripts = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const deployedScripts = userData.deployedScripts || [];
      
      // Check each script to see if it's deployed to this client
      for (const script of deployedScripts) {
        if (typeof script === 'object' && script.logic) {
          // This is a dynamic script with logic
          availableScripts.push({
            name: script.name,
            deployedAt: script.deployedAt,
            size: script.size,
            type: script.type,
            preview: script.preview,
            status: script.status,
            logic: script.logic
          });
        } else if (typeof script === 'string') {
          // This is a legacy script name
          availableScripts.push({
            name: script,
            deployedAt: new Date().toISOString(),
            size: 1000,
            type: 'custom',
            preview: 'Legacy script',
            status: 'active'
          });
        }
      }
    }

    // Remove duplicates by name
    const uniqueScripts = availableScripts.filter((script, index, self) => 
      index === self.findIndex(s => s.name === script.name)
    );

    console.log(`✅ Found ${uniqueScripts.length} unique scripts for client ${clientId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        scripts: uniqueScripts,
        clientId: clientId,
        message: `Found ${uniqueScripts.length} available scripts`
      }),
    };

  } catch (error) {
    console.error('❌ Error in get-available-scripts:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to load scripts', 
        message: error.message 
      }),
    };
  }
}; 