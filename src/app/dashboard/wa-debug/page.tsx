'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
// No UI imports needed, using standard HTML

export default function WADebugPage() {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState('');
  const [token, setToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      user.getIdToken().then(token => {
        fetch('/api/companies', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).then(companies => {
          if (companies.length > 0) {
            setCompanyId(companies[0].id);
            if (companies[0].metaToken) setToken(companies[0].metaToken);
            if (companies[0].whatsappPhoneNumberId) setPhoneId(companies[0].whatsappPhoneNumberId);
            if (companies[0].wabaId) setWabaId(companies[0].wabaId);
          }
        });
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const authToken = await user?.getIdToken();
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metaToken: token,
          whatsappPhoneNumberId: phoneId,
          wabaId: wabaId,
        })
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setMessage('✅ Credenciales guardadas en la base de datos!');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    }
    setLoading(false);
  };

  const handleCreateTemplate = async () => {
    if (!token || !wabaId) {
      setMessage('Falta el Token o el WABA ID');
      return;
    }
    setLoading(true);
    setMessage('Creando plantilla en Meta...');
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/message_templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `charlo_test_${Date.now()}`,
          language: "es",
          category: "MARKETING",
          components: [
            {
              type: "BODY",
              text: "Hola, esto es una plantilla de prueba para aprobar el App Review de Charlo."
            }
          ]
        })
      });
      const data = await res.json();
      if (data.error) {
        setMessage('❌ Error de Meta: ' + JSON.stringify(data.error));
      } else {
        setMessage('✅ Plantilla creada con éxito! ID: ' + data.id + '. Ya puedes detener la grabación de pantalla del Video 2.');
      }
    } catch (err: any) {
      setMessage('Error de red: ' + err.message);
    }
    setLoading(false);
  };

  if (!user) return <div className="p-10">Inicia sesión primero.</div>;

  return (
    <div className="p-10 max-w-2xl mx-auto font-sans">
      <div className="border rounded-lg p-6 shadow-sm bg-white text-black">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">🔧 Herramienta Interna para App Review</h2>
          <p className="text-sm text-gray-600">Pega los valores temporales del panel de Meta for Developers para inyectarlos en tu empresa activa y poder grabar los videos para la revisión de Meta.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company ID Activa</label>
            <input className="w-full border p-2 rounded" value={companyId} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Temporary Access Token (System User Token)</label>
            <input className="w-full border p-2 rounded" value={token} onChange={(e) => setToken(e.target.value)} placeholder="EAA..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp Phone Number ID</label>
            <input className="w-full border p-2 rounded" value={phoneId} onChange={(e) => setPhoneId(e.target.value)} placeholder="1234567890" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp Business Account (WABA) ID</label>
            <input className="w-full border p-2 rounded" value={wabaId} onChange={(e) => setWabaId(e.target.value)} placeholder="0987654321" />
          </div>
          
          <div className="flex gap-4 pt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50" onClick={handleSave} disabled={loading || !companyId}>
              {loading ? 'Guardando...' : '1. Inyectar Credenciales'}
            </button>
            <button className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50" onClick={handleCreateTemplate} disabled={loading || !wabaId || !token}>
              {loading ? 'Llamando...' : '2. Crear Plantilla (Para Video)'}
            </button>
          </div>

          {message && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md text-sm font-mono whitespace-pre-wrap">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
