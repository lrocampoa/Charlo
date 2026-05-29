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
  facebookPageId?: string;
  instagramAccountId?: string;
  metaAccessToken?: string; // For Meta Graph API calls
  wabaId?: string; // WhatsApp Business Account ID
  ownerId?: string;
  needsWebsiteUpsell?: boolean;
  advancedSOPs?: string;
  geminiCacheId?: string;
  geminiCacheExpiry?: string;
  activeAgents?: string[];
  bookingConfig?: {
    syncSource?: string;
    maxCapacity?: number;
    operatingHours?: string;
  };
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
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/companies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const loadedCompanies = data.companies || [];
        
        // --- AUTO SEEDER LOGIC ---
        if (loadedCompanies.length === 0 && user) {
          const hasSeeded = localStorage.getItem('hasSeeded_charlo');
          if (!hasSeeded) {
            console.log("No companies found on first login. Seeding demo data...");
            await fetch('/api/seed', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({})
            });
            localStorage.setItem('hasSeeded_charlo', 'true');
            // Re-fetch after seeding
            const res2 = await fetch('/api/companies', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data2 = await res2.json();
            setCompanies(data2.companies || []);
            if (data2.companies?.length > 0) {
              setSelectedCompanyId(data2.companies[0].id);
            }
            setIsLoading(false);
            return;
          }
        }
        
        setCompanies(loadedCompanies);
        
        if (!selectedCompanyId && loadedCompanies.length > 0) {
          setSelectedCompanyId(loadedCompanies[0].id);
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
