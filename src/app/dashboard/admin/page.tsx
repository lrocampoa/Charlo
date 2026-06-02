"use client";

import React, { useEffect, useState } from 'react';
import styles from './admin.module.css';
import StatCard from '@/components/admin/StatCard';
import LeaderboardTable from '@/components/admin/LeaderboardTable';
import { getGlobalStats, getTopBusinesses, getRecentEscalations, AdminStats, BusinessLeaderboard, EscalationAlert } from '@/services/adminService';
import { Activity, Clock, MessageSquare, AlertOctagon, TrendingUp, Users, Building, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Mock chart data for now since we don't have a time-series aggregation service yet
const mockChartData = [
  { date: 'Mon', messages: 4000, escalations: 240 },
  { date: 'Tue', messages: 3000, escalations: 139 },
  { date: 'Wed', messages: 2000, escalations: 980 },
  { date: 'Thu', messages: 2780, escalations: 390 },
  { date: 'Fri', messages: 1890, escalations: 480 },
  { date: 'Sat', messages: 2390, escalations: 380 },
  { date: 'Sun', messages: 3490, escalations: 430 },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<BusinessLeaderboard[]>([]);
  const [escalations, setEscalations] = useState<EscalationAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, topBizData, escalationsData] = await Promise.all([
          getGlobalStats(),
          getTopBusinesses(),
          getRecentEscalations()
        ]);
        setStats(statsData);
        setLeaderboard(topBizData);
        setEscalations(escalationsData);
      } catch (error) {
        console.error("Failed to load admin data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className={styles.loadingState}>
        <Activity className="animate-spin mb-4 text-blue-500" size={40} />
        <p>Loading God Mode...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <h1>Platform God Mode</h1>
        <p>Global view of Charlo performance across all businesses.</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          title="Total Messages Handled"
          value={stats.totalMessages.toLocaleString()}
          icon={<MessageSquare size={24} />}
          subtitle="+12% from last week"
          trend="up"
        />
        <StatCard
          title="Total Time Saved"
          value={`${stats.totalTimeSavedHours.toLocaleString()}h`}
          icon={<Clock size={24} />}
          subtitle="Estimated value: $83,000+"
          trend="up"
        />
        <StatCard
          title="Global Deflection Rate"
          value={`${stats.globalDeflectionRate}%`}
          icon={<TrendingUp size={24} />}
          subtitle="AI successfully handled"
          trend="up"
        />
        <StatCard
          title="Active Businesses"
          value={stats.totalActiveBusinesses}
          icon={<Building size={24} />}
          subtitle={`${stats.idleProfilesCount} profiles idle/unused`}
          trend="neutral"
        />
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartContainer}>
          <h3 className={styles.tableTitle}>Global Traffic & Escalations (Last 7 Days)</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={mockChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="escalations" stroke="#ef4444" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.escalationsContainer}>
          <h3 className={styles.tableTitle}>Action Required: Triage Center</h3>
          <div className={styles.escalationList}>
            {escalations.map(esc => (
              <div key={esc.id} className={styles.escalationItem}>
                <ShieldAlert className={styles.escalationIcon} size={20} />
                <div className={styles.escalationContent}>
                  <div className={styles.escalationHeader}>
                    <span className={styles.escalationCompany}>{esc.businessName}</span>
                    <span className={styles.escalationTime}>
                      {formatDistanceToNow(esc.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className={styles.escalationReason}>{esc.reason}</p>
                  <span className={styles.escalationCustomer}>User: {esc.customerName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.tablesGrid}>
        <LeaderboardTable 
          title="Top Businesses (By Volume)" 
          data={leaderboard} 
        />
        
        {/* Placeholder for second table, e.g. Churn Risk or Idle Profiles */}
        <div className={styles.tableContainer}>
          <h3 className={styles.tableTitle}>Churn Risk: Idle Profiles</h3>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            <AlertOctagon size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>You have <strong>{stats.idleProfilesCount}</strong> businesses that haven't received a message in 7+ days.</p>
            <button style={{
              marginTop: '1rem',
              padding: '8px 16px',
              background: '#eff6ff',
              color: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}>View At-Risk Accounts</button>
          </div>
        </div>
      </div>
    </div>
  );
}
