'use client';

import { useState } from 'react';
import { useToast } from '@/lib/ToastProvider';

function normalizeSearchJobs(payload) {
  const source = Array.isArray(payload?.jobs)
    ? payload.jobs
    : Array.isArray(payload?.jobs_results)
      ? payload.jobs_results
      : [];

  return source.map((job, index) => ({
    ...job,
    id: job.job_id || `${job.title || 'job'}-${job.company_name || job.company || 'company'}-${index}`,
    company_name: job.company_name || job.company || '',
    location: job.location || '',
    description: job.description || '',
    related_links: Array.isArray(job.related_links) ? job.related_links : [],
  }));
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const { showToast } = useToast();

  async function handleSearch(e) {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError('');
    setSelected(null);
    try {
      const res = await fetch('/api/serpapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          location: location.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Search failed');

      const normalized = normalizeSearchJobs(data);
      setResults(normalized);
      showToast(`Market Discovery Sync: ${normalized.length} Assets.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleImport(job) {
    const importKey = job.job_id || job.id;
    setImporting(importKey);
    setError('');

    const company = job.company_name || job.company || 'Unknown Company';
    const city = job.location || 'Not specified';
    const role = job.title || 'Untitled role';

    try {
      const description = `${role}\n${company} - ${city}\n\n${job.description || ''}`;
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      showToast('Mandate Asset Imported.');
    } catch (err) {
      setError('Vector Import Error: ' + err.message);
    } finally {
      setImporting(null);
    }
  }

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Global Discovery</h2>
        <p className="text-sm font-medium text-slate-400 mt-1">Real-time market discovery powered by Google Intelligence Trace.</p>
      </header>

      <div className="bg-[#1a1c23] border-none rounded-[24px] p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-5 p-2">
          <div className="md:col-span-6 relative">
            <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Role Mandate Scan..."
              required
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-8 text-sm font-semibold text-white focus:bg-white/10 focus:border-[#4285F4] outline-none transition-all placeholder:text-slate-600 font-poppins"
            />
          </div>
          <div className="md:col-span-4 relative">
            <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location Vector..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-8 text-sm font-semibold text-white focus:bg-white/10 focus:border-[#4285F4] outline-none transition-all placeholder:text-slate-600 font-poppins"
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="w-full h-full bg-[#4285F4] hover:bg-[#1a73e8] text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2" disabled={searching}>
              {searching ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Initiate Scan'
              )}
            </button>
          </div>
        </form>
      </div>

      {error && <p className="text-red-500 text-[11px] font-bold bg-red-50 p-5 rounded-[14px] border border-red-100 uppercase tracking-widest">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {results.length > 0 && (
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Active Hits</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{results.length} Nodes</span>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-3 scrollbar-clean">
              {results.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelected(job)}
                  className={`w-full bg-white border border-slate-100 rounded-[24px] p-6 text-left transition-all duration-300 ${
                    selected?.id === job.id ? 'bg-[#e8f0fe] border-[#4285F4]' : 'hover:border-[#d2e3fc]'
                  }`}
                >
                  <p className={`font-bold text-[13px] truncate uppercase tracking-tight ${selected?.id === job.id ? 'text-blue-800' : 'text-slate-900'}`}>{job.title}</p>
                  <p className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${selected?.id === job.id ? 'text-blue-500' : 'text-slate-400'}`}>{job.company_name || 'Unknown'} - {job.location || 'Not specified'}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="lg:col-span-8">
          {selected ? (
            <div className="bg-white border border-slate-100 rounded-[24px] min-h-[600px] animate-fade-in relative flex flex-col p-10 overflow-hidden">
              <div className="flex justify-between items-start border-b border-slate-50 mb-12 pb-10">
                <div className="max-w-[70%]">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">{selected.title}</h3>
                  <p className="text-[11px] font-bold text-[#4285F4] mt-3 uppercase tracking-widest italic">{selected.via || 'Direct Marketplace Source'}</p>
                </div>
                <button
                  onClick={() => handleImport(selected)}
                  disabled={importing === (selected.job_id || selected.id)}
                  className="px-10 py-4 rounded-full bg-[#4285F4] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#1a73e8] transition-all disabled:opacity-50"
                >
                  {importing === (selected.job_id || selected.id) ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Sync Mandate'
                  )}
                </button>
              </div>

              <div className="space-y-12">
                <div className="flex flex-wrap gap-2.5">
                  <span className="px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">{selected.company_name || 'Unknown'}</span>
                  <span className="px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">{selected.location || 'Not specified'}</span>
                </div>

                <div className="bg-slate-50/50 p-10 rounded-[32px] border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Internal Trace: Full Profiling</p>
                  <p className="text-sm font-medium text-slate-600 leading-[1.8] whitespace-pre-line font-poppins">{selected.description || 'No description available.'}</p>
                </div>
              </div>
              <div className="mt-auto pt-10 text-right">
                <a href={selected.related_links?.[0]?.link || '#'} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-[#4285F4] hover:underline uppercase tracking-widest">
                  Go to Source Registry
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-[24px] min-h-[600px] flex flex-col items-center justify-center text-center p-12 overflow-hidden">
              <div className="w-20 h-20 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center mb-6 text-slate-300">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Market Protocol Active</h4>
              <p className="text-xs font-bold text-slate-400 max-w-xs mt-2 uppercase tracking-widest leading-relaxed">Execute a scan mandate to initialize discovery. Capture assets to target repository.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
