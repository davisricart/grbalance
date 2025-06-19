const admin = require('firebase-admin');

exports.handler = async function(event, context) {
  console.log('🚀 Test-firebase function called');
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    console.log('🔍 Testing Firebase connection...');

    // Check if environment variable exists
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set',
          success: false
        }),
      };
    }

    // Try to parse the service account
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      console.log('✅ Service account JSON parsed successfully');
      console.log('📋 Project ID:', serviceAccount.project_id);
    } catch (parseError) {
      console.error('❌ Failed to parse Firebase service account:', parseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid Firebase service account JSON',
          success: false,
          details: parseError.message
        }),
      };
    }

    // Try to initialize Firebase Admin
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized successfully');
      } catch (initError) {
        console.error('❌ Failed to initialize Firebase Admin:', initError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to initialize Firebase Admin',
            success: false,
            details: initError.message
          }),
        };
      }
    }

    // Try to access Firestore
    try {
      const db = admin.firestore();
      console.log('✅ Firestore connection established');
      
      // Try a simple read operation
      const testDoc = await db.collection('test').doc('connection').get();
      console.log('✅ Firestore read test completed');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Firebase connection successful!',
          projectId: serviceAccount.project_id,
          timestamp: new Date().toISOString()
        }),
      };

    } catch (firestoreError) {
      console.error('❌ Firestore connection failed:', firestoreError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Firestore connection failed',
          success: false,
          details: firestoreError.message
        }),
      };
    }

  } catch (error) {
    console.error('❌ General error in test-firebase:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Test failed',
        success: false,
        message: error.message
      }),
    };
  }
};