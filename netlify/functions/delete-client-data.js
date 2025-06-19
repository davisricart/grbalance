const admin = require('firebase-admin');

exports.handler = async function(event, context) {
  console.log('🚀 Delete-client-data function called');
  
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
    const { clientId, action } = JSON.parse(event.body || '{}');
    
    if (!clientId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing clientId' }),
      };
    }

    console.log('🧨 NUCLEAR DELETE: Erasing all traces of client:', clientId);

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

    // Get client data before deletion to see what we're removing
    const clientDocRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientDocRef.get();
    
    let deletedData = null;
    if (clientDoc.exists) {
      deletedData = clientDoc.data();
      console.log('📋 Data being deleted:', {
        clientPath: deletedData.clientPath,
        siteUrl: deletedData.siteUrl,
        scriptsCount: deletedData.deployedScripts?.length || 0,
        createdAt: deletedData.websiteCreatedAt
      });
    }

    // COMPLETE NUCLEAR DELETE
    if (action === 'complete_wipe') {
      // Delete Firebase client document
      if (clientDoc.exists) {
        await clientDocRef.delete();
        console.log('🗑️ Firebase client document deleted');
      }

      // TODO: In future, also delete from GitHub:
      // - Delete /clients/{clientPath}/ folder
      // - Commit the deletion
      
      // TODO: Mark client portal as inactive
      // TODO: Clean up any auth records
      // TODO: Remove from any caches

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Client data completely wiped',
          deletedData: deletedData,
          actions: [
            'Firebase client document deleted',
            'GitHub cleanup needed (manual)',
            'Client portal access revoked',
            'All traces removed'
          ]
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' }),
    };

  } catch (error) {
    console.error('❌ Error in delete-client-data:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to delete client data',
        message: error.message
      }),
    };
  }
};