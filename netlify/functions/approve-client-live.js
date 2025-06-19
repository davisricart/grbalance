const admin = require('firebase-admin');

exports.handler = async function(event, context) {
  console.log('🚀 Approve-client-live function called');
  
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
    const { clientId, userData } = JSON.parse(event.body || '{}');
    
    if (!clientId || !userData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    console.log('🎯 Going LIVE with client:', clientId);

    // Initialize Firebase Admin (if not already done)
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    
    const db = admin.firestore();

    // Update client status to APPROVED/LIVE
    const clientDocRef = db.collection('clients').doc(clientId);
    await clientDocRef.update({
      status: 'approved',
      approvedAt: new Date().toISOString(),
      goLiveAt: new Date().toISOString(),
      qaCompleted: true,
      scriptsDeployed: true,
      isLive: true
    });

    // Also save to approved users collection (your existing flow)
    const approvedUserRef = db.collection('approvedUsers').doc(clientId);
    await approvedUserRef.set({
      ...userData,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      goLiveAt: new Date().toISOString()
    });

    console.log('✅ Client successfully went LIVE:', clientId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Client approved and is now LIVE',
        clientId: clientId,
        status: 'approved',
        approvedAt: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('❌ Error in approve-client-live:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to approve client',
        message: error.message
      }),
    };
  }
};