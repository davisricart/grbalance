import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, auth } from '../main';
import { Plus, Trash2, Upload, User, Settings, UserCheck, Eye, EyeOff } from 'lucide-react';
import { debugFirestorePermissions, safeFetchPendingUsers } from '../utils/firebaseDebug';
import clientConfig from '../config/client';

const TIER_LIMITS = {
  starter: 50,
  professional: 75,
  business: 150
};

interface Client {
  id: string;
  name: string;
  email: string;
  subdomain: string;
  scripts: string[];
  createdAt: string;
  status: 'active' | 'inactive';
}

interface PendingUser {
  id: string;
  email: string;
  businessName: string;
  businessType: string;
  subscriptionTier: string;
  billingCycle: string;
  createdAt: string;
}

interface ApprovedUser {
  id: string;
  email: string;
  businessName?: string;
  businessType?: string;
  subscriptionTier: string;
  billingCycle?: string;
  comparisonsUsed: number;
  comparisonsLimit: number;
  status: string;
  approvedAt: string;
  createdAt: string;
}

interface Script {
  name: string;
  file: File | null;
  clientId: string;
}

interface ConfirmationDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmStyle: string;
  onConfirm: () => void;
}

const AdminPage: React.FC = () => {
  // FORCE CONSOLE OUTPUT - TEMP DEBUG
  console.log('🟢 ADMIN PAGE COMPONENT LOADED');
  console.log('🟢 AUTH CURRENT USER:', auth.currentUser);
  console.log('🟢 AUTH STATE:', auth.currentUser ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');

  const [activeTab, setActiveTab] = useState<'clients' | 'pending' | 'approved' | 'settings'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showUploadScript, setShowUploadScript] = useState(false);
  const [selectedClientForScript, setSelectedClientForScript] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmStyle: '',
    onConfirm: () => {}
  });
  
  // Form states
  const [newClient, setNewClient] = useState({
    email: '',
    businessName: '',
    businessType: '',
    subscriptionTier: 'professional',
    billingCycle: 'monthly'
  });

  const [newScript, setNewScript] = useState<Script>({
    name: '',
    file: null,
    clientId: ''
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Account settings state
  const [settingsForm, setSettingsForm] = useState({
    currentPassword: '',
    newEmail: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showSettingsPasswords, setShowSettingsPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Fetch clients from Firebase
  const fetchClients = async () => {
    try {
      console.log('🔥 Fetching clients...');
      console.log('🔥 Current user:', auth.currentUser);
      console.log('🔥 Database reference:', db);
      
      const clientsCollection = collection(db, 'clients');
      console.log('🔥 Collection reference created:', clientsCollection);
      
      const snapshot = await getDocs(clientsCollection);
      console.log('🔥 Query executed successfully');
      
      const clientsData: Client[] = [];
      
      snapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() } as Client);
      });
      
      console.log('✅ Clients fetched successfully:', clientsData.length);
      setClients(clientsData);
    } catch (error: any) {
      console.error('🚨 FIREBASE ERROR in fetchClients:');
      console.error('🚨 Error Code:', error.code);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      console.error('🚨 Auth State:', auth.currentUser ? 'authenticated' : 'not authenticated');
      console.error('🚨 User UID:', auth.currentUser?.uid);
    }
  };

  // Fetch pending users with debugging
  const fetchPendingUsers = async () => {
    try {
      console.log('🔥 Fetching pending users...');
      console.log('🔥 Current user:', auth.currentUser);
      
      const users = await safeFetchPendingUsers();
      console.log('✅ Pending users fetched successfully:', users.length);
      setPendingUsers(users);
    } catch (error: any) {
      console.error('🚨 FIREBASE ERROR in fetchPendingUsers:');
      console.error('🚨 Error Code:', error.code);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      console.error('🚨 Auth State:', auth.currentUser ? 'authenticated' : 'not authenticated');
      setPendingUsers([]);
    }
  };

  // Fetch approved users
  const fetchApprovedUsers = async () => {
    try {
      console.log('🔥 Fetching approved users...');
      console.log('🔥 Current user:', auth.currentUser);
      
      const usageCollection = collection(db, 'usage');
      const approvedQuery = query(usageCollection, where('status', '==', 'approved'));
      console.log('🔥 Created approved query:', approvedQuery);
      
      const snapshot = await getDocs(approvedQuery);
      console.log('🔥 Query executed, document count:', snapshot.size);
      
      const approvedUsersData: ApprovedUser[] = [];
      snapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() } as ApprovedUser;
        console.log('🔥 Found approved user:', userData);
        approvedUsersData.push(userData);
      });
      
      console.log('✅ Approved users fetched successfully:', approvedUsersData.length);
      console.log('✅ Approved users data:', approvedUsersData);
      setApprovedUsers(approvedUsersData);
    } catch (error: any) {
      console.error('🚨 FIREBASE ERROR in fetchApprovedUsers:');
      console.error('🚨 Error Code:', error.code);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Full Error Object:', error);
      console.error('🚨 Auth State:', auth.currentUser ? 'authenticated' : 'not authenticated');
      setApprovedUsers([]);
    }
  };

  // Run Firebase debugging when component mounts
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = () => {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('🔵 AUTH STATE CHANGED:', user ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
        console.log('🔵 USER OBJECT:', user);

        if (user) {
          console.log('✅ User is authenticated - starting Firebase operations');
          console.log('✅ User UID:', user.uid);
          console.log('✅ User Email:', user.email);
          
          setLoading(true);
          
          // Now run debugging and fetch data
          console.log('🚀 Running Firebase debug...');
          await debugFirestorePermissions();
          
          console.log('🔥 Starting fetchClients...');
          await fetchClients();
          console.log('🔥 Starting fetchPendingUsers...');
          await fetchPendingUsers();
          console.log('🔥 Starting fetchApprovedUsers...');
          await fetchApprovedUsers();
          
          setLoading(false);
        } else {
          console.log('❌ User not authenticated - redirecting or waiting...');
          setLoading(false);
        }
      });
    };

    // Add error catching for debugging
    window.addEventListener('error', (event) => {
      console.error('🚨 UNHANDLED ERROR:', event.error);
      console.error('🚨 ERROR DETAILS:', {
        message: event.error?.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 UNHANDLED PROMISE REJECTION:', event.reason);
      console.error('🚨 REJECTION DETAILS:', {
        reason: event.reason,
        promise: event.promise
      });
    });

    setupAuthListener();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Approve pending user
  const approvePendingUser = async (userId: string) => {
    try {
      console.log('🔥 Approving user:', userId);
      
      // Get the pending user data
      const pendingUser = pendingUsers.find(user => user.id === userId);
      if (!pendingUser) {
        console.error('🚨 Pending user not found');
        return;
      }
      
      console.log('🔥 Found pending user:', pendingUser);

      // Get the comparison limit based on subscription tier
      const comparisonLimit = TIER_LIMITS[pendingUser.subscriptionTier as keyof typeof TIER_LIMITS] || 0;
      console.log('🔥 Calculated comparison limit:', comparisonLimit);

      // Prepare update data
      const updateData = {
        status: 'approved',
        comparisonsLimit: comparisonLimit,
        approvedAt: new Date(),
        updatedAt: new Date(),
        businessName: pendingUser.businessName,
        businessType: pendingUser.businessType,
        billingCycle: pendingUser.billingCycle
      };
      
      console.log('🔥 Update data for usage collection:', updateData);

      // Update status in usage collection to "approved" and set limits
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, updateData);
      console.log('✅ Updated usage collection successfully');

      // Remove from pendingUsers collection
      const pendingDocRef = doc(db, 'pendingUsers', userId);
      await deleteDoc(pendingDocRef);
      console.log('✅ Deleted from pendingUsers collection successfully');

      console.log('✅ User approved successfully');
      
      // Refresh both lists
      console.log('🔄 Refreshing data...');
      await fetchPendingUsers();
      await fetchApprovedUsers();
      console.log('✅ Data refresh completed');
      
    } catch (error) {
      console.error('🚨 Error approving user:', error);
    }
  };

  // Reject pending user
  const rejectPendingUser = async (userId: string) => {
    try {
      console.log('Rejecting user:', userId);
      
      // Remove from both collections
      const pendingDocRef = doc(db, 'pendingUsers', userId);
      const usageDocRef = doc(db, 'usage', userId);
      
      await deleteDoc(pendingDocRef);
      await deleteDoc(usageDocRef);

      console.log('User rejected successfully');
      
      // Refresh pending users list
      await fetchPendingUsers();
      
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  // Deactivate approved user
  const deactivateApprovedUser = async (userId: string) => {
    try {
      console.log('Deactivating user:', userId);
      
      // Update status in usage collection to "deactivated"
      const usageDocRef = doc(db, 'usage', userId);
      await updateDoc(usageDocRef, {
        status: 'deactivated',
        comparisonsLimit: 0, // Remove access
        deactivatedAt: new Date(),
        updatedAt: new Date()
      });

      console.log('User deactivated successfully');
      
      // Refresh approved users list
      await fetchApprovedUsers();
      
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  // Confirmation handlers
  const handleApprovePendingUser = (userId: string, userEmail: string) => {
    showConfirmation(
      'Approve User',
      `Are you sure you want to approve ${userEmail}? This will grant them full access to their subscription plan.`,
      'Approve',
      'bg-green-600 text-white',
      () => approvePendingUser(userId)
    );
  };

  const handleRejectPendingUser = (userId: string, userEmail: string) => {
    showConfirmation(
      'Reject User',
      `Are you sure you want to reject ${userEmail}? This will permanently delete their account and they will need to register again.`,
      'Reject',
      'bg-red-600 text-white',
      () => rejectPendingUser(userId)
    );
  };

  const handleDeactivateApprovedUser = (userId: string, userEmail: string) => {
    console.log('🔥 handleDeactivateApprovedUser called for:', userEmail);
    showConfirmation(
      'Deactivate User',
      `Are you sure you want to deactivate ${userEmail}? This will remove their access but preserve their account data.`,
      'Deactivate',
      'bg-red-600 text-white',
      () => deactivateApprovedUser(userId)
    );
    console.log('🔥 Confirmation dialog should now be visible');
  };

  // Add new client
  const addClient = async () => {
    try {
      console.log('🔥 ADD CLIENT BUTTON CLICKED');
      console.log('🔥 Form data:', newClient);
      console.log('🔥 Auth user:', auth.currentUser);
      
      // Validate required fields
      if (!newClient.email || !newClient.businessName || !newClient.businessType) {
        console.error('🚨 Missing required fields');
        alert('Please fill in all required fields: Email, Business Name, and Business Type');
        return;
      }

      console.log('✅ Validation passed, creating client...');

      // Create a usage record for the new client (pre-approved)
      const clientId = `admin_${Date.now()}`; // Generate unique ID for admin-created clients
      const comparisonLimit = TIER_LIMITS[newClient.subscriptionTier as keyof typeof TIER_LIMITS] || 0;

      console.log('🔥 Client ID:', clientId);
      console.log('🔥 Comparison limit:', comparisonLimit);

      const clientData = {
        email: newClient.email,
        businessName: newClient.businessName,
        businessType: newClient.businessType,
        subscriptionTier: newClient.subscriptionTier,
        billingCycle: newClient.billingCycle,
        comparisonsUsed: 0,
        comparisonsLimit: comparisonLimit,
        status: 'approved',
        createdAt: new Date(),
        approvedAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin'
      };

      console.log('🔥 Client data to save:', clientData);

      await setDoc(doc(db, 'usage', clientId), clientData);

      console.log('✅ Client created successfully in Firebase');
      alert('Client added successfully!');
      
      setShowAddClient(false);
      setNewClient({ 
        email: '', 
        businessName: '', 
        businessType: '', 
        subscriptionTier: 'professional', 
        billingCycle: 'monthly' 
      });
      
      // Refresh approved users to show the new client
      console.log('🔄 Refreshing approved users list...');
      await fetchApprovedUsers();
      console.log('✅ Approved users list refreshed');
      
    } catch (error: any) {
      console.error('🚨 ERROR adding client:', error);
      console.error('🚨 Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      alert(`Error adding client: ${error.message || 'Unknown error'}`);
    }
  };

  // Upload script
  const uploadScript = async () => {
    try {
      console.log('Uploading script:', newScript);
      // Implementation would upload script
      setShowUploadScript(false);
      setNewScript({ name: '', file: null, clientId: '' });
    } catch (error) {
      console.error('Error uploading script:', error);
    }
  };

  // Show confirmation dialog
  const showConfirmation = (
    title: string,
    message: string,
    confirmText: string,
    confirmStyle: string,
    onConfirm: () => void
  ) => {
    console.log('🔥 showConfirmation called with:', { title, message, confirmText });
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      confirmStyle,
      onConfirm
    });
    console.log('🔥 confirmDialog state should now be open');
  };

  // Close confirmation dialog
  const closeConfirmation = () => {
    setConfirmDialog({
      isOpen: false,
      title: '',
      message: '',
      confirmText: '',
      confirmStyle: '',
      onConfirm: () => {}
    });
  };

  // Login function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      console.log('🔐 Attempting admin login...');
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      console.log('✅ Login successful');
      
      // Clear form
      setLoginForm({ email: '', password: '' });
    } catch (error: any) {
      console.error('🚨 Login error:', error);
      setLoginError(error.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Update email function
  const handleUpdateEmail = async () => {
    if (!auth.currentUser || !settingsForm.currentPassword || !settingsForm.newEmail) {
      setSettingsError('Please enter your current password and new email');
      return;
    }

    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      // Re-authenticate user before updating email
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        settingsForm.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update email
      await updateEmail(auth.currentUser, settingsForm.newEmail);
      
      setSettingsSuccess('Email updated successfully!');
      setSettingsForm({
        currentPassword: '',
        newEmail: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('🚨 Email update error:', error);
      
      // Handle email verification requirement
      if (error.code === 'auth/operation-not-allowed' || error.message.includes('verify')) {
        setSettingsError(
          'Email verification is required. For admin access, please create a new Firebase user with your desired email address, or contact your system administrator to update Firebase settings.'
        );
      } else {
        setSettingsError(error.message || 'Failed to update email');
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  // Update password function
  const handleUpdatePassword = async () => {
    if (!auth.currentUser || !settingsForm.currentPassword || !settingsForm.newPassword) {
      setSettingsError('Please enter your current password and new password');
      return;
    }

    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      setSettingsError('New passwords do not match');
      return;
    }

    if (settingsForm.newPassword.length < 6) {
      setSettingsError('New password must be at least 6 characters');
      return;
    }

    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      // Re-authenticate user before updating password
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        settingsForm.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, settingsForm.newPassword);
      
      setSettingsSuccess('Password updated successfully!');
      setSettingsForm({
        currentPassword: '',
        newEmail: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('🚨 Password update error:', error);
      setSettingsError(error.message || 'Failed to update password');
    } finally {
      setSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
          <p className="mt-2 text-sm text-gray-500">Running Firebase diagnostics...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors duration-200">
              {/* You can use Link from react-router-dom if preferred */}
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back to Home
            </a>
          </div>
        </nav>
        <main className="flex items-center justify-center px-4 py-12">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
            <div className="flex flex-col items-center space-y-3 mb-6">
              <img 
                src={clientConfig.logo}
                alt={clientConfig.title + ' Logo'}
                className="h-28 sm:h-32 w-auto object-contain"
              />
              <p className="text-emerald-700 text-center text-base sm:text-lg font-medium">
                Admin Login
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-emerald-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {loginError && (
                <div className="text-red-600 text-sm bg-red-50/50 p-3 rounded-md border border-red-100 flex items-center gap-2">
                  {/** Optionally add an icon here */}
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 ${loginLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loginLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                  </>
                )}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Admin access only. Unauthorized access is prohibited.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage clients and user approvals</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('clients')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'clients'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="inline w-4 h-4 mr-2" />
                Client Management ({clients.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="inline w-4 h-4 mr-2" />
                Pending Approvals ({pendingUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserCheck className="inline w-4 h-4 mr-2" />
                Approved Users ({approvedUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="inline w-4 h-4 mr-2" />
                Account Settings
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAddClient(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </button>
              <button
                onClick={() => setShowUploadScript(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Script
              </button>
            </div>

            {/* Clients Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Active Clients</h3>
                <p className="text-sm text-gray-500 mt-1">Manage your client accounts and their configurations</p>
              </div>
              
              {clients.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <User className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first client.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddClient(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Client
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client Information
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Configuration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scripts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                <div className="text-sm text-gray-500">ID: {client.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.email}</div>
                            <div className="text-sm text-gray-500">Registered: {new Date(client.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Subdomain: {client.subdomain}</div>
                            <div className="text-sm text-gray-500">{client.scripts?.length || 0} scripts</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              client.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {client.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.scripts?.length > 0 ? (
                              <div className="space-y-1">
                                {client.scripts.slice(0, 2).map((script, index) => (
                                  <div key={index} className="text-xs bg-gray-100 rounded px-2 py-1">{script}</div>
                                ))}
                                {client.scripts.length > 2 && (
                                  <div className="text-xs text-gray-400">+{client.scripts.length - 2} more</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No scripts</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button 
                              onClick={() => {
                                setSelectedClientForScript(client.id);
                                setShowUploadScript(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs"
                            >
                              Upload Script
                            </button>
                            <button className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs">
                              <Trash2 className="w-3 h-3 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-6">
            {/* Pending Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Pending User Approvals</h3>
                <p className="text-sm text-gray-500 mt-1">Review and approve new user registrations</p>
              </div>
              
              {pendingUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <Settings className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                  <p className="mt-1 text-sm text-gray-500">All user registrations have been processed.</p>
                  <div className="mt-6">
                    <div className="text-xs text-gray-400">
                      New user registrations will appear here for admin review
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Information
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscription Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usage Limit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-yellow-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.businessName}</div>
                            <div className="text-sm text-gray-500">{user.businessType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.subscriptionTier}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">{user.billingCycle}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="text-sm font-medium text-gray-900">
                              {TIER_LIMITS[user.subscriptionTier as keyof typeof TIER_LIMITS] || 'Unknown'} calls/month
                            </div>
                            <div className="text-xs text-gray-500">
                              ${user.subscriptionTier === 'starter' ? '29' : user.subscriptionTier === 'professional' ? '79' : '149'}/month
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">
                              {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleApprovePendingUser(user.id, user.email)}
                              className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectPendingUser(user.id, user.email)}
                              className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center mt-1"
                            >
                              ✗ Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'approved' && (
          <div className="space-y-6">
            {/* Approved Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Approved Users</h3>
                <p className="text-sm text-gray-500 mt-1">Manage approved user accounts</p>
              </div>
              
              {approvedUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <Settings className="h-12 w-12" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No approved users</h3>
                  <p className="mt-1 text-sm text-gray-500">All approved users have been processed.</p>
                  <div className="mt-6">
                    <div className="text-xs text-gray-400">
                      Approved users will appear here for admin review
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Information
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subscription Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usage Limit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registration Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {approvedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.businessName || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{user.businessType || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {user.subscriptionTier}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">{user.billingCycle || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="text-sm font-medium text-gray-900">
                              {user.comparisonsUsed || 0}/{user.comparisonsLimit} used
                            </div>
                            <div className="text-xs text-gray-500">
                              ${user.subscriptionTier === 'starter' ? '19' : user.subscriptionTier === 'professional' ? '29' : '49'}/month
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">
                              {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleDeactivateApprovedUser(user.id, user.email)}
                              className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
                            >
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Account Settings */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
                <p className="text-sm text-gray-500 mt-1">Update your admin account email and password</p>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Current Account Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Current Account</h4>
                  <p className="text-sm text-blue-700">
                    Email: <span className="font-medium">{auth.currentUser?.email}</span>
                  </p>
                </div>

                {/* Success/Error Messages */}
                {settingsSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-600">{settingsSuccess}</p>
                  </div>
                )}

                {settingsError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{settingsError}</p>
                  </div>
                )}

                {/* Update Email Section */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Change Email Address</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password (required for verification)
                      </label>
                      <div className="relative">
                        <input
                          type={showSettingsPasswords.current ? 'text' : 'password'}
                          value={settingsForm.currentPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPasswords({...showSettingsPasswords, current: !showSettingsPasswords.current})}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showSettingsPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Email Address
                      </label>
                      <input
                        type="email"
                        value={settingsForm.newEmail}
                        onChange={(e) => setSettingsForm({...settingsForm, newEmail: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new email address"
                      />
                    </div>

                    <button
                      onClick={handleUpdateEmail}
                      disabled={settingsLoading || !settingsForm.currentPassword || !settingsForm.newEmail}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {settingsLoading ? 'Updating...' : 'Update Email'}
                    </button>
                  </div>
                </div>

                {/* Update Password Section */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSettingsPasswords.current ? 'text' : 'password'}
                          value={settingsForm.currentPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPasswords({...showSettingsPasswords, current: !showSettingsPasswords.current})}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showSettingsPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSettingsPasswords.new ? 'text' : 'password'}
                          value={settingsForm.newPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter new password (min 6 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPasswords({...showSettingsPasswords, new: !showSettingsPasswords.new})}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showSettingsPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSettingsPasswords.confirm ? 'text' : 'password'}
                          value={settingsForm.confirmPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, confirmPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPasswords({...showSettingsPasswords, confirm: !showSettingsPasswords.confirm})}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showSettingsPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleUpdatePassword}
                      disabled={settingsLoading || !settingsForm.currentPassword || !settingsForm.newPassword || !settingsForm.confirmPassword}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {settingsLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h5 className="text-sm font-medium text-yellow-800 mb-2">Security Notice</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• You'll need to enter your current password to make any changes</li>
                    <li>• Choose a strong password with at least 6 characters</li>
                    <li>• Email changes may require verification</li>
                    <li>• Keep your credentials secure and don't share them</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Client Modal */}
        {showAddClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Add New Client</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="client@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={newClient.businessName}
                    onChange={(e) => setNewClient({...newClient, businessName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    value={newClient.businessType}
                    onChange={(e) => setNewClient({...newClient, businessType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select business type</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="retail">Retail Store</option>
                    <option value="franchise">Franchise</option>
                    <option value="grocery">Grocery Store</option>
                    <option value="salon">Salon/Spa</option>
                    <option value="automotive">Automotive</option>
                    <option value="healthcare">Healthcare/Medical</option>
                    <option value="fitness">Fitness/Gym</option>
                    <option value="service">Service Business</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="hospitality">Hotel/Hospitality</option>
                    <option value="entertainment">Entertainment/Events</option>
                    <option value="professional">Professional Services</option>
                    <option value="nonprofit">Non-Profit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={newClient.subscriptionTier}
                    onChange={(e) => setNewClient({...newClient, subscriptionTier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="starter">
                      Starter - {newClient.billingCycle === 'annual' ? '$15' : '$19'}/month
                      {newClient.billingCycle === 'annual' ? ' (Billed as $182/year)' : ''}
                    </option>
                    <option value="professional">
                      Professional - {newClient.billingCycle === 'annual' ? '$23' : '$29'}/month
                      {newClient.billingCycle === 'annual' ? ' (Billed as $277/year)' : ''}
                    </option>
                    <option value="business">
                      Business - {newClient.billingCycle === 'annual' ? '$39' : '$49'}/month
                      {newClient.billingCycle === 'annual' ? ' (Billed as $470/year)' : ''}
                    </option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={newClient.billingCycle}
                    onChange={(e) => setNewClient({...newClient, billingCycle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (Save 20%)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddClient(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={addClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Client
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Script Modal */}
        {showUploadScript && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Upload Script</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Script Name
                  </label>
                  <input
                    type="text"
                    value={newScript.name}
                    onChange={(e) => setNewScript({...newScript, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter script name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Client
                  </label>
                  <select
                    value={selectedClientForScript}
                    onChange={(e) => setSelectedClientForScript(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Script File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setNewScript({...newScript, file: e.target.files?.[0] || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".js,.py,.php"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadScript(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={uploadScript}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">{confirmDialog.title}</h3>
              <p className="text-gray-700 mb-4">{confirmDialog.message}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    closeConfirmation();
                  }}
                  className={`px-4 py-2 ${confirmDialog.confirmStyle} rounded-md hover:bg-opacity-80`}
                >
                  {confirmDialog.confirmText}
                </button>
                <button
                  onClick={closeConfirmation}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage; 