"use client";

import React, { useState, useEffect } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

export default function AgentConfig() {
  const { selectedCompanyId, companies, refreshCompanies } = useCompany();
  const { user } = useAuth();
  const { t } = useLanguage();

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const [activeAgents, setActiveAgents] = useState<string[]>(['SALES', 'BOOKING']);
  const [persona, setPersona] = useState<string>('Casual');
  const [isSaving, setIsSaving] = useState(false);

  // Booking Config Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingConfig, setBookingConfig] = useState({
    syncSource: 'native',
    maxCapacity: 5,
    operatingHours: '9:00 - 18:00'
  });

  const availableAgents = [
    { id: 'SALES', name: 'Sales Agent', desc: 'Recomienda productos, cierra ventas y genera leads.' },
    { id: 'BOOKING', name: 'Booking Agent', desc: 'Maneja reservas, citas y verifica disponibilidad de agenda.' },
  ];

  useEffect(() => {
    if (selectedCompany) {
      if (selectedCompany.activeAgents) setActiveAgents(selectedCompany.activeAgents);
      if (selectedCompany.persona) setPersona(selectedCompany.persona);
      if (selectedCompany.bookingConfig) setBookingConfig({
        syncSource: selectedCompany.bookingConfig.syncSource || 'native',
        maxCapacity: selectedCompany.bookingConfig.maxCapacity || 5,
        operatingHours: selectedCompany.bookingConfig.operatingHours || '9:00 - 18:00'
      });
    }
  }, [selectedCompany]);

  const saveToFirebase = async (updates: any) => {
    if (!user || !selectedCompanyId) return;
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompanyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        await refreshCompanies();
      } else {
        alert("Error al guardar la configuración.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de red.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAgent = (id: string) => {
    const newActive = activeAgents.includes(id) 
      ? activeAgents.filter(a => a !== id) 
      : [...activeAgents, id];
    setActiveAgents(newActive);
    saveToFirebase({ activeAgents: newActive });
  };

  const handlePersonaChange = (newPersona: string) => {
    setPersona(newPersona);
    saveToFirebase({ persona: newPersona });
  };

  const handleSaveBookingConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveToFirebase({ bookingConfig });
    setIsModalOpen(false);
  };

  if (!selectedCompanyId) {
    return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Selecciona una empresa primero.</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Configurar Agentes</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Controla qué agentes están activos y cómo se comunican.</p>

      <div className="glass-panel" style={{ padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>Tono y Personalidad de Marca</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
          Selecciona cómo quieres que los agentes hablen con tus clientes.
        </p>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {['Casual', 'Profesional', 'Enfocado a Ventas'].map(tone => (
            <button 
              key={tone}
              onClick={() => handlePersonaChange(tone)}
              className={persona === tone ? "btn-primary" : "btn-secondary"}
            >
              {tone}
            </button>
          ))}
        </div>
        {isSaving && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Guardando...</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {availableAgents.map((agent) => {
          const isActive = activeAgents.includes(agent.id);
          return (
            <div key={agent.id} className="glass-panel" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {agent.name}
                  {agent.id === 'BOOKING' && (
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 4, padding: '4px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      ⚙️ Configurar
                    </button>
                  )}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{agent.desc}</p>
              </div>
              <button 
                onClick={() => toggleAgent(agent.id)}
                className={isActive ? 'btn-primary' : 'btn-secondary'}
                style={{ backgroundColor: isActive ? 'var(--success)' : '' }}
              >
                {isActive ? 'Activo' : 'Habilitar'}
              </button>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 500, padding: 32 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Configuración Booking Agent</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>Ajusta cómo la IA verifica disponibilidad y agenda citas.</p>
            
            <form onSubmit={handleSaveBookingConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fuente de Sincronización (Sync Source)</label>
                <select 
                  value={bookingConfig.syncSource}
                  onChange={(e) => setBookingConfig({...bookingConfig, syncSource: e.target.value})}
                  className="glass-input"
                  style={{ padding: '12px 16px', outline: 'none' }}
                >
                  <option value="native">Base de Datos Nativa (Automático)</option>
                  <option value="calendly">Calendly (Modo Conserje)</option>
                  <option value="google_calendar">Google Calendar (Próximamente)</option>
                </select>
                {bookingConfig.syncSource === 'calendly' && (
                  <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>⚠️ La IA solo compartirá tu link de Calendly y no agendará automáticamente.</span>
                )}
              </div>

              {bookingConfig.syncSource === 'native' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Capacidad Máxima por Espacio (Slot)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={bookingConfig.maxCapacity}
                      onChange={(e) => setBookingConfig({...bookingConfig, maxCapacity: parseInt(e.target.value) || 1})}
                      className="glass-input"
                      placeholder="ej. 5"
                      style={{ padding: '12px 16px', outline: 'none' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cuántas personas o reservas puedes atender a la misma hora.</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Horario de Atención</label>
                    <input 
                      type="text" 
                      value={bookingConfig.operatingHours}
                      onChange={(e) => setBookingConfig({...bookingConfig, operatingHours: e.target.value})}
                      className="glass-input"
                      placeholder="ej. Lunes a Viernes, 9:00 - 18:00"
                      style={{ padding: '12px 16px', outline: 'none' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar Configuración</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
