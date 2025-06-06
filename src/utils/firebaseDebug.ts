import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../main';

const debugFirestorePermissions = async () => {
  console.log('🔍 Starting Firestore permissions debug...');
  
  // Step 1: Check authentication state
  console.log('\n1️⃣ Checking authentication state...');
  
  const checkAuth = (): Promise<User | null> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
        unsubscribe(); // Unsubscribe immediately
        resolve(user);
      });
    });
  };
  
  const currentUser = await checkAuth();
  
  if (!currentUser) {
    console.error('❌ User is NOT authenticated');
    console.log('💡 Solution: Ensure user is signed in before making Firestore queries');
    return;
  }
  
  console.log('✅ User is authenticated:', {
    uid: currentUser.uid,
    email: currentUser.email,
    emailVerified: currentUser.emailVerified
  });
  
  // Step 2: Test basic document read (should work with your rules)
  console.log('\n2️⃣ Testing basic document access...');
  
  try {
    const testDocRef = doc(db, 'pendingUsers', 'test-doc');
    const testDoc = await getDoc(testDocRef);
    console.log('✅ Basic document access works');
    console.log('Document exists:', testDoc.exists());
  } catch (error: any) {
    console.error('❌ Basic document access failed:', error.code, error.message);
    
    if (error.code === 'unavailable') {
      console.log('💡 Network issue - check internet connection');
      return;
    }
    
    if (error.code === 'permission-denied') {
      console.log('💡 Rules haven\'t propagated yet or there\'s a rules issue');
    }
  }
  
  // Step 3: Test collection query
  console.log('\n3️⃣ Testing collection query...');
  
  try {
    const pendingUsersCollection = collection(db, 'pendingUsers');
    const simpleQuery = query(pendingUsersCollection);
    const snapshot = await getDocs(simpleQuery);
    
    console.log('✅ Simple collection query works');
    console.log('Documents found:', snapshot.size);
    
    if (snapshot.size === 0) {
      console.log('⚠️  Collection is empty - this might be expected');
    }
    
  } catch (error: any) {
    console.error('❌ Simple collection query failed:', error.code, error.message);
    
    if (error.code === 'permission-denied') {
      console.log('💡 Check if your security rules allow reading the entire collection');
    }
  }
  
  // Step 4: Test the specific query with where clause
  console.log('\n4️⃣ Testing query with where clause...');
  
  try {
    const pendingUsersCollection = collection(db, 'pendingUsers');
    const pendingQuery = query(pendingUsersCollection, where('status', '==', 'pending'));
    const pendingSnapshot = await getDocs(pendingQuery);
    
    console.log('✅ Query with where clause works');
    console.log('Pending users found:', pendingSnapshot.size);
    
    pendingSnapshot.forEach((doc) => {
      console.log('User:', doc.id, doc.data());
    });
    
  } catch (error: any) {
    console.error('❌ Query with where clause failed:', error.code, error.message);
    
    if (error.code === 'failed-precondition') {
      console.log('💡 You may need to create an index for this query');
      console.log('💡 Check Firebase Console > Firestore > Indexes');
    }
  }
  
  // Step 5: Test rules propagation timing
  console.log('\n5️⃣ Testing rules propagation...');
  
  const testRulesPropagation = async () => {
    console.log('Waiting 5 seconds and retrying...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      const pendingUsersCollection = collection(db, 'pendingUsers');
      const pendingQuery = query(pendingUsersCollection, where('status', '==', 'pending'));
      const pendingSnapshot = await getDocs(pendingQuery);
      
      console.log('✅ Delayed query works - rules have propagated');
      console.log('Pending users found:', pendingSnapshot.size);
      
    } catch (error: any) {
      console.error('❌ Delayed query still fails:', error.code, error.message);
      console.log('💡 This suggests a persistent rules or setup issue');
    }
  };
  
  await testRulesPropagation();
  
  console.log('\n🎯 Debug complete!');
};

// Alternative: Wrap your existing query with better error handling
const safeFetchPendingUsers = async () => {
  try {
    // Ensure user is authenticated first
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to fetch pending users');
    }
    
    console.log('Fetching pending users for authenticated user:', user.uid);
    
    const pendingUsersCollection = collection(db, 'pendingUsers');
    const pendingQuery = query(pendingUsersCollection, where('status', '==', 'pending'));
    const pendingSnapshot = await getDocs(pendingQuery);
    
    const pendingUsers: any[] = [];
    pendingSnapshot.forEach((doc) => {
      pendingUsers.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('Successfully fetched pending users:', pendingUsers.length);
    return pendingUsers;
    
  } catch (error: any) {
    console.error('Error fetching pending users:', error);
    
    // Provide specific error guidance
    switch (error.code) {
      case 'permission-denied':
        console.log('💡 Check: 1) User authentication 2) Security rules 3) Rules propagation');
        break;
      case 'unavailable':
        console.log('💡 Network issue - check internet connection');
        break;
      case 'failed-precondition':
        console.log('💡 Missing index - check Firebase Console > Firestore > Indexes');
        break;
      default:
        console.log('💡 Unexpected error - check Firebase project configuration');
    }
    
    throw error; // Re-throw for component error handling
  }
};

export { debugFirestorePermissions, safeFetchPendingUsers }; 