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
    displayName: 'DaySmart Salon',
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
    displayName: 'Toast POS',
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
    displayName: 'Custom',
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
  }
};

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const clientId = event.queryStringParameters?.clientId;
    
    if (!clientId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Client ID is required' })
      };
    }

    // Find user by client ID
    const usersSnapshot = await db.collection('usage').get();
    let userData = null;
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const userBusinessName = data.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      
      if (userBusinessName === clientId || data.subdomain === clientId) {
        userData = { id: doc.id, ...data };
      }
    });
    
    if (!userData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Client not found' })
      };
    }

    // Get software profile
    const softwareProfileId = userData.softwareProfile || 'custom_basic';
    const softwareProfile = SOFTWARE_PROFILES[softwareProfileId] || SOFTWARE_PROFILES['custom_basic'];
    
    // Check user's individual insights setting first, then fall back to profile setting
    const userShowInsights = userData.showInsights !== undefined ? userData.showInsights : softwareProfile.availableTabs.insights;
    
    // Return client configuration
    const config = {
      clientId: clientId,
      softwareProfile: softwareProfileId,
      softwareProfileName: softwareProfile.displayName,
      availableTabs: {
        ...softwareProfile.availableTabs,
        insights: userShowInsights // Override with user-specific setting
      },
      insightsConfig: softwareProfile.insightsConfig
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(config)
    };

  } catch (error) {
    console.error('Error getting client config:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get client configuration' })
    };
  }
}; 