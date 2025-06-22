const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Admin emails from environment variables (server-side only)
const getAdminEmails = () => {
  const adminEmailsEnv = process.env.ADMIN_EMAILS || 'davisricart@gmail.com';
  return adminEmailsEnv.split(',').map(email => email.trim().toLowerCase());
};

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    // Extract Supabase JWT token from Authorization header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify({ 
          error: 'Missing or invalid authorization header',
          isAdmin: false 
        }),
      };
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Supabase JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn('🚨 SECURITY: Token verification failed:', error?.message);
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify({ 
          error: 'Invalid token',
          isAdmin: false 
        }),
      };
    }

    const userEmail = user.email?.toLowerCase();

    if (!userEmail) {
      console.warn('🚨 SECURITY: Token verification failed - no email found');
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: JSON.stringify({ 
          error: 'Invalid token - no email found',
          isAdmin: false 
        }),
      };
    }

    // Check if user email is in admin whitelist
    const adminEmails = getAdminEmails();
    const isAdmin = adminEmails.includes(userEmail);

    // Log security events
    if (isAdmin) {
      console.log('✅ ADMIN ACCESS: Authorized admin login:', userEmail);
    } else {
      console.warn('🚨 SECURITY ALERT: Unauthorized admin access attempt by:', userEmail);
      console.warn('🚨 User ID:', user.id);
      console.warn('🚨 Timestamp:', new Date().toISOString());
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({
        isAdmin,
        userEmail,
        message: isAdmin ? 'Admin access granted' : 'Access denied - not an admin',
      }),
    };

  } catch (error) {
    console.error('🚨 ERROR in admin verification:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({ 
        error: 'Internal server error during admin verification',
        isAdmin: false 
      }),
    };
  }
};