import { initializeApp } from 'npm:firebase-admin/app';
import { getAuth } from 'npm:firebase-admin/auth';
import { getFirestore } from 'npm:firebase-admin/firestore';

const app = initializeApp({
  credential: {
    projectId: Deno.env.get("FIREBASE_PROJECT_ID"),
    clientEmail: Deno.env.get("FIREBASE_CLIENT_EMAIL"),
    privateKey: Deno.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, '\n'),
  }
});

const auth = getAuth(app);
const db = getFirestore(app);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // List all users
    const listUsersResult = await auth.listUsers();
    
    // Delete each user and their usage data
    const batch = db.batch();
    
    for (const userRecord of listUsersResult.users) {
      // Delete Firestore data
      const usageRef = db.collection('usage').doc(userRecord.uid);
      batch.delete(usageRef);
      
      // Delete the user authentication
      await auth.deleteUser(userRecord.uid);
    }
    
    // Commit Firestore deletions
    await batch.commit();

    return new Response(
      JSON.stringify({ 
        message: `Successfully deleted ${listUsersResult.users.length} users and their data` 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});