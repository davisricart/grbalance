import React, { useState } from 'react';
import { Check, X, Eye, ExternalLink, Globe, Zap, User, Building2, Calendar, CheckCircle2, AlertTriangle, Clock, Settings, Plus } from 'lucide-react';
import { ReadyForTestingUser, ApprovedUser, TIER_LIMITS } from '../../../types/admin';
import axios from 'axios';

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
  const [testingNotes, setTestingNotes] = useState<{[key: string]: string}>({});
  const [provisioning, setProvisioning] = useState<{[key: string]: boolean}>({});
  const [rejectingUser, setRejectingUser] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [creatingWebsiteFor, setCreatingWebsiteFor] = useState<string | null>(null);
  const [customSiteName, setCustomSiteName] = useState('');
  const [approvalErrors, setApprovalErrors] = useState<{[key: string]: string}>({});

  // Website provisioning function
  const generateSiteName = (user: ReadyForTestingUser, customName?: string) => {
    // Standard naming format: businessname-grbalance
    const baseName = customName || 
                     user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 
                     user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
                     'client-site';
    
    // Clean and standardize
    const cleanName = baseName.replace(/[-]+/g, '-').replace(/^-|-$/g, '');
    return `${cleanName}-grbalance`;
  };

  const handleCreateWebsite = (user: ReadyForTestingUser) => {
    // Show inline website creation form
    setCreatingWebsiteFor(user.id);
    setCustomSiteName(generateSiteName(user));
  };

  const provisionWebsite = async (user: ReadyForTestingUser, customSiteName?: string) => {
    console.log('🚀 provisionWebsite called for user:', user.id, 'with siteName:', customSiteName);
    
    // Check if already provisioned
    if (user.websiteProvisioned && user.siteUrl) {
      console.log('Website already provisioned for user:', user.id, 'URL:', user.siteUrl);
      // Close the creation form since website exists
      setCreatingWebsiteFor(null);
      setCustomSiteName('');
      return;
    }

    console.log('📝 Setting provisioning state to true for user:', user.id);
    setProvisioning(prev => ({ ...prev, [user.id]: true }));
    
    try {
      // Use standardized naming format: businessname-grbalance
      const siteName = customSiteName || generateSiteName(user);
      const businessName = user.businessName || user.email || user.id;
      
      // Check if we're in development mode
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        // Mock provisioning for development with proper format
        console.log('🧪 Development mode - creating mock site:', siteName);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const mockSiteUrl = `https://${siteName}.netlify.app`;
        const mockSiteId = `mock-site-${Date.now()}`;
        
        console.log('💾 Updating user data with mock website:', mockSiteUrl);
        // Update user data with provisioned website
        await onUpdateTestingUser(user.id, {
          websiteProvisioned: true,
          siteUrl: mockSiteUrl,
          siteId: mockSiteId,
          siteName: siteName,
          websiteProvisionedAt: new Date().toISOString()
        });
        
        console.log('✅ Mock website created successfully');
        // Clear creation form
        setCreatingWebsiteFor(null);
        setCustomSiteName('');
        
      } else {
        // Production mode - use real Netlify API with name checking
        const res = await axios.post(
          '/.netlify/functions/provision-client',
          JSON.stringify({
            clientId: siteName.replace('-grbalance', ''), // Remove suffix for clientId
            clientName: businessName,
            siteName: siteName, // Full standardized site name
            checkAvailability: true // Flag to check name availability first
          }),
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        // Update user data with actual Netlify deployment info
        await onUpdateTestingUser(user.id, {
          websiteProvisioned: true,
          siteUrl: res.data.siteUrl,
          siteId: res.data.siteId,
          siteName: res.data.siteName,
          websiteProvisionedAt: new Date().toISOString()
        });
        
        // Clear creation form
        setCreatingWebsiteFor(null);
        setCustomSiteName('');
      }
      
    } catch (error) {
      console.error('❌ Website provisioning failed for user', user.id, ':', error);
      // Update with error status
      await onUpdateTestingUser(user.id, {
        websiteProvisioned: false
      });
    } finally {
      console.log('🔄 Clearing provisioning state for user:', user.id);
      setProvisioning(prev => ({ ...prev, [user.id]: false }));
    }
  };

  const handleFinalApprove = async (user: ReadyForTestingUser) => {
    console.log('🎯 handleFinalApprove called for user:', user.id, user.email);
    
    // Clear any previous errors for this user
    setApprovalErrors(prev => ({ ...prev, [user.id]: '' }));
    setProcessingUser(user.id);
    
    try {
      // Check if QA is passed before final approval
      const isQAPassed = user.qaStatus === 'passed';
      console.log('📋 QA Status check:', { qaStatus: user.qaStatus, isQAPassed });
      
      if (!isQAPassed) {
        console.warn('❌ QA testing must be completed before final approval');
        setApprovalErrors(prev => ({ ...prev, [user.id]: 'QA testing must be completed before final approval' }));
        return;
      }
      
      console.log('✅ QA passed - proceeding with final approval');
      console.log('📞 Calling onFinalApprove with data:', {
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
      
      console.log('✅ onFinalApprove completed successfully');
      
    } catch (error) {
      console.error('❌ Error in handleFinalApprove:', error);
      // Set inline error instead of popup alert
      setApprovalErrors(prev => ({ 
        ...prev, 
        [user.id]: `Failed to approve user: ${error.message}` 
      }));
    } finally {
      console.log('🔄 Clearing processing state');
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
    // Show inline confirmation instead of popup
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

  const cancelSendBack = () => {
    setRejectingUser(null);
    setRejectReason('');
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
              <p className="text-xs text-blue-600 mt-1">
                • Each client gets exactly one website deployment
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {readyForTestingUsers.map((user) => {
            const qaStatus = user.qaStatus || 'pending';
            const isQAPassed = qaStatus === 'passed';
            const isProcessing = processingUser === user.id;
            const isRejecting = rejectingUser === user.id;
            
            return (
              <div key={user.id} className="p-4 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-b-0">
                <div className="flex items-center justify-between gap-6">
                  {/* User Info - Compact like Pending tab */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <User className="h-4 w-4 text-blue-600" />
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
                          <span>{new Date(user.readyForTestingAt).toLocaleDateString()}</span>
                        </div>
                        {user.siteUrl && (
                          <a
                            href={user.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 flex-shrink-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sequential Workflow Buttons - Production Line Style */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Step 1: Website Creation - MANDATORY FIRST STEP */}
                    {!user.websiteProvisioned ? (
                      <button
                        onClick={() => handleCreateWebsite(user)}
                        disabled={provisioning[user.id] || isProcessing}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                          provisioning[user.id]
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 shadow-sm'
                        }`}
                        title="Step 1: Create website (REQUIRED) - Must be completed before testing"
                      >
                        {provisioning[user.id] ? (
                          <>
                            <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="hidden sm:inline">Creating...</span>
                          </>
                        ) : (
                          <>
                            <Globe className="h-3 w-3" />
                            <span className="hidden sm:inline">Create Website</span>
                          </>
                        )}
                      </button>
                    ) : (
                      /* Website Already Exists - Only Show Visit Button */
                      <a
                        href={user.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700 transition-all hover:scale-105 shadow-sm"
                        title={`Visit website: ${user.siteUrl}`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Visit Site</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {/* Step 2: QA Testing (only available when website exists) */}
                    <button
                      onClick={() => updateQAStatus(user.id, qaStatus === 'passed' ? 'pending' : qaStatus === 'testing' ? 'passed' : 'testing')}
                      disabled={isProcessing || !user.websiteProvisioned}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                        !user.websiteProvisioned
                          ? 'bg-gray-100 text-gray-400'
                          : qaStatus === 'passed' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' 
                          : qaStatus === 'testing'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
                      }`}
                      title={user.websiteProvisioned ? "Step 2: QA Testing progress" : "Create website first"}
                    >
                      {qaStatus === 'passed' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="hidden sm:inline">QA Passed</span>
                        </>
                      ) : qaStatus === 'testing' ? (
                        <>
                          <Eye className="h-3 w-3" />
                          <span className="hidden sm:inline">Testing</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          <span className="hidden sm:inline">{user.websiteProvisioned ? 'Start QA' : 'QA Pending'}</span>
                        </>
                      )}
                    </button>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            isQAPassed ? 'bg-emerald-500' : 
                            user.websiteProvisioned ? 'bg-blue-500' : 
                            'bg-gray-300'
                          }`}
                          style={{ 
                            width: `${isQAPassed ? 100 : user.websiteProvisioned ? 50 : 25}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-medium min-w-0">
                        {isQAPassed ? '100%' : 
                         user.websiteProvisioned ? '50%' : 
                         '25%'}
                      </span>
                    </div>

                    {/* Step 3: Final Approval (only when QA passed) */}
                    <button
                      onClick={() => {
                        console.log('🖱️ Approve button clicked for user:', user.id, user.email);
                        console.log('🔍 Button state:', { isProcessing, isQAPassed, disabled: isProcessing || !isQAPassed });
                        handleFinalApprove(user);
                      }}
                      disabled={isProcessing || !isQAPassed}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        isQAPassed
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md hover:scale-105'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      title={isQAPassed ? "Step 3: Move to Approved" : "Complete QA testing first"}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">Moving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="hidden sm:inline">
                            {isQAPassed ? 'Approve' : 'QA Required'}
                          </span>
                        </>
                      )}
                    </button>
                    
                    {/* Reject Button */}
                    <button
                      onClick={() => handleSendBack(user.id)}
                      disabled={isProcessing}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                      title="Send back to pending"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Inline Approval Error */}
                {approvalErrors[user.id] && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-red-100 rounded-lg flex-shrink-0">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-red-800">{approvalErrors[user.id]}</div>
                        <button
                          onClick={() => setApprovalErrors(prev => ({ ...prev, [user.id]: '' }))}
                          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Rejection Confirmation */}
                {isRejecting && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-red-100 rounded-lg flex-shrink-0">
                        <X className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-red-800 mb-2">Send back to pending?</h5>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Enter reason for sending back to pending..."
                          className="w-full px-3 py-2 text-sm border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={confirmSendBack}
                            disabled={!rejectReason.trim() || isProcessing}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isProcessing ? 'Sending...' : 'Confirm'}
                          </button>
                          <button
                            onClick={cancelSendBack}
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

                {/* Inline Website Creation Form */}
                {creatingWebsiteFor === user.id && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                        <Globe className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-blue-800 mb-2">Create Website</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">
                              Website Name (will be: [name]-grbalance.netlify.app)
                            </label>
                            <input
                              type="text"
                              value={customSiteName}
                              onChange={(e) => setCustomSiteName(e.target.value)}
                              placeholder="e.g., salontest, pizzashop, retailstore"
                              className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                            />
                            <p className="text-xs text-blue-600 mt-1">
                              Preview: <strong>{customSiteName || 'sitename'}-grbalance.netlify.app</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => provisionWebsite(user, customSiteName)}
                              disabled={!customSiteName.trim() || provisioning[user.id]}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                            >
                              {provisioning[user.id] ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Creating...</span>
                                </>
                              ) : (
                                <>
                                  <Globe className="h-3 w-3" />
                                  <span>Create Website</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setCreatingWebsiteFor(null);
                                setCustomSiteName('');
                              }}
                              disabled={provisioning[user.id]}
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* QA Notes Section (only show when website is provisioned) */}
                {user.websiteProvisioned && (
                  <div className="mt-3 pl-9">
                    <textarea
                      value={testingNotes[user.id] || user.qaTestingNotes || ''}
                      onChange={(e) => setTestingNotes(prev => ({ ...prev, [user.id]: e.target.value }))}
                      placeholder="Add QA testing notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs resize-none focus:ring-blue-500 focus:border-blue-500"
                      rows={1}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQAStatus(user.id, 'testing')}
                        disabled={isProcessing}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        Testing
                      </button>
                      <button
                        onClick={() => updateQAStatus(user.id, 'passed')}
                        disabled={isProcessing}
                        className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
                      >
                        Pass
                      </button>
                      <button
                        onClick={() => updateQAStatus(user.id, 'failed')}
                        disabled={isProcessing}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        Fail
                      </button>
                    </div>
                  </div>
                )}
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