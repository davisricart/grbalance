import React from 'react';
import { Link } from 'react-router-dom';
import clientConfig from '../config/client';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/docs" className="text-gray-600 hover:text-emerald-600">Documentation</Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-600 hover:text-emerald-600">Support Center</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-emerald-600">Contact Us</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-emerald-600">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-emerald-600">Privacy Policy</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Help</h3>
            <p className="text-gray-600 text-sm">
              Need assistance? Our support team is here to help you with any questions or concerns.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mt-2 text-sm font-medium"
            >
              Get Help
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            © {new Date().getFullYear()} GR Balance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}