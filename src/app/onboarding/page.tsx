"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

import { Suspense } from 'react';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshCompanies, setSelectedCompanyId } = useCompany();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [dbDraftId, setDbDraftId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New states for UX Flow
  const [onboardingStep, setOnboardingStep] = useState(1); // 1 = Connect Accounts, 2 = Chat
  const [extractedProvider, setExtractedProvider] = useState<string | null>(null);
  const [showGoogleError, setShowGoogleError] = useState(false);

  const DEFAULT_TOPICS: Topic[] = [
    { id: 'identidad', title: 'Identidad y Tono', content: 'Eres un asistente virtual amable y servicial.' },
    { id: 'conocimiento', title: 'Base de Conocimiento General', content: '' },
    { id: 'catalogo', title: 'Catálogo de Productos', content: '' },
    { id: 'politicas', title: 'Reglas de Negocio / Políticas', content: '' }
  ];

  // Profile States
  const [hasStarted, setHasStarted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  
  const [profile, setProfile] = useState({
    name: '',
    topics: DEFAULT_TOPICS,
    needsWebsiteUpsell: false
  });

  // Final Step States
  const [showFinalStep, setShowFinalStep] = useState(false);
  const [finalBusinessArgs, setFinalBusinessArgs] = useState<any>(null);
  const [metaToken, setMetaToken] = useState("");
  const [phoneId, setPhoneId] = useState("");
  const [facebookPageId, setFacebookPageId] = useState<string | null>(null);
  const [instagramAccountId, setInstagramAccountId] = useState<string | null>(null);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [scannedUrls, setScannedUrls] = useState<Array<{ url: string, contentHash: string, docType: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Asset Selection States
  const [availablePhones, setAvailablePhones] = useState<any[]>([]);
  const [availablePages, setAvailablePages] = useState<any[]>([]);
  const [showAssetSelection, setShowAssetSelection] = useState(false);
  const [selectedPhoneId, setSelectedPhoneId] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [tempMetaData, setTempMetaData] = useState<any>(null);

  // Products Review States
  const [extractedProducts, setExtractedProducts] = useState<any[]>([]);
  const [baseCurrency, setBaseCurrency] = useState('CRC');
  const [syncToMeta, setSyncToMeta] = useState(true);
  const [showProductReview, setShowProductReview] = useState(false);

  // Draft Save / Load Logic
  const [isHydrated, setIsHydrated] = useState(false);

  const mergeTopics = (prevTopics: Topic[], newTopics: Topic[]) => {
    const merged = [...prevTopics];
    newTopics.forEach(nt => {
      const idx = merged.findIndex(t => t.id === nt.id);
      if (idx !== -1) {
        // Append text if it's the 'conocimiento' or 'catalogo' topic, else replace
        if ((nt.id === 'conocimiento' || nt.id === 'catalogo') && merged[idx].content) {
          if (merged[idx].content.includes('Describe aquí tus principales productos')) {
             merged[idx] = nt; // Overwrite default
          } else {
             merged[idx] = { ...merged[idx], content: merged[idx].content + '\n\n' + nt.content };
          }
        } else {
          merged[idx] = nt;
        }
      } else {
        merged.push(nt);
      }
    });
    return merged;
  };

  const applyProfileUpdate = (update: any) => {
    setProfile(prev => {
      const p = { ...prev };
      if (update.name) p.name = update.name;
      if (update.topics && Array.isArray(update.topics)) {
        p.topics = mergeTopics(p.topics, update.topics);
      }
      return p;
    });
  };

  useEffect(() => {
    const initDraft = async () => {
      const isNew = searchParams.get('new') === 'true';
      if (isNew) {
        localStorage.removeItem('charlo_onboarding_draft');
        window.history.replaceState({}, '', '/onboarding'); // Remove query param from URL so refresh doesn't clear it again
        setIsHydrated(true);
        return;
      }

      const urlDraftId = searchParams.get('draftId');
      if (urlDraftId && user) {
        try {
          const authToken = await user.getIdToken();
          const res = await fetch(`/api/onboarding/draft?id=${urlDraftId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.draftData) {
              const parsed = data.draftData;
              if (parsed.onboardingStep) setOnboardingStep(parsed.onboardingStep);
              if (parsed.profile) {
                if (!parsed.profile.topics) {
                  // Migrate legacy
                  const topics = [...DEFAULT_TOPICS];
                  if (parsed.profile.persona) {
                    const idx = topics.findIndex(t => t.id === 'identidad');
                    if (idx !== -1) topics[idx] = { ...topics[idx], content: parsed.profile.persona };
                  }
                  if (parsed.profile.knowledgeBase) {
                    const idx = topics.findIndex(t => t.id === 'conocimiento');
                    if (idx !== -1) topics[idx] = { ...topics[idx], content: parsed.profile.knowledgeBase };
                  }
                  if (parsed.profile.productsCatalog) {
                    const idx = topics.findIndex(t => t.id === 'catalogo');
                    if (idx !== -1) topics[idx] = { ...topics[idx], content: parsed.profile.productsCatalog };
                  }
                  setProfile({ ...parsed.profile, topics });
                } else {
                  setProfile(parsed.profile);
                }
              }
              if (parsed.messages) setMessages(parsed.messages);
              if (parsed.extractedProvider) setExtractedProvider(parsed.extractedProvider);
              if (parsed.metaToken) setMetaToken(parsed.metaToken);
              if (parsed.phoneId) setPhoneId(parsed.phoneId);
              if (parsed.facebookPageId) setFacebookPageId(parsed.facebookPageId);
              if (parsed.instagramAccountId) setInstagramAccountId(parsed.instagramAccountId);
              if (parsed.hasPaymentMethod !== undefined) setHasPaymentMethod(parsed.hasPaymentMethod);
              if (parsed.extractedProducts) setExtractedProducts(parsed.extractedProducts);
              if (parsed.hasStarted) setHasStarted(parsed.hasStarted);
              if (parsed.scannedUrls) setScannedUrls(parsed.scannedUrls);
            }
            setDbDraftId(urlDraftId);
            setIsHydrated(true);
            return;
          }
        } catch (e) {
          console.error("Failed to fetch DB draft", e);
        }
      }

      // Fallback to local storage
      const draft = localStorage.getItem('charlo_onboarding_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.onboardingStep) setOnboardingStep(parsed.onboardingStep);
          if (parsed.profile) {
            if (!parsed.profile.topics) {
              // Migrate legacy
              const topics = [...DEFAULT_TOPICS];
              if (parsed.profile.persona) {
                const idx = topics.findIndex(t => t.id === 'identidad');
                if (idx !== -1) topics[idx] = { ...topics[idx], content: parsed.profile.persona };
              }
              if (parsed.profile.knowledgeBase) {
                const idx = topics.findIndex(t => t.id === 'conocimiento');
                if (idx !== -1) topics[idx] = { ...topics[idx], content: parsed.profile.knowledgeBase };
              }
              if (parsed.profile.productsCatalog) {
                const idx = topics.findIndex(t => t.id === 'catalogo');
                if (idx !== -1) topics[idx] = { ...topics[idx], content: parsed.profile.productsCatalog };
              }
              setProfile({ ...parsed.profile, topics });
            } else {
              setProfile(parsed.profile);
            }
          }
          if (parsed.messages) setMessages(parsed.messages);
          if (parsed.extractedProvider) setExtractedProvider(parsed.extractedProvider);
          if (parsed.metaToken) setMetaToken(parsed.metaToken);
          if (parsed.phoneId) setPhoneId(parsed.phoneId);
          if (parsed.facebookPageId) setFacebookPageId(parsed.facebookPageId);
          if (parsed.instagramAccountId) setInstagramAccountId(parsed.instagramAccountId);
          if (parsed.hasPaymentMethod !== undefined) setHasPaymentMethod(parsed.hasPaymentMethod);
          if (parsed.extractedProducts) setExtractedProducts(parsed.extractedProducts);
          if (parsed.hasStarted) setHasStarted(parsed.hasStarted);
          if (parsed.scannedUrls) setScannedUrls(parsed.scannedUrls);
          if (parsed.dbDraftId) setDbDraftId(parsed.dbDraftId);
        } catch (e) {
          console.error("Failed to load draft", e);
        }
      }
      setIsHydrated(true);
    };

    if (user) {
      initDraft();
    } else {
      // Allow it to hydrate local storage even without user
      initDraft();
    }
  }, [user, searchParams]);

  useEffect(() => {
    if (!isHydrated) return;
    const draft = {
      onboardingStep,
      profile,
      messages,
      extractedProvider,
      metaToken,
      phoneId,
      facebookPageId,
      instagramAccountId,
      hasPaymentMethod,
      extractedProducts,
      hasStarted,
      scannedUrls,
      dbDraftId
    };
    localStorage.setItem('charlo_onboarding_draft', JSON.stringify(draft));

    // Save to DB Draft with a debounce
    if (user && hasStarted) {
      const saveToDb = async () => {
        try {
          const authToken = await user.getIdToken();
          const res = await fetch('/api/onboarding/draft', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ draftId: dbDraftId, ...draft })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.draftId && data.draftId !== dbDraftId) {
              setDbDraftId(data.draftId);
            }
          }
        } catch (e) {
          console.error("Failed to save DB draft", e);
        }
      };

      const timeoutId = setTimeout(saveToDb, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [
    isHydrated, onboardingStep, profile, messages, extractedProvider, 
    metaToken, phoneId, facebookPageId, instagramAccountId, 
    hasPaymentMethod, extractedProducts, hasStarted, scannedUrls, dbDraftId, user
  ]);

  const handleConfirmAssetSelection = () => {
    const data = tempMetaData;
    const chosenPhone = availablePhones.find(p => p.id === selectedPhoneId);
    const chosenPage = availablePages.find(p => p.id === selectedPageId);

    setMetaToken(data.accessToken);
    if (chosenPhone) {
      setPhoneId(chosenPhone.id);
      setHasPaymentMethod(chosenPhone.hasPaymentMethod);
    }
    if (chosenPage) setFacebookPageId(chosenPage.id);
    if (data.instagramAccountId) setInstagramAccountId(data.instagramAccountId);
    
    let update: any = {};
    if (chosenPage) {
      if (chosenPage.name) update.name = chosenPage.name;
      let kb = `ID de WhatsApp Business: ${chosenPhone?.wabaId || "Desconocido"}\n`;
      if (chosenPage.phone) kb += `Teléfono FB: ${chosenPage.phone}\n`;
      if (chosenPage.website) kb += `Sitio Web: ${chosenPage.website}\n`;
      if (chosenPage.about) kb += `\nSobre nosotros:\n${chosenPage.about}`;
      update.topics = [{ id: 'conocimiento', title: 'Base de Conocimiento General', content: kb }];
    } else if (chosenPhone) {
       update.name = chosenPhone.verified_name || "Mi Negocio de WhatsApp";
       update.topics = [{ id: 'conocimiento', title: 'Base de Conocimiento General', content: `ID de WhatsApp Business: ${chosenPhone.wabaId}\n` }];
    }

    applyProfileUpdate(update);
    setExtractedProvider('Meta');
    setShowAssetSelection(false);
    setOnboardingStep(2);
  };

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
        setOnboardingStep(3);
      }
    } catch (e: any) {
      console.error("Google Connect Error:", e);
      if (e.code !== 'auth/popup-closed-by-user') {
        alert("Error al conectar con Google: " + e.message);
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleNoWebsite = () => {
    setProfile(prev => ({ ...prev, needsWebsiteUpsell: true }));
    setOnboardingStep(4);
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
            } else if (data.event === 'CANCEL' || data.event === 'ERROR') {
              console.log("Meta Onboarding Cancelled or Errored");
              setIsExtracting(false);
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
                console.log("META DEBUG INFO:", data.debugLogs); 
                
                if ((data.availablePhones && data.availablePhones.length > 1) || 
                    (data.availablePages && data.availablePages.length > 1)) {
                  
                  setAvailablePhones(data.availablePhones || []);
                  setAvailablePages(data.availablePages || []);
                  setSelectedPhoneId(data.availablePhones?.[0]?.id || "");
                  setSelectedPageId(data.availablePages?.[0]?.id || "");
                  setTempMetaData(data);
                  setShowAssetSelection(true);
                  setIsExtracting(false);
                  return; 
                  
                } else {
                  const singlePhone = data.availablePhones?.[0];
                  const singlePage = data.availablePages?.[0];

                  setMetaToken(data.accessToken);
                  if (singlePhone) {
                    setPhoneId(singlePhone.id);
                    setHasPaymentMethod(singlePhone.hasPaymentMethod);
                  }
                  if (singlePage) setFacebookPageId(singlePage.id);
                  if (data.instagramAccountId) setInstagramAccountId(data.instagramAccountId);
                  
                  let update: any = {};
                  if (singlePage) {
                    if (singlePage.name) update.name = singlePage.name;
                    let kb = `ID de WhatsApp Business: ${singlePhone?.wabaId || "Desconocido"}\n`;
                    if (singlePage.phone) kb += `Teléfono FB: ${singlePage.phone}\n`;
                    if (singlePage.website) kb += `Sitio Web: ${singlePage.website}\n`;
                    if (singlePage.about) kb += `\nSobre nosotros:\n${singlePage.about}`;
                    update.topics = [{ id: 'conocimiento', title: 'Base de Conocimiento General', content: kb }];
                  } else if (singlePhone) {
                     update.name = singlePhone.verified_name || "Mi Negocio de WhatsApp";
                     update.topics = [{ id: 'conocimiento', title: 'Base de Conocimiento General', content: `ID de WhatsApp Business: ${singlePhone.wabaId}\n` }];
                  }
                  
                  applyProfileUpdate(update);
                  setExtractedProvider('Meta');
                  setIsExtracting(false);
                  setOnboardingStep(2);
                }
              } else {
                alert("No pudimos extraer la información. Continúa manual. Error: " + (data.error || 'Unknown'));
                setIsExtracting(false);
                setOnboardingStep(2);
              }
            } catch (e) {
              console.error("Backend exchange error:", e);
              alert("Error al comunicarse con el servidor.");
            } finally {
              // We only proceed if not showing the asset selection
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
        override_default_response_type: true
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
      const authToken = await user?.getIdToken();
      const res = await fetch('/api/onboarding/extract', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ provider, token })
      });
      const data = await res.json();
      
      if (res.ok && data.profileUpdate) {
        // Automatically merge the extracted data into the UI profile
        applyProfileUpdate(data.profileUpdate);
        setExtractedProvider(provider === 'google' ? 'Google' : 'Meta');
        
        // Auto-fill the Phone Number ID if the API managed to find it
        if (data.extractedPhoneId) {
          setPhoneId(data.extractedPhoneId);
        }
      } else {
        if (provider === 'google') {
          console.error("Google Extraction Error:", data.error);
          alert("Error de Google: " + data.error);
          setShowGoogleError(true);
        } else {
          alert("No pudimos extraer información útil de esta cuenta. Por favor, continúa manual. Error: " + (data.error || ""));
        }
      }
    } catch (e) {
      console.error("Extraction error:", e);
    }
  };

  const handleScrapeUrl = async () => {
    if (!websiteUrl) return;
    
    if (scannedUrls.length >= 5) {
      alert("Has alcanzado el límite de 5 páginas. Continúa al siguiente paso.");
      return;
    }

    let fetchUrl = websiteUrl.trim().replace(/,/g, '.');
    if (!fetchUrl.startsWith('http')) fetchUrl = `https://${fetchUrl}`;
    
    if (scannedUrls.some(s => s.url === fetchUrl)) {
      alert("Esta página ya ha sido escaneada.");
      return;
    }

    setIsExtracting(true);
    try {
      const authToken = await user?.getIdToken();
      const res = await fetch('/api/onboarding/scrape-url', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ url: fetchUrl })
      });
      const data = await res.json();
      if (res.ok && data.profileUpdate) {
        applyProfileUpdate(data.profileUpdate);
        
        setScannedUrls(prev => [...prev, { url: fetchUrl, contentHash: data.hash, docType: data.docType || 'website' }]);
        setWebsiteUrl('');

        if (data.extractedProducts && data.extractedProducts.length > 0) {
          setExtractedProducts(prev => [...prev, ...data.extractedProducts]);
          setShowProductReview(true);
        }
      } else {
        alert("Error extrayendo sitio web: " + (data.error || "Desconocido"));
      }
    } catch (e) {
      console.error(e);
      alert("Error de red.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemoveUrl = (index: number) => {
    setScannedUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    try {
      const authToken = await user?.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/onboarding/upload-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.profileUpdate) {
        applyProfileUpdate(data.profileUpdate);
        setExtractedProvider('Documento');
        if (data.extractedProducts && data.extractedProducts.length > 0) {
          setExtractedProducts(prev => [...prev, ...data.extractedProducts]);
          setShowProductReview(true);
        } else {
          setOnboardingStep(5);
        }
      } else {
        alert("Error procesando archivo: " + (data.error || "Desconocido"));
      }
    } catch (e) {
      console.error(e);
      alert("Error de red.");
    } finally {
      setIsExtracting(false);
    }
  };

  useEffect(() => {
    if (user && messages.length === 0 && onboardingStep === 4) {
      const name = user.displayName?.split(' ')[0]; // We only use displayName as a confident name
      
      let greeting = "";
      if (extractedProvider) {
        greeting = `¡Hola ${name || ''}! Vi que conectaste información de tu negocio. He llenado tu perfil con toda la información que pude encontrar.\n\nRevisemos lo que tenemos. ¿Qué más te gustaría agregar o corregir?`;
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
         let js, fjs = d.getElementsByTagName(s)[0] as any;
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
        applyProfileUpdate(data.profileUpdate);
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
          persona: (finalBusinessArgs?.topics || profile.topics).find((t: Topic) => t.id === 'identidad')?.content || '',
          productsCatalog: (finalBusinessArgs?.topics || profile.topics).find((t: Topic) => t.id === 'catalogo')?.content || '',
          knowledgeBase: (finalBusinessArgs?.topics || profile.topics).filter((t: Topic) => t.id !== 'identidad' && t.id !== 'catalogo').map((t: Topic) => `### ${t.title}\n${t.content}`).join('\n\n'),
          calendlyLink: '',
          metaAccessToken: skipMeta ? undefined : metaToken,
          whatsappPhoneNumberId: skipMeta ? undefined : phoneId,
          facebookPageId: skipMeta ? undefined : facebookPageId,
          instagramAccountId: skipMeta ? undefined : instagramAccountId,
          extractedServices: finalBusinessArgs?.extractedServices || [],
          extractedProducts: extractedProducts,
          syncToMeta: syncToMeta,
          needsWebsiteUpsell: profile.needsWebsiteUpsell,
          hasPaymentMethod: skipMeta ? true : hasPaymentMethod,
          initialDataSources: scannedUrls,
          draftId: dbDraftId
        })
      });
      
      if (createRes.ok) {
        localStorage.removeItem('charlo_onboarding_draft');
        const newCompany = await createRes.json();
        
        // Trigger Meta Sync if requested
        if (syncToMeta && extractedProducts.length > 0 && !skipMeta) {
          const authToken = await user?.getIdToken();
          fetch(`/api/companies/${newCompany.id}/sync-meta-catalog`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ extractedProducts })
          }).catch(err => console.error("Background meta sync failed", err));
        }

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

  if (!isHydrated) return null; // Avoid flicker before draft loads

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-primary)', 
      padding: '40px 24px',
      alignItems: 'center',
    }}>
      {/* BACK BUTTON */}
      <button 
        onClick={() => router.push('/dashboard/companies')}
        style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          borderRadius: '50%',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        title="Volver al Dashboard"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      {/* STEPPER */}
      <div className="stepper-container slide-up">
        <div className={`step ${onboardingStep >= 1 ? 'active' : ''}`} onClick={() => setOnboardingStep(1)} style={{ cursor: 'pointer' }}>
          <div className="step-number">1</div>
          <span>Conectar Meta</span>
        </div>
        <div className={`step-line ${onboardingStep >= 2 ? 'active' : ''}`} />
        <div className={`step ${onboardingStep >= 2 ? 'active' : ''}`} onClick={() => setOnboardingStep(2)} style={{ cursor: 'pointer' }}>
          <div className="step-number">2</div>
          <span>Google Business</span>
        </div>
        <div className={`step-line ${onboardingStep >= 3 ? 'active' : ''}`} />
        <div className={`step ${onboardingStep >= 3 ? 'active' : ''}`} onClick={() => setOnboardingStep(3)} style={{ cursor: 'pointer' }}>
          <div className="step-number">3</div>
          <span>Escanear Web</span>
        </div>
        <div className={`step-line ${onboardingStep >= 4 ? 'active' : ''}`} />
        <div className={`step ${onboardingStep >= 4 ? 'active' : ''}`} onClick={() => setOnboardingStep(4)} style={{ cursor: 'pointer' }}>
          <div className="step-number">4</div>
          <span>Subir Menú</span>
        </div>
        <div className={`step-line ${onboardingStep >= 5 ? 'active' : ''}`} />
        <div className={`step ${onboardingStep >= 5 ? 'active' : ''}`} onClick={() => setOnboardingStep(5)} style={{ cursor: 'pointer' }}>
          <div className="step-number">5</div>
          <span>Entrenar IA</span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        width: '100%',
        maxWidth: '100%',
        padding: '0 48px',
        flex: 1
      }}>
      
        {/* FINAL STEP MODAL */}
        {showFinalStep && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="glass-panel-premium" style={{ width: 500, padding: 40, display: 'flex', flexDirection: 'column', gap: 24, animation: 'scaleIn 0.3s ease-out' }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 8, background: "linear-gradient(to right, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>¡Ya casi terminamos!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Charlo ha configurado tu agente inteligentemente.</p>
              </div>

              {metaToken ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', textAlign: 'center', color: '#10b981' }}>
                    ✅ Cuenta de Meta y WhatsApp configurada exitosamente.
                  </div>
                  {!hasPaymentMethod && (
                    <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', color: '#f59e0b', fontSize: '0.95rem', lineHeight: 1.5, textAlign: 'left' }}>
                      <strong>⚠️ Acción Requerida:</strong> Hemos detectado que tu cuenta no tiene un método de pago. Para que la IA pueda responder a tus clientes, Meta requiere una tarjeta de crédito.<br/><br/>
                      <a href="https://business.facebook.com/settings/payment-methods" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: 600 }}>Haz clic aquí</a> para agregar un método de pago en tu Business Manager y luego vincúlalo a tu cuenta de WhatsApp.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Ahora puedes conectarlo a tu cuenta de WhatsApp (Opcional).</p>
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
              )}

              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                {!metaToken && (
                  <button className="btn-secondary" style={{ flex: 1, padding: '14px 0' }} onClick={() => handleFinalSubmit(true)} disabled={isCreating}>
                    Saltar por ahora
                  </button>
                )}
                <button className="btn-primary" style={{ flex: 1, backgroundColor: '#10b981', color: '#fff', padding: '14px 0', border: 'none' }} onClick={() => handleFinalSubmit(false)} disabled={isCreating}>
                  {isCreating ? 'Guardando...' : 'Finalizar Configuración'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: CONECTAR META */}
        {onboardingStep === 1 && (
          <div className="glass-panel-premium slide-up" style={{ width: '100%', maxWidth: 500, padding: 48, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 16, background: "linear-gradient(to right, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Conecta tu negocio
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.6 }}>
              Conecta tus redes para que la IA responda automáticamente en Facebook Messenger, Instagram y WhatsApp.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {metaToken && (
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ color: '#10b981', fontWeight: 600 }}>✅ Conectado a Meta</div>
                  {profile.name && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>Negocio: {profile.name}</div>}
                </div>
              )}
              <button 
                onClick={handleConnectFacebook}
                disabled={isExtracting}
                className="btn-primary" 
                style={{ padding: '16px 24px', fontSize: '1.05rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#1877F2', color: '#fff', transition: 'transform 0.2s', transform: isExtracting ? 'scale(0.98)' : 'scale(1)' }}
              >
                {isExtracting ? <div className="spinner-small" /> : <img src="https://www.facebook.com/favicon.ico" alt="Meta" style={{ width: 24, height: 24 }} />}
                {isExtracting ? 'Conectando...' : metaToken ? 'Reconectar Meta' : 'Conectar Meta (Obligatorio)'}
              </button>

              <button 
                onClick={() => setOnboardingStep(2)}
                disabled={isExtracting}
                className="btn-secondary"
                style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: 'transparent', color: 'var(--text-secondary)', border: 'none', marginTop: 16 }}
              >
                Saltar por ahora (Solo pruebas)
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GOOGLE BUSINESS */}
        {onboardingStep === 2 && (
          <div className="glass-panel-premium slide-up" style={{ width: '100%', maxWidth: 500, padding: 48, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 16, background: "linear-gradient(to right, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Conectar Google Business
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.6 }}>
              Para empezar a entrenar tu IA, podemos conectarnos a tu Perfil de Negocio de Google. Esto nos permitirá extraer tu ubicación, horarios y datos de contacto automáticamente.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {extractedProvider === 'Google' && (
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ color: '#10b981', fontWeight: 600 }}>✅ Conectado a Google Business</div>
                  {profile.name && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>Negocio: {profile.name}</div>}
                </div>
              )}
              <button 
                onClick={handleConnectGoogle} 
                disabled={isExtracting}
                className="btn-primary" 
                style={{ padding: '16px 24px', fontSize: '1.05rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', transition: 'transform 0.2s', transform: isExtracting ? 'scale(0.98)' : 'scale(1)' }}
              >
                {isExtracting ? <div className="spinner-small" /> : <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 24, height: 24 }} />}
                {isExtracting ? 'Conectando...' : extractedProvider === 'Google' ? 'Reconectar Google' : 'Conectar Google Business'}
              </button>
              
              <button 
                onClick={() => setOnboardingStep(3)}
                disabled={isExtracting}
                className="btn-secondary"
                style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: 'transparent', color: 'var(--text-secondary)', border: 'none', marginTop: 16 }}
              >
                Omitir este paso
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WEBSITE */}
        {onboardingStep === 3 && (
          <div className="glass-panel-premium slide-up" style={{ width: '100%', maxWidth: 500, padding: 48, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 16, background: "linear-gradient(to right, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Escanear Sitio Web
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.6 }}>
              Ingresa el enlace de tu sitio web para que tu IA aprenda automáticamente sobre tus servicios, productos y reglas de negocio.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {scannedUrls.length > 0 && (
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', textAlign: 'left' }}>
                  <div style={{ color: '#10b981', fontWeight: 600, marginBottom: 8 }}>✅ Páginas Escaneadas ({scannedUrls.length}/5):</div>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {scannedUrls.map((s, idx) => (
                      <li key={idx} style={{ marginBottom: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-primary)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ marginRight: 8, flex: 1 }}>{s.url}</span>
                        <button 
                          onClick={() => handleRemoveUrl(idx)} 
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Eliminar enlace"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://www.tu-sitio.com/pagina"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                disabled={scannedUrls.length >= 5}
              />
              <button 
                onClick={handleScrapeUrl}
                disabled={isExtracting || !websiteUrl || scannedUrls.length >= 5}
                className="btn-primary" 
                style={{ width: '100%', padding: '16px', fontSize: '1.05rem', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '12px' }}
              >
                {isExtracting ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                    <div className="spinner-small" /> Escaneando...
                  </div>
                ) : scannedUrls.length >= 5 ? 'Límite Alcanzado' : scannedUrls.length > 0 ? '🌐 Agregar otro link' : '🌐 Escanear Sitio Web'}
              </button>

              <button 
                onClick={() => setOnboardingStep(4)}
                disabled={isExtracting}
                className={scannedUrls.length > 0 ? "btn-primary" : "btn-secondary"}
                style={scannedUrls.length > 0 
                  ? { width: '100%', padding: '16px', fontSize: '1.05rem', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', marginTop: 16 }
                  : { padding: '12px 24px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: 'transparent', color: 'var(--text-secondary)', border: 'none', marginTop: 16 }
                }
              >
                {scannedUrls.length > 0 ? 'Siguiente paso ➡️' : 'No tengo sitio web'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: DOCUMENT/MENU UPLOAD */}
        {onboardingStep === 4 && (
          <div className="glass-panel-premium slide-up" style={{ width: '100%', maxWidth: 500, padding: 48, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 16, background: "linear-gradient(to right, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Subir Menú o Catálogo
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.6 }}>
              Sube tu menú, catálogo o manual en formato PDF o Imagen para que la IA sepa qué productos vendes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {extractedProvider === 'Documento' && (
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ color: '#10b981', fontWeight: 600 }}>✅ Documento Procesado</div>
                </div>
              )}
              
              <input 
                type="file" 
                accept="application/pdf,image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                className="btn-primary" 
                style={{ width: '100%', padding: '24px', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '2px dashed var(--border-color)', borderRadius: '12px' }}
              >
                {isExtracting ? (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                    <div className="spinner-small" /> Procesando...
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '2rem' }}>📸</span>
                    Subir Menú / PDF
                  </>
                )}
              </button>

              <button 
                onClick={() => setOnboardingStep(5)}
                disabled={isExtracting}
                className="btn-secondary"
                style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: 'transparent', color: 'var(--text-secondary)', border: 'none', marginTop: 16 }}
              >
                No tengo menú / Omitir
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Chat Simulator */}
        {onboardingStep === 5 && (
        <div 
          className="glass-panel-premium slide-up" 
          style={{ 
            flex: 1,
            width: '100%', 
            maxWidth: '100%', 
            transition: 'max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            height: '75vh', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 0, 
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 600, background: "linear-gradient(to right, var(--accent-color), #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Asistente de Configuración
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
                Responde mis preguntas para entrenar a tu IA.
              </p>
            </div>
            {hasStarted && (
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}
              >
                {isProfileOpen ? '▶ Ocultar Perfil' : '◀ Ver Perfil'}
              </button>
            )}
          </div>

          {/* Chat Area */}
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px 0', backgroundColor: 'var(--bg-primary)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, padding: '0 32px' }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent-color), #8b5cf6)' : 'var(--bg-secondary)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                    border: msg.role === 'model' ? '1px solid var(--border-color)' : 'none',
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
                            backgroundColor: 'var(--border-color)', border: '1px solid rgba(255,255,255,0.2)', 
                            color: msg.role === 'user' ? '#fff' : 'var(--text-primary)', cursor: 'pointer', transition: 'background 0.2s' 
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
          </div>

          {/* Input Area */}
          <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
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
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
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

        {/* STEP 5: Profile Area */}
        {onboardingStep === 5 && (
        <div 
          className="glass-panel-premium slide-up" 
          style={{ 
            flex: (hasStarted && isProfileOpen) ? '0 0 35%' : 'none',
            minWidth: (hasStarted && isProfileOpen) ? '350px' : '0px',
            maxWidth: (hasStarted && isProfileOpen) ? '500px' : '0px',
            width: (hasStarted && isProfileOpen) ? 'auto' : '0px',
            opacity: (hasStarted && isProfileOpen) ? 1 : 0,
            visibility: (hasStarted && isProfileOpen) ? 'visible' : 'hidden',
            height: '75vh', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: (hasStarted && isProfileOpen) ? 32 : 0, 
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            border: (hasStarted && isProfileOpen) ? '1px solid var(--border-color)' : 'none',
          }}
        >
          <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>📄 Perfil en Construcción</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>Charlo actualiza esto mientras conversan.</p>
          </div>

          <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', flex: 1, paddingRight: 8 }}>
            
            {/* Canales Conectados */}
            <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
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
                {(extractedProvider === 'Website' || extractedProvider === 'Documento') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#8b5cf6', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem' }}>
                    <span>✅</span> {extractedProvider}
                    <button onClick={() => setExtractedProvider(null)} style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', marginLeft: 4, opacity: 0.7 }}>✕</button>
                  </div>
                )}
                {!phoneId && !facebookPageId && !instagramAccountId && !extractedProvider && (
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', padding: '4px 0' }}>Ningún canal vinculado</span>
                )}
              </div>
            </div>

            {/* Name Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.5px' }}>Nombre del Negocio</label>
              <input type="text" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }} value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Tu Negocio" />
            </div>

            {/* Documentos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Base de Conocimiento
              </label>
              {profile.topics.map(t => (
                <button 
                  key={t.id}
                  onClick={() => { setEditingTopic(t); setIsTopicModalOpen(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '1.2rem' }}>{t.id === 'identidad' ? '👤' : t.id === 'catalogo' ? '📦' : '📄'}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t.title}</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Editar →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

      </div>

      {/* Modal para Editar/Ver Documento */}
      {isTopicModalOpen && editingTopic && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: 24
        }}>
          <div className="glass-panel-premium" style={{
            width: '100%',
            maxWidth: 800,
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.5rem' }}>{editingTopic.id === 'identidad' ? '👤' : editingTopic.id === 'catalogo' ? '📦' : '📄'}</span>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{editingTopic.title}</h2>
              </div>
              <button 
                onClick={() => setIsTopicModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                ✕
              </button>
            </div>
            
            {/* Body */}
            <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Contenido del Documento (Markdown Soportado)
              </label>
              <textarea 
                className="custom-scrollbar"
                value={editingTopic.content}
                onChange={e => setEditingTopic({ ...editingTopic, content: e.target.value })}
                style={{
                  width: '100%',
                  flex: 1,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  padding: 24,
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  resize: 'none',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-color)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
            </div>
            
            {/* Footer */}
            <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
              <button 
                onClick={() => setIsTopicModalOpen(false)}
                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  applyProfileUpdate({ topics: [editingTopic] });
                  setIsTopicModalOpen(false);
                }}
                style={{ padding: '10px 24px', background: 'var(--accent-color)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'filter 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'none'}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        /* Glassmorphism */
        .glass-panel-premium {
          background: var(--bg-secondary);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-color);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
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
          background: var(--bg-secondary) !important;
          border: 1px solid var(--border-color) !important;
          border-radius: 12px !important;
          color: var(--text-primary) !important;
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
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.4s;
        }
        .step.active {
          color: var(--text-primary);
        }
        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-secondary);
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
          background: var(--border-color);
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
          border: 2px solid var(--border-color);
          border-top-color: var(--text-primary);
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
      `}</style>
      {showAssetSelection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="panel-glass" style={{ width: '90%', maxWidth: '500px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Selecciona tus cuentas</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              Has otorgado permisos a múltiples cuentas. Por favor selecciona cuáles quieres vincular a este negocio.
            </p>

            {availablePhones.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Número de WhatsApp</label>
                <select 
                  className="input-field" 
                  value={selectedPhoneId} 
                  onChange={(e) => setSelectedPhoneId(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  {availablePhones.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.verified_name || p.display_phone_number} ({p.display_phone_number})</option>
                  ))}
                </select>
              </div>
            )}

            {availablePages.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Página de Facebook</label>
                <select 
                  className="input-field" 
                  value={selectedPageId} 
                  onChange={(e) => setSelectedPageId(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  {availablePages.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button className="btn-primary" onClick={handleConfirmAssetSelection} style={{ marginTop: '8px' }}>
              Confirmar Selección
            </button>
          </div>
        </div>
      )}
      {showProductReview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="panel-glass" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Productos Encontrados</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              Hemos extraído {extractedProducts.length} productos/servicios. Confirma la moneda base para tus precios.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Moneda Principal</label>
              <select 
                className="input-field" 
                value={baseCurrency} 
                onChange={(e) => setBaseCurrency(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <option value="CRC">Colones Costarricenses (CRC)</option>
                <option value="USD">Dólares (USD)</option>
                <option value="MXN">Pesos Mexicanos (MXN)</option>
                <option value="EUR">Euros (EUR)</option>
              </select>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '12px' }}>Vista Previa</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {extractedProducts.slice(0, 3).map((p, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    <span>{p.name}</span>
                    <strong>{p.price ? `${p.price} ${p.currency || baseCurrency}` : 'Consultar'}</strong>
                  </li>
                ))}
                {extractedProducts.length > 3 && (
                  <li style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '8px' }}>
                    y {extractedProducts.length - 3} productos más...
                  </li>
                )}
              </ul>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '8px', padding: '16px', backgroundColor: 'rgba(var(--primary-color-rgb), 0.1)', borderRadius: '8px', border: '1px solid var(--primary-color)' }}>
              <input 
                type="checkbox" 
                id="syncMetaToggle"
                checked={syncToMeta}
                onChange={(e) => setSyncToMeta(e.target.checked)}
                style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
              />
              <label htmlFor="syncMetaToggle" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer', lineHeight: '1.4' }}>
                <strong>Sincronizar catálogo con Meta</strong><br/>
                <span style={{ color: 'var(--text-secondary)' }}>Opcional (Requiere Plan Starter o superior). Crearemos un catálogo automáticamente en Facebook, Instagram y WhatsApp con estos productos.</span>
              </label>
            </div>

            <button className="btn-primary" onClick={() => {
              // Update all products to use the selected base currency if none was provided
              const updatedProducts = extractedProducts.map(p => ({...p, currency: p.currency || baseCurrency}));
              setExtractedProducts(updatedProducts);
              
              let catalogMarkdown = "### Productos y Servicios Extraídos\n\n";
              updatedProducts.forEach(p => {
                catalogMarkdown += `- **${p.name}**: ${p.price ? p.price + ' ' + (p.currency || baseCurrency) : 'Consultar'}\n`;
                if (p.description) catalogMarkdown += `  ${p.description}\n`;
              });
              
              applyProfileUpdate({
                topics: [{ id: 'catalogo', title: 'Catálogo de Productos', content: catalogMarkdown }]
              });

              setShowProductReview(false);
              if (onboardingStep === 4) {
                setOnboardingStep(5);
              }
            }} style={{ marginTop: '8px' }}>
              Confirmar y Continuar
            </button>
          </div>
        </div>
      )}

      {showGoogleError && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="panel-glass" style={{ width: '90%', maxWidth: '400px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Cuenta no encontrada</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              No pudimos extraer información de Google Business. Es probable que no tengas un Perfil de Negocio creado o asociado a esta cuenta.
            </p>
            <a 
              href="https://business.google.com/locations" 
              target="_blank" 
              rel="noreferrer" 
              style={{ color: 'var(--primary-color)', textDecoration: 'underline', fontSize: '0.9rem' }}
            >
              Revisa tus perfiles de Google Business aquí
            </a>
            <button 
              className="btn-primary" 
              onClick={() => {
                setShowGoogleError(false);
                setOnboardingStep(3);
              }} 
              style={{ marginTop: '16px' }}
            >
              OK, continuar manual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export interface Topic {
  id: string;
  title: string;
  content: string;
}

export default function OnboardingPage() { return ( <Suspense fallback={<div>Loading Onboarding...</div>}> <OnboardingContent /> </Suspense> ); }
