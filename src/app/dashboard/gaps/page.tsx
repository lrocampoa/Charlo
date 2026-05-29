"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';

interface Gap {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

export default function GapsPage() {
  const { user } = useAuth();
  const { selectedCompanyId } = useCompany();
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [resolutions, setResolutions] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGaps() {
      if (!user || !selectedCompanyId) return;
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/companies/${selectedCompanyId}/gaps`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGaps(data.gaps || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchGaps();
  }, [selectedCompanyId, user]);

  const handleResolve = async (gap: Gap) => {
    if (!user || !selectedCompanyId) return;
    const text = resolutions[gap.id];
    if (!text || text.trim().length === 0) {
      alert("Por favor, ingresa el procedimiento para resolver esta duda.");
      return;
    }

    setResolving(gap.id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompanyId}/gaps`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gapId: gap.id,
          question: gap.description,
          resolutionText: text
        })
      });

      if (res.ok) {
        setGaps(prev => prev.filter(g => g.id !== gap.id));
        alert("¡Resuelto! La IA ha memorizado este nuevo procedimiento.");
      } else {
        const errData = await res.json();
        alert(errData.error || "Error al resolver la brecha.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red.");
    } finally {
      setResolving(null);
    }
  };

  if (!selectedCompanyId) {
    return <div style={{ color: 'var(--text-secondary)' }}>Selecciona una empresa para ver sus áreas de mejora.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>⚠️</span> Mejora Continua
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Nuestro Agente de Calidad (QA) ha detectado preguntas que la IA no pudo responder. 
          Escribe el procedimiento aquí y la IA lo memorizará instantáneamente.
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Cargando...</div>
      ) : gaps.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>¡Tu IA lo sabe todo!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>No hay brechas de conocimiento pendientes.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
          {gaps.map((gap) => (
            <div key={gap.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  ❓ {gap.description}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  padding: '4px 8px', 
                  borderRadius: 12, 
                  background: gap.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : gap.severity === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: gap.severity === 'high' ? '#ef4444' : gap.severity === 'medium' ? '#f59e0b' : '#10b981',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {gap.severity}
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Detectado el: {new Date(gap.createdAt).toLocaleString()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Escribe la respuesta o procedimiento a seguir:</label>
                <textarea
                  value={resolutions[gap.id] || ''}
                  onChange={(e) => setResolutions({ ...resolutions, [gap.id]: e.target.value })}
                  placeholder="Ej: Para devoluciones internacionales, el cliente debe..."
                  rows={4}
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              <button 
                onClick={() => handleResolve(gap)}
                className="btn-primary"
                disabled={resolving === gap.id}
                style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {resolving === gap.id ? '🧠 Enseñando...' : 'Enseñar a la IA'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
