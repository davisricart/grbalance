const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = getFirestore();

// Software Profiles Configuration
const SOFTWARE_PROFILES = {
  'daysmart_salon': {
    id: 'daysmart_salon',
    displayName: 'DaySmart Salon Software',
    insightsConfig: {
      showInsights: true,
      showPaymentTrends: true,
      showCustomerBehavior: true,
      showOperationalMetrics: true,
      showRiskFactors: true,
      showBusinessIntelligence: true
    },
    availableTabs: {
      overview: true,
      insights: true,
      details: true,
      reports: true
    }
  },
  'square_pos': {
    id: 'square_pos',
    displayName: 'Square POS',
    insightsConfig: {
      showInsights: true,
      showPaymentTrends: true,
      showCustomerBehavior: false,
      showOperationalMetrics: true,
      showRiskFactors: true,
      showBusinessIntelligence: true
    },
    availableTabs: {
      overview: true,
      insights: true,
      details: true,
      reports: false
    }
  },
  'toast_pos': {
    id: 'toast_pos',
    displayName: 'Toast POS (Restaurant)',
    insightsConfig: {
      showInsights: true,
      showPaymentTrends: true,
      showCustomerBehavior: false,
      showOperationalMetrics: true,
      showRiskFactors: true,
      showBusinessIntelligence: true
    },
    availableTabs: {
      overview: true,
      insights: true,
      details: true,
      reports: true
    }
  },
  'shopify_pos': {
    id: 'shopify_pos',
    displayName: 'Shopify POS',
    insightsConfig: {
      showInsights: true,
      showPaymentTrends: true,
      showCustomerBehavior: true,
      showOperationalMetrics: true,
      showRiskFactors: true,
      showBusinessIntelligence: true
    },
    availableTabs: {
      overview: true,
      insights: true,
      details: true,
      reports: true
    }
  },
  'custom_basic': {
    id: 'custom_basic',
    displayName: 'Custom/Basic Format',
    insightsConfig: {
      showInsights: false,
      showPaymentTrends: false,
      showCustomerBehavior: false,
      showOperationalMetrics: false,
      showRiskFactors: false,
      showBusinessIntelligence: false
    },
    availableTabs: {
      overview: true,
      insights: false,
      details: true,
      reports: false
    }
  }
};

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get CLIENT_ID from environment variables
    const clientId = process.env.CLIENT_ID;
    
    if (!clientId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Client ID not configured' }),
      };
    }

    console.log('🔍 Looking up configuration for clientId:', clientId);
    
    // Query usage collection for user with matching businessName or subdomain
    const usageRef = db.collection('usage');
    const snapshot = await usageRef.get();
    
    let userProfile = null;
    let userData = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      const userBusinessName = data.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      
      if (userBusinessName === clientId || data.subdomain === clientId) {
        userProfile = data.softwareProfile;
        userData = data;
        console.log('✅ Found user with software profile:', userProfile);
      }
    });
    
    // Use default profile if not set
    const profileId = userProfile || 'daysmart_salon';
    const profile = SOFTWARE_PROFILES[profileId] || SOFTWARE_PROFILES['daysmart_salon'];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientId,
        softwareProfile: profile,
        businessName: userData?.businessName || 'Unknown Business',
        businessType: userData?.businessType || 'Unknown Type',
        message: 'Client configuration retrieved successfully'
      }),
    };

  } catch (error) {
    console.error('❌ Error getting client config:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get client configuration', 
        message: error.message 
      }),
    };
  }
}; 