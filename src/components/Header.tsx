import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Book, HelpCircle, MessageCircle, Menu, X } from 'lucide-react';
import clientConfig from '../config/client';
import { useAuthState } from '../hooks/useAuthState';
import UsageCounter from './UsageCounter';

export default function Header() {
  const { isAuthenticated, isLoading } = useAuthState();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start gap-2">
            <Link to="/" className="shrink-0">
              <img 
                src={clientConfig.logo}
                alt={`${clientConfig.title} Logo`}
                className="h-14 w-auto"
              />
            </Link>
            {isAuthenticated && <UsageCounter />}
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/docs" className="text-gray-600 hover:text-emerald-600 flex items-center gap-2 transition-colors duration-200">
              <Book className="h-4 w-4" />
              Documentation
            </Link>
            <Link to="/support" className="text-gray-600 hover:text-emerald-600 flex items-center gap-2 transition-colors duration-200">
              <HelpCircle className="h-4 w-4" />
              Support
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-emerald-600 flex items-center gap-2 transition-colors duration-200">
              <MessageCircle className="h-4 w-4" />
              Contact
            </Link>
            <Link to="/pricing" className="text-gray-600 hover:text-emerald-600 transition-colors duration-200">
              Pricing
            </Link>
            {!isLoading && (
              <Link
                to="/app"
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
              >
                {isAuthenticated ? 'Dashboard' : 'Login'}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            {!isLoading && (
              <Link
                to="/app"
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-sm"
              >
                {isAuthenticated ? 'Dashboard' : 'Login'}
              </Link>
            )}
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-emerald-600 transition-colors duration-200"
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
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/docs" 
                className="text-gray-600 hover:text-emerald-600 flex items-center gap-2 transition-colors duration-200 py-2"
                onClick={closeMobileMenu}
              >
                <Book className="h-4 w-4" />
                Documentation
              </Link>
              <Link 
                to="/support" 
                className="text-gray-600 hover:text-emerald-600 flex items-center gap-2 transition-colors duration-200 py-2"
                onClick={closeMobileMenu}
              >
                <HelpCircle className="h-4 w-4" />
                Support
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-600 hover:text-emerald-600 flex items-center gap-2 transition-colors duration-200 py-2"
                onClick={closeMobileMenu}
              >
                <MessageCircle className="h-4 w-4" />
                Contact
              </Link>
              <Link 
                to="/pricing" 
                className="text-gray-600 hover:text-emerald-600 transition-colors duration-200 py-2"
                onClick={closeMobileMenu}
              >
                Pricing
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}