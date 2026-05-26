"use client";

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CompanyProvider } from '@/context/CompanyContext';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <CompanyProvider>
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
          <Sidebar />
          <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </CompanyProvider>
    </ProtectedRoute>
  );
}
