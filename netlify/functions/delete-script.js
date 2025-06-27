exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { clientPath, scriptName } = JSON.parse(event.body);
    
    if (!clientPath || !scriptName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Client path and script name are required' })
      };
    }

    console.log('🗑️ Deleting script from client portal:', { clientPath, scriptName });

    // Initialize Supabase connection
    const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      console.error('Missing Supabase key');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Get current scripts
    const getResponse = await fetch(`${supabaseUrl}/rest/v1/clients?client_path=eq.${clientPath}&select=deployed_scripts`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch scripts: ${getResponse.statusText}`);
    }

    const clients = await getResponse.json();
    if (!clients || clients.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Client not found' })
      };
    }

    const currentScripts = clients[0].deployed_scripts || [];
    
    // Filter out the script to delete
    const updatedScripts = currentScripts.filter(script => script.name !== scriptName);
    
    console.log('📝 Script deletion:', { 
      original: currentScripts.length, 
      after: updatedScripts.length,
      removed: scriptName
    });

    // Update the client record
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/clients?client_path=eq.${clientPath}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deployed_scripts: updatedScripts
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update scripts: ${updateResponse.statusText}`);
    }

    console.log('✅ Script deleted successfully from client portal');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `Script "${scriptName}" deleted successfully`,
        remainingScripts: updatedScripts.length
      })
    };

  } catch (error) {
    console.error('🚨 Delete script function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};