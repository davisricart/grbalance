import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Book, HelpCircle, MessageCircle, Menu, X, CreditCard } from 'lucide-react';
import clientConfig from '../config/client';
import { useAuth } from '../contexts/AuthProvider';
import UsageCounter from './UsageCounter';

export default function Header() {
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

  const { isAuthenticated, isApproved, isPending, isLoading } = authState;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center sm:items-start">
          <div className="flex flex-col items-start gap-1 sm:gap-2">
            <Link to="/" className="shrink-0">
              <img 
                src={clientConfig.logo}
                alt={`${clientConfig.title} Logo`}
                className="h-10 sm:h-12 lg:h-14 w-auto"
              />
            </Link>
            {isAuthenticated && <div className="hidden sm:block"><UsageCounter /></div>}
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            {isAuthenticated && isApproved && (
              <Link to="/mockup-billing" className="text-gray-600 hover:text-emerald-600 flex items-center gap-2 transition-colors duration-200 min-h-[44px] px-2">
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
              to={isAuthenticated ? (isPending ? '/pending-approval' : '/app') : '/login'}
              className="bg-emerald-600 text-white px-4 lg:px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 min-h-[44px] flex items-center touch-manipulation"
            >
              {isLoading ? 'Loading...' : (isAuthenticated ? (isPending ? 'Pending' : 'Dashboard') : 'Login')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2 sm:gap-4">
            <Link
              to={isAuthenticated ? (isPending ? '/pending-approval' : '/app') : '/login'}
              className="bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-xs sm:text-sm min-h-[44px] flex items-center touch-manipulation"
            >
              {isLoading ? 'Loading...' : (isAuthenticated ? (isPending ? 'Pending' : 'Dashboard') : 'Login')}
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
                    <UsageCounter />
                  </div>
                  <Link 
                    to="/mockup-billing" 
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