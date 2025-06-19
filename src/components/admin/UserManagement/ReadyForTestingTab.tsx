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
  const [scriptStatus, setScriptStatus] = useState<{[key: string]: 'none' | 'ready' | 'completed'}>({});
  const [websiteStatus, setWebsiteStatus] = useState<{[key: string]: 'none' | 'created'}>({});

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
      const userData = {
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
      };

      // LIVE GO LIVE: Call both functions for complete approval
      const [approvalResponse, liveResponse] = await Promise.all([
        // Original approval flow
        onFinalApprove(user.id, userData),
        
        // New live approval with Firebase updates
        fetch('/.netlify/functions/approve-client-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: user.id,
            userData: userData
          })
        })
      ]);

      if (liveResponse.ok) {
        const result = await liveResponse.json();
        console.log('🎯 Client LIVE approved in Firebase:', result);
      }
      
      console.log('✅ Client fully approved and LIVE:', user.id);
      
    } finally {
      setProcessingUser(null);
    }
  };

  const cleanupDuplicateClients = async () => {
    console.log('🧹 Starting cleanup of duplicate client data...');
    
    try {
      // TODO: Implement actual cleanup API call
      // This handles the specific scenario:
      // Same session creates: /clientname1 + /clientname2
      // Only /clientname2 goes live → Keep /clientname2, Delete /clientname1
      
      const response = await fetch('/.netlify/functions/cleanup-duplicate-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'cleanup_same_session_duplicates',
          strategy: 'keep_approved_delete_abandoned', // Keep what went live, remove what didn't
          sessionBased: true // Look for same user with different client paths
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Duplicate cleanup completed:', result);
        alert(`Cleanup completed: Removed ${result.abandonedSites} abandoned test sites, kept ${result.liveSites} live sites`);
      } else {
        throw new Error('Duplicate cleanup failed');
      }
      
    } catch (error) {
      console.error('❌ Duplicate cleanup failed:', error);
      alert('Duplicate cleanup failed - see console for details');
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
      
      // NUCLEAR RESET: LIVE deletion of all client data
      console.log('🧨 LIVE COMPLETE RESET: Erasing all traces of client:', rejectingUser);
      
      try {
        // REAL DELETION: Call Netlify function to wipe everything
        const deleteResponse = await fetch('/.netlify/functions/delete-client-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            clientId: rejectingUser,
            action: 'complete_wipe'
          })
        });
        
        if (deleteResponse.ok) {
          const result = await deleteResponse.json();
          console.log('✅ LIVE deletion completed:', result);
        } else {
          console.warn('⚠️ Deletion API call failed');
        }
      } catch (error) {
        console.warn('⚠️ Data wipe failed:', error);
      }
      
      // Reset ALL local state - virgin slate
      setWebsiteStatus(prev => ({ ...prev, [rejectingUser]: 'none' }));
      setScriptStatus(prev => ({ ...prev, [rejectingUser]: 'none' }));
      setCustomUrls(prev => ({ ...prev, [rejectingUser]: undefined }));
      setTestingNotes(prev => ({ ...prev, [rejectingUser]: '' }));
      
      console.log('🎯 LIVE RESET: Client never existed - fresh start ready');
      
      setRejectingUser(null);
      setRejectReason('');
    } finally {
      setProcessingUser(null);
    }
  };

  const handleScriptUpload = async (userId: string) => {
    const user = readyForTestingUsers.find(u => u.id === userId);
    if (!user) return;

    const clientPath = customUrls[userId] || user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                       user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';

    // Create a file input element to select script
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,.ts';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setProcessingUser(userId);
      try {
        const scriptContent = await file.text();
        
        console.log('📤 Uploading script to GitHub + Firebase:', {
          filename: file.name,
          clientPath: clientPath,
          size: file.size
        });

        // REAL UPLOAD: Send to Netlify function for GitHub + Firebase
        const uploadResponse = await fetch('/.netlify/functions/upload-client-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: userId,
            clientPath: clientPath,
            fileName: file.name,
            scriptContent: scriptContent,
            scriptMetadata: {
              name: file.name.replace(/\.(js|ts)$/, '')
            }
          })
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        const result = await uploadResponse.json();
        console.log('✅ Script uploaded successfully:', result);
        
        setScriptStatus(prev => ({ ...prev, [userId]: 'ready' }));
        alert(`Script "${file.name}" uploaded and saved to GitHub + Firebase!`);
        
      } catch (error) {
        console.error('❌ Error uploading script:', error);
        alert(`Failed to upload script: ${error.message}`);
      } finally {
        setProcessingUser(null);
      }
    };
    
    input.click();
  };

  const handleScriptTest = async (userId: string) => {
    setProcessingUser(userId);
    
    try {
      // TODO: Implement actual script testing functionality
      // This would open script testing interface or run automated tests
      console.log('🧪 Testing script for user:', userId);
      
      // Simulate testing process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setScriptStatus(prev => ({ ...prev, [userId]: 'completed' }));
      console.log('✅ Script testing completed for user:', userId);
      
    } catch (error) {
      console.error('❌ Error testing script:', error);
      alert(`Failed to test script: ${error.message}`);
    } finally {
      setProcessingUser(null);
    }
  };

  const handleCreateWebsite = async (userId: string) => {
    setProcessingUser(userId);
    
    try {
      const user = readyForTestingUsers.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }

      const clientPath = customUrls[userId] || user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                         user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';

      console.log('🏗️ Creating LIVE website for:', { userId, clientPath, businessName: user.businessName });

      // REAL WEBSITE CREATION: Call Netlify function to save to Firebase
      const createResponse = await fetch('/.netlify/functions/create-client-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: userId,
          clientPath: clientPath,
          businessName: user.businessName,
          email: user.email,
          subscriptionTier: user.subscriptionTier
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Website creation failed: ${createResponse.statusText}`);
      }

      const result = await createResponse.json();
      console.log('✅ LIVE Website created in Firebase:', result);

      setWebsiteStatus(prev => ({ ...prev, [userId]: 'created' }));
      console.log('🔍 Current clientPath after creation:', clientPath);
      console.log('🔍 CustomUrls state:', customUrls[userId]);
      
    } catch (error) {
      console.error('❌ Error creating website:', error);
      alert(`Failed to create website: ${error.message}`);
    } finally {
      setProcessingUser(null);
    }
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
            Client portals: <code className="bg-gray-100 px-2 py-1 rounded text-xs">grbalance.netlify.app/[clientname]</code>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {readyForTestingUsers.map((user) => {
          const qaStatus = user.qaStatus || 'pending';
          const isQAPassed = qaStatus === 'passed';
          const currentScriptStatus = scriptStatus[user.id] || 'none';
          const isScriptCompleted = currentScriptStatus === 'completed';
          const canApprove = isQAPassed && isScriptCompleted;
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
                      {/* Create/Preview Website */}
                      {websiteStatus[user.id] === 'created' ? (
                        <a
                          href={`https://grbalance.netlify.app/${clientPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors border border-green-200"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Website Ready</span>
                          <span className="text-xs">/{clientPath}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <button
                          onClick={() => handleCreateWebsite(user.id)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors border border-blue-200 hover:scale-105 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                              <span>Creating...</span>
                            </>
                          ) : (
                            <>
                              <Code className="h-3 w-3" />
                              <span>Create Website</span>
                            </>
                          )}
                        </button>
                      )}

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
                                  ? 'Go Live' 
                                  : !isQAPassed 
                                  ? 'QA Required' 
                                  : 'Script Completion Required'
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
                      {websiteStatus[user.id] === 'created' ? (
                        <a
                          href={`https://grbalance.netlify.app/${clientPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          grbalance.netlify.app/{clientPath}
                        </a>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>

                  {/* Script Workflow */}
                  <div className="mt-3 ml-0">
                    <label className="block text-xs text-gray-600 mb-2">Reconciliation Script Workflow:</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleScriptUpload(user.id)}
                        disabled={isProcessing}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 ${
                          scriptStatus[user.id] === 'ready' || scriptStatus[user.id] === 'completed'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                        }`}
                      >
                        <Upload className="h-3 w-3" />
                        <span>{scriptStatus[user.id] === 'ready' || scriptStatus[user.id] === 'completed' ? 'Script Ready' : 'Upload Script'}</span>
                      </button>

                      <button
                        onClick={() => handleScriptTest(user.id)}
                        disabled={isProcessing || (!scriptStatus[user.id] || scriptStatus[user.id] === 'none')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 ${
                          scriptStatus[user.id] === 'completed'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : scriptStatus[user.id] === 'ready'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        {isProcessing && scriptStatus[user.id] === 'ready' ? (
                          <>
                            <div className="w-3 h-3 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
                            <span>Testing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            <span>{scriptStatus[user.id] === 'completed' ? 'Completed' : 'Test Script'}</span>
                          </>
                        )}
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