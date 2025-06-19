// send-instruction.js - AI Communication Endpoint
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🚀 AI Instruction Request received');
    
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No request body provided' })
      };
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    console.log('📝 Request data:', JSON.stringify(requestData, null, 2));

    const { instruction, sessionId, timestamp, metadata } = requestData;

    if (!instruction || !sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: instruction and sessionId' })
      };
    }

    // Create the request file for the AI watcher
    const commDir = path.join(process.cwd(), 'public', 'claude-communication');
    const requestFileName = `claude-comm-request-${sessionId}.txt`;
    const requestFilePath = path.join(commDir, requestFileName);

    console.log('📁 Communication directory:', commDir);
    console.log('📄 Request file path:', requestFilePath);

    try {
      // Ensure the communication directory exists
      await fs.mkdir(commDir, { recursive: true });
      console.log('✅ Communication directory ready');

      // Write the request file
      const requestContent = instruction;
      await fs.writeFile(requestFilePath, requestContent, 'utf8');
      console.log('✅ Request file written successfully');

      // Verify the file was written
      const fileExists = await fs.access(requestFilePath).then(() => true).catch(() => false);
      if (!fileExists) {
        throw new Error('Request file verification failed');
      }

      console.log('🎉 AI instruction request processed successfully');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Instruction sent to AI processing system',
          sessionId: sessionId,
          requestFile: requestFileName,
          timestamp: new Date().toISOString()
        })
      };

    } catch (fileError) {
      console.error('❌ File operation error:', fileError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to create request file',
          details: fileError.message
        })
      };
    }

  } catch (error) {
    console.error('❌ Unexpected error in send-instruction:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};