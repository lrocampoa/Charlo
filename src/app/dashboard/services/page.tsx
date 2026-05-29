"use client";

import React, { useState, useEffect } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';

interface Service {
  id: string;
  name: string;
  type: 'appointment' | 'event';
  durationMinutes: number;
  capacity: number;
  price: number;
}

export default function ServicesPage() {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestedServices, setSuggestedServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Partial<Service>>({
    name: '', type: 'appointment', durationMinutes: 30, capacity: 1, price: 0
  });

  const fetchServices = async () => {
    if (!user || !selectedCompanyId) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompanyId}/services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [selectedCompanyId, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCompanyId) return;
    try {
      const token = await user.getIdToken();
      const method = editingService.id ? 'PUT' : 'POST';
      const url = editingService.id 
        ? `/api/companies/${selectedCompanyId}/services/${editingService.id}`
        : `/api/companies/${selectedCompanyId}/services`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingService)
      });

      if (res.ok) {
        await fetchServices();
        setIsModalOpen(false);
      } else {
        alert("Error al guardar el servicio");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este servicio?")) return;
    if (!user || !selectedCompanyId) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/companies/${selectedCompanyId}/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setServices(services.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const generateWithAI = async () => {
    if (!user || !selectedCompanyId) return;
    setGenerating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompanyId}/services/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSuggestedServices(data.services || []);
        setIsAiModalOpen(true);
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error generating services.");
    } finally {
      setGenerating(false);
    }
  };

  const saveSuggestedServices = async () => {
    if (!user || !selectedCompanyId) return;
    setGenerating(true);
    try {
      const token = await user.getIdToken();
      // Save all in sequence or batch
      for (const s of suggestedServices) {
        await fetch(`/api/companies/${selectedCompanyId}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(s)
        });
      }
      await fetchServices();
      setIsAiModalOpen(false);
      setSuggestedServices([]);
    } catch (e) {
      console.error(e);
      alert("Error saving some services.");
    } finally {
      setGenerating(false);
    }
  };

  const openNewModal = () => {
    setEditingService({ name: '', type: 'appointment', durationMinutes: 30, capacity: 1, price: 0 });
    setIsModalOpen(true);
  };

  if (!selectedCompanyId) {
    return <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Selecciona una empresa primero.</div>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>🏷️</span> Servicios Bookeables
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Define los servicios, clases o tours que el agente IA puede reservar.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={generateWithAI} disabled={generating} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: 20 }}>
            {generating ? 'Generando...' : '✨ Generar con IA'}
          </button>
          <button onClick={openNewModal} className="btn-primary" style={{ padding: '10px 20px', borderRadius: 20 }}>
            + Nuevo Servicio
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Cargando servicios...</div>
      ) : services.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
          No has creado ningún servicio. Haz clic en "Nuevo Servicio" para empezar.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {services.map(service => (
            <div key={service.id} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{service.name}</h3>
                <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 4, textTransform: 'capitalize' }}>
                  {service.type === 'appointment' ? 'Cita' : 'Evento'}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>⏱️</span> {service.durationMinutes} minutos
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>👥</span> Capacidad: {service.capacity}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>💰</span> ₡{service.price?.toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => { setEditingService(service); setIsModalOpen(true); }}
                  className="btn-secondary" style={{ flex: 1, padding: '8px' }}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(service.id)}
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 500, padding: 32 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>
              {editingService.id ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nombre del Servicio</label>
                <input 
                  type="text" 
                  value={editingService.name}
                  onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                  className="glass-input"
                  placeholder="ej. Corte Clásico, Tour Volcán"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tipo</label>
                  <select 
                    value={editingService.type}
                    onChange={(e) => setEditingService({...editingService, type: e.target.value as any})}
                    className="glass-input"
                  >
                    <option value="appointment">Cita (1 a 1)</option>
                    <option value="event">Evento / Clase (Grupal)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Duración (min)</label>
                  <input 
                    type="number" 
                    value={editingService.durationMinutes}
                    onChange={(e) => setEditingService({...editingService, durationMinutes: parseInt(e.target.value) || 0})}
                    className="glass-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Capacidad Max.</label>
                  <input 
                    type="number" 
                    value={editingService.capacity}
                    onChange={(e) => setEditingService({...editingService, capacity: parseInt(e.target.value) || 1})}
                    className="glass-input"
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Precio (CRC)</label>
                  <input 
                    type="number" 
                    value={editingService.price}
                    onChange={(e) => setEditingService({...editingService, price: parseInt(e.target.value) || 0})}
                    className="glass-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar Servicio</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAiModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 700, padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>✨ Servicios Sugeridos</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>La IA ha extraído estos servicios de tu Base de Conocimiento. Revisa, edita si es necesario, y guárdalos.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {suggestedServices.map((svc, idx) => (
                <div key={idx} style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: '1 1 40%', minWidth: 200 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre</label>
                    <input type="text" value={svc.name} className="glass-input" style={{ width: '100%' }}
                      onChange={(e) => {
                        const newArr = [...suggestedServices];
                        newArr[idx].name = e.target.value;
                        setSuggestedServices(newArr);
                      }}
                    />
                  </div>
                  <div style={{ flex: '1 1 20%', minWidth: 100 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tipo</label>
                    <select value={svc.type} className="glass-input" style={{ width: '100%' }}
                      onChange={(e) => {
                        const newArr = [...suggestedServices];
                        newArr[idx].type = e.target.value as 'appointment' | 'event';
                        setSuggestedServices(newArr);
                      }}
                    >
                      <option value="appointment">Cita</option>
                      <option value="event">Evento</option>
                    </select>
                  </div>
                  <div style={{ flex: '1 1 15%', minWidth: 80 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Minutos</label>
                    <input type="number" value={svc.durationMinutes} className="glass-input" style={{ width: '100%' }}
                      onChange={(e) => {
                        const newArr = [...suggestedServices];
                        newArr[idx].durationMinutes = parseInt(e.target.value) || 30;
                        setSuggestedServices(newArr);
                      }}
                    />
                  </div>
                  <div style={{ flex: '1 1 10%', minWidth: 60 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cap.</label>
                    <input type="number" value={svc.capacity} className="glass-input" style={{ width: '100%' }}
                      onChange={(e) => {
                        const newArr = [...suggestedServices];
                        newArr[idx].capacity = parseInt(e.target.value) || 1;
                        setSuggestedServices(newArr);
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={() => {
                        const newArr = [...suggestedServices];
                        newArr.splice(idx, 1);
                        setSuggestedServices(newArr);
                    }} style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              
              {suggestedServices.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>No hay servicios en la lista.</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setIsAiModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button type="button" onClick={saveSuggestedServices} className="btn-primary" style={{ flex: 1 }} disabled={generating || suggestedServices.length === 0}>
                {generating ? 'Guardando...' : 'Guardar Todos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
