"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompany, Company } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

export default function CompaniesPage() {
  const { companies, refreshCompanies, isLoading, setSelectedCompanyId } = useCompany();
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();

  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditConfig = (company: Company) => {
    setSelectedCompanyId(company.id);
    router.push('/dashboard/settings?tab=general');
  };

  const handleInviteTeam = (company: Company) => {
    setSelectedCompanyId(company.id);
    router.push('/dashboard/settings?tab=team');
  };

  const confirmDeleteModal = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteConfirmText("");
  };

  const executeDelete = async () => {
    if (!companyToDelete) return;
    setIsDeleting(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/companies/${companyToDelete.id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Error al eliminar la empresa.");
      } else {
        await refreshCompanies();
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al eliminar la empresa.");
    } finally {
      setIsDeleting(false);
      setCompanyToDelete(null);
    }
  };

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading businesses...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>{t('companies.title')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{t('companies.subtitle')}</p>
        </div>
        <button className="btn-primary" onClick={() => router.push('/onboarding?new=true')}>{t('companies.newBusiness')}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {companies.map(c => {
          const isDraft = c.status === 'draft';
          const initials = (c.name || t('companies.unnamed')).charAt(0).toUpperCase();
          const avatarGradient = `linear-gradient(135deg, hsl(${(c.name?.length || 0) * 10 % 360}, 70%, 50%), hsl(${(c.name?.length || 0) * 20 % 360}, 70%, 30%))`;
          
          return (
          <div key={c.id} className="glass-panel" style={{ padding: '24px 24px 16px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
               onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* Top row: Avatar + Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ 
                width: 52, height: 52, borderRadius: '14px', 
                background: avatarGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: '#fff', fontSize: '1.6rem', fontWeight: 700,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {initials}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {isDraft && (
                  <div style={{ background: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
                    BORRADOR
                  </div>
                )}
                {c.id.startsWith('demo_') && (
                  <div style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    MOCKUP
                  </div>
                )}
              </div>
            </div>

            {/* Title & Subtitle */}
            <h3 style={{ fontSize: '1.35rem', marginBottom: 6, color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '-0.02em' }}>{c.name || t('companies.unnamed')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.7, fontFamily: 'monospace' }}>ID: {c.id.split('_').pop()?.substring(0, 10) || c.id}</span>
              {c.whatsappPhoneNumberId && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.7, fontFamily: 'monospace' }}>WA ID: {c.whatsappPhoneNumberId}</span>
              )}
              {c.whatsappNumber && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.7, fontFamily: 'monospace' }}>Tel: {c.whatsappNumber}</span>
              )}
            </div>
            
            {/* Actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isDraft ? (
                <button className="btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 600 }} onClick={() => router.push(`/onboarding?draftId=${c.id}`)}>Continuar Configuración ➔</button>
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn-secondary" style={{ flex: 1, padding: '10px' }} onClick={() => handleEditConfig(c)}>{t('companies.editConfig')}</button>
                  <button className="btn-secondary" style={{ flex: 1, padding: '10px' }} onClick={() => handleInviteTeam(c)}>Invitar Equipo</button>
                </div>
              )}
            </div>

            {/* Footer / Delete */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => confirmDeleteModal(c)} 
                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer', opacity: 0.6, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', borderRadius: '6px' }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                {t('companies.delete')}
              </button>
            </div>
          </div>
        )})}
        {companies.length > 0 && (
          <div 
            className="glass-panel" 
            style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 200, borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--border-color)', opacity: 0.8, transition: 'all 0.2s' }}
            onClick={() => router.push('/onboarding?new=true')}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '1', e.currentTarget.style.borderColor = 'var(--accent-color)')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '0.8', e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={{ fontSize: '3rem', marginBottom: 8, color: 'var(--text-secondary)' }}>+</div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Crear otro negocio</h3>
          </div>
        )}
        {companies.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed var(--border-color)' }}>
            <p>{t('companies.noBusinesses')}</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <button className="btn-primary" onClick={() => router.push('/onboarding?new=true')}>
                {t('companies.createOneBusiness')}
              </button>
            </div>
          </div>
        )}
      </div>

      {companyToDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 24 }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: 500, padding: 32 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 16, fontWeight: 600, color: '#ef4444' }}>Borrar Negocio</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Esta acción es permanente y no se puede deshacer. Para confirmar, por favor escribe la siguiente frase:
            </p>
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, fontFamily: 'monospace', marginBottom: 16, userSelect: 'all' }}>
              estoy seguro de borrar {companyToDelete.name}
            </div>
            
            <input 
              type="text" 
              placeholder="Escribe la frase aquí..."
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none', marginBottom: 24 }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn-secondary" onClick={() => setCompanyToDelete(null)}>Cancelar</button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ backgroundColor: '#ef4444' }}
                disabled={isDeleting || deleteConfirmText !== `estoy seguro de borrar ${companyToDelete.name}`}
                onClick={executeDelete}
              >
                {isDeleting ? 'Borrando...' : 'Confirmar Borrado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
