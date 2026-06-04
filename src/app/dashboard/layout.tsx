"use client";

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CompanyProvider, useCompany } from '@/context/CompanyContext';
import Sidebar from '@/components/Sidebar';
import BillingWall from '@/components/BillingWall';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <CompanyProvider>
        <DashboardContent>{children}</DashboardContent>
      </CompanyProvider>
    </ProtectedRoute>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { selectedCompany, isLoading, refreshCompanies } = useCompany();

  // If still loading, render nothing or a spinner
  if (isLoading) return null;

  // Evaluate billing wall condition
  let showBillingWall = false;
  if (selectedCompany) {
    const status = selectedCompany.subscription?.status;
    const tier = selectedCompany.subscription?.tier;
    // Free Sandbox tier is allowed
    if (tier === 'free' && status === 'active') {
      showBillingWall = false;
    } else if (status !== 'active' && status !== 'trialing') {
      showBillingWall = true;
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' }}>
        {showBillingWall && selectedCompany && (
          <BillingWall 
            companyId={selectedCompany.id} 
            onComplete={() => refreshCompanies()} 
          />
        )}
        {children}
      </main>
    </div>
  );
}
