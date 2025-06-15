import React, { useState } from 'react';
import { Check, X, Eye, Clock, AlertTriangle, User, Building2, Calendar, CheckCircle2, Settings, Zap } from 'lucide-react';
import { PendingUser, ReadyForTestingUser, TIER_LIMITS, TIER_PRICING } from '../../../types/admin';

interface PendingUsersTabProps {
  pendingUsers: PendingUser[];
  onMoveToTesting: (userId: string, userData: Partial<ReadyForTestingUser>) => Promise<void>;
  onRejectUser: (userId: string, reason?: string) => Promise<void>;
  onUpdatePendingUser: (userId: string, updates: Partial<PendingUser>) => Promise<void>;
  isLoading: boolean;
}

export default function PendingUsersTab({
  pendingUsers,
  onMoveToTesting,
  onRejectUser,
  onUpdatePendingUser,
  isLoading
}: PendingUsersTabProps) {
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<PendingUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [approvingUser, setApprovingUser] = useState<string | null>(null);

  const handleMoveToTesting = async (user: PendingUser) => {
    setProcessingUser(user.id);
    try {
      await onMoveToTesting(user.id, {
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        businessType: user.businessType,
        subscriptionTier: user.subscriptionTier,
        billingCycle: user.billingCycle,
        createdAt: user.createdAt,
        readyForTestingAt: new Date().toISOString(),
        qaStatus: 'pending',
        websiteProvisioned: false,
        scriptDeployed: false
      });
    } finally {
      setProcessingUser(null);
      setApprovingUser(null);
    }
  };

  const toggleConsultation = async (userId: string, field: 'consultationCompleted' | 'scriptReady', currentValue: boolean) => {
    setProcessingUser(userId);
    try {
      await onUpdatePendingUser(userId, { [field]: !currentValue });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleReject = async (userId: string, reason?: string) => {
    setProcessingUser(userId);
    try {
      await onRejectUser(userId, reason || undefined);
    } finally {
      setProcessingUser(null);
      setDeletingUser(null);
    }
  };

  if (pendingUsers.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Clock className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
              <p className="text-sm text-gray-500">Review and manage consultation workflow</p>
            </div>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            No pending user approvals at the moment. New registrations will appear here for review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
                <p className="text-sm text-gray-500">
                  {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} awaiting consultation completion
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {pendingUsers.map((user) => {
            const isReady = user.consultationCompleted && user.scriptReady;
            const isProcessing = processingUser === user.id;
            
            return (
              <div key={user.id} className="p-4 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-b-0">
                <div className="flex items-center justify-between gap-6">
                  {/* User Info - Compact */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate text-sm">{user.email}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          user.subscriptionTier === 'business' 
                            ? 'bg-purple-100 text-purple-700'
                            : user.subscriptionTier === 'professional'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {user.subscriptionTier}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <span className="truncate">{user.businessName}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="font-medium text-green-600">
                            ${user.billingCycle === 'annual' 
                              ? TIER_PRICING[user.subscriptionTier as keyof typeof TIER_PRICING]?.annual || 0
                              : TIER_PRICING[user.subscriptionTier as keyof typeof TIER_PRICING]?.monthly || 0
                            }/{user.billingCycle === 'annual' ? 'mo' : 'mo'}
                          </span>
                          {user.billingCycle === 'annual' && (
                            <span className="text-green-500 font-medium">📅</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Status - Compact Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleConsultation(user.id, 'consultationCompleted', user.consultationCompleted || false)}
                      disabled={isProcessing}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                        user.consultationCompleted 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' 
                          : 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
                      }`}
                      title="Click to toggle consultation status"
                    >
                      {user.consultationCompleted ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      <span className="hidden sm:inline">
                        {user.consultationCompleted ? 'Consult' : 'Pending'}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => toggleConsultation(user.id, 'scriptReady', user.scriptReady || false)}
                      disabled={isProcessing}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                        user.scriptReady 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' 
                          : 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
                      }`}
                      title="Click to toggle script ready status"
                    >
                      {user.scriptReady ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Settings className="h-3 w-3" />
                      )}
                      <span className="hidden sm:inline">
                        {user.scriptReady ? 'Script' : 'Building'}
                      </span>
                    </button>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            isReady ? 'bg-emerald-500' : user.consultationCompleted || user.scriptReady ? 'bg-amber-400' : 'bg-gray-300'
                          }`}
                          style={{ 
                            width: `${isReady ? 100 : (user.consultationCompleted ? 50 : 0) + (user.scriptReady ? 50 : 0)}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-medium min-w-0">
                        {(user.consultationCompleted ? 1 : 0) + (user.scriptReady ? 1 : 0)}/2
                      </span>
                    </div>
                  </div>

                  {/* Actions - Compact */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setApprovingUser(user.id)}
                      disabled={!isReady || isProcessing}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 ${
                        isReady && !isProcessing
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={isReady ? 'Move to Testing stage - consultation and script ready' : 'Complete consultation and script development first'}
                    >
                      <Zap className="h-3 w-3" />
                      <span className="hidden sm:inline">To Testing</span>
                    </button>
                    
                    <button
                      onClick={() => setViewingUser(user)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    
                    <button
                      onClick={() => setDeletingUser(user.id)}
                      disabled={isProcessing || isLoading}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Reject User"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                {/* Inline Confirmation for Deletion */}
                {deletingUser === user.id && (
                  <div className="bg-red-50 border-t border-red-200 p-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-red-900">Confirm Rejection</h4>
                          <p className="text-sm text-red-700">Are you sure you want to reject this user? This action cannot be undone.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDeletingUser(null)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(user.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? 'Rejecting...' : 'Reject User'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Confirmation for Approval */}
                {approvingUser === user.id && (
                  <div className="bg-blue-50 border-t border-blue-200 p-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Zap className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">Move to Testing Stage</h4>
                          <p className="text-sm text-blue-700">
                            Ready to move {user.email} to testing stage? 
                            <span className="font-medium"> In Testing, their website will be provisioned and scripts deployed for QA testing.</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setApprovingUser(null)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleMoveToTesting(user)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? 'Moving...' : 'Move to Testing'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                  <p className="text-sm text-gray-500">Registration information</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingUser.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingUser.businessName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingUser.businessType}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Tier</label>
                    <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                      viewingUser.subscriptionTier === 'business' 
                        ? 'bg-purple-100 text-purple-700'
                        : viewingUser.subscriptionTier === 'professional'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {viewingUser.subscriptionTier}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingUser.billingCycle}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {new Date(viewingUser.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Consultation Status in Modal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Consultation Status</label>
                  <div className="flex gap-3">
                    <div className={`flex-1 p-3 rounded-lg border ${
                      viewingUser.consultationCompleted 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {viewingUser.consultationCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600" />
                        )}
                        <span className="text-sm font-medium">Consultation</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {viewingUser.consultationCompleted ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                    
                    <div className={`flex-1 p-3 rounded-lg border ${
                      viewingUser.scriptReady 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {viewingUser.scriptReady ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Settings className="h-4 w-4 text-amber-600" />
                        )}
                        <span className="text-sm font-medium">Script</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {viewingUser.scriptReady ? 'Ready' : 'Building'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleMoveToTesting(viewingUser);
                  setViewingUser(null);
                }}
                disabled={processingUser === viewingUser.id || isLoading || !viewingUser.consultationCompleted || !viewingUser.scriptReady}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {viewingUser.consultationCompleted && viewingUser.scriptReady ? 'Move to Testing' : 'Not Ready'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 