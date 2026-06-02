import { collection, getDocs, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface AdminStats {
  totalMessages: number;
  totalTimeSavedHours: number;
  globalDeflectionRate: number;
  totalActiveBusinesses: number;
  idleProfilesCount: number;
  escalationCount: number;
}

export interface BusinessLeaderboard {
  id: string;
  name: string;
  messageCount: number;
  timeSavedHours: number;
}

export interface EscalationAlert {
  id: string;
  businessName: string;
  customerName: string;
  reason: string;
  timestamp: Date;
}

// NOTE: These queries are approximations and should be adjusted to match your exact Firestore schema.
export async function getGlobalStats(): Promise<AdminStats> {
  try {
    // In a real app, aggregating across all collections on the client is expensive.
    // We recommend using Firebase Cloud Functions to calculate these nightly and store them in a single document (e.g. 'admin/stats')
    
    // For now, returning mocked/placeholder aggregated data to build the UI:
    return {
      totalMessages: 125430,
      totalTimeSavedHours: 4181, // ~2 mins per message
      globalDeflectionRate: 85.4, // %
      totalActiveBusinesses: 42,
      idleProfilesCount: 7,
      escalationCount: 24,
    };
  } catch (error) {
    console.error("Error fetching global stats:", error);
    throw error;
  }
}

export async function getTopBusinesses(): Promise<BusinessLeaderboard[]> {
  try {
    // const q = query(collection(db, 'companies'), orderBy('messageCount', 'desc'), limit(10));
    // const snapshot = await getDocs(q);
    // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Mocked Leaderboard
    return [
      { id: '1', name: 'Acme Corp', messageCount: 15400, timeSavedHours: 513 },
      { id: '2', name: 'Global Tech', messageCount: 12100, timeSavedHours: 403 },
      { id: '3', name: 'Dental Plus', messageCount: 9800, timeSavedHours: 326 },
      { id: '4', name: 'Auto Repair Shop', messageCount: 8200, timeSavedHours: 273 },
      { id: '5', name: 'Pizza Express', messageCount: 6500, timeSavedHours: 216 },
    ];
  } catch (error) {
    console.error("Error fetching top businesses:", error);
    return [];
  }
}

export async function getRecentEscalations(): Promise<EscalationAlert[]> {
  try {
    // Mocked Escalations
    return [
      { id: 'e1', businessName: 'Dental Plus', customerName: 'John Doe', reason: 'Billing Dispute', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
      { id: 'e2', businessName: 'Pizza Express', customerName: 'Jane Smith', reason: 'Wrong Order', timestamp: new Date(Date.now() - 1000 * 60 * 120) },
      { id: 'e3', businessName: 'Acme Corp', customerName: 'Bob Builder', reason: 'Complex Technical Issue', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
    ];
  } catch (error) {
    console.error("Error fetching escalations:", error);
    return [];
  }
}
