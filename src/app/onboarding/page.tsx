"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

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
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New states for UX Flow
  const [onboardingStep, setOnboardingStep] = useState(1); // 1 = Connect Accounts, 2 = Chat
  const [extractedProvider, setExtractedProvider] = useState<string | null>(null);

  // Profile States
  const [hasStarted, setHasStarted] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    knowledgeBase: '',
    productsCatalog: '',
    persona: 'Eres un asistente virtual amable y servicial.'
  });

  // Final Step States
  const [showFinalStep, setShowFinalStep] = useState(false);
  const [finalBusinessArgs, setFinalBusinessArgs] = useState<any>(null);
  const [metaToken, setMetaToken] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [facebookPageId, setFacebookPageId] = useState<string | null>(null);
  const [instagramAccountId, setInstagramAccountId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleConnectGoogle = async () => {
    try {
      setIsExtracting(true);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/business.manage');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token) {
        await extractDataFromProvider('google', token);
      }
    } catch (e: any) {
      console.error("Google Connect Error:", e);
      if (e.code !== 'auth/popup-closed-by-user') {
        alert("Error al conectar con Google: " + e.message);
      }
    } finally {
      setIsExtracting(false);
      setOnboardingStep(2); // Move to chat regardless of success/fail to unblock
    }
  };

  const handleConnectFacebook = async () => {
    try {
      setIsExtracting(true);
      
      if (!window.FB) {
        throw new Error("El SDK de Facebook no ha cargado. Por favor, recarga la página.");
      }

      let extractedWabaId: string | null = null;
      let extractedPhoneId: string | null = null;

      const messageListener = (event: MessageEvent) => {
        if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && data.type === 'WA_EMBEDDED_SIGNUP') {
            console.log("META POST-MESSAGE RECIBIDO:", data);
            if (data.event === 'FINISH' || data.event === 'WABA_ONBOARDING_COMPLETED') {
              extractedWabaId = data.data?.waba_id || null;
              extractedPhoneId = data.data?.phone_number_id || null;
              console.log("IDs atrapados en frontend -> WABA:", extractedWabaId, "Phone:", extractedPhoneId);
            }
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      };

      window.addEventListener('message', messageListener);

      window.FB.login((response: any) => {
        // Remove listener after login flow closes
        setTimeout(() => window.removeEventListener('message', messageListener), 2000);

        const handleResponse = async () => {
          if (response.authResponse?.code) {
            const code = response.authResponse.code;
            
            try {
              // Exchange code for token and extract WABA info on backend
              const res = await fetch('/api/onboarding/embedded-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  code,
                  wabaId: extractedWabaId,
                  phoneId: extractedPhoneId
                })
              });
              const data = await res.json();
              
              if (res.ok && data.success) {
                console.log("META DEBUG INFO:", data.debugLogs); // Output everything for debugging
                setMetaToken(data.accessToken);
                if (data.phoneId) setPhoneId(data.phoneId);
                if (data.facebookPageId) setFacebookPageId(data.facebookPageId);
                if (data.instagramAccountId) setInstagramAccountId(data.instagramAccountId);
                
                setProfile(prev => ({ ...prev, ...data.profileUpdate }));
                setExtractedProvider('Meta');
              } else {
                alert("No pudimos extraer la información. Continúa manual. Error: " + (data.error || 'Unknown'));
              }
            } catch (e) {
              console.error("Backend exchange error:", e);
              alert("Error al comunicarse con el servidor.");
            } finally {
              setIsExtracting(false);
              setOnboardingStep(2);
            }
          } else {
            console.error("Facebook Connect Error: No code received", response);
            setIsExtracting(false);
            setOnboardingStep(2);
          }
        };
        handleResponse();
      }, {
        config_id: '2262599374275303',
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          feature: 'whatsapp_embedded_signup',
          sessionInfoVersion: '3'
        }
      });
      
    } catch (e: any) {
      console.error("Facebook Connect Error:", e);
      alert("Error al conectar con Facebook: " + (e.message || "Requiere HTTPS o Hubo un problema."));
      setIsExtracting(false);
      setOnboardingStep(2);
    }
  };

  const extractDataFromProvider = async (provider: 'google' | 'facebook', token: string) => {
    try {
      const res = await fetch('/api/onboarding/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, token })
      });
      const data = await res.json();
      
      if (res.ok && data.profileUpdate) {
        // Automatically merge the extracted data into the UI profile
        setProfile(prev => ({ ...prev, ...data.profileUpdate }));
        setExtractedProvider(provider === 'google' ? 'Google' : 'Meta');
        
        // Auto-fill the Phone Number ID if the API managed to find it
        if (data.extractedPhoneId) {
          setPhoneId(data.extractedPhoneId);
        }
      } else {
        alert("No pudimos extraer información útil de esta cuenta. Por favor, continúa manual.");
      }
    } catch (e) {
      console.error("Extraction error:", e);
    }
  };

  useEffect(() => {
    if (user && messages.length === 0 && onboardingStep === 2) {
      const name = user.displayName?.split(' ')[0]; // We only use displayName as a confident name
      
      let greeting = "";
      if (extractedProvider) {
        greeting = `¡Hola ${name || ''}! Vi que conectaste tu cuenta de ${extractedProvider}. He llenado tu perfil con toda la información que pude encontrar.\n\nRevisemos lo que tenemos. ¿Qué más te gustaría agregar o corregir?`;
      } else {
        greeting = name 
          ? `¡Hola ${name}! Soy Charlo, tu especialista de onboarding. 🚀\n¿Cómo se llama tu negocio?`
          : `¡Hola! Soy Charlo, tu especialista de onboarding. 🚀\nPara empezar a configurar tu IA, ¿cómo te llamas?`;
      }
        
      setMessages([{ id: '1', role: 'model', parts: [{ text: greeting }] }]);
      setHasStarted(true); // Automatically open the side panel
    }
  }, [user, messages.length, onboardingStep, extractedProvider]);

  // Load Facebook SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.FB) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId      : process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
          cookie     : true,
          xfbml      : true,
          version    : 'v19.0'
        });
      };

      (function(d, s, id){
         var js, fjs = d.getElementsByTagName(s)[0] as any;
         if (d.getElementById(id)) {return;}
         js = d.createElement(s) as any; js.id = id;
         js.src = "https://connect.facebook.net/es_LA/sdk.js";
         fjs.parentNode.insertBefore(js, fjs);
       }(document, 'script', 'facebook-jssdk'));
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isCreating]);

  const handleSend = async (text: string, isSilent = false) => {
    if (!text.trim() || isLoading || isCreating) return;

    if (!hasStarted) setHasStarted(true);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', parts: [{ text }] };
    const currentHistory = messages.map(m => ({ ...m, options: undefined }));
    
    if (!isSilent) {
      setMessages([...currentHistory, userMsg]);
    }
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the current profile state so the AI knows what we already have
        body: JSON.stringify({ 
          message: text, 
          history: currentHistory, 
          profileState: profile,
          userContext: {
            name: user?.displayName || "Unknown",
            email: user?.email || "Unknown"
          }
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Error from server");
      }

      if (data.profileUpdate) {
        setProfile(prev => ({ ...prev, ...data.profileUpdate }));
      }

      if (data.toolCall && data.toolCall.name === 'ask_multiple_choice') {
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
        const args = data.toolCall.args;
        setFinalBusinessArgs(args);
        
        // Let the user read the last message before showing modal
        setTimeout(() => {
          setShowFinalStep(true);
        }, 1500);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', parts: [{ text: "Error de conexión con el agente." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async (skipMeta: boolean) => {
    setIsCreating(true);
    try {
      const createRes = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalBusinessArgs?.name || profile.name,
          persona: finalBusinessArgs?.persona || profile.persona,
          productsCatalog: finalBusinessArgs?.productsCatalog || profile.productsCatalog,
          knowledgeBase: finalBusinessArgs?.knowledgeBase || profile.knowledgeBase,
          calendlyLink: '',
          metaAccessToken: skipMeta ? undefined : metaToken,
          whatsappPhoneNumberId: skipMeta ? undefined : phoneId,
          facebookPageId: skipMeta ? undefined : facebookPageId,
          instagramAccountId: skipMeta ? undefined : instagramAccountId,
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
      setIsCreating(false);
      setShowFinalStep(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-primary)', 
      padding: '40px 24px',
      alignItems: 'center',
    }}>
      
      {/* STEPPER */}
      <div className="stepper-container slide-up">
        <div className={`step ${onboardingStep >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <span>Conectar</span>
        </div>
        <div className={`step-line ${onboardingStep >= 2 ? 'active' : ''}`} />
        <div className={`step ${onboardingStep >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <span>Entrenar IA</span>
        </div>
        <div className={`step-line ${showFinalStep ? 'active' : ''}`} />
        <div className={`step ${showFinalStep ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span>Listo</span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        width: '100%',
        maxWidth: 1000,
        flex: 1
      }}>
      
        {/* FINAL STEP MODAL */}
        {showFinalStep && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="glass-panel-premium" style={{ width: 500, padding: 40, display: 'flex', flexDirection: 'column', gap: 24, animation: 'scaleIn 0.3s ease-out' }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 8, background: "linear-gradient(to right, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>¡Ya casi terminamos!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Charlo ha configurado tu agente inteligentemente. Ahora puedes conectarlo a tu cuenta de WhatsApp (Opcional).</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="floating-input-group">
                  <input 
                    type="password"
                    className="floating-input"
                    value={metaToken}
                    onChange={e => setMetaToken(e.target.value)}
                    placeholder=" "
                    style={{ fontFamily: 'monospace' }}
                  />
                  <label className="floating-label">Token de Acceso de Meta (Opcional)</label>
                </div>

                <div className="floating-input-group">
                  <input 
                    type="text"
                    className="floating-input"
                    value={phoneId}
                    onChange={e => setPhoneId(e.target.value)}
                    placeholder=" "
                    style={{ fontFamily: 'monospace' }}
                  />
                  <label className="floating-label">ID del Número de Teléfono (Opcional)</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                <button className="btn-secondary" style={{ flex: 1, padding: '14px 0' }} onClick={() => handleFinalSubmit(true)} disabled={isCreating}>
                  Saltar por ahora
                </button>
                <button className="btn-primary" style={{ flex: 1, backgroundColor: '#10b981', color: '#fff', padding: '14px 0', border: 'none' }} onClick={() => handleFinalSubmit(false)} disabled={isCreating || !metaToken || !phoneId}>
                  {isCreating ? 'Guardando...' : 'Conectar y Finalizar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: INITIAL CONNECTION SCREEN */}
        {onboardingStep === 1 && (
          <div className="glass-panel-premium slide-up" style={{ width: '100%', maxWidth: 500, padding: 48, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 16, background: "linear-gradient(to right, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Conecta tu negocio
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.6 }}>
              Para ahorrarte tiempo, extraemos el nombre, ubicación, y catálogos directamente de tus redes. 
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <button 
                onClick={handleConnectGoogle} 
                disabled={isExtracting}
                className="btn-primary" 
                style={{ padding: '16px 24px', fontSize: '1.05rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#ffffff', color: '#000', transition: 'transform 0.2s', transform: isExtracting ? 'scale(0.98)' : 'scale(1)' }}
              >
                {isExtracting ? <div className="spinner-small" /> : '🌐'}
                {isExtracting ? 'Conectando...' : 'Conectar Google Business'}
              </button>
              
              <button 
                onClick={handleConnectFacebook}
                disabled={isExtracting}
                className="btn-primary" 
                style={{ padding: '16px 24px', fontSize: '1.05rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#1877F2', color: '#fff', transition: 'transform 0.2s', transform: isExtracting ? 'scale(0.98)' : 'scale(1)' }}
              >
                {isExtracting ? <div className="spinner-small" /> : '🔵'}
                {isExtracting ? 'Conectando...' : 'Conectar Meta (WhatsApp)'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '16px 0' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>O</span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
              </div>

              <button 
                onClick={() => setOnboardingStep(2)}
                disabled={isExtracting}
                className="btn-secondary"
                style={{ padding: '16px 24px', fontSize: '1.05rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                ✍️ Llenar manualmente
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LEFT PANE (Profile) - Only visible in Step 2 */}
        {onboardingStep === 2 && (
        <div 
          className="glass-panel-premium slide-up" 
          style={{ 
            width: hasStarted ? '380px' : '0px', 
            opacity: hasStarted ? 1 : 0,
            visibility: hasStarted ? 'visible' : 'hidden',
            height: '75vh', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: hasStarted ? 32 : 0, 
            overflow: 'hidden',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            border: hasStarted ? '1px solid rgba(255,255,255,0.1)' : 'none',
          }}
        >
          <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>📄 Perfil en Construcción</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>Charlo actualiza esto mientras conversan.</p>
          </div>

          <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', flex: 1, paddingRight: 8 }}>
            
            {/* Canales Conectados */}
            <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Canales Conectados
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {phoneId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem' }}>
                    <span>✅</span> WhatsApp
                    <button onClick={() => setPhoneId('')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', marginLeft: 4, opacity: 0.7 }}>✕</button>
                  </div>
                )}
                {facebookPageId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem' }}>
                    <span>✅</span> Messenger
                    <button onClick={() => setFacebookPageId(null)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginLeft: 4, opacity: 0.7 }}>✕</button>
                  </div>
                )}
                {instagramAccountId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)', color: '#ec4899', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem' }}>
                    <span>✅</span> Instagram
                    <button onClick={() => setInstagramAccountId(null)} style={{ background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer', marginLeft: 4, opacity: 0.7 }}>✕</button>
                  </div>
                )}
                {extractedProvider === 'Google' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(234, 67, 53, 0.1)', border: '1px solid rgba(234, 67, 53, 0.3)', color: '#ea4335', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem' }}>
                    <span>✅</span> Google
                    <button onClick={() => setExtractedProvider(null)} style={{ background: 'none', border: 'none', color: '#ea4335', cursor: 'pointer', marginLeft: 4, opacity: 0.7 }}>✕</button>
                  </div>
                )}
                {!phoneId && !facebookPageId && !instagramAccountId && extractedProvider !== 'Google' && (
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', padding: '4px 0' }}>Ningún canal vinculado</span>
                )}
              </div>
            </div>

            <div className="floating-input-group">
              <input 
                type="text" 
                className="floating-input"
                placeholder=" "
                value={profile.name} 
                onChange={e => setProfile({...profile, name: e.target.value})}
              />
              <label className="floating-label">Nombre del Negocio</label>
            </div>

            <div className="floating-input-group">
              <textarea 
                className="floating-input custom-scrollbar"
                placeholder=" "
                rows={4}
                value={profile.knowledgeBase} 
                onChange={e => setProfile({...profile, knowledgeBase: e.target.value})}
                style={{ resize: 'none' }}
              />
              <label className="floating-label">Base de Conocimiento</label>
            </div>

            <div className="floating-input-group">
              <textarea 
                className="floating-input custom-scrollbar"
                placeholder=" "
                rows={3}
                value={profile.productsCatalog} 
                onChange={e => setProfile({...profile, productsCatalog: e.target.value})}
                style={{ resize: 'none' }}
              />
              <label className="floating-label">Catálogo de Productos</label>
            </div>

            <div className="floating-input-group">
              <textarea 
                className="floating-input custom-scrollbar"
                placeholder=" "
                rows={2}
                value={profile.persona} 
                onChange={e => setProfile({...profile, persona: e.target.value})}
                style={{ resize: 'none' }}
              />
              <label className="floating-label">Personalidad del Agente</label>
            </div>
          </div>
        </div>
        )}

        {/* STEP 2: RIGHT PANE (Chat Interface) */}
        {onboardingStep === 2 && (
        <div 
          className="glass-panel-premium slide-up" 
          style={{ 
            width: '100%', 
            maxWidth: 600, 
            height: '75vh', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 0, 
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 600, background: "linear-gradient(to right, var(--accent-color), #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Asistente de Configuración
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
              Responde mis preguntas para entrenar a tu IA.
            </p>
          </div>

          {/* Chat Area */}
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24, backgroundColor: 'rgba(0,0,0,0.1)' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  padding: '14px 18px',
                  borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent-color), #8b5cf6)' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  border: msg.role === 'model' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  boxShadow: msg.role === 'user' ? '0 8px 24px rgba(139, 92, 246, 0.25)' : '0 4px 12px rgba(0,0,0,0.1)',
                  backdropFilter: msg.role === 'model' ? 'blur(10px)' : 'none'
                }}>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.95rem' }}>{msg.parts[0].text}</p>
                </div>
                
                {msg.options && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {msg.options.map((opt, idx) => (
                      <button 
                        key={idx} 
                        style={{ 
                          fontSize: '0.85rem', padding: '10px 18px', borderRadius: 'var(--border-radius-full)', 
                          backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
                          color: '#fff', cursor: 'pointer', transition: 'background 0.2s' 
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
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
              <div style={{ alignSelf: 'flex-start', padding: '14px 20px', borderRadius: '20px 20px 20px 4px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <div className="typing-indicator" style={{ display: 'flex', gap: 6 }}>
                  <span style={{ width: 6, height: 6, backgroundColor: 'var(--accent-color)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                  <span style={{ width: 6, height: 6, backgroundColor: 'var(--accent-color)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                  <span style={{ width: 6, height: 6, backgroundColor: 'var(--accent-color)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            {isCreating && (
              <div style={{ alignSelf: 'center', padding: '14px 24px', borderRadius: 24, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(10px)' }}>
                <div className="spinner-small" style={{ borderTopColor: '#10b981' }}></div>
                {t('onboarding.configuring')}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('onboarding.placeholder')}
                disabled={isLoading || isCreating || showFinalStep}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  borderRadius: 'var(--border-radius-full)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '0.95rem',
                  transition: 'border-color 0.3s, box-shadow 0.3s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-color)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading || isCreating || showFinalStep}
                style={{ 
                  borderRadius: 'var(--border-radius-full)', 
                  padding: '0 24px',
                  background: (!input.trim() || isLoading || isCreating) ? 'rgba(255,255,255,0.1)' : 'var(--accent-color)',
                  color: (!input.trim() || isLoading || isCreating) ? 'rgba(255,255,255,0.5)' : '#fff',
                  border: 'none',
                  cursor: (!input.trim() || isLoading || isCreating) ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  transition: 'background 0.3s'
                }}
              >
                {t('onboarding.send')}
              </button>
            </form>
          </div>
        </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        /* Glassmorphism */
        .glass-panel-premium {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
          border-radius: 24px;
        }

        /* Floating Labels */
        .floating-input-group {
          position: relative;
          margin-bottom: 8px;
        }
        .floating-input {
          width: 100%;
          padding: 20px 16px 8px;
          background: rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          color: #fff !important;
          font-size: 0.95rem;
          transition: border-color 0.3s, box-shadow 0.3s;
          outline: none;
        }
        .floating-input:focus {
          border-color: var(--accent-color) !important;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }
        .floating-label {
          position: absolute;
          left: 16px;
          top: 16px;
          color: var(--text-secondary);
          font-size: 0.95rem;
          pointer-events: none;
          transition: 0.2s ease all;
        }
        .floating-input:focus ~ .floating-label,
        .floating-input:not(:placeholder-shown) ~ .floating-label {
          top: 6px;
          font-size: 0.7rem;
          color: var(--accent-color);
        }

        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Stepper */
        .stepper-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 32px;
        }
        .step {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.4s;
        }
        .step.active {
          color: #fff;
        }
        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          transition: all 0.4s;
        }
        .step.active .step-number {
          background: var(--accent-color);
          color: #fff;
          box-shadow: 0 0 16px rgba(139, 92, 246, 0.5);
        }
        .step-line {
          width: 48px;
          height: 2px;
          background: rgba(255,255,255,0.1);
          transition: background 0.4s;
        }
        .step-line.active {
          background: var(--accent-color);
        }

        /* Animations */
        .slide-up {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
