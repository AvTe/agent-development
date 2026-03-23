'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/lib/ToastProvider';

function normalizeJobsResponse(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.jobs)) return payload.jobs;
  return [];
}

function normalizeAnalysis(analysis = {}) {
  return {
    ...analysis,
    verdict: analysis.verdict || 'Partial Match',
    strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
    gaps: Array.isArray(analysis.gaps) ? analysis.gaps : [],
    suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
  };
}

function normalizeMatch(match) {
  if (!match) return null;
  const score = Number.isFinite(Number(match.score)) ? Number(match.score) : Number(match.match_score) || 0;

  return {
    ...match,
    score,
    match_score: score,
    analysis: normalizeAnalysis(match.analysis || {}),
    job_title: match.job_title || match.job_data?.title || 'Untitled role',
    job_company: match.job_company || match.job_data?.company || 'Unknown company',
    resume_name: match.resume_name || match.resume_data?.name || match.resume_filename || 'Unnamed profile',
  };
}

export default function MatchPage() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [resumeId, setResumeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [matching, setMatching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [resumePayload, jobPayload, matchPayload] = await Promise.all([
        fetch('/api/resume').then((res) => res.json().catch(() => [])),
        fetch('/api/jobs').then((res) => res.json().catch(() => ({ data: [] }))),
        fetch('/api/match').then((res) => res.json().catch(() => [])),
      ]);

      const resumeList = Array.isArray(resumePayload) ? resumePayload : [];
      const jobList = normalizeJobsResponse(jobPayload);
      const matchList = (Array.isArray(matchPayload) ? matchPayload : []).map(normalizeMatch).filter(Boolean);

      setResumes(resumeList);
      setJobs(jobList);
      setMatches(matchList);
      if (matchList.length > 0) setSelected(matchList[0]);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }

  async function handleMatch(e) {
    if (e) e.preventDefault();
    if (!resumeId || !jobId) return;

    setMatching(true);
    setError('');
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: Number(resumeId), job_id: Number(jobId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to compute match');

      const normalized = normalizeMatch(data);
      setMatches((prev) => [normalized, ...prev.filter((item) => item.id !== normalized.id)]);
      setSelected(normalized);
      showToast('Alignment intelligence generated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setMatching(false);
    }
  }

  const getScoreStyle = (score) => {
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-[#4285F4]/30';
    if (score >= 60) return 'text-slate-600 bg-slate-50 border-slate-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Match Analytics</h2>
        <p className="text-sm font-medium text-slate-400 mt-1">Cross-vector alignment analysis between profile and mandate.</p>
      </header>

      <div className="bg-white border border-slate-100 rounded-[24px] p-10">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-12 h-12 rounded-[14px] bg-blue-50 text-[#4285F4] flex items-center justify-center border border-[#d2e3fc]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-none">Compute Align</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Asset-Mandate Alignment Vector</p>
          </div>
        </div>

        <form onSubmit={handleMatch} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-4 space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asset Node</label>
            <select value={resumeId} onChange={(e) => setResumeId(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-full px-8 py-4 text-xs font-bold text-slate-700 focus:bg-white focus:border-[#4285F4] outline-none transition-all">
              <option value="">Select identity...</option>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.parsed_data?.name || r.filename}</option>)}
            </select>
          </div>
          <div className="md:col-span-5 space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mandate Target</label>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-full px-8 py-4 text-xs font-bold text-slate-700 focus:bg-white focus:border-[#4285F4] outline-none transition-all">
              <option value="">Select target...</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.parsed_data?.title || j.title}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="w-full bg-[#4285F4] text-white py-4 rounded-full text-sm font-bold hover:bg-[#1a73e8] transition-all" disabled={matching}>
              {matching ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Run Analytics'
              )}
            </button>
          </div>
        </form>
        {error && <p className="text-red-500 text-[11px] font-bold mt-6 bg-red-50 p-4 rounded-[14px] border border-red-100">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 px-2">Insight Stream</h3>
          {matches.length === 0 ? (
            <div className="p-10 border border-dashed border-slate-200 rounded-[24px] text-center bg-slate-50/20">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Stream Null</p>
            </div>
          ) : (
            <div className="space-y-3 custom-scrollbar">
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className={`w-full bg-white border border-slate-100 rounded-[24px] p-6 text-left transition-all duration-300 ${
                    selected?.id === m.id ? 'bg-[#e8f0fe] border-[#4285F4]' : 'hover:border-[#d2e3fc]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-[13px] truncate text-slate-900 uppercase tracking-tight">{m.job_title}</p>
                    <span className="text-[10px] font-black text-[#1a73e8]">{m.score}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4285F4]" style={{ width: `${m.score}%` }}></div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          {selected ? (
            <div className="bg-white border border-slate-100 rounded-[24px] p-10 min-h-[600px] animate-fade-in">
              <div className="flex justify-between items-start border-b border-slate-50 mb-12 pb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">{selected.job_title}</h3>
                  <p className="text-sm font-bold text-[#4285F4] mt-2 uppercase tracking-widest">{selected.job_company || 'Asset Node'}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-2">Candidate: {selected.resume_name}</p>
                </div>
                <div className={`w-24 h-24 rounded-[24px] border-2 flex flex-col items-center justify-center transition-all ${getScoreStyle(selected.score)}`}>
                  <span className="text-2xl font-black">{selected.score}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Fit Vector</span>
                </div>
              </div>

              <div className="space-y-12">
                <div className="bg-slate-50/50 p-10 rounded-[32px] border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Final Mandate Verdict</p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed font-poppins">{selected.analysis?.verdict}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold text-[#4285F4] uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#4285F4]"></span> Strength Vectors
                    </p>
                    <div className="space-y-3">
                      {selected.analysis?.strengths?.length > 0 ? selected.analysis.strengths.map((s, i) => (
                        <div key={i} className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100/30">
                          <p className="text-[11px] font-bold text-slate-800 leading-relaxed">{s}</p>
                        </div>
                      )) : <p className="text-xs font-medium text-slate-400 italic">No strengths generated.</p>}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span> Strategic Gaps
                    </p>
                    <div className="space-y-3">
                      {selected.analysis?.gaps?.length > 0 ? selected.analysis.gaps.map((g, i) => (
                        <div key={i} className="bg-slate-50/40 p-6 rounded-[24px] border border-slate-100/50">
                          <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{g}</p>
                        </div>
                      )) : <p className="text-xs font-medium text-slate-400 italic">No gaps generated.</p>}
                    </div>
                  </div>
                </div>

                <div className="p-10 bg-[#e8f0fe] rounded-[32px]">
                  <p className="text-[10px] font-bold text-[#1a73e8] uppercase tracking-[0.2em] mb-8">Strategic Optimization Path</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {selected.analysis?.suggestions?.length > 0 ? selected.analysis.suggestions.map((s, i) => (
                      <div key={i} className="bg-white p-6 rounded-[24px] border border-blue-100 flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-[#4285F4] mt-2 shrink-0"></div>
                        <p className="text-[11px] font-bold text-slate-900 leading-relaxed">{s}</p>
                      </div>
                    )) : <p className="text-xs font-medium text-slate-500 italic">No suggestions generated.</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-[24px] min-h-[600px] flex flex-col items-center justify-center text-center p-12 overflow-hidden">
              <div className="w-20 h-20 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center mb-6 text-slate-300">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Analytics Hub Dormant</h4>
              <p className="text-xs font-bold text-slate-400 max-w-xs mt-2 uppercase tracking-widest leading-relaxed">Select entities or run a compute protocol to initiate alignment intelligence traces.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
