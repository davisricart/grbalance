exports.handler = async function(event, context) {
  console.log('🔍 Debug Firebase Environment Variable');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const envVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!envVar) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: 'Environment variable not found',
          exists: false
        })
      };
    }

    // Check basic properties
    const length = envVar.length;
    const firstChar = envVar.charAt(0);
    const lastChar = envVar.charAt(length - 1);
    const hasNewlines = envVar.includes('\n');
    const hasCarriageReturns = envVar.includes('\r');
    
    // Try to parse and get basic info
    let parseResult = null;
    let parseError = null;
    
    try {
      const parsed = JSON.parse(envVar);
      parseResult = {
        hasProjectId: !!parsed.project_id,
        projectId: parsed.project_id,
        hasPrivateKey: !!parsed.private_key,
        hasClientEmail: !!parsed.client_email,
        type: parsed.type
      };
    } catch (err) {
      parseError = err.message;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        exists: true,
        length: length,
        firstChar: firstChar,
        lastChar: lastChar,
        hasNewlines: hasNewlines,
        hasCarriageReturns: hasCarriageReturns,
        parseSuccess: !!parseResult,
        parseError: parseError,
        parseResult: parseResult,
        // Show first 50 characters for debugging
        preview: envVar.substring(0, 50) + '...'
      }, null, 2)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Debug failed',
        message: error.message
      })
    };
  }
};