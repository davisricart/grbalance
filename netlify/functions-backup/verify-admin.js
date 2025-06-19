const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Admin emails from environment variables (server-side only)
const getAdminEmails = () => {
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (!adminEmailsEnv) {
    console.error('🚨 ADMIN_EMAILS environment variable not set');
    return [];
  }
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
    // Extract Firebase ID token from Authorization header
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

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email?.toLowerCase();

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
      console.warn('🚨 User UID:', decodedToken.uid);
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