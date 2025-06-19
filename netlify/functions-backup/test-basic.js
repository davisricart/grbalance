exports.handler = async function(event, context) {
  console.log('🚀 Basic test function called');
  
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
      message: 'Basic function works perfectly!',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      environment: {
        nodeVersion: process.version,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        supabaseUrlLength: process.env.SUPABASE_URL?.length || 0,
        supabaseKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0
      }
    }, null, 2)
  };
};