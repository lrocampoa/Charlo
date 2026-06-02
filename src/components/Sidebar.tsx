"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { companies, selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { t } = useLanguage();

  const isAdmin = user?.email?.endsWith('@charlo.ai') || user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;


  const navItems = [
    { name: `📊 ${t('sidebar.overview')}`, path: '/dashboard' },
    { name: `🏢 ${t('sidebar.manageBusinesses')}`, path: '/dashboard/companies' },
    { name: `📥 ${t('sidebar.inbox')}`, path: '/dashboard/inbox' },
    { name: `👥 ${t('sidebar.customers')}`, path: '/dashboard/customers' },
    { name: `🧠 ${t('sidebar.knowledge')}`, path: '/dashboard/knowledge' },
    { name: `⚠️ Mejora Continua`, path: '/dashboard/gaps' },
    { name: `🤖 ${t('sidebar.agents')}`, path: '/dashboard/agents' },
    { name: `📅 ${t('sidebar.reservations')}`, path: '/dashboard/reservations' },
    { name: `🏷️ Servicios`, path: '/dashboard/services' },
    { name: "🛍️ Órdenes", path: '/dashboard/orders' },
    { name: "💳 Pagos", path: '/dashboard/payments' },
    { name: "🎁 Fidelización", path: '/dashboard/loyalty' },
    { name: "📢 Campañas", path: '/dashboard/campaigns' },
    { name: `🎮 ${t('sidebar.simulator')}`, path: '/dashboard/test' },
  ];

  return (
    <aside style={{ width: 260, backgroundColor: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, background: "linear-gradient(to right, var(--accent-color), #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16 }}>Charlo B2B</h1>
        
        {user && (
          <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            ¡Bienvenido, <strong style={{ color: 'var(--text-primary)' }}>{user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Usuario'}</strong>!
          </div>
        )}

        {/* Global Company Selector */}
        <select 
          value={selectedCompanyId || ''}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
        >
          {companies.map(company => (
            <option key={company.id} value={company.id}>{company.name || company.id}</option>
          ))}
        </select>
      </div>
      <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} style={{
              padding: '12px 16px',
              borderRadius: 'var(--border-radius-sm)',
              backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
              color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 400,
              transition: 'all var(--transition-fast)'
            }}>
              {item.name}
            </Link>
          );
        })}
        
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/dashboard/settings" style={{
              padding: '12px 16px',
              borderRadius: 'var(--border-radius-sm)',
              backgroundColor: pathname === '/dashboard/settings' ? 'var(--bg-secondary)' : 'transparent',
              color: pathname === '/dashboard/settings' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: pathname === '/dashboard/settings' ? 600 : 400,
              transition: 'all var(--transition-fast)'
          }}>
            ⚙️ {t('sidebar.settings')}
          </Link>
          {isAdmin && (
            <Link href="/admin" style={{
                padding: '12px 16px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: pathname === '/admin' ? 'var(--bg-secondary)' : 'transparent',
                color: pathname === '/admin' ? 'var(--accent-color)' : 'var(--text-secondary)',
                fontWeight: pathname === '/admin' ? 600 : 400,
                transition: 'all var(--transition-fast)'
            }}>
              👑 Admin Dashboard
            </Link>
          )}

        </div>
      </nav>
      <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)' }}>
        <button className="btn-secondary" style={{ width: '100%' }} onClick={logout}>{t('sidebar.signOut')}</button>
      </div>
    </aside>
  );
}
