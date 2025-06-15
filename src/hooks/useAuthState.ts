import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../main';

interface UserStatus {
  isAuthenticated: boolean;
  isApproved: boolean;
  isPending: boolean;
  isLoading: boolean;
  user: any;
  userStatus: string | null;
}

export function useAuthState(): UserStatus {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsAuthenticated(true);
        setUser(firebaseUser);
        
        try {
          // Check user's approval status in Firebase
          const userStatusDoc = await getDoc(doc(db, 'usage', firebaseUser.uid));
          
          if (userStatusDoc.exists()) {
            const userData = userStatusDoc.data();
            const status = userData.status || 'pending';
            setUserStatus(status);
            
            // User is approved if status is 'approved' or 'active'
            const approved = status === 'approved' || status === 'active';
            setIsApproved(approved);
            setIsPending(!approved && status === 'pending');
          } else {
            // No status document = pending approval
            setUserStatus('pending');
            setIsApproved(false);
            setIsPending(true);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          // Default to pending if error
          setUserStatus('pending');
          setIsApproved(false);
          setIsPending(true);
        }
      } else {
        // User not authenticated
        setIsAuthenticated(false);
        setIsApproved(false);
        setIsPending(false);
        setUser(null);
        setUserStatus(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { 
    isAuthenticated, 
    isApproved, 
    isPending, 
    isLoading, 
    user, 
    userStatus 
  };
}