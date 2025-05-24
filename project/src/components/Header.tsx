import React from 'react';
import { Link } from 'react-router-dom';
import { Book, HelpCircle, MessageCircle } from 'lucide-react';
import clientConfig from '../config/client';
import { useAuthState } from '../hooks/useAuthState';
import UsageCounter from './UsageCounter';

export default function Header() {
  const { isAuthenticated, isLoading } = useAuthState();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start gap-2">
            <Link to="/" className="shrink-0">
              <img 
                src={clientConfig.logo}
                alt={`${clientConfig.title} Logo`}
                className="h-12 w-auto"
              />
            </Link>
            {isAuthenticated && <UsageCounter />}
          </div>
          
          <div className="flex items-center gap-8">
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
            </div>
            <div className="flex items-center gap-4">
              {!isLoading && (
                <Link
                  to="/app"
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
                >
                  {isAuthenticated ? 'Dashboard' : 'Login'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}