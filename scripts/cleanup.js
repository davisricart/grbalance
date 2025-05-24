import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with service account
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
});

const auth = getAuth(app);
const db = getFirestore(app);

async function deleteAllUsers() {
  try {
    console.log('Starting user deletion process...');
    
    // List all users
    const listUsersResult = await auth.listUsers();
    console.log(`Found ${listUsersResult.users.length} users to delete`);
    
    // Delete each user and their usage data
    const batch = db.batch();
    
    for (const userRecord of listUsersResult.users) {
      console.log(`Deleting user: ${userRecord.email}`);
      
      // Delete Firestore data
      const usageRef = db.collection('usage').doc(userRecord.uid);
      batch.delete(usageRef);
      
      // Delete the user authentication
      await auth.deleteUser(userRecord.uid);
    }
    
    // Commit Firestore deletions
    await batch.commit();
    
    console.log('Successfully deleted all users and their data');
  } catch (error) {
    console.error('Error deleting users:', error);
    process.exit(1);
  }
}

deleteAllUsers();