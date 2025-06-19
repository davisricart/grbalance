exports.handler = async function(event, context) {
  console.log('🚀 Simple test function called');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Simple function works!',
      timestamp: new Date().toISOString(),
      environment: {
        hasFirebaseKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        keyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0
      }
    })
  };
};