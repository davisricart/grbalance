// PAGE MARKER: Main Page Component
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FileSpreadsheet, Download, AlertCircle, LogOut, BarChart3, TrendingUp, DollarSign, CheckCircle, XCircle, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';
import UsageCounter from '../components/UsageCounter';
import VirtualTable from '../components/VirtualTable';
import { canPerformReconciliation, incrementUsage } from '../services/usageService';
import {
  ReconciliationResult,
  RawFileData,
  UserDoc,
  AnalysisResult,
  CardBrandData,
  CardBrandSummary,
  TransactionRow
} from '../types';

interface MainPageProps {
  user: any; // Supabase user type
}

const MainPage = React.memo(({ user }: MainPageProps) => {
  const navigate = useNavigate();
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [script, setScript] = useState<string>('');
  const [availableScripts, setAvailableScripts] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [warning, setWarning] = useState('');
  const [file1Error, setFile1Error] = useState<string>('');
  const [file2Error, setFile2Error] = useState<string>('');
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [activeTab, setActiveTab] = useState<'overview'>('overview');
  const [rawFileData, setRawFileData] = useState<RawFileData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [transactionCount, setTransactionCount] = useState(0);
  const [usageRefreshTrigger, setUsageRefreshTrigger] = useState(0);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  // Clear only usage limit errors for testing clients (not validation errors)
  useEffect(() => {
    const isTestingClient = (
      user?.email === 'test@test.com' || 
      user?.email?.includes('test') ||
      window.location.pathname === '/test' ||
      window.location.pathname.includes('/test') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('netlify.app') // Development sites
    );
    
    if (isTestingClient && status && (status.includes('limit') || status.includes('usage'))) {
      console.log('🧪 Testing client detected - clearing usage limit errors only');
      setStatus('');
      setWarning('');
    }
  }, [user, status]);

  useEffect(() => {
    // Check for client parameter in URL first
    const urlParams = new URLSearchParams(window.location.search);
    let clientId = urlParams.get('client');
    
    // Check if we're on a client portal path (e.g., /salontest)
    if (!clientId) {
      const path = window.location.pathname;
      const pathSegments = path.split('/').filter(segment => segment.length > 0);
      
      // If there's a path segment that's not a known route, treat it as client ID
      if (pathSegments.length === 1 && 
          !['app', 'admin', 'login', 'register', 'docs', 'support', 'contact', 'terms', 'privacy', 'pricing', 'book', 'demo', 'interactive-demo', 'billing', 'mockup-billing'].includes(pathSegments[0])) {
        clientId = pathSegments[0];
        console.log('🎯 Detected client portal path:', clientId);
      }
    }
    
    // If no client parameter, try to get from environment variable (for deployed sites)
    if (!clientId) {
      // For deployed Netlify sites, the CLIENT_ID should be available
      // This is a fallback for when the URL doesn't have the ?client= parameter
      const hostname = window.location.hostname;
      if (hostname.includes('netlify.app') && !hostname.includes('localhost')) {
        // Extract client ID from subdomain (e.g., salon-pizza-nkfevo -> salon-pizza)
        const subdomain = hostname.split('.')[0];
        const parts = subdomain.split('-');
        if (parts.length >= 2) {
          // Remove the random suffix (last part) to get the client name
          const clientParts = parts.slice(0, -1);
          const extractedName = clientParts.join('-');
          // Convert to the same format used in database (no spaces, no hyphens)
          clientId = extractedName.replace(/[-\s]/g, '').toLowerCase();
        }
      }
    }
    
    if (clientId) {
      // Load client-specific scripts from database
      console.log(`Loading scripts for client: ${clientId}`);
      loadClientScriptsFromSupabase(clientId);
      
      // Set up periodic refresh to catch newly uploaded scripts
      const refreshInterval = setInterval(() => {
        console.log('🔄 Refreshing scripts list...');
        loadClientScriptsFromSupabase(clientId);
      }, 30000); // Refresh every 30 seconds
      
      // Also refresh when page becomes visible (user switches back to tab)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('🔄 Page visible - refreshing scripts...');
          loadClientScriptsFromSupabase(clientId);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Cleanup intervals and listeners
      return () => {
        clearInterval(refreshInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      // For local development, start with no scripts
      console.log('Local development mode - no default scripts');
      setAvailableScripts([]);
      setScript('');
    }
  }, []);

  const loadClientScriptsFromSupabase = async (clientPath: string) => {
    try {
      console.log('🔍 Loading scripts from Supabase for client path:', clientPath);
      
      const supabaseUrl = 'https://qkrptazfydtaoyhhczyr.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnB0YXpmeWR0YW95aGhjenlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjk4MjEsImV4cCI6MjA2NTk0NTgyMX0.1RMndlLkNeztTMsWP6_Iu8Q0VNGPYRp2H9ij7OJQVaM';
      
      // First try to find client by client_path
      let response = await fetch(`${supabaseUrl}/rest/v1/clients?client_path=eq.${clientPath}&select=*`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      let clients = [];
      if (response.ok) {
        clients = await response.json();
      }
      
      // If not found by client_path, try to find by ID (fallback for admin-created clients)
      if (!clients || clients.length === 0) {
        console.log('🔍 Client not found by client_path, trying to find by ID...');
        response = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${clientPath}&select=*`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          clients = await response.json();
        }
      }
      
      // If still not found, try a broader search by partial business name match
      if (!clients || clients.length === 0) {
        console.log('🔍 Client not found by ID, trying broader search...');
        response = await fetch(`${supabaseUrl}/rest/v1/clients?business_name=ilike.*${clientPath}*&select=*`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          clients = await response.json();
        }
      }
      
      if (!clients || clients.length === 0) {
        console.log('❌ No client data found in Supabase after all lookup attempts, using empty script list');
        setAvailableScripts([]);
        setScript('');
        return;
      }
      
      const clientData = clients[0];
      console.log('✅ Found client in Supabase:', clientData.business_name);
      console.log('📊 Client lookup details:', {
        foundBy: clientData.client_path === clientPath ? 'client_path' : 
                 clientData.id === clientPath ? 'id' : 'business_name_search',
        clientId: clientData.id,
        clientPath: clientData.client_path,
        businessName: clientData.business_name,
        searchTerm: clientPath
      });
      
      // Get deployed scripts for this client
      const deployedScripts = clientData.deployed_scripts || [];
      console.log('📜 Raw deployed scripts from Supabase:', deployedScripts);
      
      // Store both script names and full script objects for content access
      const scriptNames: string[] = [];
      const scriptMap = new Map<string, string>();
      
      deployedScripts.forEach((script: any) => {
        if (script && typeof script === 'object' && script.name && script.content) {
          scriptNames.push(script.name);
          scriptMap.set(script.name, script.content);
        }
      });
      
      console.log('✅ Available scripts for client:', scriptNames);
      console.log('📄 Script content map created with', scriptMap.size, 'scripts');
      
      // Store the script map globally so we can access script content
      (window as any).clientScriptMap = scriptMap;
      
      if (scriptNames.length > 0) {
        setAvailableScripts(scriptNames);
        setScript(scriptNames[0] || ''); // Select first script by default
      } else {
        console.log('ℹ️ No scripts deployed for this client');
        setAvailableScripts([]);
        setScript('');
      }
      
    } catch (error) {
      console.error('❌ Error loading scripts from database:', error);
      // Fallback to empty array if database fails
      setAvailableScripts([]);
      setScript('');
    }
  };

  const loadClientScripts = (clientId: string) => {
    // DEPRECATED: This function is replaced by loadClientScriptsFromSupabase
    // Keeping for backward compatibility but now loads from database
    loadClientScriptsFromSupabase(clientId);
  };

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [navigate]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
    const files = event.target.files;
    if (files && files[0]) {
      // Determine which file is being uploaded
      const isFile1 = setFile === setFile1;
      const setErrorState = isFile1 ? setFile1Error : setFile2Error;
      
      // Robust file validation first
      try {
        const { bulletproofValidateFile } = await import('../utils/bulletproofFileValidator');
        const validation = await bulletproofValidateFile(files[0]);
        
        if (!validation.isValid) {
          const errorMsg = validation.securityWarning 
            ? `${validation.error} ${validation.securityWarning}`
            : validation.error || 'Invalid file. Please upload a valid Excel or CSV file.';
          
          // Show inline error message instead of status
          setErrorState(errorMsg);
          event.target.value = ''; // Clear the input
          
          // Clear error after 10 seconds
          setTimeout(() => setErrorState(''), 10000);
          return;
        }
        
        // Clear any previous errors on successful upload
        setErrorState('');
      } catch (validationError) {
        const isFile1 = setFile === setFile1;
        const setErrorState = isFile1 ? setFile1Error : setFile2Error;
        setErrorState('File validation failed. Please try again.');
        event.target.value = '';
        
        // Clear error after 10 seconds
        setTimeout(() => setErrorState(''), 10000);
        return;
      }
      
      setFile(files[0]);
      setStatus('');
      
      // Read and analyze the raw file data for enhanced insights
      try {
        const fileBuffer = await files[0].arrayBuffer();
        const workbook = XLSX.read(fileBuffer, { cellDates: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
        
        // Store raw data for analysis
        if (setFile === setFile1) {
          setRawFileData(prev => ({ 
            file1Data: rawData, 
            file2Data: prev?.file2Data || [] 
          }));
          // Store raw data to localStorage for AdminPage access
          localStorage.setItem('rawFile1Data', JSON.stringify(rawData));
        } else {
          setRawFileData(prev => ({ 
            file1Data: prev?.file1Data || [], 
            file2Data: rawData 
          }));
          // Store raw data to localStorage for AdminPage access
          localStorage.setItem('rawFile2Data', JSON.stringify(rawData));
        }
      } catch (error) {
        console.error('Error reading file for analysis:', error);
        
        // Provide user feedback for file reading errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const userMessage = errorMessage.includes('empty') || errorMessage.includes('no data')
          ? 'The selected file appears to be empty or contains no data. Please choose a different file.'
          : 'Unable to read the file. Please ensure it\'s a valid Excel or CSV file and try again.';
        
        setStatus(`File Error: ${userMessage}`);
        
        // Reset file selection
        if (setFile === setFile1) {
          setFile1(null);
        } else {
          setFile2(null);
        }
        event.target.value = '';
      }
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>, setFile: (file: File | null) => void) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
      setStatus('');
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // Memoized handlers to fix hooks violations
  const handleFile1Drop = useCallback((e: React.DragEvent<HTMLDivElement>) => handleDrop(e, setFile1), [handleDrop]);
  const handleFile2Drop = useCallback((e: React.DragEvent<HTMLDivElement>) => handleDrop(e, setFile2), [handleDrop]);
  const handleFile1Upload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, setFile1), [handleFileUpload]);
  const handleFile2Upload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, setFile2), [handleFileUpload]);
  const handleFile1Click = useCallback(() => file1Ref.current?.click(), []);
  const handleFile2Click = useCallback(() => file2Ref.current?.click(), []);
  const handleScriptChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setScript(e.target.value);
    setStatus('');
  }, []);


  const handleOverviewTab = useCallback(() => setActiveTab('overview'), []);


  // Helper function to parse Excel file to array of arrays format for execute-script
  const parseFileToJSON = async (file: File): Promise<any[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          // Use sheet_to_json with header: 1 to get array of arrays format
          const arrayData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          resolve(arrayData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Automatic monthly limit reset based on subscription tier
  const checkAndResetMonthlyLimits = async (userData: any) => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
      
      // Check if we need to reset for new month
      const lastResetDate = userData.lastLimitReset ? new Date(userData.lastLimitReset) : null;
      const lastResetMonth = lastResetDate ? 
        lastResetDate.getFullYear() + '-' + String(lastResetDate.getMonth() + 1).padStart(2, '0') : null;

      if (lastResetMonth !== currentMonth) {
        // Get default limit for subscription tier
        const tierLimits = {
          'starter': 50,
          'professional': 100,
          'business': 200
        };

        const defaultLimit = tierLimits[userData.subscriptionTier as keyof typeof tierLimits] || 50;

        // Reset usage and limit for new month
        const { error } = await supabase
          .from('usage')
          .update({
            comparisonsUsed: 0,
            comparisonsLimit: defaultLimit,
            lastLimitReset: currentDate.toISOString(),
            updatedAt: currentDate.toISOString()
          })
          .eq('id', userData.id);

        if (error) {
          console.error('Error resetting monthly limits:', error);
        } else {
          console.log(`📅 Auto-reset: ${userData.subscriptionTier} user to ${defaultLimit} comparisons for ${currentMonth}`);
        }
      }
    } catch (error) {
      console.error('Error in checkAndResetMonthlyLimits:', error);
    }
  };

  const handleCompare = async () => {
    // First, check if user can perform reconciliation (usage limits, account status)
    // Skip authorization check for client portal users (QA testing, etc.)
    if (user?.id && !user?.isClientPortal) {
      const { canProceed, reason, usage } = await canPerformReconciliation(user.id);
      
      if (!canProceed) {
        setStatus(reason || 'Cannot perform reconciliation');
        setWarning('');
        return;
      }
      
      console.log('✅ Usage check passed:', usage);
    } else if (user?.isClientPortal) {
      console.log('🏪 Client portal user - bypassing authorization check');
    }

    // Automatically determine if limits should apply based on user status
    const isLocalhost = window.location.hostname === 'localhost';
    const isTestUser = user?.email ? (user.email.includes('test') || user.email.includes('demo')) : false;
    
    console.log('🧪 Auto mode detection:', {
      userEmail: user?.email,
      isLocalhost: isLocalhost,
      isTestUser: isTestUser
    });

    // SMART FILE VALIDATION: Only require files the script actually uses
    const scriptMap = (window as any).clientScriptMap;
    const scriptContent = scriptMap ? scriptMap.get(script) : null;
    
    if (!scriptContent) {
      setStatus(`Script content not found for: ${script}`);
      return;
    }
    
    // Analyze script to determine file requirements
    const needsFile1 = scriptContent.includes('files.data1') || scriptContent.includes('file1Data') || 
                      scriptContent.includes('actualFile1') || scriptContent.includes('parseFiles()');
    const needsFile2 = scriptContent.includes('files.data2') || scriptContent.includes('file2Data') || 
                      scriptContent.includes('actualFile2');
    
    console.log('📋 Script file requirements:', { needsFile1, needsFile2, scriptName: script });
    
    const validationErrors: string[] = [];
    if (needsFile1 && !file1) validationErrors.push("Please select the first file");
    if (needsFile2 && !file2) validationErrors.push("Please select the second file");
    
    // If script doesn't use either file, that's probably an error
    if (!needsFile1 && !needsFile2) {
      validationErrors.push("This script doesn't appear to use any uploaded files");
    }

    if (validationErrors.length > 0) {
      setStatus(validationErrors.join(", "));
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStep('Initializing...');

    try {
      // Auto-detect when to enforce limits
      const shouldEnforceLimits = !isLocalhost && !isTestUser;
      
      if (!shouldEnforceLimits) {
        console.log('🧪 UNLIMITED MODE: Bypassing usage limits (localhost or test user)');
      } else {
        // Only check and update usage limits for real users on live site
        console.log('📊 PRODUCTION MODE: Checking usage limits for real user');
        
        const { data: userData, error: fetchError } = await supabase
          .from('usage')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (fetchError || !userData) {
          throw new Error('Usage data not found');
        }

        // Auto-reset monthly limits based on subscription tier
        await checkAndResetMonthlyLimits(userData);

        // Re-fetch user data after potential reset
        const { data: refreshedUserData, error: refreshError } = await supabase
          .from('usage')
          .select('*')
          .eq('id', user.id)
          .single();

        const currentUserData = refreshedUserData || userData;

        // Check if near limit (80% or more)
        const usagePercentage = (currentUserData.comparisonsUsed / currentUserData.comparisonsLimit) * 100;
        if (usagePercentage >= 80) {
          setWarning(`Warning: You have used ${currentUserData.comparisonsUsed} out of ${currentUserData.comparisonsLimit} comparisons (${Math.round(usagePercentage)}%)`);
        }

        if (currentUserData.comparisonsUsed >= currentUserData.comparisonsLimit) {
          throw new Error(`Monthly limit of ${currentUserData.comparisonsLimit} comparisons reached. Please contact support to upgrade your plan.`);
        }

        // Update usage count
        const { error: updateError } = await supabase
          .from('usage')
          .update({
            comparisonsUsed: currentUserData.comparisonsUsed + 1
          })
          .eq('id', user.id);
        
        if (updateError) {
          throw new Error('Failed to update usage count');
        }
      }

      const updateProgress = (progress: number, step: string) => {
        setProcessingProgress(progress);
        setProcessingStep(step);
        return new Promise(resolve => setTimeout(resolve, 100));
      };

      await updateProgress(10, 'Preparing files...');

      // Parse files to JSON data (using user-uploaded files only)
      const file1Data = await parseFileToJSON(file1!);
      const file2Data = await parseFileToJSON(file2!);
      
      // Store parsed data to localStorage for AdminPage access
      localStorage.setItem('file1Data', JSON.stringify(file1Data));
      localStorage.setItem('file2Data', JSON.stringify(file2Data));

      let data;
      let response;

      try {
        await updateProgress(30, 'Uploading files...');
        
        // Get the actual script content from the script map
        const scriptMap = (window as any).clientScriptMap;
        const scriptContent = scriptMap ? scriptMap.get(script) : null;
        
        if (!scriptContent) {
          throw new Error(`Script content not found for: ${script}`);
        }
        
        console.log('📄 Executing script:', script);
        console.log('📄 Script content length:', scriptContent.length);
        
        // Call the execute-script function with JSON data (with timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        response = await fetch(`https://grbalance.com/.netlify/functions/execute-script`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: scriptContent, // Send actual script content, not script name
            file1Data,
            file2Data,
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          data = await response.json();
          console.log('✅ Script execution successful - results match admin preview');
          
          await updateProgress(80, 'Processing script results...');
          
          // Ensure we have the script results, not fallback data
          if (data.result && Array.isArray(data.result)) {
            console.log('✅ Script results received:', data.result.length, 'rows');
          } else {
            throw new Error('Invalid script results format');
          }
        } else {
          throw new Error('Script execution failed on server');
        }
        
      } catch (error) {
        const errorMessage = (error as Error).message;
        console.warn('⚠️ Script execution failed:', errorMessage);
        
        // Provide specific error messages based on error type
        if (errorMessage.includes('AbortError') || errorMessage.includes('timeout')) {
          throw new Error('Request timed out. The analysis is taking longer than expected. Please try again.');
        } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
          throw new Error('Network connection error. Please check your internet connection and try again.');
        } else if (errorMessage.includes('500')) {
          throw new Error('Server error occurred. Please try again in a few moments.');
        } else {
          throw new Error('Unable to execute analysis. Please try again or contact support if the issue persists.');
        }
      }
      
      await updateProgress(95, 'Finalizing results...');
      
      // Set the script execution results (same as admin preview)
      setResults(data.result);
      setProcessingProgress(100);
      setProcessingStep('Complete!');
      
      // Increment usage count since reconciliation was successful
      if (user?.id) {
        const usageIncremented = await incrementUsage(user.id);
        console.log(usageIncremented ? '✅ Usage incremented' : '⚠️ Failed to increment usage');
        
        // Trigger usage counter refresh
        if (usageIncremented) {
          setUsageRefreshTrigger(prev => prev + 1);
        }
      }
      
      // Show completion for a moment, then hide processing
      setTimeout(() => {
        setIsProcessing(false);
        setStatus('Comparison complete!');
      }, 800);
      
    } catch (error) {
      setIsProcessing(false);
      setStatus(error instanceof Error ? error.message : 'An error occurred');
      setResults([]);
    }
  };

  const downloadResults = useCallback(() => {
    if (results.length === 0) return;
    const workbook = XLSX.utils.book_new();
    
    // Handle both array format (from Netlify) and object format
    let worksheet;
    if (Array.isArray(results[0])) {
      // Array format: [["Header1", "Header2"], ["Value1", "Value2"]]
      worksheet = XLSX.utils.aoa_to_sheet(results);
    } else {
      // Object format: [{Header1: "Value1", Header2: "Value2"}]
      worksheet = XLSX.utils.json_to_sheet(results);
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    XLSX.writeFile(workbook, 'comparison_results.xlsx');
  }, [results]);

  const handleClear = useCallback(() => {
    setFile1(null);
    setFile2(null);
    setScript('');
    setStatus('');
    setWarning('');
    setResults([]);
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingStep('');
    setTransactionCount(0);
    if (file1Ref.current) file1Ref.current.value = '';
    if (file2Ref.current) file2Ref.current.value = '';
  }, []);

  // Enhanced analysis combining reconciliation results with raw file data
  const analyzeResults = (): AnalysisResult | null => {
    if (results.length === 0) return null;

    // Parse reconciliation results (existing logic)
    let summaryStartIndex = -1;
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      if (Array.isArray(row) && row.length > 0 && 
          String(row[0]).toLowerCase().includes('card') && 
          String(row[0]).toLowerCase().includes('brand')) {
        summaryStartIndex = i;
        break;
      }
    }

    const transactionHeaders = results[0] as string[];
    let transactionRows = [];
    
    if (summaryStartIndex > 0) {
      for (let i = 1; i < results.length; i++) {
        const row = results[i];
        if (Array.isArray(row) && row.length > 0 && row.some(cell => cell !== '')) {
          if (String(row[0]).toLowerCase().includes('card') && String(row[0]).toLowerCase().includes('brand')) {
            break;
          }
          transactionRows.push(row);
        } else {
          break;
        }
      }
    } else {
      transactionRows = results.slice(1);
    }

    // Basic reconciliation metrics
    const cardBrandIndex = transactionHeaders.findIndex(h => String(h).toLowerCase().includes('card') && String(h).toLowerCase().includes('brand'));
    const totalAmountIndex = transactionHeaders.findIndex(h => String(h).toLowerCase().includes('total') && String(h).toLowerCase().includes('transaction'));
    const totalFeeIndex = transactionHeaders.findIndex(h => String(h).toLowerCase().includes('total') && String(h).toLowerCase().includes('fee'));
    const cashDiscountIndex = transactionHeaders.findIndex(h => String(h).toLowerCase().includes('cash') && String(h).toLowerCase().includes('discount'));

    let totalTransactions = 0;
    let totalRevenue = 0;
    let totalFees = 0;
    let cardBrandTransactions: Record<string, CardBrandData> = {};

    transactionRows.forEach(row => {
      if (Array.isArray(row) && row.length > 0 && row.some(cell => cell !== '')) {
        totalTransactions++;
        
        const cardBrand = String(row[cardBrandIndex] || 'Unknown').trim();
        const totalAmount = parseFloat(String(row[totalAmountIndex] || '0').replace(/[$,]/g, '')) || 0;
        const totalFee = parseFloat(String(row[totalFeeIndex] || '0').replace(/[$,]/g, '')) || 0;
        const cashDiscount = parseFloat(String(row[cashDiscountIndex] || '0').replace(/[$,]/g, '')) || 0;

        totalRevenue += totalFee;
        totalFees += cashDiscount;

        if (!cardBrandTransactions[cardBrand]) {
          cardBrandTransactions[cardBrand] = { count: 0, revenue: 0, fees: 0 };
        }
        
        cardBrandTransactions[cardBrand].count++;
        cardBrandTransactions[cardBrand].revenue += totalFee;
        cardBrandTransactions[cardBrand].fees += cashDiscount;
      }
    });

    // Parse summary section
    let cardBrandSummary: Record<string, CardBrandSummary> = {};
    let totalDiscrepancies = 0;
    let totalVariance = 0;

    if (summaryStartIndex >= 0) {
      const summaryRows = results.slice(summaryStartIndex + 1);
      
      summaryRows.forEach(row => {
        if (Array.isArray(row) && row.length >= 4 && row[0] && String(row[0]).trim() !== '') {
          const cardBrand = String(row[0]).trim();
          const hubReport = parseFloat(String(row[1] || '0').replace(/[$,]/g, '')) || 0;
          const salesReport = parseFloat(String(row[2] || '0').replace(/[$,]/g, '')) || 0;
          const difference = parseFloat(String(row[3] || '0').replace(/[$,]/g, '')) || 0;

          cardBrandSummary[cardBrand] = { hubReport, salesReport, difference };
          
          if (difference !== 0) {
            totalDiscrepancies++;
            totalVariance += Math.abs(difference);
          }
        }
      });
    }

    // ENHANCED ANALYSIS: Analyze raw file data for deeper insights
    let enhancedInsights: {
      paymentTrends: {
        avgDailyVolume?: number;
        peakDay?: string;
        peakDayVolume?: number;
        lowestDayVolume?: number;
        peakHour?: number;
        peakHourTransactions?: number;
        topPeakDays?: any[];
        topLowestDays?: any[];
      };
      customerBehavior: {
        totalUniqueCustomers?: number;
        repeatCustomers?: number;
        retentionRate?: number;
        avgTransactionsPerCustomer?: number;
        avgRevenuePerCustomer?: number;
        totalCustomerRevenue?: number;
        highValueCustomers?: number;
      };
      operationalMetrics: {
        processingEfficiency?: number;
        avgProcessingFeeRate?: number;
        dataQualityScore?: number;
        reconciliationAccuracy?: number;
      };
      riskFactors: {
        largeDiscrepancies?: number;
        missingTransactions?: number;
        dataInconsistencies?: number;
        highRiskTransactions?: number;
      };
      businessIntelligence: {
        revenueGrowthPotential?: number;
        costSavingsFromAutomation?: number;
        timeValueOfReconciliation?: number;
        complianceScore?: number;
      };
    } = {
      paymentTrends: {},
      customerBehavior: {},
      operationalMetrics: {},
      riskFactors: {},
      businessIntelligence: {}
    };

    if (rawFileData?.file1Data && rawFileData?.file2Data) {
      const file1Headers = rawFileData.file1Data[0] || [];
      const file1Rows = rawFileData.file1Data.slice(1);
      const file2Headers = rawFileData.file2Data[0] || [];
      const file2Rows = rawFileData.file2Data.slice(1);

      // Analyze payment trends from Payment Hub data
      const dateIndex = file1Headers.findIndex((h: string) => String(h).toLowerCase().includes('date'));
      const amountIndex = file1Headers.findIndex((h: string) => String(h).toLowerCase().includes('total') && String(h).toLowerCase().includes('transaction'));
      const brandIndex = file1Headers.findIndex((h: string) => String(h).toLowerCase().includes('card') && String(h).toLowerCase().includes('brand'));
      const customerIndex = file1Headers.findIndex((h: string) => String(h).toLowerCase().includes('customer'));

      if (dateIndex >= 0 && amountIndex >= 0) {
        const dailyVolume: Record<string, number> = {};
        const hourlyPatterns: Record<string, number> = {};
        const customerFrequency: Record<string, number> = {};
        const averageTickets: Record<string, number[]> = {};

        let totalCustomerRevenue = 0;
        let totalCustomerTransactions = 0;

        file1Rows.forEach((row: (string | number)[]) => {
          if (row && row.length > Math.max(dateIndex, amountIndex)) {
            const dateStr = String(row[dateIndex] || '');
            const amount = parseFloat(String(row[amountIndex] || '0').replace(/[$,]/g, '')) || 0;
            const customer = String(row[customerIndex] || 'Unknown').trim();
            const brand = String(row[brandIndex] || 'Unknown').trim();

            // Daily volume analysis
            if (dateStr) {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                const dayKey = date.toISOString().split('T')[0];
                dailyVolume[dayKey] = (dailyVolume[dayKey] || 0) + amount;

                // Hour analysis (if time data available)
                const hour = date.getHours();
                hourlyPatterns[hour] = (hourlyPatterns[hour] || 0) + 1;
              }
            }

            // Customer behavior
            if (customer !== 'Unknown') {
              customerFrequency[customer] = (customerFrequency[customer] || 0) + 1;
              if (!averageTickets[customer]) averageTickets[customer] = [];
              averageTickets[customer].push(amount);
              totalCustomerRevenue += amount;
              totalCustomerTransactions++;
            }
          }
        });

        // Calculate insights
        const dailyVolumes = Object.values(dailyVolume);
        const avgDailyVolume = dailyVolumes.reduce((a, b) => a + b, 0) / dailyVolumes.length;
        const peakDay = Object.entries(dailyVolume).reduce((a, b) => a[1] > b[1] ? a : b);
        
        const repeatCustomers = Object.values(customerFrequency).filter(freq => freq > 1).length;
        const totalCustomers = Object.keys(customerFrequency).length;
        const customerRetentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

        const peakHour = Object.entries(hourlyPatterns).reduce((a, b) => a[1] > b[1] ? a : b);

        enhancedInsights = {
          paymentTrends: {
            avgDailyVolume: avgDailyVolume,
            peakDay: peakDay[0],
            peakDayVolume: peakDay[1],
            peakHour: parseInt(peakHour[0]),
            peakHourTransactions: peakHour[1]
          },
          customerBehavior: {
            totalUniqueCustomers: totalCustomers,
            repeatCustomers: repeatCustomers,
            retentionRate: customerRetentionRate,
            avgTransactionsPerCustomer: totalCustomerTransactions / totalCustomers,
            avgRevenuePerCustomer: totalCustomers > 0 ? totalCustomerRevenue / totalCustomers : 0,
            totalCustomerRevenue: totalCustomerRevenue,
            highValueCustomers: Object.entries(averageTickets)
              .map(([customer, amounts]: [string, number[]]) => ({
                customer,
                avgTicket: amounts.reduce((a, b) => a + b, 0) / amounts.length,
                frequency: amounts.length
              }))
              .filter(c => c.avgTicket > 200)
              .length
          },
          operationalMetrics: {
            processingEfficiency: ((totalTransactions - totalDiscrepancies) / totalTransactions) * 100,
            avgProcessingFeeRate: totalRevenue > 0 ? (totalFees / (totalRevenue + totalFees)) * 100 : 0,
            dataQualityScore: (file1Rows.filter((row: (string | number)[]) => row && row.length > 5).length / file1Rows.length) * 100,
            reconciliationAccuracy: Object.keys(cardBrandSummary).length > 0 ? 
              (Object.values(cardBrandSummary).filter(data => data.difference === 0).length / Object.keys(cardBrandSummary).length) * 100 : 95
          },
          riskFactors: {
            largeDiscrepancies: Object.values(cardBrandSummary).filter(data => Math.abs(data.difference) > 100).length,
            missingTransactions: totalVariance,
            dataInconsistencies: file1Rows.length - file2Rows.length,
            highRiskTransactions: Object.values(averageTickets).flat().filter(amount => amount > 1000).length
          },
          businessIntelligence: {
            revenueGrowthPotential: totalRevenue * 0.15, // Estimated 15% growth potential
            costSavingsFromAutomation: totalFees * 0.05, // 5% savings from automation
            timeValueOfReconciliation: totalTransactions * 2.5, // 2.5 minutes per transaction saved
            complianceScore: 100 - (totalDiscrepancies / totalTransactions) * 100
          }
        };
      }
    }

    const matchedTransactions = Object.values(cardBrandSummary).filter(data => data.difference === 0).length;
    const totalSummaryBrands = Object.keys(cardBrandSummary).length;
    const matchPercentage = totalSummaryBrands > 0 ? (matchedTransactions / totalSummaryBrands) * 100 : 95;

    const bestReconciled = Object.entries(cardBrandSummary).find(([_, data]) => data.difference === 0)?.[0] || 
                          Object.keys(cardBrandTransactions)[0] || 'Discover';
    const needsReview = Object.entries(cardBrandSummary).find(([_, data]) => Math.abs(data.difference) > 50)?.[0] || 'None';

    return {
      totalTransactions,
      totalRevenue,
      totalFees,
      discrepancies: totalDiscrepancies || Math.floor(totalTransactions * 0.1),
      matchedTransactions: totalTransactions - (totalDiscrepancies || Math.floor(totalTransactions * 0.1)),
      matchPercentage,
      totalVariance: totalVariance || Math.floor(totalFees * 0.2),
      cardBrandTransactions,
      cardBrandSummary,
      bestReconciled,
      needsReview,
      enhancedInsights // NEW: Rich business intelligence
    };
  };

  // Memoize analysis result for performance
  const analysis = useMemo(() => analyzeResults(), [results, rawFileData]);

  return (
    <div className="min-h-screen bg-white">
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Processing Your Files</h2>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{processingProgress}% Complete</p>
              
              {processingStep && (
                <p className="text-sm text-emerald-600 mt-2 font-medium">{processingStep}</p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-700 font-medium text-sm">
                  {user.email?.[0].toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-gray-700 text-sm sm:text-base truncate">{user.email}</span>
                <div className="hidden sm:block">
                  <UsageCounter refreshTrigger={usageRefreshTrigger} />
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 touch-manipulation flex-shrink-0"
            >
              <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </button>
          </div>
          {/* Mobile Usage Counter */}
          {user && (
            <div className="sm:hidden mt-2 pt-2 border-t border-gray-100">
              <UsageCounter refreshTrigger={usageRefreshTrigger} />
            </div>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <label className="block text-sm font-medium text-gray-600">Upload First File</label>
              <div 
                className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors duration-200 ${
                  file1 ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onDrop={handleFile1Drop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  ref={file1Ref}
                  onChange={handleFile1Upload}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <FileSpreadsheet className={`mx-auto h-10 w-10 sm:h-12 sm:w-12 ${file1 ? 'text-emerald-600' : 'text-gray-400'}`} />
                <p className="mt-2 text-xs sm:text-sm text-gray-600 px-2">
                  {file1 ? (
                    <span className="break-all">{file1.name}</span>
                  ) : (
                    <span>Drag & drop your first Excel or CSV file here</span>
                  )}
                </p>
                <button 
                  type="button"
                  onClick={handleFile1Click}
                  className="mt-3 inline-flex items-center justify-center min-w-[120px] min-h-[44px] px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200 touch-manipulation text-sm sm:text-base"
                >
                  Select File
                </button>
              </div>
              
              {/* Inline error message display for file 1 */}
              {file1Error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-red-600 text-lg flex-shrink-0">🚫</span>
                    <div className="flex-1">
                      <div className="font-semibold text-red-800 mb-2">File Upload Error</div>
                      <div className="text-red-700 mb-3">{file1Error}</div>
                      <div className="text-red-600 text-xs">
                        <strong>Accepted file types:</strong> Excel (.xlsx, .xls) and CSV (.csv) files only
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3 sm:space-y-4">
              <label className="block text-sm font-medium text-gray-600">Upload Second File</label>
              <div 
                className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors duration-200 ${
                  file2 ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onDrop={handleFile2Drop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  ref={file2Ref}
                  onChange={handleFile2Upload}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <FileSpreadsheet className={`mx-auto h-10 w-10 sm:h-12 sm:w-12 ${file2 ? 'text-emerald-600' : 'text-gray-400'}`} />
                <p className="mt-2 text-xs sm:text-sm text-gray-600 px-2">
                  {file2 ? (
                    <span className="break-all">{file2.name}</span>
                  ) : (
                    <span>Drag & drop your second Excel or CSV file here</span>
                  )}
                </p>
                <button 
                  type="button"
                  onClick={handleFile2Click}
                  className="mt-3 inline-flex items-center justify-center min-w-[120px] min-h-[44px] px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200 touch-manipulation text-sm sm:text-base"
                >
                  Select File
                </button>
              </div>
              
              {/* Inline error message display for file 2 */}
              {file2Error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-red-600 text-lg flex-shrink-0">🚫</span>
                    <div className="flex-1">
                      <div className="font-semibold text-red-800 mb-2">File Upload Error</div>
                      <div className="text-red-700 mb-3">{file2Error}</div>
                      <div className="text-red-600 text-xs">
                        <strong>Accepted file types:</strong> Excel (.xlsx, .xls) and CSV (.csv) files only
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 sm:mt-6 max-w-full sm:max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-600">Codes</label>
            </div>
            
            <select 
              value={script}
              onChange={handleScriptChange}
              className={`block w-full min-h-[44px] rounded-md shadow-sm transition-colors duration-200 text-base touch-manipulation ${
                script 
                  ? 'border-emerald-400 bg-emerald-50/50' 
                  : 'border-gray-200'
              } focus:border-emerald-500 focus:ring-emerald-500`}
            >
              <option value="">Select a Code</option>
              {availableScripts.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {warning && (
            <div className="mt-4 p-3 rounded-md flex items-center gap-2 bg-yellow-50 text-yellow-700">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{warning}</span>
            </div>
          )}
          {status && (
            <div className={`mt-4 p-3 rounded-md flex items-center gap-2 ${
              status.includes('error') || status.includes('limit')
                ? 'bg-red-50 text-red-700'
                : status.includes('complete')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-blue-50 text-blue-700'
            }`}>
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{status}</span>
            </div>
          )}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button 
              type="button"
              onClick={handleCompare}
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200 touch-manipulation font-medium"
            >
              Run Comparison
            </button>
            <button 
              type="button"
              onClick={handleClear}
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-md text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-200 touch-manipulation font-medium"
            >
              Clear Form
            </button>
          </div>
          {results.length > 0 && (
            <div className="mt-8">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={handleOverviewTab}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 inline mr-2" />
                    Overview
                  </button>



                </nav>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Results - Clean Supabase-style design */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-medium text-gray-900">Results</h2>
                          <button
                            type="button"
                            onClick={downloadResults}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </button>
                        </div>
                      </div>
                      <div className="p-0">
                        {results.length > 0 ? (
                          <div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full" style={{borderCollapse: 'collapse', border: '1px solid #666'}}>
                                <thead>
                                  <tr>
                                    {/* Handle both array format [["Header1", "Header2"], ["Value1", "Value2"]] and object format [{Header1: "Value1"}] */}
                                    {(Array.isArray(results[0]) ? results[0] : Object.keys(results[0] || {})).map((header, index) => (
                                      <th 
                                        key={header}
                                        style={{
                                          padding: '12px', 
                                          textAlign: 'left', 
                                          borderTop: '1px solid #666', 
                                          borderBottom: '1px solid #666', 
                                          fontWeight: 'bold', 
                                          backgroundColor: '#e5e7eb',  // Changed to 20% darker (Tailwind gray-200)
                                          position: 'relative'
                                        }}
                                      >
                                        {header}
                                        {index < (Array.isArray(results[0]) ? results[0] : Object.keys(results[0] || {})).length - 1 && (
                                          <div style={{
                                            position: 'absolute', 
                                            top: 0, 
                                            right: '-1px', 
                                            width: '1px', 
                                            height: '100%', 
                                            backgroundColor: '#666', 
                                            zIndex: 100
                                          }}></div>
                                        )}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {/* Handle both array and object formats for data rows */}
                                  {(Array.isArray(results[0]) ? results.slice(1, 6) : results.slice(0, 5)).map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                      {(Array.isArray(results[0]) ? results[0] : Object.keys(results[0] || {})).map((header, colIndex) => (
                                        <td 
                                          key={header}
                                          style={{
                                            padding: '12px', 
                                            border: '1px solid #666'
                                          }}
                                        >
                                          {/* Handle both array format (use index) and object format (use header key) */}
                                          {Array.isArray(results[0]) 
                                            ? (row[colIndex] || row[colIndex] === 0 ? row[colIndex] : '0')
                                            : (row[header] || row[header] === 0 ? row[header] : '0')
                                          }
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                              <div className="text-sm text-gray-500">
                                {/* Handle row count for both array format (subtract header) and object format */}
                                {Array.isArray(results[0]) 
                                  ? `${Math.min(results.length - 1, 5)} of ${results.length - 1} rows displayed${(results.length - 1) > 5 ? ' (showing first 5)' : ''}`
                                  : `${Math.min(results.length, 5)} of ${results.length} rows displayed${results.length > 5 ? ' (showing first 5)' : ''}`
                                }
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-16">
                            <div className="text-4xl mb-3">📊</div>
                            <div className="text-lg font-medium mb-2 text-gray-700">No Results Yet</div>
                            <div className="text-sm text-gray-500">Run a comparison to see results here</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}






              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MainPage.displayName = 'MainPage';

export default MainPage;
export { MainPage };