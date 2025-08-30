import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, HelpCircle, MessageCircle, Menu, X, CreditCard } from 'lucide-react';
import clientConfig from '../config/client';
import { useAuth } from '../contexts/AuthProvider';
import UsageCounter from './UsageCounter';
import { calculateTrialFromCreatedAt } from '../services/trialService';

interface HeaderProps {
  usageRefreshTrigger?: number;
}

export default function Header({ usageRefreshTrigger }: HeaderProps = {}) {
  // Safely use auth state with fallback for router context issues
  let authState;
  try {
    authState = useAuth();
  } catch (error) {
    console.warn('Auth state error in Header, using fallback values:', error);
    authState = {
      isAuthenticated: false,
      isApproved: false,
      isPending: false,
      isLoading: false
    };
  }

  const { isAuthenticated, isApproved, isPending, isLoading, clientPath, userStatus, user } = authState;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState('/app');
  
  // Check if trial user has expired trial
  const isTrialExpired = () => {
    if (userStatus === 'trial' && user?.created_at) {
      const trialInfo = calculateTrialFromCreatedAt(user.created_at, true);
      return trialInfo.isExpired;
    }
    return false;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Determine the appropriate dashboard URL based on current context
  useEffect(() => {
    const updateDashboardUrl = () => {
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split('/').filter(segment => segment.length > 0);
      
      // If we're currently on a client portal path (e.g., /grsalon), save it and use it
      if (pathSegments.length === 1 && 
          !['app', 'admin', 'login', 'register', 'docs', 'support', 'contact', 'terms', 'privacy', 'pricing', 'book', 'demo', 'interactive-demo', 'billing', 'mockup-billing'].includes(pathSegments[0])) {
        console.log(`🎯 Header: Detected client portal path, saving and setting dashboard URL to /${pathSegments[0]}`);
        sessionStorage.setItem('clientPortalPath', `/${pathSegments[0]}`);
        setDashboardUrl(`/${pathSegments[0]}`);
      } else {
        // Check if we have a saved client portal path from previous navigation
        const savedClientPath = sessionStorage.getItem('clientPortalPath');
        if (savedClientPath) {
          console.log(`🎯 Header: Using saved client portal path: ${savedClientPath}`);
          setDashboardUrl(savedClientPath);
        } else {
          console.log('🎯 Header: No client portal context found, setting dashboard URL to /app');
          setDashboardUrl('/app');
        }
      }
    };

    // Update on mount
    updateDashboardUrl();

    // Listen for navigation changes
    const handlePopState = () => {
      updateDashboardUrl();
    };

    window.addEventListener('popstate', handlePopState);
    
    // Also check periodically in case of programmatic navigation
    const interval = setInterval(updateDashboardUrl, 1000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center sm:items-start">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="shrink-0">
              <img 
                src={clientConfig.logo}
                alt={`${clientConfig.title} Logo`}
                className="h-10 sm:h-12 lg:h-14 w-auto"
              />
            </Link>
            {isAuthenticated && <div className="hidden md:block"><UsageCounter refreshTrigger={usageRefreshTrigger || 0} /></div>}
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {isAuthenticated && isApproved && (
              <Link to="/billing" className="text-gray-600 hover:text-emerald-600 flex items-center gap-2 transition-colors duration-200 min-h-[44px] px-2">
                <CreditCard className="h-4 w-4" />
                <span>Billing</span>
              </Link>
            )}
            <Link to="/pricing" className="text-gray-600 hover:text-emerald-600 transition-colors duration-200 min-h-[44px] px-2 flex items-center">
              Pricing
            </Link>
            <Link to="/docs" className="text-gray-600 hover:text-emerald-600 flex items-center gap-2 transition-colors duration-200 min-h-[44px] px-2">
              <Book className="h-4 w-4" />
              <span className="hidden lg:inline">Documentation</span>
              <span className="lg:hidden">Docs</span>
            </Link>
            <Link to="/support" className="text-gray-600 hover:text-emerald-600 flex items-center gap-2 transition-colors duration-200 min-h-[44px] px-2">
              <HelpCircle className="h-4 w-4" />
              Support
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-emerald-600 flex items-center gap-2 transition-colors duration-200 min-h-[44px] px-2">
              <MessageCircle className="h-4 w-4" />
              Contact
            </Link>
            <Link
              to={isAuthenticated ? (isTrialExpired() ? '/billing' : isPending ? (clientPath ? `/${clientPath}` : '/pending-approval') : dashboardUrl) : '/login'}
              className="bg-emerald-600 text-white px-4 lg:px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 min-h-[44px] flex items-center touch-manipulation"
            >
              {isLoading ? 'Loading...' : (isAuthenticated ? 'Dashboard' : 'Login')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2 sm:gap-4">
            <Link
              to={isAuthenticated ? (isTrialExpired() ? '/billing' : isPending ? (clientPath ? `/${clientPath}` : '/pending-approval') : dashboardUrl) : '/login'}
              className="bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-xs sm:text-sm min-h-[44px] flex items-center touch-manipulation"
            >
              {isLoading ? 'Loading...' : (isAuthenticated ? 'Dashboard' : 'Login')}
            </Link>
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-emerald-600 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 sm:mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col space-y-2">
              {isAuthenticated && isApproved && (
                <>
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <UsageCounter refreshTrigger={usageRefreshTrigger || 0} />
                  </div>
                  <Link 
                    to="/billing" 
                    className="text-gray-600 hover:text-emerald-600 flex items-center gap-3 transition-colors duration-200 py-3 px-2 rounded-lg hover:bg-gray-50 min-h-[44px] touch-manipulation"
                    onClick={closeMobileMenu}
                  >
                    <CreditCard className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">Billing</span>
                  </Link>
                </>
              )}
              <Link 
                to="/pricing" 
                className="text-gray-600 hover:text-emerald-600 flex items-center gap-3 transition-colors duration-200 py-3 px-2 rounded-lg hover:bg-gray-50 min-h-[44px] touch-manipulation"
                onClick={closeMobileMenu}
              >
                <span className="font-medium">Pricing</span>
              </Link>
              <Link 
                to="/docs" 
                className="text-gray-600 hover:text-emerald-600 flex items-center gap-3 transition-colors duration-200 py-3 px-2 rounded-lg hover:bg-gray-50 min-h-[44px] touch-manipulation"
                onClick={closeMobileMenu}
              >
                <Book className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Documentation</span>
              </Link>
              <Link 
                to="/support" 
                className="text-gray-600 hover:text-emerald-600 flex items-center gap-3 transition-colors duration-200 py-3 px-2 rounded-lg hover:bg-gray-50 min-h-[44px] touch-manipulation"
                onClick={closeMobileMenu}
              >
                <HelpCircle className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Support</span>
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-600 hover:text-emerald-600 flex items-center gap-3 transition-colors duration-200 py-3 px-2 rounded-lg hover:bg-gray-50 min-h-[44px] touch-manipulation"
                onClick={closeMobileMenu}
              >
                <MessageCircle className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Contact</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}