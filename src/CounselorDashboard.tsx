import React, { useState, useEffect } from 'react';
import { StoredApplication } from './types';
import { Loader2, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export default function CounselorDashboard() {
  const [applications, setApplications] = useState<StoredApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications');
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.data.personalInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.data.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || app.validationResult.tier3Enrichment.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'PENDING_REVIEW').length,
    flagged: applications.filter(a => a.status === 'FLAGGED').length,
    approved: applications.filter(a => a.status === 'APPROVED').length,
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AdmitGuard — Counselor View</h1>
          <p className="text-slate-500">Application review and monitoring</p>
        </div>
        <button 
          onClick={fetchApplications}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Refresh'}
        </button>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Total Applications</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Pending Review</div>
          <div className="text-3xl font-bold text-blue-600">{stats.pending}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Flagged</div>
          <div className="text-3xl font-bold text-amber-600">{stats.flagged}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Approved</div>
          <div className="text-3xl font-bold text-emerald-600">{stats.approved}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="FLAGGED">Flagged</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select 
            className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="Strong Fit">Strong Fit</option>
            <option value="Needs Review">Needs Review</option>
            <option value="Weak Fit">Weak Fit</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Path</th>
                <th className="p-4">Status</th>
                <th className="p-4">Risk</th>
                <th className="p-4">Category</th>
                <th className="p-4">Submitted</th>
                <th className="p-4">Flags</th>
              </tr>
            </thead>
            <tbody>
              {loading && applications.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">Loading applications...</td></tr>
              ) : filteredApps.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">No applications found.</td></tr>
              ) : (
                filteredApps.map(app => (
                  <React.Fragment key={app.id}>
                    <tr 
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    >
                      <td className="p-4 font-medium">{app.data.personalInfo.fullName}</td>
                      <td className="p-4 text-sm text-slate-600">{app.data.personalInfo.email}</td>
                      <td className="p-4 text-sm text-slate-600 truncate max-w-[150px]">{app.data.educationPath}</td>
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
                      <td className="p-4 text-sm text-amber-600 font-medium">{app.validationResult.tier2Flags.length}</td>
                    </tr>
                    {expandedId === app.id && (
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <td colSpan={8} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h3 className="font-bold text-slate-900 mb-4">Application Details</h3>
                              <div className="space-y-2 text-sm">
                                <p><span className="font-medium text-slate-500 w-24 inline-block">Phone:</span> {app.data.personalInfo.phone}</p>
                                <p><span className="font-medium text-slate-500 w-24 inline-block">DOB:</span> {app.data.personalInfo.dateOfBirth}</p>
                                <p><span className="font-medium text-slate-500 w-24 inline-block">Total Exp:</span> {app.validationResult.tier3Enrichment.totalExperienceMonths} months</p>
                              </div>
                              
                              <h4 className="font-bold text-slate-900 mt-6 mb-2">Education</h4>
                              <ul className="space-y-2 text-sm">
                                {app.data.educationHistory.map((edu, i) => (
                                  <li key={i} className="bg-white p-3 rounded border border-slate-200">
                                    <span className="font-bold text-indigo-600">{edu.level}</span> - {edu.boardUniversity} ({edu.yearOfPassing})
                                    <br/><span className="text-slate-500">Score: {edu.score} {edu.scoreScale}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 mb-4">AI Insights</h3>
                              {app.validationResult.aiInsights ? (
                                <div className="space-y-4 text-sm bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                  <div>
                                    <span className="font-bold text-indigo-900 block mb-1">Summary</span>
                                    <p className="text-indigo-800">{app.validationResult.aiInsights.summary}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-indigo-900 block mb-1">Alignment</span>
                                    <p className="text-indigo-800">{app.validationResult.aiInsights.alignment}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-indigo-900 block mb-1">Strengths</span>
                                    <p className="text-indigo-800">{app.validationResult.aiInsights.strengths}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">No AI insights available.</p>
                              )}

                              {app.validationResult.tier2Flags.length > 0 && (
                                <div className="mt-6">
                                  <h4 className="font-bold text-amber-800 mb-2">Flags</h4>
                                  <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                                    {app.validationResult.tier2Flags.map((f, i) => <li key={i}>{f}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
