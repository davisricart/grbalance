import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthProvider';

import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

import RegisterPage from './pages/RegisterPage';

// Lazy load heavy components to improve initial load time
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const AdminLoginPage = React.lazy(() => import('./pages/AdminLoginPage'));
const BookingPage = React.lazy(() => import('./pages/BookingPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const DemoPage = React.lazy(() => import('./pages/DemoPage'));
const DocumentationPage = React.lazy(() => import('./pages/DocumentationPage'));
const InteractiveDemoPage = React.lazy(() => import('./pages/InteractiveDemoPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const PendingApprovalPage = React.lazy(() => import('./pages/PendingApprovalPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const ReconciliationApp = React.lazy(() => import('./pages/ReconciliationApp'));
const SupportPage = React.lazy(() => import('./pages/SupportPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const BillingPage = React.lazy(() => import('./pages/BillingPage'));
const BillingWireframe = React.lazy(() => import('./mockups/BillingWireframe'));
const ClientPortalPage = React.lazy(() => import('./pages/ClientPortalPage'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const ApprovedUserRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isApproved, isPending, isLoading } = useAuth();
  
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

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <Router>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Admin routes - no layout */}
                <Route path="/admin" element={<AdminLoginPage />} />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } />
                
                {/* All other routes - with layout */}
                <Route path="/" element={<Layout><LandingPage /></Layout>} />
                <Route path="/app" element={
                  <Layout>
                    <ApprovedUserRoute>
                      <ReconciliationApp />
                    </ApprovedUserRoute>
                  </Layout>
                } />
                <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
                <Route path="/login" element={<Layout><LoginPage /></Layout>} />
                <Route path="/pending-approval" element={
                  <Layout>
                    <ProtectedRoute>
                      <PendingApprovalPage />
                    </ProtectedRoute>
                  </Layout>
                } />
                <Route path="/docs" element={<Layout><DocumentationPage /></Layout>} />
                <Route path="/support" element={<Layout><SupportPage /></Layout>} />
                <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
                <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
                <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
                <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
                <Route path="/book" element={<Layout><BookingPage /></Layout>} />
                <Route path="/demo" element={<Layout><DemoPage /></Layout>} />
                <Route path="/interactive-demo" element={<Layout><InteractiveDemoPage /></Layout>} />
                <Route path="/billing" element={
                  <Layout>
                    <ProtectedRoute>
                      <BillingPage />
                    </ProtectedRoute>
                  </Layout>
                } />
                <Route path="/mockup-billing" element={
                  <Layout>
                    <ProtectedRoute>
                      <BillingWireframe />
                    </ProtectedRoute>
                  </Layout>
                } />
                {/* Dynamic Client Portal Route */}
                <Route path="/:clientname" element={<Layout><ClientPortalPage /></Layout>} />
                <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}