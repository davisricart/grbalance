import React, { useState } from 'react';
import { ExternalLink, User, Calendar, TrendingUp, CreditCard, Clock, CheckCircle2, Mail, Rocket, Trash2, UserX } from 'lucide-react';
import { ApprovedUser } from '../../../types/admin';

interface ApprovedUsersTabProps {
  users: ApprovedUser[];
  isLoading: boolean;
}

const ApprovedUsersTab = React.memo(({
  users,
  isLoading
}: ApprovedUsersTabProps) => {
  const [processing, setProcessing] = useState<string | null>(null);
  const [userStates, setUserStates] = useState<{[key: string]: {
    billingSetup: boolean;
    trialStarted: boolean;
    welcomePackageSent: boolean;
    goLive: boolean;
  }}>({});

  // Sequential workflow handlers
  const handleSetupBilling = async (userId: string, tier: string) => {
    setProcessing(userId);
    console.log(`💳 Converting trial to paid ${tier} subscription for user ${userId}`);
    
    // Simulate billing setup
    setTimeout(() => {
      setUserStates(prev => ({
        ...prev,
        [userId]: { 
          billingSetup: true,
          trialStarted: prev[userId]?.trialStarted || false,
          welcomePackageSent: prev[userId]?.welcomePackageSent || false,
          goLive: prev[userId]?.goLive || false
        }
      }));
      setProcessing(null);
      console.log('✅ Trial converted to paid subscription - billing active!');
    }, 2000);
  };

  const handleStartTrial = async (userId: string) => {
    setProcessing(userId);
    console.log(`🚀 Starting 14-day FREE trial for user ${userId} (NO CREDIT CARD REQUIRED)`);
    
    setTimeout(() => {
      setUserStates(prev => ({
        ...prev,
        [userId]: { 
          billingSetup: prev[userId]?.billingSetup || false,
          trialStarted: true,
          welcomePackageSent: prev[userId]?.welcomePackageSent || false,
          goLive: prev[userId]?.goLive || false
        }
      }));
      setProcessing(null);
      console.log('✅ 14-day FREE trial started - client has immediate access!');
    }, 1500);
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

  // Administrative actions
  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      console.log(`Deleting user ${userId}`);
      // TODO: Implement delete functionality
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (confirm('Are you sure you want to deactivate this user?')) {
      console.log(`Deactivating user ${userId}`);
      // TODO: Implement deactivate functionality
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
            All clients access: <code className="bg-gray-100 px-2 py-1 rounded text-xs">grbalance.netlify.app/clientname</code>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {users.map((user) => {
          const usagePercentage = (user.comparisonsUsed / user.comparisonsLimit) * 100;
          const clientPath = user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
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
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
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
                </span>
              </div>

              {/* Sequential Workflow Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  
                  {/* Step 1: Start 14-Day Trial (NO CREDIT CARD) */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleStartTrial(user.id)}
                      disabled={isProcessingUser || userState.trialStarted}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        userState.trialStarted
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:scale-105 disabled:opacity-50'
                      }`}
                    >
                      {isProcessingUser && !userState.trialStarted ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : userState.trialStarted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      {userState.trialStarted ? '14-Day Trial' : 'Start Trial'}
                    </button>
                    <span className="text-xs text-gray-500 mt-1">Step 1</span>
                  </div>

                  {/* Step 2: Send Welcome Package */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleSendWelcomePackage(user.id)}
                      disabled={!userState.trialStarted || isProcessingUser || userState.welcomePackageSent}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        userState.welcomePackageSent
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : userState.trialStarted
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:scale-105'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isProcessingUser && userState.trialStarted && !userState.welcomePackageSent ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : userState.welcomePackageSent ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      {userState.welcomePackageSent ? 'Package Sent' : 'Send Welcome'}
                    </button>
                    <span className="text-xs text-gray-500 mt-1">Step 2</span>
                  </div>

                  {/* Step 3: Go Live */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleGoLive(user.id)}
                      disabled={!userState.welcomePackageSent || isProcessingUser || userState.goLive}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        userState.goLive
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : userState.welcomePackageSent
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:scale-105'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isProcessingUser && userState.welcomePackageSent && !userState.goLive ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : userState.goLive ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Rocket className="h-4 w-4" />
                      )}
                      {userState.goLive ? 'Live' : 'Go Live'}
                    </button>
                    <span className="text-xs text-gray-500 mt-1">Step 3</span>
                  </div>

                  {/* Step 4: Setup Billing (At Trial End) */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleSetupBilling(user.id, user.subscriptionTier || 'starter')}
                      disabled={!userState.goLive || isProcessingUser || userState.billingSetup}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        userState.billingSetup
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : userState.goLive
                          ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm hover:scale-105'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isProcessingUser && userState.goLive && !userState.billingSetup ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : userState.billingSetup ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      {userState.billingSetup ? 'Billing Active' : 'Setup Billing'}
                    </button>
                    <span className="text-xs text-gray-500 mt-1">Step 4</span>
                  </div>

                </div>

                {/* Administrative Actions (Far Right) */}
                <div className="flex items-center gap-2 ml-8 border-l border-gray-200 pl-6">
                  <button
                    onClick={() => handleDeactivateUser(user.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-amber-600 hover:bg-amber-50 rounded-md text-sm font-medium transition-all hover:scale-105"
                  >
                    <UserX className="h-4 w-4" />
                    <span>Deactivate</span>
                  </button>
                  
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-all hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Onboarding Progress</span>
                  <span className="text-sm text-gray-500">
                    {Object.values(userState).filter(Boolean).length} of 4 completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(Object.values(userState).filter(Boolean).length / 4) * 100}%` 
                    }}
                  />
                </div>
              </div>
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