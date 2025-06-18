import React, { useState } from 'react';
import { CheckCircle2, Clock, Eye, AlertCircle, ExternalLink, User, MessageSquare, Upload, Code, Play, CheckCircle } from 'lucide-react';
import { ReadyForTestingUser } from '../../../types/admin';

interface ReadyForTestingTabProps {
  readyForTestingUsers: ReadyForTestingUser[];
  onFinalApprove: (userId: string, userData: any) => Promise<void>;
  onSendBackToPending: (userId: string, reason: string) => Promise<void>;
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
  const [testingNotes, setTestingNotes] = useState<{[key: string]: string}>({});
  const [rejectingUser, setRejectingUser] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [customUrls, setCustomUrls] = useState<{[key: string]: string}>({});
  const [scriptStatus, setScriptStatus] = useState<{[key: string]: 'none' | 'uploaded' | 'tested' | 'deployed'}>({});

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

  const handleFinalApprove = async (user: ReadyForTestingUser) => {
    setProcessingUser(user.id);
    try {
      await onFinalApprove(user.id, {
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        businessType: user.businessType,
        subscriptionTier: user.subscriptionTier,
        billingCycle: user.billingCycle,
        comparisonsUsed: 0,
        comparisonsLimit: 100,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        createdAt: user.createdAt
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const handleSendBack = (userId: string) => {
    setRejectingUser(userId);
    setRejectReason('');
  };

  const confirmSendBack = async () => {
    if (!rejectingUser || !rejectReason.trim()) return;
    
    setProcessingUser(rejectingUser);
    try {
      await onSendBackToPending(rejectingUser, rejectReason);
      setRejectingUser(null);
      setRejectReason('');
    } finally {
      setProcessingUser(null);
    }
  };

  const handleScriptUpload = async (userId: string) => {
    // TODO: Implement script upload functionality
    setScriptStatus(prev => ({ ...prev, [userId]: 'uploaded' }));
    console.log('Script upload for user:', userId);
  };

  const handleScriptTest = async (userId: string) => {
    // TODO: Implement script testing functionality
    setScriptStatus(prev => ({ ...prev, [userId]: 'tested' }));
    console.log('Script test for user:', userId);
  };

  const handleScriptDeploy = async (userId: string) => {
    // TODO: Implement script deployment functionality
    setScriptStatus(prev => ({ ...prev, [userId]: 'deployed' }));
    console.log('Script deploy for user:', userId);
  };

  if (readyForTestingUsers.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">QA Testing</h3>
              <p className="text-sm text-gray-500">Internal testing before client approval</p>
            </div>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sites ready for testing</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Users will appear here after consultation and script development are complete.
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">QA Testing</h3>
              <p className="text-sm text-gray-500">
                {readyForTestingUsers.length} client{readyForTestingUsers.length !== 1 ? 's' : ''} ready for internal testing
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Client portals: <code className="bg-gray-100 px-2 py-1 rounded text-xs">grbalance.netlify.app/clientname</code>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {readyForTestingUsers.map((user) => {
          const qaStatus = user.qaStatus || 'pending';
          const isQAPassed = qaStatus === 'passed';
          const currentScriptStatus = scriptStatus[user.id] || 'none';
          const isScriptDeployed = currentScriptStatus === 'deployed';
          const canApprove = isQAPassed && isScriptDeployed;
          const isProcessing = processingUser === user.id;
          const defaultPath = user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                            user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
          const clientPath = customUrls[user.id] || defaultPath;

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
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{user.email}</span>
                        <span>•</span>
                        <span>Ready {new Date(user.readyForTestingAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* QA Status & Actions */}
                    <div className="flex items-center gap-3">
                      {/* Client Portal Link */}
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

                      {/* QA Status Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQAStatus(user.id, qaStatus === 'testing' ? 'passed' : 'testing')}
                          disabled={isProcessing}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 ${
                            qaStatus === 'passed' 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                              : qaStatus === 'testing'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {qaStatus === 'passed' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>QA Passed</span>
                            </>
                          ) : qaStatus === 'testing' ? (
                            <>
                              <Eye className="h-3 w-3" />
                              <span>Testing</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>Start QA</span>
                            </>
                          )}
                        </button>

                        {qaStatus !== 'pending' && (
                          <button
                            onClick={() => updateQAStatus(user.id, 'failed')}
                            disabled={isProcessing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition-all hover:scale-105 disabled:opacity-50"
                          >
                            <AlertCircle className="h-3 w-3" />
                            <span>Fail</span>
                          </button>
                        )}
                      </div>

                      {/* Final Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFinalApprove(user)}
                          disabled={isProcessing || !canApprove}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            canApprove
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md hover:scale-105'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Approving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>
                                {canApprove 
                                  ? 'Approve' 
                                  : !isQAPassed 
                                  ? 'QA Required' 
                                  : 'Script Required'
                                }
                              </span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleSendBack(user.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all hover:scale-105 disabled:opacity-50"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Send Back</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Client Portal URL */}
                  <div className="mt-3 ml-0">
                    <label className="block text-xs text-gray-600 mb-1">Client Portal URL:</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">grbalance.netlify.app/</span>
                      <input
                        type="text"
                        value={customUrls[user.id] !== undefined ? customUrls[user.id] : defaultPath}
                        onChange={(e) => setCustomUrls(prev => ({ ...prev, [user.id]: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                        placeholder="Enter client business name here..."
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                        onFocus={(e) => {
                          // Clear the field on first focus if it's still the default
                          if (customUrls[user.id] === undefined) {
                            setCustomUrls(prev => ({ ...prev, [user.id]: '' }));
                          }
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Client logs in here → gets their branded reconciliation portal</div>
                  </div>

                  {/* Script Workflow */}
                  <div className="mt-3 ml-0">
                    <label className="block text-xs text-gray-600 mb-2">Reconciliation Script Workflow:</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleScriptUpload(user.id)}
                        disabled={isProcessing}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 ${
                          scriptStatus[user.id] === 'uploaded' || scriptStatus[user.id] === 'tested' || scriptStatus[user.id] === 'deployed'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                        }`}
                      >
                        <Upload className="h-3 w-3" />
                        <span>{scriptStatus[user.id] === 'uploaded' || scriptStatus[user.id] === 'tested' || scriptStatus[user.id] === 'deployed' ? 'Script Ready' : 'Upload Script'}</span>
                      </button>

                      <button
                        onClick={() => handleScriptTest(user.id)}
                        disabled={isProcessing || (!scriptStatus[user.id] || scriptStatus[user.id] === 'none')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 ${
                          scriptStatus[user.id] === 'tested' || scriptStatus[user.id] === 'deployed'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : scriptStatus[user.id] === 'uploaded'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        <Play className="h-3 w-3" />
                        <span>{scriptStatus[user.id] === 'tested' || scriptStatus[user.id] === 'deployed' ? 'Script Tested' : 'Test Script'}</span>
                      </button>

                      <button
                        onClick={() => handleScriptDeploy(user.id)}
                        disabled={isProcessing || scriptStatus[user.id] !== 'tested'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 ${
                          scriptStatus[user.id] === 'deployed'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : scriptStatus[user.id] === 'tested'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        <Code className="h-3 w-3" />
                        <span>{scriptStatus[user.id] === 'deployed' ? 'Script Live' : 'Deploy Script'}</span>
                      </button>
                    </div>
                  </div>

                  {/* QA Notes */}
                  <div className="mt-3 ml-0">
                    <textarea
                      value={testingNotes[user.id] || user.qaTestingNotes || ''}
                      onChange={(e) => setTestingNotes(prev => ({ ...prev, [user.id]: e.target.value }))}
                      placeholder="Add QA testing notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs resize-none focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Inline Rejection Form */}
              {rejectingUser === user.id && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-red-100 rounded-lg flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-red-800 mb-2">Send Back to Pending</h5>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Explain what needs to be fixed..."
                        className="w-full px-3 py-2 text-sm border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={confirmSendBack}
                          disabled={!rejectReason.trim() || isProcessing}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Send Back
                        </button>
                        <button
                          onClick={() => setRejectingUser(null)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
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
            {readyForTestingUsers.filter(u => u.qaStatus === 'passed').length} of {readyForTestingUsers.length} passed QA
          </span>
          <span>
            Single-site testing workflow
          </span>
        </div>
      </div>
    </div>
  );
} 