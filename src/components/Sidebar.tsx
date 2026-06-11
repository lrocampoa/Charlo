"use client";

import React from 'react';
import Link from 'next/link';
import { CharloLogo } from './CharloLogo';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { companies, selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { t } = useLanguage();

  const extraAdmins = ['lrocampoa@gmail.com'];
  const isAdmin = user?.email?.endsWith('@charlo.ai') || user?.email === 'Charlo@pallets.cr' || (user?.email && extraAdmins.includes(user.email));


  const navItems = [
    { name: `📊 ${t('sidebar.overview')}`, path: '/dashboard' },
    { name: `🏢 ${t('sidebar.manageBusinesses')}`, path: '/dashboard/companies' },
    { name: `📥 ${t('sidebar.inbox')}`, path: '/dashboard/inbox' },
    { name: `👥 ${t('sidebar.customers')}`, path: '/dashboard/customers' },
    { name: `🧠 ${t('sidebar.knowledge')}`, path: '/dashboard/knowledge' },
    { name: `⚠️ ${t('sidebar.gapAnalysis')}`, path: '/dashboard/gaps' },
    { name: `🤖 ${t('sidebar.agents')}`, path: '/dashboard/agents' },
    { name: `📅 ${t('sidebar.reservations')}`, path: '/dashboard/reservations' },
    { name: `🏷️ ${t('sidebar.services')}`, path: '/dashboard/services' },
    { name: `🛍️ ${t('sidebar.orders')}`, path: '/dashboard/orders' },
    { name: `💳 ${t('sidebar.payments')}`, path: '/dashboard/payments' },
    { name: `🎁 ${t('sidebar.loyalty')}`, path: '/dashboard/loyalty' },
    { name: `📢 ${t('sidebar.campaigns')}`, path: '/dashboard/campaigns' },
    { name: `🎮 ${t('sidebar.simulator')}`, path: '/dashboard/test' },
  ];

  return (
    <aside style={{ width: 260, backgroundColor: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <CharloLogo width={120} height={32} />
          {isAdmin && (
            <div style={{ background: 'var(--primary-color)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 12, letterSpacing: '0.05em' }}>
              ADMIN
            </div>
          )}
        </div>
        
        {user && (
          <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            ¡Bienvenido, <strong style={{ color: 'var(--text-primary)' }}>{user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Usuario'}</strong>!
          </div>
        )}

        {/* Global Company Selector */}
        {companies.length === 0 ? (
          <button 
            onClick={() => window.location.href = '/onboarding?new=true'}
            className="btn-primary" 
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem' }}
          >
            {t('sidebar.addBusiness')}
          </button>
        ) : (
          <select 
            value={selectedCompanyId || ''}
            onChange={(e) => {
              const id = e.target.value;
              const comp = companies.find(c => c.id === id);
              if (comp?.status === 'draft') {
                window.location.href = `/onboarding?draftId=${id}`;
              } else {
                setSelectedCompanyId(id);
              }
            }}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
          >
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name || company.id} {company.status === 'draft' ? '(Borrador)' : company.isPaused ? '(Pausado)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>
      <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isAdmin && (
           <Link href="/admin" style={{
              padding: '12px 16px',
              borderRadius: 'var(--border-radius-sm)',
              backgroundColor: pathname === '/admin' ? 'var(--bg-secondary)' : 'transparent',
              color: pathname === '/admin' ? 'var(--accent-color)' : '#eab308',
              fontWeight: pathname === '/admin' ? 600 : 500,
              transition: 'all var(--transition-fast)',
              border: '1px solid rgba(234, 179, 8, 0.3)'
            }}>
              👑 {t('sidebar.globalAdmin')}
            </Link>
        )}
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
          <Link href="/dashboard/account" style={{
              padding: '12px 16px',
              borderRadius: 'var(--border-radius-sm)',
              backgroundColor: pathname === '/dashboard/account' ? 'var(--bg-secondary)' : 'transparent',
              color: pathname === '/dashboard/account' ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: pathname === '/dashboard/account' ? 600 : 400,
              transition: 'all var(--transition-fast)'
          }}>
            👤 {t('sidebar.myAccount')}
          </Link>
          {isAdmin && (
            <>
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
              <Link href="/admin/financials" style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: pathname === '/admin/financials' ? 'var(--bg-secondary)' : 'transparent',
                  color: pathname === '/admin/financials' ? 'var(--accent-color)' : 'var(--text-secondary)',
                  fontWeight: pathname === '/admin/financials' ? 600 : 400,
                  transition: 'all var(--transition-fast)'
              }}>
                💰 Financials
              </Link>
            </>
          )}

        </div>
      </nav>
      <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={logout}>{t('sidebar.signOut')}</button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
