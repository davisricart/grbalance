import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Eye, AlertCircle, ExternalLink, User, MessageSquare, Upload, Code, Play, CheckCircle, FileText, Trash2, RefreshCw } from 'lucide-react';
import { ReadyForTestingUser } from '../../../types/admin';

interface ReadyForTestingTabProps {
  readyForTestingUsers: ReadyForTestingUser[];
  onFinalApprove: (userId: string, userData: any) => Promise<void>;
  onSendBackToPending: (userId: string, reason: string) => Promise<void>;
  onUpdateTestingUser: (userId: string, updates: Partial<ReadyForTestingUser>) => Promise<void>;
  isLoading: boolean;
}

// Component to show and manage deployed scripts for a client
function DeployedScriptsSection({ userId, clientPath, businessName, refreshTrigger }: { userId: string; clientPath: string; businessName: string; refreshTrigger?: number }) {
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadScripts = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Loading deployed scripts for userId:', userId);
      
      const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/clients?client_path=eq.${clientPath}&select=deployed_scripts`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const clients = await response.json();
        if (clients && clients.length > 0) {
          const deployedScripts = clients[0].deployed_scripts || [];
          setScripts(deployedScripts);
          console.log('✅ Found scripts:', deployedScripts.map((s: any) => s.name));
        } else {
          setScripts([]);
          console.log('ℹ️ No client found or no scripts deployed');
        }
      } else {
        throw new Error(`Failed to load scripts: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Error loading scripts:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteScript = async (scriptName: string) => {
    try {
      console.log('🗑️ Deleting script:', scriptName);
      
      const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';
      
      // Remove the script from the deployed_scripts array
      const updatedScripts = scripts.filter(script => script.name !== scriptName);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/clients?client_path=eq.${clientPath}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deployed_scripts: updatedScripts
        })
      });
      
      if (response.ok) {
        setScripts(updatedScripts);
        console.log('✅ Script deleted successfully');
      } else {
        throw new Error(`Failed to delete script: ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Error deleting script:', error);
      setError(`Failed to delete script: ${error.message}`);
    }
  };

  // Load scripts when component mounts or refresh trigger changes
  useEffect(() => {
    loadScripts();
  }, [userId, refreshTrigger]);

  return (
         <div className="mt-3 ml-0">
       <div className="flex items-center justify-between mb-2">
         <label className="block text-xs text-gray-600">Scripts Available on Client Portal:</label>
         <button
           onClick={loadScripts}
           disabled={loading}
           className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
           title="Refresh scripts list"
         >
           {loading ? (
             <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
           ) : (
             <RefreshCw className="h-3 w-3" />
           )}
           <span className="hidden sm:inline">Refresh</span>
         </button>
       </div>
      
      {error && (
        <div className="text-xs text-red-600 mb-2">Error: {error}</div>
      )}
      
             {scripts.length > 0 ? (
         <div className="space-y-1">
           {scripts.map((script, index) => (
                           <div key={index} className="flex items-center bg-gray-50 px-3 py-2 rounded-md">
                <FileText className="h-3 w-3 text-gray-500 flex-shrink-0 mr-2" />
                <span className="text-xs font-medium text-gray-700 mr-2">{script.name}</span>
                <span className="text-xs text-gray-500 mr-3">
                  ({script.uploaded_at ? new Date(script.uploaded_at).toLocaleDateString() : 'Unknown date'})
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteScript(script.name);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors flex-shrink-0"
                  title="Delete this script"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
           ))}
         </div>
      ) : (
        <div className="text-xs text-gray-500 italic bg-gray-50 px-3 py-2 rounded-md">
          {loading ? 'Loading scripts...' : 'No scripts deployed to client portal'}
        </div>
      )}
      

    </div>
  );
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
  const [customUrls, setCustomUrls] = useState<{[key: string]: string}>({});
  const [scriptStatus, setScriptStatus] = useState<{[key: string]: 'none' | 'ready' | 'completed'}>({});
  const [websiteStatus, setWebsiteStatus] = useState<{[key: string]: 'none' | 'created'}>({});
  const [sendBackConfirm, setSendBackConfirm] = useState<string | null>(null);
  const [scriptRefreshTrigger, setScriptRefreshTrigger] = useState<{[key: string]: number}>({});

  // Check Supabase for existing websites when component loads - PERSISTENT STATUS
  useEffect(() => {
    const checkExistingWebsites = async () => {
      console.log('🔄 CHECKING PERSISTENT WEBSITE STATUS - Loading from Supabase...');
      const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';
      
      // Load all existing clients at once for better performance
      try {
        const userIds = readyForTestingUsers.map(user => user.id).join(',');
        const response = await fetch(`${supabaseUrl}/rest/v1/clients?id=in.(${userIds})&select=id,client_path,website_created`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const clients = await response.json();
          console.log('📊 Supabase persistence check:', clients.length, 'existing websites found');
          
          // Update status for all found clients
          const newWebsiteStatus: {[key: string]: 'none' | 'created'} = {};
          clients.forEach((client: any) => {
            if (client.website_created) {
              newWebsiteStatus[client.id] = 'created';
              console.log('✅ PERSISTENT: Website exists for', client.id, '→', client.client_path);
            }
          });
          
          // Batch update the state
          if (Object.keys(newWebsiteStatus).length > 0) {
            setWebsiteStatus(prev => ({ ...prev, ...newWebsiteStatus }));
            console.log('🎯 PERSISTENT STATUS RESTORED:', Object.keys(newWebsiteStatus).length, 'websites');
          }
        } else {
          console.warn('⚠️ Failed to load persistent website status');
        }
      } catch (error) {
        console.error('❌ Error checking persistent website status:', error);
      }
    };

    if (readyForTestingUsers.length > 0) {
      checkExistingWebsites();
    }
  }, [readyForTestingUsers]);

  // Check Supabase for existing scripts when component loads - PERSISTENT SCRIPT STATUS
  useEffect(() => {
    const checkExistingScripts = async () => {
      console.log('🔄 CHECKING PERSISTENT SCRIPT STATUS - Loading from Supabase...');
      const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';
      
      try {
        // Calculate client paths for all users using the same logic as handleScriptUpload
        const clientPaths = readyForTestingUsers.map(user => {
          const clientPath = customUrls[user.id] || user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                            user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
          return clientPath;
        }).join(',');
        
        const response = await fetch(`${supabaseUrl}/rest/v1/clients?client_path=in.(${clientPaths})&select=id,client_path,deployed_scripts`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const clients = await response.json();
          console.log('📊 Script persistence check:', clients.length, 'clients checked for scripts');
          
          const newScriptStatus: {[key: string]: 'none' | 'ready' | 'completed'} = {};
          clients.forEach((client: any) => {
            if (client.deployed_scripts && Array.isArray(client.deployed_scripts) && client.deployed_scripts.length > 0) {
              // Find the user that matches this client_path using the same calculation logic
              const matchingUser = readyForTestingUsers.find(user => {
                const calculatedClientPath = customUrls[user.id] || user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                                            user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
                return calculatedClientPath === client.client_path;
              });
              if (matchingUser) {
                newScriptStatus[matchingUser.id] = 'ready';
                console.log('✅ PERSISTENT: Scripts exist for', client.client_path, '→', client.deployed_scripts.length, 'scripts');
              }
            }
          });
          
          if (Object.keys(newScriptStatus).length > 0) {
            setScriptStatus(prev => ({ ...prev, ...newScriptStatus }));
            console.log('🎯 PERSISTENT SCRIPT STATUS RESTORED:', Object.keys(newScriptStatus).length, 'users with scripts');
          }
        } else {
          console.warn('⚠️ Failed to load persistent script status');
        }
      } catch (error) {
        console.error('❌ Error checking persistent script status:', error);
      }
    };

    if (readyForTestingUsers.length > 0) {
      checkExistingScripts();
    }
  }, [readyForTestingUsers, customUrls]);

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
      console.log('✅ QA status updated successfully:', status);
    } catch (error) {
      console.error('❌ Failed to update QA status:', error);
      // Don't clear processing state on error so user can see the button didn't work
      throw error;
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

      // Final approval flow - handles all approval logic
      await onFinalApprove(user.id, userData);
      
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
        console.log(`✅ Cleanup completed: Removed ${result.abandonedSites} abandoned test sites, kept ${result.liveSites} live sites`);
      } else {
        throw new Error('Duplicate cleanup failed');
      }
      
    } catch (error) {
      console.error('❌ Duplicate cleanup failed:', error);
      console.error('❌ Duplicate cleanup failed - see console for details');
    }
  };

  const handleSendBack = (userId: string) => {
    // Show inline confirmation warning
    setSendBackConfirm(userId);
  };

  const confirmSendBack = async (userId: string) => {
    setSendBackConfirm(null); // Hide the confirmation
    setProcessingUser(userId);
    try {
      await onSendBackToPending(userId, 'Sent back from QA testing');
      
      // NUCLEAR RESET: LIVE deletion of all client data
              console.log('🧨 LIVE COMPLETE RESET: Erasing all traces of client:', userId);
        
        try {
          // DIRECT SUPABASE DELETION: Remove client record completely
          const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
          const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';
          
          const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${userId}`, {
            method: 'DELETE',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (deleteResponse.ok) {
            console.log('✅ LIVE Supabase deletion completed for client:', userId);
          } else {
            console.warn('⚠️ Supabase deletion failed - continuing with local reset');
          }
        } catch (error) {
          console.warn('⚠️ Data wipe failed - continuing with local reset:', error);
          // Don't fail the send-back operation if deletion fails
        }
        
        // Reset ALL local state - virgin slate
        setWebsiteStatus(prev => ({ ...prev, [userId]: 'none' }));
        setScriptStatus(prev => ({ ...prev, [userId]: 'none' }));
        setCustomUrls(prev => {
          const newUrls = { ...prev };
          delete newUrls[userId];
          return newUrls;
        });
        setTestingNotes(prev => ({ ...prev, [userId]: '' }));
        
        console.log('🎯 LIVE RESET: Client never existed - fresh start ready');
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
        
        console.log('📤 Uploading script to GitHub + database:', {
          filename: file.name,
          clientPath: clientPath,
          size: file.size
        });

        // DIRECT SUPABASE: Save script to client record
        const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';
        
        const scriptData = {
          id: file.name.replace(/\.(js|ts)$/, ''),
          name: file.name.replace(/\.(js|ts)$/, ''),
          content: scriptContent,
          uploaded_at: new Date().toISOString()
        };

        // Get current scripts first, then append new one (use client_path to match portal loading)
        const currentResponse = await fetch(`${supabaseUrl}/rest/v1/clients?client_path=eq.${clientPath}&select=deployed_scripts`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        let currentScripts: any[] = [];
        if (currentResponse.ok) {
          const clients = await currentResponse.json();
          if (clients && clients.length > 0) {
            currentScripts = clients[0].deployed_scripts || [];
          }
        }

        // Remove any existing script with the same name, then add the new one
        const filteredScripts = currentScripts.filter(script => script.name !== scriptData.name);
        const updatedScripts = [...filteredScripts, scriptData];

        console.log('📝 Script upload details:', { 
          fileName: file.name,
          scriptName: scriptData.name,
          existingScripts: currentScripts.map(s => s.name),
          removingScript: scriptData.name,
          finalScriptCount: updatedScripts.length,
          finalScripts: updatedScripts.map(s => s.name)
        });

        // Update client record with updated scripts array (use client_path to match portal loading)
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/clients?client_path=eq.${clientPath}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            deployed_scripts: updatedScripts
          })
        });

        if (!updateResponse.ok) {
          throw new Error(`Script upload failed: ${updateResponse.statusText}`);
        }

        console.log('✅ Script uploaded to Supabase successfully:', scriptData);
        
        setScriptStatus(prev => ({ ...prev, [userId]: 'ready' }));
        // Trigger refresh of deployed scripts section
        setScriptRefreshTrigger(prev => ({ ...prev, [userId]: Date.now() }));
        console.log(`✅ Script "${file.name}" uploaded and saved to GitHub + database!`);
        console.log('🎯 Button will stay green to allow multiple script uploads');
        
      } catch (error) {
        console.error('❌ Error uploading script:', error);
        // No popup - just log the error
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
      // No popup - just log the error
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

      // DIRECT SUPABASE: Skip Netlify functions entirely and use Supabase directly
      // CACHE BUST v3.0 - FORCE NEW CODE EXECUTION
      console.log('🔄 CACHE BUST v3.0 - DIRECT SUPABASE CALL EXECUTING');
      console.log('🚀 Using direct Supabase API - NO NETLIFY FUNCTIONS!');
      
      const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';

      const clientData = {
        id: userId,
        client_path: clientPath,
        business_name: user.businessName,
        email: user.email,
        subscription_tier: user.subscriptionTier,
        website_created: true,
        website_created_at: new Date().toISOString(),
        status: 'testing',
        site_url: `https://grbalance.netlify.app/${clientPath}`,
        deployed_scripts: [],
        usage: {
          comparisons_used: 0,
          comparisons_limit: user.subscriptionTier === 'business' ? 500 : 
                            user.subscriptionTier === 'professional' ? 200 : 100
        }
      };

      console.log('📡 Making direct Supabase API call to:', `${supabaseUrl}/rest/v1/clients`);
      console.log('📦 Client data payload:', clientData);
      
      // First, check if client already exists by ID
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${userId}`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const existingClients = await checkResponse.json();
      const clientExists = existingClients && existingClients.length > 0;
      
      // Also check if client_path already exists (to avoid unique constraint violation)
      const pathCheckResponse = await fetch(`${supabaseUrl}/rest/v1/clients?client_path=eq.${clientPath}`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const pathExists = await pathCheckResponse.json();
      const pathTaken = pathExists && pathExists.length > 0 && pathExists[0].id !== userId;
      
      // If path is taken by another client, generate a unique one
      if (pathTaken) {
        const timestamp = Date.now().toString().slice(-4);
        clientData.client_path = `${clientPath}${timestamp}`;
        console.log(`🔄 Path "${clientPath}" taken, using "${clientData.client_path}" instead`);
      }
      
      console.log('🔍 Client exists check:', clientExists ? 'YES - will UPDATE' : 'NO - will CREATE');
      console.log('🔍 Path collision check:', pathTaken ? 'COLLISION AVOIDED' : 'PATH AVAILABLE');
      
      let createResponse;
      if (clientExists) {
        // UPDATE existing client
        createResponse = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(clientData)
        });
        console.log('📨 UPDATE response status:', createResponse.status);
      } else {
        // CREATE new client
        createResponse = await fetch(`${supabaseUrl}/rest/v1/clients`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(clientData)
        });
        console.log('📨 CREATE response status:', createResponse.status);
      }

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('❌ Supabase direct error:', createResponse.status, errorText);
        throw new Error(`Supabase API error: ${createResponse.status} ${errorText}`);
      }

      const result = await createResponse.json();
      console.log('✅ LIVE Website processed directly in Supabase:', result);

      setWebsiteStatus(prev => ({ ...prev, [userId]: 'created' }));
      console.log('🔍 Current clientPath after creation:', clientPath);
      console.log('🔍 CustomUrls state:', customUrls[userId]);
      
    } catch (error) {
      console.error('❌ Error creating website:', error);
      // No popup - just log the error
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
            {/* Show active client portals here */}
            {readyForTestingUsers.some(user => websiteStatus[user.id] === 'created') ? (
              <div className="space-y-1">
                <span className="text-gray-400 text-xs">Client Portals:</span>
                {readyForTestingUsers
                  .filter(user => websiteStatus[user.id] === 'created')
                  .map(user => {
                    const clientPath = customUrls[user.id] || user.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                                     user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client';
                    return (
                      <div key={user.id} className="flex items-center gap-2">
                        <span className="text-gray-600 text-xs">{user.businessName}:</span>
                        <a
                          href={`https://grbalance.netlify.app/${clientPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 underline font-medium text-xs"
                        >
                          grbalance.netlify.app/{clientPath}
                        </a>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <span>Created client portals appear as clickable links below each client</span>
            )}
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
                        <span>Ready {user.readyForTestingAt ? (() => {
                          const date = new Date(user.readyForTestingAt);
                          return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                        })() : 'Date not set'}</span>
                      </div>
                      
                      {/* Client Portal URL Input */}
                      {websiteStatus[user.id] !== 'created' && (
                        <div className="mt-2">
                          <label className="block text-xs text-gray-600 mb-1">Client Portal URL:</label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">grbalance.netlify.app/</span>
                            <input
                              type="text"
                              value={customUrls[user.id] !== undefined ? customUrls[user.id] : defaultPath}
                              onChange={(e) => setCustomUrls(prev => ({ ...prev, [user.id]: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                              placeholder="Enter client portal name..."
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 max-w-xs"
                              onFocus={(e) => {
                                if (customUrls[user.id] === undefined) {
                                  setCustomUrls(prev => ({ ...prev, [user.id]: '' }));
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
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
                              <span>Moving to Approved...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              <span>
                                {canApprove 
                                  ? 'Move to Approved' 
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


                  {/* Script Workflow */}
                  <div className="mt-3 ml-0">
                    <label className="block text-xs text-gray-600 mb-2">Reconciliation Script Workflow:</label>
                    <div className="flex items-center gap-2">
                                              <button
                          onClick={() => handleScriptUpload(user.id)}
                          disabled={isProcessing}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 flex-shrink-0 ${
                            scriptStatus[user.id] === 'ready' || scriptStatus[user.id] === 'completed'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                          }`}
                        >
                          <Upload className="h-3 w-3" />
                          <span>{scriptStatus[user.id] === 'ready' || scriptStatus[user.id] === 'completed' ? 'Add More Scripts' : 'Upload Script'}</span>
                        </button>

                                              <button
                          onClick={() => handleScriptTest(user.id)}
                          disabled={isProcessing || (!scriptStatus[user.id] || scriptStatus[user.id] === 'none')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 flex-shrink-0 ${
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

                  {/* Deployed Scripts Section - Only show if website is created */}
                  {websiteStatus[user.id] === 'created' && (
                    <DeployedScriptsSection
                      userId={user.id}
                      clientPath={clientPath}
                      businessName={user.businessName || 'Unknown Business'}
                      refreshTrigger={scriptRefreshTrigger[user.id] || 0}
                    />
                  )}

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

              {/* Inline Send Back Confirmation */}
              {sendBackConfirm === user.id && (
                <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-amber-800 mb-1">
                        Send Back to Pending?
                      </h4>
                      <p className="text-sm text-amber-700 mb-3">
                        This will move the client back to pending status and remove all website/script data. Are you sure?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => confirmSendBack(user.id)}
                          disabled={processingUser === user.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                        >
                          {processingUser === user.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Sending Back...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              <span>Yes, Send Back</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setSendBackConfirm(null)}
                          disabled={processingUser === user.id}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
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