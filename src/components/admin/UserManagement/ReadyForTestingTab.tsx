import React, { useState } from 'react';
import { Check, X, Eye, ExternalLink, Globe, Zap, User, Building2, Calendar, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { ReadyForTestingUser, ApprovedUser, TIER_LIMITS } from '../../../types/admin';

interface ReadyForTestingTabProps {
  readyForTestingUsers: ReadyForTestingUser[];
  onFinalApprove: (userId: string, userData: Partial<ApprovedUser>) => Promise<void>;
  onSendBackToPending: (userId: string, reason?: string) => Promise<void>;
  onUpdateTestingUser: (userId: string, updates: Partial<ReadyForTestingUser>) => Promise<void>;
  isLoading: boolean;
}

export default function ReadyForTestingTab({
  readyForTestingUsers,
  onFinalApprove,
  onSendBackToPending,
  onUpdateTestingUser,
  isLoading
}: ReadyForTestingTabProps) {
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<ReadyForTestingUser | null>(null);
  const [testingNotes, setTestingNotes] = useState<{[userId: string]: string}>({});

  const handleFinalApprove = async (user: ReadyForTestingUser) => {
    if (user.qaStatus !== 'passed') {
      alert('Please complete QA testing and mark as passed before final approval.');
      return;
    }
    
    setProcessingUser(user.id);
    try {
      const tierLimit = TIER_LIMITS[user.subscriptionTier as keyof typeof TIER_LIMITS] || 50;
      await onFinalApprove(user.id, {
        email: user.email,
        businessName: user.businessName,
        businessType: user.businessType,
        subscriptionTier: user.subscriptionTier,
        billingCycle: user.billingCycle,
        comparisonsUsed: 0,
        comparisonsLimit: tierLimit,
        status: 'active',
        approvedAt: new Date().toISOString(),
        createdAt: user.createdAt,
        qaPassedAt: user.qaTestedAt || new Date().toISOString()
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const updateQAStatus = async (userId: string, status: 'pending' | 'testing' | 'passed' | 'failed') => {
    setProcessingUser(userId);
    try {
      const updates: Partial<ReadyForTestingUser> = {
        qaStatus: status
      };
      
      if (status === 'passed' || status === 'failed') {
        updates.qaTestedAt = new Date().toISOString();
      }
      
      if (testingNotes[userId]) {
        updates.qaTestingNotes = testingNotes[userId];
      }
      await onUpdateTestingUser(userId, updates);
      setTestingNotes(prev => ({ ...prev, [userId]: '' }));
    } finally {
      setProcessingUser(null);
    }
  };

  const handleSendBack = async (userId: string) => {
    const reason = prompt('Send back to pending? Enter reason:');
    if (reason) {
      setProcessingUser(userId);
      try {
        await onSendBackToPending(userId, reason);
      } finally {
        setProcessingUser(null);
      }
    }
  };

  if (readyForTestingUsers.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready for Testing</h3>
              <p className="text-sm text-gray-500">QA testing and final approval workflow</p>
            </div>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sites ready for testing</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Users will appear here after consultation and script development are complete, with their websites provisioned for your QA testing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready for Testing</h3>
              <p className="text-sm text-gray-500">
                {readyForTestingUsers.length} website{readyForTestingUsers.length !== 1 ? 's' : ''} ready for QA testing
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {readyForTestingUsers.map((user) => {
            const qaStatus = user.qaStatus || 'pending';
            const isQAPassed = qaStatus === 'passed';
            const isProcessing = processingUser === user.id;
            
            return (
              <div key={user.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2.5 bg-slate-100 rounded-xl">
                      <User className="h-5 w-5 text-slate-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900 truncate">{user.email}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.subscriptionTier === 'business' 
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : user.subscriptionTier === 'professional'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {user.subscriptionTier}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{user.businessName}</div>
                            <div className="text-gray-500">{user.businessType}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {new Date(user.readyForTestingAt).toLocaleDateString()}
                            </div>
                            <div className="text-gray-500">{user.billingCycle}</div>
                          </div>
                        </div>
                      </div>

                      {user.siteUrl && (
                        <div className="mb-4">
                          <a
                            href={user.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Test Website: {user.siteUrl}
                          </a>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">QA Status:</span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                            qaStatus === 'passed' 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : qaStatus === 'failed'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : qaStatus === 'testing'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {qaStatus === 'passed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                            {qaStatus === 'failed' && <X className="h-3.5 w-3.5" />}
                            {qaStatus === 'testing' && <Eye className="h-3.5 w-3.5" />}
                            {qaStatus === 'pending' && <Clock className="h-3.5 w-3.5" />}
                            {qaStatus.charAt(0).toUpperCase() + qaStatus.slice(1)}
                          </span>
                        </div>

                        <div>
                          <textarea
                            value={testingNotes[user.id] || user.qaTestingNotes || ''}
                            onChange={(e) => setTestingNotes(prev => ({ ...prev, [user.id]: e.target.value }))}
                            placeholder="Add QA testing notes..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQAStatus(user.id, 'testing')}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                          >
                            Mark Testing
                          </button>
                          <button
                            onClick={() => updateQAStatus(user.id, 'passed')}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
                          >
                            QA Passed
                          </button>
                          <button
                            onClick={() => updateQAStatus(user.id, 'failed')}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            QA Failed
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setViewingUser(user)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleFinalApprove(user)}
                      disabled={isProcessing || isLoading || !isQAPassed}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        isQAPassed
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title={isQAPassed ? "Send billing link - QA approved!" : "Complete QA testing first"}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          {isQAPassed ? 'Send Billing' : 'QA Required'}
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleSendBack(user.id)}
                      disabled={isProcessing || isLoading}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Send Back to Pending"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">QA Testing Details</h3>
                  <p className="text-sm text-gray-500">Website and testing information</p>
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

                {viewingUser.siteUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                    <a
                      href={viewingUser.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {viewingUser.siteUrl}
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">QA Status</label>
                  <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    viewingUser.qaStatus === 'passed' 
                      ? 'bg-emerald-100 text-emerald-700'
                      : viewingUser.qaStatus === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : viewingUser.qaStatus === 'testing'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {viewingUser.qaStatus || 'pending'}
                  </span>
                </div>

                {viewingUser.qaTestingNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Testing Notes</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg whitespace-pre-wrap">
                      {viewingUser.qaTestingNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              {viewingUser.siteUrl && (
                <a
                  href={viewingUser.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Test Website
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 