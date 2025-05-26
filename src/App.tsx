import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ReconciliationApp from './pages/ReconciliationApp';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import DocumentationPage from './pages/DocumentationPage';
import SupportPage from './pages/SupportPage';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import PricingPage from './pages/PricingPage';
import BookingPage from './pages/BookingPage';
import DemoPage from './pages/DemoPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<ReconciliationApp />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/docs" element={<DocumentationPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/book" element={<BookingPage />} />
            <Route path="/demo" element={<DemoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;