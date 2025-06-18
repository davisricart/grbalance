import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from './hooks/useAuthState';

import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import AdminPage from './pages/AdminPage';
import BookingPage from './pages/BookingPage';
import ContactPage from './pages/ContactPage';
import DemoPage from './pages/DemoPage';
import DocumentationPage from './pages/DocumentationPage';
import InteractiveDemoPage from './pages/InteractiveDemoPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import PricingPage from './pages/PricingPage';
import PrivacyPage from './pages/PrivacyPage';
import ReconciliationApp from './pages/ReconciliationApp';
import RegisterPage from './pages/RegisterPage';
import SupportPage from './pages/SupportPage';
import TermsPage from './pages/TermsPage';
import BillingPage from './pages/BillingPage';
import BillingWireframe from './mockups/BillingWireframe';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthState();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const ApprovedUserRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isApproved, isPending, isLoading } = useAuthState();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (isPending) {
    return <Navigate to="/pending-approval" />;
  }
  
  if (!isApproved) {
    return <Navigate to="/pending-approval" />;
  }
  
  return <>{children}</>;
};

// Add client detection from URL for single-site architecture
const getClientFromURL = () => {
  const path = window.location.pathname;
  
  // Single-site approach: /salon1, /salon2, etc.
  const directClientMatch = path.match(/^\/([^\/]+)$/);
  
  // Legacy support: /client/clientname
  const clientMatch = path.match(/\/client\/([^\/]+)/);
  
  // Subdomain support: salon1.grbalance.com
  const subdomain = window.location.hostname.split('.')[0];
  
  // Check direct path first (grbalance.netlify.app/salon1)
  if (directClientMatch && directClientMatch[1] !== 'app' && !['register', 'login', 'docs', 'support', 'contact', 'terms', 'privacy', 'pricing', 'book', 'demo', 'interactive-demo', 'admin', 'billing', 'mockup-billing'].includes(directClientMatch[1])) {
    return directClientMatch[1];
  }
  
  // Legacy /client/ support
  if (clientMatch) {
    return clientMatch[1];
  }
  
  // Subdomain support
  if (subdomain !== 'grbalance' && subdomain !== 'localhost') {
    return subdomain;
  }
  
  return null;
};

const clientId = getClientFromURL();

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={
              <ApprovedUserRoute>
                <ReconciliationApp />
              </ApprovedUserRoute>
            } />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pending-approval" element={
              <ProtectedRoute>
                <PendingApprovalPage />
              </ProtectedRoute>
            } />
            <Route path="/docs" element={<DocumentationPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/interactive-demo" element={<InteractiveDemoPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/billing" element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            } />
            <Route path="/mockup-billing" element={
              <ProtectedRoute>
                <BillingWireframe />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}