// This script requires Firebase Admin SDK and service account credentials
// To use this script:
// 1. Download your service account key from Firebase Console > Project Settings > Service Accounts
// 2. Save it as 'serviceAccountKey.json' in the scripts directory
// 3. Run: node scripts/adminCleanup.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Try to load service account key
  const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8')
  );

  // Initialize Firebase Admin
  const app = initializeApp({
    credential: cert(serviceAccount)
  });

  const auth = getAuth(app);
  const db = getFirestore(app);

  async function cleanupUserByEmail(email) {
    try {
      console.log(`Cleaning up user: ${email}`);
      
      // Try to get user by email
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
        console.log(`Found auth user: ${userRecord.uid}`);
        
        // Delete from auth
        await auth.deleteUser(userRecord.uid);
        console.log('Deleted from Firebase Auth');
        
        // Delete from Firestore
        await db.collection('usage').doc(userRecord.uid).delete();
        console.log('Deleted from Firestore');
        
      } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
          console.log('User not found in Auth, checking Firestore only...');
          
          // Search Firestore for documents with this email
          const usageSnapshot = await db.collection('usage')
            .where('email', '==', email)
            .get();
            
          if (!usageSnapshot.empty) {
            const deletePromises = [];
            usageSnapshot.forEach(doc => {
              console.log(`Found orphaned Firestore document: ${doc.id}`);
              deletePromises.push(doc.ref.delete());
            });
            
            await Promise.all(deletePromises);
            console.log(`Deleted ${deletePromises.length} orphaned Firestore document(s)`);
          } else {
            console.log('No Firestore documents found for this email');
          }
        } else {
          throw authError;
        }
      }
      
      console.log(`Cleanup complete for: ${email}`);
      
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Clean up the test user
  cleanupUserByEmail('test@test.com')
    .then(() => {
      console.log('All cleanup operations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('Failed to initialize Firebase Admin:');
  console.error('Make sure you have downloaded your service account key and saved it as "serviceAccountKey.json"');
  console.error('You can download it from: Firebase Console > Project Settings > Service Accounts > Generate new private key');
  console.error('Error details:', error.message);
  process.exit(1);
} 