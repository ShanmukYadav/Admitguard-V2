import React, { useState, useEffect } from 'react';
import { StoredApplication } from './types';
import { Loader2, Search, Filter, Lock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function DirectorDashboard() {
  const [applications, setApplications] = useState<StoredApplication[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Decision State
  const [directorNote, setDirectorNote] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/applications/stats')
      ]);
      if (!appsRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');
      
      const apps = await appsRes.json();
      const st = await statsRes.json();
      
      setApplications(apps);
      setStats(st);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDecision = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (directorNote.length < 20) {
      alert('Director note must be at least 20 characters.');
      return;
    }
    if (!directorName) {
      alert('Please enter your name.');
      return;
    }

    setDecisionLoading(true);
    try {
      const res = await fetch(`/api/applications/${id}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, directorNote, approvedBy: directorName })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record decision');
      }
      
      await fetchData();
      setDirectorNote('');
      alert(`Decision recorded successfully.`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDecisionLoading(false);
    }
  };

  const filteredApps = applications.filter(app => 
    app.data.personalInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    app.data.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const needsAttention = applications.filter(app => 
    app.status === 'FLAGGED' || 
    (app.validationResult.tier2Flags.some(f => f.includes('No work experience despite 3+ years'))) ||
    app.validationResult.tier3Enrichment.riskScore > 60 ||
    (app.validationResult.tier3Enrichment.category === 'Weak Fit' && app.status === 'PENDING_REVIEW')
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Lock className="text-slate-400 w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">AdmitGuard — Director View</h1>
            <p className="text-slate-500">Executive analytics and final decisions</p>
          </div>
        </div>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Refresh Data'}
        </button>
      </header>

      {/* Analytics Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Category Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-emerald-700">Strong Fit</span>
                  <span>{stats.categoryBreakdown.strongFit}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${stats.total ? (stats.categoryBreakdown.strongFit / stats.total) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-amber-700">Needs Review</span>
                  <span>{stats.categoryBreakdown.needsReview}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${stats.total ? (stats.categoryBreakdown.needsReview / stats.total) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-red-700">Weak Fit</span>
                  <span>{stats.categoryBreakdown.weakFit}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${stats.total ? (stats.categoryBreakdown.weakFit / stats.total) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Avg Risk Score</h3>
            <div className={`text-5xl font-bold ${stats.averageRiskScore > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
              {stats.averageRiskScore}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Submissions (7 Days)</h3>
            <div className="flex items-end gap-1 h-20">
              {stats.submissionsPerDay.map((day: any, i: number) => {
                const max = Math.max(...stats.submissionsPerDay.map((d: any) => d.count), 1);
                const height = `${(day.count / max) * 100}%`;
                return (
                  <div key={i} className="flex-1 bg-indigo-100 rounded-t-sm relative group" style={{ height }}>
                    <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-sm transition-all" style={{ height: '100%' }}></div>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none">
                      {day.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Needs Attention Section */}
      {needsAttention.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-500" /> Needs Director Attention
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {needsAttention.map(app => (
              <div key={app.id} className="bg-red-50 border border-red-100 p-4 rounded-xl cursor-pointer hover:bg-red-100 transition-colors" onClick={() => setExpandedId(app.id)}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900">{app.data.personalInfo.fullName}</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-red-200 text-red-800 rounded-full">Risk: {app.validationResult.tier3Enrichment.riskScore}</span>
                </div>
                <p className="text-sm text-slate-600 mb-2 truncate">{app.data.educationPath}</p>
                <div className="text-xs text-red-600 font-medium">
                  {app.validationResult.tier2Flags.length} flags detected
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Applications Table */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search all applications..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="p-4">Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Risk</th>
                <th className="p-4">Category</th>
                <th className="p-4">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map(app => (
                <React.Fragment key={app.id}>
                  <tr 
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  >
                    <td className="p-4 font-medium">{app.data.personalInfo.fullName}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        app.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        app.status === 'FLAGGED' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium">{app.validationResult.tier3Enrichment.riskScore}</td>
                    <td className="p-4 text-sm">{app.validationResult.tier3Enrichment.category}</td>
                    <td className="p-4 text-sm text-slate-500">{new Date(app.submittedAt).toLocaleDateString()}</td>
                  </tr>
                  
                  {expandedId === app.id && (
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={5} className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          
                          {/* Details Column */}
                          <div className="lg:col-span-2 space-y-6">
                            <div>
                              <h3 className="font-bold text-slate-900 mb-2">Application Details</h3>
                              <p className="text-sm text-slate-600 mb-4">{app.data.personalInfo.email} | {app.data.personalInfo.phone}</p>
                              
                              <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm space-y-2">
                                <p><span className="font-bold">Path:</span> {app.data.educationPath}</p>
                                <p><span className="font-bold">Total Exp:</span> {app.validationResult.tier3Enrichment.totalExperienceMonths} months</p>
                                <p><span className="font-bold">AI Summary:</span> {app.validationResult.aiInsights?.summary}</p>
                              </div>
                            </div>
                            
                            {app.validationResult.tier2Flags.length > 0 && (
                              <div>
                                <h4 className="font-bold text-amber-800 mb-2">Flags</h4>
                                <ul className="list-disc list-inside text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100">
                                  {app.validationResult.tier2Flags.map((f, i) => <li key={i}>{f}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Action Panel */}
                          <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm flex flex-col h-full">
                            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                              <Lock size={16} /> Director Decision
                            </h3>
                            
                            <div className="mb-4 text-sm">
                              <div className="flex justify-between mb-1">
                                <span className="text-slate-500">Risk Score:</span>
                                <span className="font-bold">{app.validationResult.tier3Enrichment.riskScore}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Category:</span>
                                <span className="font-bold">{app.validationResult.tier3Enrichment.category}</span>
                              </div>
                            </div>

                            {app.status === 'APPROVED' || app.status === 'REJECTED' ? (
                              <div className={`mt-auto p-4 rounded-xl border ${app.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                <div className="font-bold mb-2 flex items-center gap-2">
                                  {app.status === 'APPROVED' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                  Decision: {app.status}
                                </div>
                                <p className="text-sm mb-2">"{app.directorNote}"</p>
                                <p className="text-xs opacity-75">— {app.approvedBy} at {new Date(app.approvedAt!).toLocaleString()}</p>
                              </div>
                            ) : (
                              <div className="mt-auto space-y-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Director Note (min 20 chars)</label>
                                  <textarea 
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                                    value={directorNote}
                                    onChange={e => setDirectorNote(e.target.value)}
                                    placeholder="Explain your decision..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Your Name</label>
                                  <input 
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={directorName}
                                    onChange={e => setDirectorName(e.target.value)}
                                    placeholder="Director Name"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                  <button 
                                    disabled={decisionLoading}
                                    onClick={() => handleDecision(app.id, 'APPROVED')}
                                    className="py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                  >
                                    <CheckCircle2 size={16} /> Approve
                                  </button>
                                  <button 
                                    disabled={decisionLoading}
                                    onClick={() => handleDecision(app.id, 'REJECTED')}
                                    className="py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                  >
                                    <XCircle size={16} /> Reject
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
