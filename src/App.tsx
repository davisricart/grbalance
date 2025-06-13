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

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<ReconciliationApp />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pending-approval" element={<PendingApprovalPage />} />
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