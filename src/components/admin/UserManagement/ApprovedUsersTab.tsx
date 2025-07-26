import React, { useState } from 'react';
import { ExternalLink, User, Calendar, TrendingUp, CreditCard, Clock, CheckCircle2, Mail, Rocket, Trash2, UserX, RotateCcw, Plus, Settings, ArrowLeft, X } from 'lucide-react';
import { ApprovedUser } from '../../../types/admin';

interface ApprovedUsersTabProps {
  users: ApprovedUser[];
  isLoading: boolean;
  onResetUsage: (userId: string) => Promise<void>;
  onAddUsage: (userId: string, amount: number) => Promise<void>;
  onUpdateLimit: (userId: string, newLimit: number) => Promise<void>;
  onSendBackToQA?: (userId: string) => Promise<void>;
  onDeactivateUser?: (userId: string) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  inlineNotifications: Record<string, { type: 'success' | 'error' | 'info'; message: string }>;
}

const ApprovedUsersTab = React.memo(({
  users,
  isLoading,
  onResetUsage,
  onAddUsage,
  onUpdateLimit,
  onSendBackToQA,
  onDeactivateUser,
  onDeleteUser,
  inlineNotifications
}: ApprovedUsersTabProps) => {
  const [processing, setProcessing] = useState<string | null>(null);
  const [userStates, setUserStates] = useState<{[key: string]: {
    billingSetup: boolean;
    trialStarted: boolean;
    welcomePackageSent: boolean;
    goLive: boolean;
  }}>({});
  const [expandedUsage, setExpandedUsage] = useState<{[key: string]: boolean}>({});
  const [usageInputs, setUsageInputs] = useState<{[key: string]: string}>({});
  const [expandedActivation, setExpandedActivation] = useState<{[key: string]: boolean}>({});
  const [confirmActivation, setConfirmActivation] = useState<{[key: string]: boolean}>({});
  const [sendingBackToQA, setSendingBackToQA] = useState<string | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  // Sequential workflow handlers
  const handleSetupBilling = async (userId: string, tier: string, userEmail: string, businessName?: string) => {
    setProcessing(userId);
    console.log(`💳 Converting trial to paid ${tier} subscription for user ${userId}`);
    
    try {
      // Import Stripe service
      const { createCheckoutSession } = await import('../../../services/stripeService');
      const { getPlanConfig } = await import('../../../config/stripe');
      
      // Get plan configuration
      const planConfig = getPlanConfig(tier, 'monthly'); // Default to monthly, can be made configurable
      
      // Create checkout session for subscription
      const session = await createCheckoutSession({
        userId: userId,
        email: userEmail,
        tier: tier as 'starter' | 'professional' | 'business',
        cycle: 'monthly',
        businessName: businessName,
        successUrl: `${window.location.origin}/admin?billing_success=true&user_id=${userId}`,
        cancelUrl: `${window.location.origin}/admin?billing_cancelled=true&user_id=${userId}`
      });
      
      console.log('✅ Checkout session created, redirecting to Stripe...');
      
      // Redirect to Stripe Checkout
      window.open(session.url, '_blank');
      
      // Update local state to show billing setup initiated
      setUserStates(prev => ({
        ...prev,
        [userId]: { 
          billingSetup: true,
          trialStarted: prev[userId]?.trialStarted || false,
          welcomePackageSent: prev[userId]?.welcomePackageSent || false,
          goLive: prev[userId]?.goLive || false
        }
      }));
      
      console.log('💳 User redirected to Stripe checkout - billing setup initiated!');
      
    } catch (error) {
      console.error('❌ Error setting up billing:', error);
      alert('Failed to setup billing. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleStartTrial = async (userId: string) => {
    setProcessing(userId);
    console.log(`🚀 Starting 14-day FREE trial for user ${userId} (NO CREDIT CARD REQUIRED)`);
    
    try {
      // Store trial start date in database
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://qkrptazfydtaoyhhczyr.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM'
      );
      
      const trialStartDate = new Date();
      const trialEndDate = new Date(trialStartDate.getTime() + (1 * 60 * 60 * 1000)); // 1 hour from now (TESTING)
      
      const { error } = await supabase
        .from('usage')
        .update({
          status: 'trial',
          trialStartedAt: trialStartDate.toISOString(),
          trialEndsAt: trialEndDate.toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUserStates(prev => ({
        ...prev,
        [userId]: { 
          billingSetup: prev[userId]?.billingSetup || false,
          trialStarted: true,
          welcomePackageSent: prev[userId]?.welcomePackageSent || false,
          goLive: prev[userId]?.goLive || false
        }
      }));
      
      console.log(`✅ 14-day FREE trial started - expires ${trialEndDate.toLocaleDateString()}`);
      
    } catch (error) {
      console.error('❌ Error starting trial:', error);
      alert('Failed to start trial. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleSendWelcomePackage = async (userId: string) => {
    setProcessing(userId);
    console.log(`Sending welcome package to user ${userId}`);
    
    setTimeout(() => {
      setUserStates(prev => ({
        ...prev,
        [userId]: { 
          billingSetup: prev[userId]?.billingSetup || false,
          trialStarted: prev[userId]?.trialStarted || false,
          welcomePackageSent: true,
          goLive: prev[userId]?.goLive || false
        }
      }));
      setProcessing(null);
      console.log('✅ Welcome package sent');
    }, 1500);
  };

  const handleGoLive = async (userId: string) => {
    setProcessing(userId);
    console.log(`Making client portal LIVE for user ${userId}`);
    
    setTimeout(() => {
      setUserStates(prev => ({
        ...prev,
        [userId]: { 
          billingSetup: prev[userId]?.billingSetup || false,
          trialStarted: prev[userId]?.trialStarted || false,
          welcomePackageSent: prev[userId]?.welcomePackageSent || false,
          goLive: true
        }
      }));
      setProcessing(null);
      console.log('🚀 Client portal is now LIVE!');
    }, 2000);
  };

  // Administrative actions with inline confirmations
  const handleSendBackToQA = async (userId: string) => {
    if (onSendBackToQA) {
      setSendingBackToQA(userId);
      try {
        await onSendBackToQA(userId);
      } finally {
        setSendingBackToQA(null);
      }
    }
  };

  const handleDeleteUserClick = async (userId: string) => {
    if (onDeleteUser) {
      setDeletingUser(userId);
      try {
        await onDeleteUser(userId);
      } finally {
        setDeletingUser(null);
      }
    }
  };

  const handleDeactivateUserClick = async (userId: string) => {
    if (onDeactivateUser) {
      setDeactivatingUser(userId);
      try {
        await onDeactivateUser(userId);
      } finally {
        setDeactivatingUser(null);
      }
    }
  };

  const getUserState = (userId: string) => {
    return userStates[userId] || {
      billingSetup: false,
      trialStarted: false,
      welcomePackageSent: false,
      goLive: false
    };
  };

  // Usage Management Functions
  const toggleUsageExpanded = (userId: string) => {
    setExpandedUsage(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleUsageInputChange = (userId: string, value: string) => {
    setUsageInputs(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  const handleResetUsage = async (userId: string) => {
    await onResetUsage(userId);
  };

  const handleAddUsage = async (userId: string, amount: number) => {
    await onAddUsage(userId, amount);
  };

  const handleCustomUsageAdd = async (userId: string) => {
    const inputValue = usageInputs[userId];
    if (!inputValue) return;
    
    const customAmount = parseInt(inputValue);
    if (customAmount > 0) {
      await onAddUsage(userId, customAmount);
      handleUsageInputChange(userId, ''); // Clear input
    }
  };

  const handleUpdateLimit = async (userId: string) => {
    const inputValue = usageInputs[userId];
    if (!inputValue) return;
    
    const newLimit = parseInt(inputValue);
    if (newLimit > 0) {
      await onUpdateLimit(userId, newLimit);
      handleUsageInputChange(userId, ''); // Clear input
    }
  };

  const getUserNotification = (userId: string) => {
    return inlineNotifications[userId];
  };

  // Client Activation Functions
  const toggleActivationExpanded = (userId: string) => {
    setExpandedActivation(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleActivateClient = async (userId: string, userEmail: string, tier: string) => {
    setProcessing(userId);
    console.log(`🚀 ACTIVATING CLIENT: ${userEmail} (${tier} plan)`);
    console.log('📊 Current processing state:', processing);
    
    try {
      // Validate email before proceeding
      if (!userEmail) {
        throw new Error('User email is required for activation');
      }
      
      // Step 1: Send welcome email & start trial
      console.log('📧 Step 1: Sending welcome email and starting 14-day trial...');
      
      // Import EmailJS email service (original setup - 200 emails/month)
      const { sendSimpleWelcomeEmail } = await import('../../../services/welcomeEmailService');
      
      // Send welcome email via EmailJS (200/month limit)
      const businessName = userEmail.split('@')[0]; // Use email prefix as business name fallback
      const emailSent = await sendSimpleWelcomeEmail(
        userEmail, 
        businessName,
        tier
      );
      
      if (!emailSent) {
        console.warn('⚠️ Welcome email failed but continuing activation...');
        // Don't throw error - continue with activation even if email fails
      }
      
      // Step 2: Send welcome package (onboarding materials)
      console.log('📦 Step 2: Sending onboarding materials...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Activate live site
      console.log('🌐 Step 3: Activating live site...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Start 14-day free trial with database tracking
      console.log('⏰ Step 4: Starting 14-day free trial with expiration tracking...');
      
      // Store trial start date in database
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://qkrptazfydtaoyhhczyr.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM'
      );
      
      const trialStartDate = new Date();
      const trialEndDate = new Date(trialStartDate.getTime() + (1 * 60 * 60 * 1000)); // 1 hour from now (TESTING)
      
      const { error } = await supabase
        .from('usage')
        .update({
          status: 'trial',
          trialStartedAt: trialStartDate.toISOString(),
          trialEndsAt: trialEndDate.toISOString(),
          subscriptionTier: tier,
          billingCycle: 'monthly' // Default to monthly
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      console.log(`✅ 14-day FREE trial started - expires ${trialEndDate.toLocaleDateString()}`);
      console.log('💡 User will be prompted for payment when trial expires');
      
      // Update all states to completed (billing will happen when trial expires)
      setUserStates(prev => ({
        ...prev,
        [userId]: { 
          trialStarted: true,
          welcomePackageSent: true,
          goLive: true,
          billingSetup: false // Will be set to true after payment
        }
      }));
      
      // Close the activation panel
      setExpandedActivation(prev => ({
        ...prev,
        [userId]: false
      }));
      
      console.log('✅ CLIENT ACTIVATION COMPLETE! Welcome email sent and all systems automated.');
      
    } catch (error) {
      console.error('❌ Client activation failed:', error);
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to activate client: ${errorMessage}`);
    } finally {
      setProcessing(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Approved Users</h3>
              <p className="text-sm text-gray-500">Live clients using the platform</p>
            </div>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No approved users yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Users will appear here after completing the testing workflow and final approval.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Approved Users</h3>
              <p className="text-sm text-gray-500">
                {users.length} active client{users.length !== 1 ? 's' : ''} • Single-site architecture
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            All clients access: <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              grbalance.netlify.app/{users.length > 0 
                ? (users[0].client_path || 
                   users[0].businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                   users[0].email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client')
                : '[client-name]'
              }
            </code>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {users.map((user) => {
          const usagePercentage = (user.comparisonsUsed / user.comparisonsLimit) * 100;
          const clientPath = user.client_path || 
                            user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                            user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
          const userState = getUserState(user.id);
          const isProcessingUser = processing === user.id;
          
          return (
            <div key={user.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
              {/* User Header Info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{user.businessName || 'Business Name Not Set'}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.subscriptionTier === 'business' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.subscriptionTier === 'professional'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.subscriptionTier}
                    </span>
                  </div>
                </div>
                
                {/* Client Access */}
                <a
                  href={`https://grbalance.netlify.app/${clientPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <span className="font-mono">{clientPath}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* User Details */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {user.email}
                </span>
                <span>•</span>
                <span>Approved {new Date(user.approvedAt || new Date()).toLocaleDateString()}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {user.comparisonsUsed} / {user.comparisonsLimit} comparisons
                    {usagePercentage >= 80 && (
                      <span className="ml-1 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                        {Math.round(usagePercentage)}% used
                      </span>
                    )}
                </span>
              </div>

                {/* Usage Management Toggle */}
                    <button
                  onClick={() => toggleUsageExpanded(user.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium transition-all"
                >
                  <Settings className="h-4 w-4" />
                  Usage Management
                </button>
              </div>

              {/* Usage Management Panel */}
              {expandedUsage[user.id] && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-blue-900">Usage Controls</h5>
                    {getUserNotification(user.id) && (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        getUserNotification(user.id)?.type === 'success' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getUserNotification(user.id)?.message}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <h6 className="text-xs font-medium text-blue-800 uppercase tracking-wide">Quick Actions</h6>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleResetUsage(user.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reset to 0
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddUsage(user.id, 5)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 transition-colors"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleAddUsage(user.id, 10)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 transition-colors"
                          >
                            +10
                          </button>
                    <button
                            onClick={() => handleAddUsage(user.id, 20)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 transition-colors"
                          >
                            +20
                    </button>
                        </div>
                      </div>
                  </div>

                    {/* Custom Add Usage */}
                    <div className="space-y-2">
                      <h6 className="text-xs font-medium text-blue-800 uppercase tracking-wide">Add Usage</h6>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={usageInputs[user.id] || ''}
                          onChange={(e) => handleUsageInputChange(user.id, e.target.value)}
                          className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    <button
                          onClick={() => handleCustomUsageAdd(user.id)}
                          disabled={!usageInputs[user.id] || parseInt(usageInputs[user.id] || '0') <= 0}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                    </button>
                      </div>
                  </div>

                    {/* Update Limit */}
                    <div className="space-y-2">
                      <h6 className="text-xs font-medium text-blue-800 uppercase tracking-wide">Monthly Limit</h6>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder={`Current: ${user.comparisonsLimit}`}
                          value={usageInputs[user.id] || ''}
                          onChange={(e) => handleUsageInputChange(user.id, e.target.value)}
                          className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    <button
                          onClick={() => handleUpdateLimit(user.id)}
                          disabled={!usageInputs[user.id] || parseInt(usageInputs[user.id] || '0') <= 0}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Settings className="h-3 w-3" />
                          Update
                    </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Client Activation Section */}
              <div className="flex items-center justify-between">
                {/* Client Activation Status */}
                {userState.trialStarted && userState.welcomePackageSent && userState.goLive ? (
                  <div className="flex-1">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <h5 className="text-sm font-semibold text-green-900">
                            {userState.billingSetup ? 'Client Activated' : 'Trial Active'}
                          </h5>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {userState.billingSetup ? 'All Systems Live' : '1-Hour Trial Active'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-1 text-green-700">
                          <Mail className="h-3 w-3" />
                          <span>Welcome sent</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-700">
                          <Clock className="h-3 w-3" />
                          <span>1-hour trial active</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-700">
                          <Rocket className="h-3 w-3" />
                          <span>Site live</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-700">
                          <CreditCard className="h-3 w-3" />
                          <span>Auto-billing ready</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleActivationExpanded(user.id)}
                        disabled={isProcessingUser}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg text-sm font-medium shadow-lg hover:from-blue-700 hover:to-emerald-700 transform hover:scale-105 transition-all disabled:opacity-50"
                      >
                        <Rocket className="h-5 w-5" />
                        <span>Activate Client</span>
                      </button>
                      
                      <button
                        onClick={() => toggleActivationExpanded(user.id)}
                        className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md text-sm transition-all"
                      >
                        <span>📋 Review actions</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Administrative Actions (Far Right) */}
                <div className="flex items-center gap-2 ml-8 border-l border-gray-200 pl-6">
                  {onSendBackToQA && (
                    <button
                      onClick={() => setSendingBackToQA(user.id)}
                      disabled={sendingBackToQA === user.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Send to QA</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setDeactivatingUser(user.id)}
                    disabled={deactivatingUser === user.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-amber-600 hover:bg-amber-50 rounded-md text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                  >
                    <UserX className="h-4 w-4" />
                    <span>Deactivate</span>
                  </button>
                  
                  <button
                    onClick={() => setDeletingUser(user.id)}
                    disabled={deletingUser === user.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Activation Confirmation Panel */}
              {expandedActivation[user.id] && (
                <div className="mt-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-amber-600 text-sm font-bold">⚠️</span>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-amber-900">Confirm Client Activation</h5>
                        <p className="text-xs text-amber-700 mt-1">
                          This will start the complete onboarding process for {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h6 className="text-sm font-medium text-gray-900 mb-3">This will automatically:</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span>Send welcome email with login credentials</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span>Start 14-day free trial immediately</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Rocket className="h-4 w-4 text-purple-500" />
                        <span>Activate live site access</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <CreditCard className="h-4 w-4 text-amber-500" />
                        <span>Schedule auto-billing after trial</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleActivationExpanded(user.id)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm transition-all"
                    >
                      Cancel
                    </button>
                    
                    <button
                                                  onClick={() => handleActivateClient(user.id, user.email, (user.subscriptionTier || 'starter') as string)}
                      disabled={isProcessingUser}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg text-sm font-medium shadow-lg hover:from-blue-700 hover:to-emerald-700 transform hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isProcessingUser ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Rocket className="h-4 w-4" />
                      )}
                      <span>{isProcessingUser ? 'Activating...' : '🚀 Yes, Activate Client'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Send Back to QA Confirmation */}
              {sendingBackToQA === user.id && (
                <div className="mt-4 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <ArrowLeft className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-blue-800 font-medium">Send Back to QA Testing</h4>
                        <p className="text-blue-600 text-sm">This will move the user back to the QA testing phase. They can be re-approved later.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSendingBackToQA(null)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSendBackToQA(user.id)}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Yes, Send to QA</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Deactivate User Confirmation */}
              {deactivatingUser === user.id && (
                <div className="mt-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                        <UserX className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-amber-800 font-medium">Deactivate User</h4>
                        <p className="text-amber-600 text-sm">This will deactivate the user's account. They can be reactivated later.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setDeactivatingUser(null)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeactivateUserClick(user.id)}
                      className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-all"
                    >
                      <UserX className="h-4 w-4" />
                      <span>Yes, Deactivate</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Delete User Confirmation */}
              {deletingUser === user.id && (
                <div className="mt-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <h4 className="text-red-800 font-medium">Delete User</h4>
                        <p className="text-red-600 text-sm">This will permanently delete the user. This action cannot be undone.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setDeletingUser(null)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteUserClick(user.id)}
                      className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Yes, Delete</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Total: {users.length} active client{users.length !== 1 ? 's' : ''}
          </span>
          <span>
            Revenue: ${users.length * 30}/month
          </span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.users === nextProps.users &&
    prevProps.isLoading === nextProps.isLoading
  );
});

ApprovedUsersTab.displayName = 'ApprovedUsersTab';

export default ApprovedUsersTab;