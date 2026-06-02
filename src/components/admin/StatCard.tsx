import React from 'react';
import styles from '@/app/dashboard/admin/admin.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatCard({ title, value, icon, subtitle, trend }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <span className={styles.statTitle}>{title}</span>
        <div className={styles.iconContainer}>
          {icon}
        </div>
      </div>
      <div className={styles.statValue}>{value}</div>
      {subtitle && (
        <div className={`${styles.statSubtitle} ${trend ? styles[trend] : ''}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
