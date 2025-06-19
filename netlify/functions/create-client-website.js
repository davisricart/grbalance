const admin = require('firebase-admin');

exports.handler = async function(event, context) {
  console.log('🚀 Create-client-website function called');
  
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
    const { clientId, clientPath, businessName, email, subscriptionTier } = JSON.parse(event.body || '{}');
    
    if (!clientId || !clientPath) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    console.log('🏗️ Creating client website:', { clientId, clientPath, businessName });

    // Debug environment variable
    console.log('🔍 Environment variable exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('🔍 Environment variable length:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0);

    // Initialize Firebase Admin (if not already done)
    if (!admin.apps.length) {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
      }
      
      try {
        console.log('🔍 Attempting to parse Firebase service account...');
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log('✅ Service account parsed, project:', serviceAccount.project_id);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized');
      } catch (parseError) {
        console.error('❌ Failed to parse Firebase service account:', parseError.message);
        console.error('❌ First 100 chars of env var:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.substring(0, 100));
        throw new Error(`Invalid Firebase service account configuration: ${parseError.message}`);
      }
    }
    
    const db = admin.firestore();

    // Create comprehensive client data
    const clientData = {
      id: clientId,
      clientPath: clientPath,
      businessName: businessName,
      email: email,
      subscriptionTier: subscriptionTier,
      websiteCreated: true,
      websiteCreatedAt: new Date().toISOString(),
      status: 'testing', // Testing phase
      siteUrl: `https://grbalance.netlify.app/${clientPath}`,
      deployedScripts: [],
      usage: {
        comparisonsUsed: 0,
        comparisonsLimit: subscriptionTier === 'business' ? 500 : 
                         subscriptionTier === 'professional' ? 200 : 100
      },
      settings: {
        theme: 'default',
        customization: {},
        features: {
          advancedReports: subscriptionTier === 'business',
          bulkExport: subscriptionTier !== 'starter',
          apiAccess: subscriptionTier === 'business'
        }
      },
      analytics: {
        lastLogin: null,
        totalComparisons: 0,
        createdReports: 0
      }
    };

    // Save to Firebase
    const clientDocRef = db.collection('clients').doc(clientId);
    await clientDocRef.set(clientData, { merge: true });

    console.log('✅ Client website created in Firebase:', clientData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Client website created successfully',
        clientData: clientData,
        siteUrl: clientData.siteUrl,
        clientId: clientId
      }),
    };

  } catch (error) {
    console.error('❌ Error in create-client-website:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create client website',
        message: error.message
      }),
    };
  }
};