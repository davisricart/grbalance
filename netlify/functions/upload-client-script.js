const admin = require('firebase-admin');

exports.handler = async function(event, context) {
  console.log('🚀 Upload-client-script function called');
  
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
    const { clientId, clientPath, fileName, scriptContent, scriptMetadata } = JSON.parse(event.body || '{}');
    
    if (!clientId || !clientPath || !fileName || !scriptContent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    console.log('📝 Processing script upload:', { clientId, clientPath, fileName });

    // Initialize Firebase Admin (if not already done)
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    
    const db = admin.firestore();

    // TODO: In a real implementation, we would:
    // 1. Use GitHub API to create/update file at `/clients/${clientPath}/scripts/${fileName}`
    // 2. Commit the file to the repository
    // 3. Get the raw GitHub URL
    
    // For now, we'll simulate the GitHub upload and focus on Firebase storage
    const githubUrl = `https://raw.githubusercontent.com/davisricart/grbalance/main/clients/${clientPath}/scripts/${fileName}`;
    
    // Create the complete script metadata
    const fullScriptMetadata = {
      name: scriptMetadata.name || fileName.replace(/\.(js|ts)$/, ''),
      scriptPath: `clients/${clientPath}/scripts/${fileName}`,
      githubUrl: githubUrl,
      deployedAt: new Date().toISOString(),
      size: scriptContent.length,
      type: 'github',
      status: 'uploaded',
      fileName: fileName,
      contentPreview: scriptContent.substring(0, 200) + (scriptContent.length > 200 ? '...' : '')
    };

    // Save to Firebase
    const clientDocRef = db.collection('clients').doc(clientId);
    const clientDoc = await clientDocRef.get();
    
    let deployedScripts = [];
    if (clientDoc.exists) {
      const clientData = clientDoc.data();
      deployedScripts = clientData.deployedScripts || [];
    }
    
    // Add or update the script
    const existingIndex = deployedScripts.findIndex(script => 
      script.fileName === fileName || script.name === fullScriptMetadata.name
    );
    
    if (existingIndex >= 0) {
      deployedScripts[existingIndex] = fullScriptMetadata;
      console.log('🔄 Updated existing script:', fullScriptMetadata.name);
    } else {
      deployedScripts.push(fullScriptMetadata);
      console.log('✅ Added new script:', fullScriptMetadata.name);
    }

    // Update or create client document
    await clientDocRef.set({
      id: clientId,
      clientPath: clientPath,
      deployedScripts: deployedScripts,
      lastScriptUpdate: new Date().toISOString(),
      status: 'testing',
      siteUrl: `https://grbalance.netlify.app/${clientPath}`
    }, { merge: true });

    console.log('💾 Script metadata saved to Firebase:', fullScriptMetadata);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Script uploaded successfully',
        scriptMetadata: fullScriptMetadata,
        githubUrl: githubUrl,
        clientId: clientId
      }),
    };

  } catch (error) {
    console.error('❌ Error in upload-client-script:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to upload script',
        message: error.message
      }),
    };
  }
};