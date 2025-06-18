import React, { useState } from 'react';
import { ExternalLink, User, Calendar, TrendingUp, CreditCard, Clock, CheckCircle2 } from 'lucide-react';
import { ApprovedUser } from '../../../types/admin';

interface ApprovedUsersTabProps {
  users: ApprovedUser[];
  isLoading: boolean;
}

const ApprovedUsersTab = React.memo(({
  users,
  isLoading
}: ApprovedUsersTabProps) => {
  const [activatingBilling, setActivatingBilling] = useState<string | null>(null);

  const handleActivateBilling = async (userId: string, tier: string) => {
    setActivatingBilling(userId);
    // TODO: Implement Stripe billing activation when ready
    console.log(`Would activate ${tier} billing for user ${userId}`);
    
    // Simulate API call
    setTimeout(() => {
      setActivatingBilling(null);
      alert('Billing activation ready! (Stripe integration pending)');
    }, 2000);
  };

  const getBillingStatus = (user: ApprovedUser) => {
    // Mock billing status for preview
    if (user.email?.includes('demo')) return 'trial';
    if (user.comparisonsUsed > 50) return 'active';
    return 'pending';
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
          const billingStatus = getBillingStatus(user);
          const isActivating = activatingBilling === user.id;
          
          return (
            <div key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    {/* User Info */}
                    <div className="flex-1">
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
                        {/* Billing Status Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          billingStatus === 'active' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : billingStatus === 'trial'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {billingStatus === 'active' && <CheckCircle2 className="h-3 w-3" />}
                          {billingStatus === 'trial' && <Clock className="h-3 w-3" />}
                          {billingStatus === 'pending' && <CreditCard className="h-3 w-3" />}
                          {billingStatus === 'active' ? 'Billing Active' : billingStatus === 'trial' ? '14-Day Trial' : 'Billing Pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {user.email}
                        </span>
                        <span>•</span>
                        <span>Approved {new Date(user.approvedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {user.comparisonsUsed} / {user.comparisonsLimit}
                          </span>
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              usagePercentage > 80 
                                ? 'bg-red-500' 
                                : usagePercentage > 60 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Client URL */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Client Access</div>
                        <a
                          href={`https://grbalance.netlify.app/${clientPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          <span>/</span>
                          <span className="font-mono">{clientPath}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      {/* Billing Action */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Billing</div>
                        {billingStatus === 'pending' ? (
                          <button
                            onClick={() => handleActivateBilling(user.id, user.subscriptionTier)}
                            disabled={isActivating}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {isActivating ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Starting...</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-3 w-3" />
                                <span>Start Trial</span>
                              </>
                            )}
                          </button>
                        ) : billingStatus === 'trial' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                            <Clock className="h-3 w-3" />
                            <span>Day 7 of 14</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-md text-sm font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>${user.subscriptionTier === 'business' ? '49' : user.subscriptionTier === 'professional' ? '29' : '19'}/mo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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