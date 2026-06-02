"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
};

export default function SimulatorPage() {
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Generate a fresh session ID for testing every time they load the page
    setSessionId(`test_${Date.now()}`);
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text, companyId: selectedCompanyId, sessionId }),
      });

      const data = await response.json();
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: data.reply || t('simulator.error')
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = { id: Date.now().toString(), sender: 'ai', text: t('simulator.connectionError') };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>{t('simulator.title')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          {t('simulator.subtitle')} <span style={{ color: 'var(--accent-color)', fontWeight: 500 }}>{selectedCompany?.name || '...'}</span> {t('simulator.subtitle2')}
        </p>
      </div>

      {!selectedCompanyId ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px dashed var(--border-color)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '16px' }}>🏢</span>
            <h3>{t('simulator.noBusiness')}</h3>
            <p style={{ marginTop: '8px', opacity: 0.8 }}>Please select or create a business to start simulating.</p>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24, backgroundImage: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.03) 0%, transparent 70%)' }}>
            
            {messages.length === 0 && !isLoading ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.6, marginTop: '-40px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✨</div>
                <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Start testing your AI</h3>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px' }}>
                  Send a message to see how the agent responds based on the configured knowledge base and personality.
                </p>
              </div>
            ) : null}

            {messages.map(msg => (
              <div key={msg.id} className="animate-slide-in-up" style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--accent-color) 0%, var(--accent-color-hover) 100%)' : 'rgba(255,255,255,0.03)',
                backdropFilter: msg.sender === 'user' ? 'none' : 'blur(10px)',
                color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                padding: '14px 20px',
                borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                maxWidth: '75%',
                boxShadow: msg.sender === 'user' ? '0 8px 16px -4px rgba(59, 130, 246, 0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
                border: msg.sender === 'user' ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--glass-border)',
                lineHeight: 1.6,
                fontSize: '0.95rem'
              }}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="animate-slide-in-up" style={{ 
                alignSelf: 'flex-start', 
                padding: '16px 20px', 
                background: 'rgba(255,255,255,0.03)', 
                backdropFilter: 'blur(10px)',
                borderRadius: '20px 20px 20px 4px', 
                color: 'var(--text-secondary)', 
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '20px 24px', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--glass-border)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 12, position: 'relative' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('simulator.typeMessage')}
                disabled={isLoading}
                className="glass-input"
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  paddingRight: '60px',
                  borderRadius: 'var(--border-radius-full)',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading} 
                style={{ 
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: (!input.trim() || isLoading) ? 'transparent' : 'var(--accent-color)',
                  color: (!input.trim() || isLoading) ? 'var(--text-secondary)' : '#fff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--transition-fast)',
                  cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  border: 'none',
                  boxShadow: (!input.trim() || isLoading) ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.4)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
