import { useEffect, useState } from 'react';
import { ShieldCheck, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface AdminOverview {
  stats: {
    users: number;
    crops: number;
    soils: number;
    recommendations: number;
    pending_feedback: number;
    datasets: number;
  };
  users: { id: number; email: string; full_name: string; role: string; is_active: number; created_at: string }[];
  feedback: { id: number; name: string; email: string; country: string | null; topic: string; message: string; status: string; created_at: string }[];
  dataQuality: { id: number; slug: string; common_name: string; verification_status: string; missing_ph: number; missing_temp: number; missing_pests: number; missing_storage: number }[];
  auditLogs: { id: number; actor_email: string | null; action: string; entity_type: string | null; details: string | null; created_at: string }[];
}

export function AdminDashboardPage() {
  const { user, apiFetch, navigate } = useApp();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'feedback' | 'quality' | 'import' | 'audit'>('users');
  const [importJson, setImportJson] = useState(
    JSON.stringify(
      {
        crops: [
          {
            slug: 'teff-custom-check',
            common_name: 'Teff (Sample Import Check)',
            scientific_name: 'Eragrostis tef',
            categories: ['cereals'],
            ph_min: 5.5,
            ph_max: 7.5,
            temp_min_c: 15,
            temp_max_c: 28,
            rainfall_min_mm: 400,
            rainfall_max_mm: 900,
            water_req: 'Low to Moderate',
            source: 'Admin Verified Import',
          },
        ],
      },
      null,
      2,
    ),
  );
  const [importStatus, setImportStatus] = useState('');

  const loadAdmin = () => {
    setLoading(true);
    setError('');
    apiFetch<AdminOverview>('/api/admin/overview')
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Admin authorization required.');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdmin();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border border-[#E2E8E2] rounded-xl p-8 text-center space-y-4">
          <ShieldCheck className="w-8 h-8 text-emerald-700 mx-auto" />
          <h1 className="text-2xl font-bold text-[#142218]">Administrator Access Required</h1>
          <p className="text-sm text-[#4B5E50]">
            This governance console is restricted by Role-Based Access Control (RBAC) to authenticated administrator accounts.
          </p>
          <button type="button" onClick={() => navigate('/login')} className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 rounded-lg cursor-pointer">
            Sign in with Admin Account
          </button>
        </div>
      </div>
    );
  }

  const updateUserRole = async (id: number, role: string, is_active?: boolean) => {
    await apiFetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, is_active }),
    });
    loadAdmin();
  };

  const updateFeedbackStatus = async (id: number, status: 'pending' | 'reviewed' | 'resolved') => {
    await apiFetch(`/api/admin/feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    loadAdmin();
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus('');
    try {
      const parsed = JSON.parse(importJson);
      const res = await apiFetch<{ imported: number }>('/api/admin/crops/import', {
        method: 'POST',
        body: JSON.stringify(parsed),
      });
      setImportStatus(`Successfully imported or updated ${res.imported} canonical crop record(s).`);
      loadAdmin();
    } catch (err: any) {
      setImportStatus(`Import error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#E2E8E2]">
        <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">RBAC Governance Console</p>
        <h1 className="mt-1 text-3xl font-bold text-[#142218]">System Administration &amp; Data Quality</h1>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900">{error}</div>}

      {loading || !data ? (
        <p className="text-sm text-[#4B5E50]">Loading system governance records...</p>
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Users', val: data.stats.users },
              { label: 'Canonical Crops', val: data.stats.crops },
              { label: 'WRB Soils', val: data.stats.soils },
              { label: 'Recommendations', val: data.stats.recommendations },
              { label: 'Pending Feedback', val: data.stats.pending_feedback },
              { label: 'Verified Datasets', val: data.stats.datasets },
            ].map((m) => (
              <div key={m.label} className="bg-white border border-[#E2E8E2] rounded-xl p-4">
                <p className="text-xs text-[#4B5E50]">{m.label}</p>
                <p className="mt-1 text-2xl font-bold font-mono text-[#142218]">{m.val}</p>
              </div>
            ))}
          </div>

          {/* Sub-tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[#E2E8E2] pb-3">
            {[
              { id: 'users', label: 'Users & Roles' },
              { id: 'feedback', label: 'Feedback Queue' },
              { id: 'quality', label: 'Crop Data Quality' },
              { id: 'import', label: 'Batch Crop Import' },
              { id: 'audit', label: 'Security Audit Logs' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-[#4B5E50] border-stone-200 hover:text-[#142218]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'users' && (
            <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#E2E8E2] text-xs text-[#4B5E50]">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-4 font-medium text-[#142218]">{u.full_name}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs">{u.email}</td>
                      <td className="py-2.5 pr-4">
                        <select
                          aria-label={`Role for ${u.email}`}
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-stone-300 rounded bg-white"
                        >
                          <option value="farmer">farmer</option>
                          <option value="agronomist">agronomist</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="py-2.5 pr-4 text-xs">{u.is_active ? 'Active' : 'Disabled'}</td>
                      <td className="py-2.5">
                        <button
                          type="button"
                          onClick={() => updateUserRole(u.id, u.role, !u.is_active)}
                          className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                        >
                          {u.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 space-y-4">
              {data.feedback.map((f) => (
                <div key={f.id} className="pb-4 border-b border-stone-100 last:border-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#4B5E50]">
                      <strong className="text-[#142218]">{f.topic}</strong> · {f.name} ({f.email}) · {f.country || 'Unspecified'} · {f.created_at}
                    </p>
                    <p className="mt-1 text-sm text-[#142218]">{f.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      aria-label={`Status for feedback ${f.id}`}
                      value={f.status}
                      onChange={(e) => updateFeedbackStatus(f.id, e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white"
                    >
                      <option value="pending">pending</option>
                      <option value="reviewed">reviewed</option>
                      <option value="resolved">resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 overflow-x-auto">
              <p className="text-xs text-[#4B5E50] mb-3">
                Audit showing any crop records missing optional fields rather than fabricating unverified numbers.
              </p>
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#E2E8E2] text-xs text-[#4B5E50]">
                  <tr>
                    <th className="py-2 pr-4">Crop</th>
                    <th className="py-2 pr-4">Verification</th>
                    <th className="py-2 pr-4">pH</th>
                    <th className="py-2 pr-4">Temp</th>
                    <th className="py-2 pr-4">Pests</th>
                    <th className="py-2">Storage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {data.dataQuality.slice(0, 40).map((q) => (
                    <tr key={q.id}>
                      <td className="py-2 pr-4 font-medium">
                        <button type="button" onClick={() => navigate(`/crops/${q.slug}`)} className="hover:underline text-emerald-800 cursor-pointer">
                          {q.common_name}
                        </button>
                      </td>
                      <td className="py-2 pr-4 text-[#4B5E50]">{q.verification_status}</td>
                      <td className="py-2 pr-4 font-mono">{q.missing_ph ? 'Missing' : 'OK'}</td>
                      <td className="py-2 pr-4 font-mono">{q.missing_temp ? 'Missing' : 'OK'}</td>
                      <td className="py-2 pr-4 font-mono">{q.missing_pests ? 'Missing' : 'OK'}</td>
                      <td className="py-2 font-mono">{q.missing_storage ? 'Missing' : 'OK'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'import' && (
            <form onSubmit={handleImport} className="bg-white border border-[#E2E8E2] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-700" />
                <h2 className="text-base font-bold text-[#142218]">Canonical Crop JSON Batch Import / Upsert</h2>
              </div>
              <p className="text-xs text-[#4B5E50]">
                Paste verified FAO EcoCrop / ICAR crop records matching the schema below. Existing slugs update cleanly without creating duplicate crop entries.
              </p>
              <textarea
                rows={12}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full p-3 font-mono text-xs border border-stone-300 rounded-lg"
              />
              {importStatus && <p className="text-xs font-medium text-emerald-800">{importStatus}</p>}
              <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer">
                Import Verified Crop Batch
              </button>
            </form>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[#E2E8E2] text-[#4B5E50]">
                  <tr>
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Actor</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Entity</th>
                    <th className="py-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 pr-4 font-mono text-[#4B5E50] whitespace-nowrap">{log.created_at}</td>
                      <td className="py-2 pr-4">{log.actor_email || 'Anonymous'}</td>
                      <td className="py-2 pr-4 font-mono font-semibold text-[#142218]">{log.action}</td>
                      <td className="py-2 pr-4 text-[#4B5E50]">{log.entity_type}</td>
                      <td className="py-2 text-[#4B5E50]">{log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
