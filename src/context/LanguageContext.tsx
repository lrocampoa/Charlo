"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { en } from '@/locales/en';
import { es } from '@/locales/es';

type Language = 'en' | 'es';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: () => {},
  t: () => '',
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    // Load preference from local storage on mount
    const savedLang = localStorage.getItem('charlo_lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('charlo_lang', lang);
  };

  const getTranslation = (keyPath: string): string => {
    const dictionary: any = language === 'es' ? es : en;
    const keys = keyPath.split('.');
    
    let result = dictionary;
    for (const key of keys) {
      if (result[key] === undefined) {
        console.warn(`Translation key not found: ${keyPath}`);
        return keyPath; // fallback to the key itself if missing
      }
      result = result[key];
    }
    
    return typeof result === 'string' ? result : keyPath;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: getTranslation }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
