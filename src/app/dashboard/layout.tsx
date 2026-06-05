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
  const { selectedCompany, globalUser, isLoading, refreshCompanies } = useCompany();

  // If still loading, render nothing or a spinner
  if (isLoading) return null;

  // Evaluate billing wall condition against the GLOBAL USER
  let showBillingWall = false;
  if (globalUser) {
    const status = globalUser.subscription?.status;
    const tier = globalUser.subscription?.tier;
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
        {selectedCompany?.isPaused && (
          <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.2rem' }}>⏸️</span>
            <div>
              <strong style={{ display: 'block' }}>Este asistente está pausado.</strong>
              <span style={{ fontSize: '0.9rem' }}>Los clientes recibirán una respuesta automática. Ve a Ajustes para reactivarlo si tu plan lo permite.</span>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
