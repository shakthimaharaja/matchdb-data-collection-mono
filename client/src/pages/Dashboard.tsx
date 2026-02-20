import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { Stats } from '../types';
import Navbar from '../components/Navbar';
import PasteTab from '../components/PasteTab';
import CandidateForm from '../components/CandidateForm';
import JobForm from '../components/JobForm';
import ExcelUpload from '../components/ExcelUpload';
import DataTable from '../components/DataTable';

type Tab = 'paste' | 'manual' | 'excel';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('manual');
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, bySource: { paste: 0, manual: 0, excel: 0 } });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isCandidate = user?.role === 'candidate_uploader';
  const endpoint = isCandidate ? '/api/candidates' : '/api/jobs';

  const fetchData = useCallback(async () => {
    try {
      const [recordsRes, statsRes] = await Promise.all([
        api.get(endpoint),
        api.get(`${endpoint}/stats`),
      ]);
      setRecords(recordsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async (data: any, source: string) => {
    try {
      await api.post(endpoint, { ...data, source });
      showToast('Record saved successfully!');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save', 'error');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`${endpoint}/${id}`);
      showToast('Record deleted');
      fetchData();
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleExcelUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post(`${endpoint}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(`${data.count} records imported from Excel!`);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Upload failed', 'error');
      throw err;
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'paste', label: 'Paste', icon: '📋' },
    { key: 'manual', label: 'Manual Entry', icon: '✏️' },
    { key: 'excel', label: 'Excel Upload', icon: '📁' },
  ];

  return (
    <div className="dashboard">
      <Navbar />

      <main className="dashboard-content">
        {/* ── Stats ─────────────────────────────── */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Records</span>
          </div>
          <div className="stat-card stat-paste">
            <span className="stat-value">{stats.bySource.paste}</span>
            <span className="stat-label">Via Paste</span>
          </div>
          <div className="stat-card stat-manual">
            <span className="stat-value">{stats.bySource.manual}</span>
            <span className="stat-label">Via Manual</span>
          </div>
          <div className="stat-card stat-excel">
            <span className="stat-value">{stats.bySource.excel}</span>
            <span className="stat-label">Via Excel</span>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────── */}
        <div className="tab-section">
          <div className="tab-bar">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                <span className="tab-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'paste' && (
              <PasteTab
                type={isCandidate ? 'candidate' : 'job'}
                onSave={(data) => handleSave(data, 'paste')}
              />
            )}

            {activeTab === 'manual' &&
              (isCandidate ? (
                <CandidateForm onSubmit={(data) => handleSave(data, 'manual')} />
              ) : (
                <JobForm onSubmit={(data) => handleSave(data, 'manual')} />
              ))}

            {activeTab === 'excel' && (
              <ExcelUpload
                onUpload={handleExcelUpload}
                type={isCandidate ? 'candidate' : 'job'}
              />
            )}
          </div>
        </div>

        {/* ── Data Table ────────────────────────── */}
        <DataTable
          records={records}
          type={isCandidate ? 'candidate' : 'job'}
          onDelete={handleDelete}
        />
      </main>

      {/* ── Toast ───────────────────────────────── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
