// ADASwift Admin Dashboard
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { UserProfile, PlanId, SubscriptionStatus, SYSTEM_TAG } from '../../types';

interface Filters {
  plan: PlanId | '';
  status: SubscriptionStatus | '';
}

export default function AdminDashboard(): JSX.Element {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ plan: '', status: '' });
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => { fetchUsers(); }, [filters]);

  const fetchUsers = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tag: SYSTEM_TAG });
      if (filters.plan) params.append('plan', filters.plan);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setTotalCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (): void => {
    const params = new URLSearchParams({ tag: SYSTEM_TAG, format: 'csv' });
    if (filters.plan) params.append('plan', filters.plan);
    if (filters.status) params.append('status', filters.status);
    window.location.href = `/api/users?${params}`;
  };

  const getPlanBadgeStyle = (plan: PlanId): React.CSSProperties => ({
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    backgroundColor: plan === 'basic' ? '#6c757d' : plan === 'business' ? '#007bff' : '#ffc107',
    color: plan === 'agency' ? '#000' : '#fff',
  });

  const getStatusStyle = (status: SubscriptionStatus): React.CSSProperties => ({
    color: status === 'active' ? '#28a745' : status === 'cancelled' ? '#dc3545' : '#ffc107',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  });

  return (
    <>
      <Head>
        <title>ADASwift Admin - Users</title>
      </Head>
      
      <div style={styles.container}>
        <h1 style={styles.title}>ADASwift Admin Dashboard</h1>
        <p style={styles.subtitle}>System Tag: <code style={styles.code}>{SYSTEM_TAG}</code></p>
        
        <div style={styles.filterBar}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Plan:</label>
            <select value={filters.plan} onChange={(e) => setFilters({ ...filters, plan: e.target.value as PlanId })} style={styles.select}>
              <option value="">All Plans</option>
              <option value="basic">Basic</option>
              <option value="business">Business</option>
              <option value="agency">Agency</option>
            </select>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.label}>Status:</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as SubscriptionStatus })} style={styles.select}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="past_due">Past Due</option>
            </select>
          </div>
          
          <button onClick={exportCSV} style={styles.exportBtn}>📥 Export CSV</button>
        </div>
        
        {loading ? (
          <div style={styles.loading}>Loading users...</div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Plan</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>MintBird ID</th>
                  <th style={styles.th}>Signup Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={styles.row}>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}><span style={getPlanBadgeStyle(user.plan_id)}>{user.plan_id}</span></td>
                    <td style={styles.td}><span style={getStatusStyle(user.subscription_status)}>{user.subscription_status}</span></td>
                    <td style={styles.td}><code style={styles.codeSmall}>{user.mintbird_customer_id}</code></td>
                    <td style={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <p style={styles.total}>Total Users: <strong>{totalCount}</strong></p>
          </>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px',
  },
  title: {
    fontSize: '32px',
    marginBottom: '5px',
  },
  subtitle: {
    color: '#666',
    marginBottom: '30px',
  },
  code: {
    backgroundColor: '#f4f4f4',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  codeSmall: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#666',
  },
  filterBar: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    fontWeight: 'bold',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  exportBtn: {
    marginLeft: 'auto',
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    color: '#666',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
  },
  headerRow: {
    backgroundColor: '#007bff',
    color: 'white',
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    fontWeight: 'bold',
  },
  row: {
    borderBottom: '1px solid #eee',
  },
  td: {
    padding: '15px',
  },
  total: {
    fontSize: '18px',
    color: '#666',
  },
};
