import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import { calculateTrialFromCreatedAt } from './services/trialService';

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
const BillingSuccessPage = React.lazy(() => import('./pages/BillingSuccessPage'));
const BillingCancelledPage = React.lazy(() => import('./pages/BillingCancelledPage'));
const BillingWireframe = React.lazy(() => import('./mockups/BillingWireframe'));
const ClientPortalPage = React.lazy(() => import('./pages/ClientPortalPage'));
const BlogPage = React.lazy(() => import('./pages/BlogPage'));
const SimpleBlogPostPage = React.lazy(() => import('./pages/SimpleBlogPostPage'));

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
  const { isAuthenticated, isApproved, isPending, isLoading, userStatus, user } = useAuth();
  const [trialCheckLoading, setTrialCheckLoading] = useState(false);
  
  useEffect(() => {
    const checkTrialExpiry = async () => {
      // Only check trial expiry for trial users
      if (userStatus === 'trial' && user?.created_at) {
        setTrialCheckLoading(true);
        const trialInfo = calculateTrialFromCreatedAt(user.created_at, true);
        
        if (trialInfo.isExpired) {
          // Trial expired - redirect to billing page
          window.location.href = '/billing';
          return;
        }
        setTrialCheckLoading(false);
      }
    };
    
    if (!isLoading && isAuthenticated) {
      checkTrialExpiry();
    }
  }, [userStatus, user, isLoading, isAuthenticated]);
  
  if (isLoading || trialCheckLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Explicitly allow trial and approved users (trial expiry checked in useEffect above)
  if (userStatus === 'trial' || userStatus === 'approved' || isApproved) {
    return <>{children}</>;
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
  
  // Check direct path first (grbalance.com/salon1)
  if (directClientMatch && directClientMatch[1] && directClientMatch[1] !== 'app' && !['register', 'login', 'docs', 'support', 'contact', 'terms', 'privacy', 'pricing', 'book', 'demo', 'interactive-demo', 'admin', 'billing', 'mockup-billing'].includes(directClientMatch[1])) {
    return directClientMatch[1];
  }
  
  // Legacy /client/ support
  if (clientMatch && clientMatch[1]) {
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
  const [usageRefreshTrigger, setUsageRefreshTrigger] = useState(0);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
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
              <Route path="/*" element={
                <Layout usageRefreshTrigger={usageRefreshTrigger}>
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
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:slug" element={<SimpleBlogPostPage />} />
                    <Route path="/book" element={<BookingPage />} />
                    <Route path="/demo" element={<DemoPage />} />
                    <Route path="/interactive-demo" element={<InteractiveDemoPage />} />
                    <Route path="/billing" element={
                      <ProtectedRoute>
                        <BillingPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/billing/success" element={
                      <ProtectedRoute>
                        <BillingSuccessPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/billing/cancelled" element={
                      <ProtectedRoute>
                        <BillingCancelledPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/mockup-billing" element={
                      <ProtectedRoute>
                        <BillingWireframe />
                      </ProtectedRoute>
                    } />
                    {/* Dynamic Client Portal Route */}
                    <Route path="/:clientname" element={
                      <ApprovedUserRoute>
                        <ClientPortalPage />
                      </ApprovedUserRoute>
                    } />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}