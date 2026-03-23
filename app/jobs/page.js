'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/ToastProvider';

function normalizeJobData(parsedData = {}) {
  return {
    ...parsedData,
    required_skills: Array.isArray(parsedData.required_skills) ? parsedData.required_skills : [],
    preferred_skills: Array.isArray(parsedData.preferred_skills) ? parsedData.preferred_skills : [],
    responsibilities: Array.isArray(parsedData.responsibilities) ? parsedData.responsibilities : [],
    benefits: Array.isArray(parsedData.benefits) ? parsedData.benefits : [],
  };
}

function normalizeJobRecord(record) {
  if (!record) return null;
  return {
    ...record,
    parsed_data: normalizeJobData(record.parsed_data || {}),
  };
}

function getJobsFromResponse(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.jobs)) return payload.jobs;
  return [];
}

export default function JobsPage() {
  const [recentJobs, setRecentJobs] = useState([]);
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      const normalized = getJobsFromResponse(data).map(normalizeJobRecord).filter(Boolean);
      setRecentJobs(normalized);
      if (normalized.length > 0 && !selected) setSelected(normalized[0]);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }

  async function handleAnalyze(e) {
    if (e) e.preventDefault();
    if (!description) return;

    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const normalized = normalizeJobRecord(data);
      setRecentJobs((prev) => [normalized, ...prev.filter((item) => item.id !== normalized.id)]);
      setSelected(normalized);
      setDescription('');
      showToast('Market mandate analyzed.');
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  const selectedJob = normalizeJobRecord(selected);
  const parsed = selectedJob?.parsed_data || normalizeJobData();

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Market Intel</h2>
        <p className="text-sm font-medium text-slate-400 mt-1">Strategic job analysis and mandate requirement mapping.</p>
      </header>

      <div className="bg-white border border-slate-100 rounded-[24px] p-10">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-12 h-12 rounded-[14px] bg-blue-50 text-[#4285F4] flex items-center justify-center border border-[#d2e3fc]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-none">Capture Mandate</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Description Input Trace</p>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-6">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste raw mandate documentation here..."
            className="w-full h-48 bg-slate-50 border border-slate-100 rounded-[24px] p-8 text-sm font-semibold focus:bg-white focus:border-[#4285F4] outline-none transition-all placeholder:text-slate-400 resize-none scrollbar-clean font-poppins"
          />
          <div className="flex items-center justify-between pt-6 border-t border-slate-50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol: AI Extraction Trace</span>
            <button type="submit" className="px-10 py-3.5 rounded-full bg-[#4285F4] text-white text-sm font-bold hover:bg-[#1a73e8] transition-all disabled:opacity-50" disabled={analyzing}>
              {analyzing ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Analyze Intel'
              )}
            </button>
          </div>
        </form>
        {error && <p className="text-red-500 text-[11px] font-bold mt-6 bg-red-50 p-4 rounded-[14px] border border-red-100">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 px-2">Mandate Stream</h3>
          {recentJobs.length === 0 ? (
            <div className="p-10 border border-dashed border-slate-200 rounded-[24px] text-center bg-slate-50/20">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Stream Empty</p>
            </div>
          ) : (
            <div className="space-y-3 custom-scrollbar">
              {recentJobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSelected(j)}
                  className={`w-full bg-white border border-slate-100 rounded-[24px] p-5 text-left transition-all duration-300 ${
                    selected?.id === j.id ? 'bg-[#e8f0fe] border-[#4285F4]' : 'hover:border-[#d2e3fc]'
                  }`}
                >
                  <p className="font-bold text-sm truncate text-slate-900">{j.parsed_data?.title || j.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold text-[#1a73e8] uppercase tracking-widest">{j.parsed_data?.company || j.company}</span>
                    <span className="text-[9px] font-bold text-slate-400">{new Date(j.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          {selectedJob ? (
            <div className="bg-white border border-slate-100 rounded-[24px] p-10 min-h-[600px] animate-fade-in">
              <div className="flex justify-between items-start border-b border-slate-50 mb-12 pb-8">
                <div className="max-w-[70%]">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{parsed.title || 'Resource Asset'}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-bold text-[#4285F4] uppercase tracking-widest">{parsed.company || 'Organization'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200 text-[10px]"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{parsed.location || 'Not specified'}</span>
                  </div>
                </div>
                <button className="px-8 py-3 rounded-full bg-blue-50 text-[#1a73e8] text-xs font-bold hover:bg-blue-100 transition-all border border-[#d2e3fc]">Export Mandate</button>
              </div>

              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Role Type</p>
                    <p className="text-sm font-bold text-slate-900 mt-2">{parsed.type || 'Not specified'}</p>
                  </div>
                  <div className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Experience</p>
                    <p className="text-sm font-bold text-slate-900 mt-2">{parsed.experience_required || 'Not specified'}</p>
                  </div>
                  <div className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Education</p>
                    <p className="text-sm font-bold text-slate-900 mt-2">{parsed.education_required || 'Not specified'}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Role Summary</p>
                  <div className="bg-slate-50/30 p-8 rounded-[24px] border border-slate-100">
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{parsed.summary || 'No summary extracted.'}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Competency Baseline</p>
                  <div className="flex flex-wrap gap-2.5">
                    {parsed.required_skills.length > 0 ? (
                      parsed.required_skills.map((s, i) => (
                        <span key={i} className="px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-[#1a73e8] border border-[#d2e3fc]">{s}</span>
                      ))
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">No requirement mapping found.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Preferred Skills</p>
                  <div className="flex flex-wrap gap-2.5">
                    {parsed.preferred_skills.length > 0 ? (
                      parsed.preferred_skills.map((skill, i) => (
                        <span key={i} className="px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-100">{skill}</span>
                      ))
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">No preferred skills specified.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Operational Scope</p>
                  <div className="space-y-4">
                    {parsed.responsibilities.length > 0 ? (
                      parsed.responsibilities.map((res, i) => (
                        <div key={i} className="bg-slate-50/30 p-8 rounded-[24px] border border-slate-100">
                          <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase tracking-tight">{res}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 border border-dashed border-slate-100 rounded-[24px] text-center bg-slate-50/10">
                        <p className="text-[10px] font-bold text-slate-400 italic uppercase">Trace Null</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Incentive Protocol</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsed.benefits.length > 0 ? (
                      parsed.benefits.map((benefit, i) => (
                        <div key={i} className="bg-white border border-slate-100 p-8 rounded-[24px]">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{benefit}</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-6 text-slate-400 text-[10px] font-bold italic uppercase">Offer Trace Null.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-[24px] min-h-[600px] flex flex-col items-center justify-center text-center p-12 overflow-hidden">
              <div className="w-20 h-20 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center mb-6 text-slate-300">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Market Intel Hub Ready</h4>
              <p className="text-xs font-bold text-slate-400 max-w-xs mt-2 uppercase tracking-widest leading-relaxed">Initialize a mandate analysis or select an asset from repository to start extraction traces.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
