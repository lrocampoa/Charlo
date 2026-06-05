"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export default function SupportWidget() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState('');

  // Render null if not logged in, but must do it AFTER all hooks!

  useEffect(() => {
    // Generate a session ID for this session or reuse one from local storage
    const storedSession = localStorage.getItem('charlo_support_session');
    if (storedSession) {
      setSessionId(storedSession);
    } else {
      const newSession = `web_support_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('charlo_support_session', newSession);
      setSessionId(newSession);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    // Add initial greeting if empty
    if (!isOpen && messages.length === 0) {
      setMessages([
        { id: '1', role: 'model', content: t('supportWidget.initialGreeting') }
      ]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          companyId: 'company_charlo_official', // Fixed Charlo Support ID
          sessionId: sessionId,
          userId: user?.uid // Passing user id for context if needed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const aiMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: data.reply || t('supportWidget.fallbackReply') 
      };
      
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: t('supportWidget.errorConnecting') 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      {/* Chat Window */}
      <div 
        style={{
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          transformOrigin: 'bottom right',
          transform: isOpen ? 'scale(1)' : 'scale(0)',
          opacity: isOpen ? 1 : 0,
          height: isOpen ? '500px' : '0px',
          width: isOpen ? '350px' : '0px',
          maxHeight: '80vh',
          marginBottom: isOpen ? 16 : 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
          borderRadius: 24,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--accent-color)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{t('supportWidget.title')}</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>{t('supportWidget.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={toggleWidget} 
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: 8, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'model' && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                  <Bot size={16} color="var(--accent-color)" />
                </div>
              )}
              <div 
                style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: 16,
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  background: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  borderTopRightRadius: msg.role === 'user' ? 4 : 16,
                  borderTopLeftRadius: msg.role === 'model' ? 4 : 16,
                  border: msg.role === 'model' ? '1px solid var(--border-color)' : 'none'
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                <Bot size={16} color="var(--accent-color)" />
              </div>
              <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: 16, borderTopLeftRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={16} className="animate-spin" color="var(--text-secondary)" />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t('supportWidget.typing')}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
          <form onSubmit={sendMessage} style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('supportWidget.inputPlaceholder')}
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: 24,
                padding: '10px 16px',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-color)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              style={{
                padding: 10,
                borderRadius: '50%',
                background: (!input.trim() || isLoading) ? 'rgba(255,255,255,0.1)' : 'var(--accent-color)',
                color: (!input.trim() || isLoading) ? 'var(--text-secondary)' : 'white',
                border: 'none',
                cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={toggleWidget}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px 0 rgba(0,0,0,0.2)',
          background: isOpen ? 'var(--bg-secondary)' : 'var(--accent-color)',
          color: isOpen ? 'var(--text-primary)' : 'white',
          border: isOpen ? '1px solid var(--border-color)' : 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s, background 0.2s',
          transform: 'scale(1)'
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
