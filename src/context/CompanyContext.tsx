"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export interface Company {
  id: string;
  name: string;
  knowledgeBase: string;
  productsCatalog: string;
  calendlyLink: string;
  persona: string;
  whatsappPhoneNumberId?: string; // system ID
  whatsappNumber?: string; // customer-facing number
  instagramLink?: string;
  facebookLink?: string;
  metaAccessToken?: string; // For Meta Graph API calls
  wabaId?: string; // WhatsApp Business Account ID
  ownerId?: string;
  needsWebsiteUpsell?: boolean;
}

interface CompanyContextType {
  companies: Company[];
  selectedCompanyId: string | null;
  selectedCompany: Company | null;
  setSelectedCompanyId: (id: string) => void;
  refreshCompanies: () => Promise<void>;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  selectedCompanyId: null,
  selectedCompany: null,
  setSelectedCompanyId: () => {},
  refreshCompanies: async () => {},
  isLoading: true,
});

export const CompanyProvider = ({ children }: { children: React.ReactNode }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const refreshCompanies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
        
        if (!selectedCompanyId && data.companies?.length > 0) {
          setSelectedCompanyId(data.companies[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load companies", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || null;

  return (
    <CompanyContext.Provider value={{ companies, selectedCompanyId, selectedCompany, setSelectedCompanyId, refreshCompanies, isLoading }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);
