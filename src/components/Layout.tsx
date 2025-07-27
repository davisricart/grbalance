import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  usageRefreshTrigger?: number;
}

export default function Layout({ children, usageRefreshTrigger }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header usageRefreshTrigger={usageRefreshTrigger || 0} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}