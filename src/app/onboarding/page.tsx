"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';

type Message = {
  id: string;
  role: 'user' | 'model';
  parts: { text: string }[];
  options?: string[];
};

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshCompanies, setSelectedCompanyId } = useCompany();
  const { t } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'model', 
      parts: [{ text: "¡Hola! Soy Charlo, tu especialista de onboarding. 🚀\n¿Cómo se llama tu negocio?" }] 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New states for Split Pane
  const [hasStarted, setHasStarted] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    knowledgeBase: '',
    productsCatalog: '',
    persona: 'Eres un asistente virtual amable y servicial.'
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isCreating]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || isCreating) return;

    if (!hasStarted) setHasStarted(true);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', parts: [{ text }] };
    const currentHistory = messages.map(m => ({ ...m, options: undefined }));
    setMessages([...currentHistory, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the current profile state so the AI knows what we already have
        body: JSON.stringify({ message: text, history: currentHistory, profileState: profile }),
      });

      const data = await response.json();

      if (data.toolCall && data.toolCall.name === 'update_profile_preview') {
        // AI sent us new profile data!
        setProfile(prev => ({ ...prev, ...data.toolCall.args }));
        // Add a silent system message if you don't want it, or just use the text if provided
        if (data.text) {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', parts: [{ text: data.text }] }]);
        }
      } 
      else if (data.toolCall && data.toolCall.name === 'ask_multiple_choice') {
        const newMessage: Message = { 
          id: Date.now().toString(), 
          role: 'model', 
          parts: [{ text: data.text }],
          options: data.toolCall.args.options 
        };
        setMessages(prev => [...prev, newMessage]);
      } 
      else if (data.text) {
        const newMessage: Message = { id: Date.now().toString(), role: 'model', parts: [{ text: data.text }] };
        setMessages(prev => [...prev, newMessage]);
      }

      // If the AI decided to call the create_business tool
      if (data.toolCall && data.toolCall.name === 'create_business') {
        setIsCreating(true);
        const args = data.toolCall.args;
        
        // Let the user read the last message before redirecting
        setTimeout(async () => {
          try {
            // Call the CRUD API to actually create the company
            const createRes = await fetch('/api/companies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: args.name || profile.name,
                persona: args.persona || profile.persona,
                productsCatalog: args.productsCatalog || profile.productsCatalog,
                knowledgeBase: args.knowledgeBase || profile.knowledgeBase,
                calendlyLink: ''
              })
            });
            
            if (createRes.ok) {
              const newCompany = await createRes.json();
              await refreshCompanies();
              setSelectedCompanyId(newCompany.id);
              router.push('/dashboard/companies');
            }
          } catch (err) {
            console.error("Failed to provision business:", err);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', parts: [{ text: "❌ Hubo un error al guardar tu negocio en la base de datos." }] }]);
          } finally {
            setIsCreating(false);
          }
        }, 2000);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', parts: [{ text: "Error de conexión con el agente." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-primary)', 
      padding: 24,
      gap: 24,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      
      {/* LEFT PANE: Profile Editor (Only visible after interacting) */}
      <div 
        className="glass-panel" 
        style={{ 
          width: hasStarted ? '400px' : '0px', 
          opacity: hasStarted ? 1 : 0,
          visibility: hasStarted ? 'visible' : 'hidden',
          height: '80vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: hasStarted ? 24 : 0, 
          overflow: 'hidden',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          border: hasStarted ? '1px solid var(--border-color)' : 'none',
          transform: hasStarted ? 'translateX(0)' : 'translateX(-50px)'
        }}
      >
        <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border-color)', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>📄 Perfil en Construcción</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Charlo está analizando internet y tus respuestas para construir esto.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, paddingRight: 8 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Nombre del Negocio:
            <input 
              type="text" 
              value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Horarios, Ubicación y Reglas (Base de Conocimiento):
            <textarea 
              rows={4}
              value={profile.knowledgeBase} 
              onChange={e => setProfile({...profile, knowledgeBase: e.target.value})}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', resize: 'vertical' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Catálogo o Servicios (Markdown aceptado):
            <textarea 
              rows={4}
              value={profile.productsCatalog} 
              onChange={e => setProfile({...profile, productsCatalog: e.target.value})}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', resize: 'vertical' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Personalidad del Agente:
            <textarea 
              rows={2}
              value={profile.persona} 
              onChange={e => setProfile({...profile, persona: e.target.value})}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', resize: 'vertical' }}
            />
          </label>
        </div>
      </div>

      {/* RIGHT PANE: Chat Interface */}
      <div 
        className="glass-panel" 
        style={{ 
          width: '100%', 
          maxWidth: 600, 
          height: '80vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0, 
          overflow: 'hidden',
          transition: 'all 0.5s ease-in-out'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, background: "linear-gradient(to right, var(--accent-color), #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {t('onboarding.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
            {t('onboarding.subtitle')}
          </p>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: 16,
                backgroundColor: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: msg.role === 'model' ? '1px solid var(--border-color)' : 'none',
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
              }}>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.95rem' }}>{msg.parts[0].text}</p>
              </div>
              
              {/* Render clickable buttons if options exist */}
              {msg.options && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {msg.options.map((opt, idx) => (
                    <button 
                      key={idx} 
                      className="btn-primary" 
                      style={{ fontSize: '0.85rem', padding: '8px 16px', borderRadius: 'var(--border-radius-full)' }}
                      onClick={() => handleSend(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && !isCreating && (
            <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
              <div className="typing-indicator" style={{ display: 'flex', gap: 4 }}>
                <span style={{ width: 6, height: 6, backgroundColor: 'var(--text-secondary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                <span style={{ width: 6, height: 6, backgroundColor: 'var(--text-secondary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                <span style={{ width: 6, height: 6, backgroundColor: 'var(--text-secondary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          {isCreating && (
            <div style={{ alignSelf: 'center', padding: '12px 24px', borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="spinner" style={{ width: 16, height: 16, border: '2px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              {t('onboarding.configuring')}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('onboarding.placeholder')}
              disabled={isLoading || isCreating}
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: 'var(--border-radius-full)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.95rem'
              }}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!input.trim() || isLoading || isCreating}
              style={{ borderRadius: 'var(--border-radius-full)', padding: '0 24px' }}
            >
              {t('onboarding.send')}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button type="button" onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
              {t('onboarding.skip')}
            </button>
          </div>
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
