const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase
if (!admin.apps.length) {
  const serviceAccount = require('./grbalance-93c2e-firebase-adminsdk-15xzt-60a96bc5cf.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkScripts() {
  try {
    console.log('🔍 Checking deployed scripts...');
    const usageSnapshot = await db.collection('usage').get();
    
    usageSnapshot.forEach(doc => {
      const userData = doc.data();
      const businessName = userData.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      
      if (businessName === 'salonpizza' || userData.subdomain === 'salonpizza') {
        console.log('📋 Found salonpizza user:', doc.id);
        console.log('💼 Business name:', userData.businessName);
        console.log('🌐 Subdomain:', userData.subdomain);
        console.log('📜 Deployed scripts:', userData.deployedScripts?.length || 0);
        
        if (userData.deployedScripts) {
          userData.deployedScripts.forEach((script, index) => {
            console.log(`\n🔧 Script ${index + 1}:`, script.name);
            if (script.logic?.generatedCode) {
              console.log('📝 Generated code:');
              console.log(script.logic.generatedCode);
              console.log('\n' + '='.repeat(50));
            }
          });
        }
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkScripts(); 