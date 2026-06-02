import React from 'react';
import styles from '@/app/dashboard/admin/admin.module.css';
import { BusinessLeaderboard } from '@/services/adminService';

interface LeaderboardTableProps {
  data: BusinessLeaderboard[];
  title: string;
}

export default function LeaderboardTable({ data, title }: LeaderboardTableProps) {
  return (
    <div className={styles.tableContainer}>
      <h3 className={styles.tableTitle}>{title}</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Business Name</th>
            <th style={{ textAlign: 'right' }}>Total Messages</th>
            <th style={{ textAlign: 'right' }}>Hours Saved</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id}>
              <td>
                <span className={`${styles.rankBadge} ${index < 3 ? styles.topRank : ''}`}>
                  #{index + 1}
                </span>
              </td>
              <td className={styles.businessName}>{row.name}</td>
              <td style={{ textAlign: 'right' }}>{row.messageCount.toLocaleString()}</td>
              <td style={{ textAlign: 'right' }}>
                <span className={styles.highlightText}>{row.timeSavedHours.toLocaleString()}h</span>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
