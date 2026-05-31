"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompany, Company } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { TeamManagement } from '@/components/TeamManagement';

export default function CompaniesPage() {
  const { companies, refreshCompanies, isLoading } = useCompany();
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Company>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [inviteModalCompany, setInviteModalCompany] = useState<Company | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData(company);
    } else {
      setEditingCompany(null);
      setFormData({ name: '', knowledgeBase: '', productsCatalog: '', calendlyLink: '', persona: '', whatsappPhoneNumberId: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const url = editingCompany ? `/api/companies/${editingCompany.id}` : '/api/companies';
    const method = editingCompany ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    await refreshCompanies();
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const confirmDeleteModal = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteConfirmText("");
  };

  const executeDelete = async () => {
    if (!companyToDelete) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/companies/${companyToDelete.id}`, { method: 'DELETE' });
      await refreshCompanies();
    } finally {
      setIsDeleting(false);
      setCompanyToDelete(null);
    }
  };

  const handleGenerateInvite = async (company: Company) => {
    setInviteModalCompany(company);
    setInviteLink('');
    setIsGeneratingInvite(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/companies/${company.id}/invites`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInviteLink(`${window.location.origin}/invite/${data.id}`);
      } else {
        alert("Failed to generate invite: " + data.error);
        setInviteModalCompany(null);
      }
    } catch (e) {
      console.error(e);
      setInviteModalCompany(null);
    } finally {
      setIsGeneratingInvite(false);
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
        <button className="btn-primary" onClick={() => router.push('/onboarding')}>{t('companies.newBusiness')}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {companies.map(c => (
          <div key={c.id} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Mockup Ribbon */}
            {c.id.startsWith('demo_') && (
              <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', padding: '4px 10px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                MOCKUP
              </div>
            )}
            <h3 style={{ fontSize: '1.25rem', marginBottom: 8, color: 'var(--text-primary)', fontWeight: 600, paddingRight: c.id.startsWith('demo_') ? 60 : 0 }}>{c.name || t('companies.unnamed')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 24, fontFamily: 'monospace' }}>{t('companies.id')}: {c.id}</p>
            
            <div style={{ marginTop: 'auto', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-secondary" style={{ flex: 1, minWidth: 100 }} onClick={() => handleOpenModal(c)}>{t('companies.editConfig')}</button>
              <button className="btn-secondary" style={{ flex: 1, minWidth: 100 }} onClick={() => handleGenerateInvite(c)}>Invite Team</button>
              <button className="btn-secondary" style={{ padding: '0 16px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }} onClick={() => confirmDeleteModal(c)}>{t('companies.delete')}</button>
            </div>
          </div>
        ))}
        {companies.length > 0 && (
          <div 
            className="glass-panel" 
            style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 200, borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--border-color)', opacity: 0.8, transition: 'all 0.2s' }}
            onClick={() => router.push('/onboarding')}
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
              <button className="btn-primary" onClick={() => router.push('/onboarding')}>
                Create one business
              </button>
              <button 
                className="btn-secondary" 
                disabled={isSeeding}
                onClick={async () => {
                  setIsSeeding(true);
                  try {
                    const token = await user?.getIdToken();
                    await fetch('/api/seed', { 
                      method: 'POST', 
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    await refreshCompanies();
                  } finally {
                    setIsSeeding(false);
                  }
                }}
              >
                {isSeeding ? "Generando..." : "Generar Datos de Prueba"}
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 24 }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: 700, padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 24, fontWeight: 600 }}>{t('companies.editTitle')}</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('companies.name')}</label>
                <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('companies.whatsappId')}</label>
                  <input type="text" value={formData.whatsappPhoneNumberId || ''} onChange={e => setFormData({...formData, whatsappPhoneNumberId: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('companies.calendlyLink')}</label>
                  <input type="url" value={formData.calendlyLink || ''} onChange={e => setFormData({...formData, calendlyLink: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('companies.persona')}</label>
                <textarea rows={2} required value={formData.persona || ''} onChange={e => setFormData({...formData, persona: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('companies.productsCatalog')}</label>
                <textarea rows={4} value={formData.productsCatalog || ''} onChange={e => setFormData({...formData, productsCatalog: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none', fontFamily: 'monospace' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('companies.knowledgeBase')}</label>
                <textarea rows={5} value={formData.knowledgeBase || ''} onChange={e => setFormData({...formData, knowledgeBase: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('companies.cancel')}</button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  {isSaving ? t('companies.saving') : t('companies.save')}
                </button>
              </div>
            </form>

            {editingCompany && (
              <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>👥</span> Team Access
                </h4>
                <TeamManagement companyId={editingCompany.id} ownerId={editingCompany.ownerId || ''} />
              </div>
            )}
          </div>
        </div>
      )}

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

      {inviteModalCompany && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 24 }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: 500, padding: 32 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 16, fontWeight: 600 }}>Invite Team Members</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Share this link with anyone you want to join <strong>{inviteModalCompany.name || 'this business'}</strong>. They will be granted member access.
            </p>
            
            {isGeneratingInvite ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Generating link...</div>
            ) : (
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <input 
                  type="text" 
                  readOnly 
                  value={inviteLink}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', outline: 'none' }}
                />
                <button 
                  className="btn-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    alert("Copied to clipboard!");
                  }}
                >
                  Copy Link
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setInviteModalCompany(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
