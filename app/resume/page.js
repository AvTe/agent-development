'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/ToastProvider';

function normalizeExperience(entry = {}) {
  return {
    title: entry.title || entry.job_title || 'Experience',
    company: entry.company || 'Unknown company',
    duration: entry.duration || '',
    highlights: Array.isArray(entry.highlights)
      ? entry.highlights
      : Array.isArray(entry.responsibilities)
        ? entry.responsibilities
        : [],
  };
}

function normalizeEducation(entry = {}) {
  return {
    degree: entry.degree || 'Education',
    institution: entry.institution || entry.school || 'Unknown institution',
    year: entry.year || entry.grad_year || '',
  };
}

function normalizeResumeData(parsedData = {}) {
  return {
    ...parsedData,
    skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
    experience: Array.isArray(parsedData.experience) ? parsedData.experience.map(normalizeExperience) : [],
    education: Array.isArray(parsedData.education) ? parsedData.education.map(normalizeEducation) : [],
    projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
  };
}

function normalizeResumeRecord(record) {
  if (!record) return null;
  return {
    ...record,
    parsed_data: normalizeResumeData(record.parsed_data || {}),
  };
}

export default function ResumePage() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matching, setMatching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [matchError, setMatchError] = useState('');
  const [recommended, setRecommended] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    if (selected?.id) {
      refreshRecommendations(selected.id);
    } else {
      setRecommended([]);
    }
  }, [selected, matches, jobs]);

  async function fetchInitial() {
    await Promise.all([fetchResumes(), fetchJobs(), fetchMatches()]);
  }

  async function fetchResumes() {
    try {
      const res = await fetch('/api/resume');
      const data = await res.json();
      const normalized = Array.isArray(data) ? data.map(normalizeResumeRecord).filter(Boolean) : [];
      setResumes(normalized);
      if (normalized.length > 0 && !selected) setSelected(normalized[0]);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }

  async function fetchJobs() {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      const normalized = Array.isArray(data?.data) ? data.data : Array.isArray(data?.jobs) ? data.jobs : [];
      setJobs(normalized);
    } catch (err) {
      console.error('Jobs fetch error:', err);
    }
  }

  async function fetchMatches() {
    try {
      const res = await fetch('/api/match');
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Match fetch error:', err);
    }
  }

  function refreshRecommendations(resumeId) {
    if (!resumeId) return;
    const recs = matches
      .filter((m) => Number(m.resume_id) === Number(resumeId))
      .sort((a, b) => Number(b.score) - Number(a.score));
    setRecommended(recs);
  }

  async function autoMatchResume(resumeRecord) {
    if (!resumeRecord?.id) return;
    setMatching(true);
    setMatchError('');
    try {
      // Ensure we have jobs and matches
      if (jobs.length === 0) {
        await fetchJobs();
      }
      if (matches.length === 0) {
        await fetchMatches();
      }
      const matchedJobIds = new Set(
        matches.filter((m) => Number(m.resume_id) === Number(resumeRecord.id)).map((m) => Number(m.job_id))
      );
      const jobsToMatch = jobs.filter((j) => !matchedJobIds.has(Number(j.id)));

      const newMatches = [];
      for (const job of jobsToMatch) {
        try {
          const res = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume_id: Number(resumeRecord.id), job_id: Number(job.id) }),
          });
          const data = await res.json();
          if (res.ok) {
            newMatches.push(data);
          }
        } catch (err) {
          console.error('Auto-match error:', err);
        }
      }
      if (newMatches.length > 0) {
        const updated = [...matches, ...newMatches];
        setMatches(updated);
        refreshRecommendations(resumeRecord.id);
        showToast('Recommended jobs refreshed.');
      } else if (jobsToMatch.length === 0) {
        showToast('Recommendations are already up to date.');
      }
    } catch (err) {
      setMatchError('Failed to refresh recommendations.');
    } finally {
      setMatching(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const input = e.currentTarget;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/resume', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const normalized = normalizeResumeRecord(data);
      setResumes((prev) => [normalized, ...prev.filter((item) => item.id !== normalized.id)]);
      setSelected(normalized);
      showToast('Profile asset captured and analyzed.');
      await autoMatchResume(normalized);
    } catch (err) {
      setError(err.message);
    } finally {
      input.value = '';
      setUploading(false);
    }
  }

  const selectedResume = normalizeResumeRecord(selected);
  const parsed = selectedResume?.parsed_data || normalizeResumeData();

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Resume Intelligence</h2>
        <p className="text-sm font-medium text-slate-400 mt-1">Profile management and AI-driven competency extraction.</p>
      </header>

      <div className="bg-white border border-slate-100 rounded-[24px] p-10">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-12 h-12 rounded-[14px] bg-blue-50 text-[#4285F4] flex items-center justify-center border border-[#d2e3fc]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-none">Import Mandate</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">PDF Profiling Trace</p>
          </div>
        </div>

        <label className={`w-full h-48 border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center transition-all group cursor-pointer ${
          uploading ? 'bg-slate-50 border-[#4285F4]' : 'bg-white border-slate-100 hover:border-[#4285F4]/30 hover:bg-blue-50/20'
        }`}>
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="application/pdf" />
          {uploading ? (
            <>
              <div className="w-10 h-10 border-4 border-blue-100 border-t-[#4285F4] rounded-full animate-spin mb-4"></div>
              <span className="text-[10px] font-bold text-[#4285F4] uppercase tracking-[0.2em]">Synchronizing Data...</span>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 text-slate-400 group-hover:text-[#4285F4] transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-900">Initiate Asset Upload</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Select target PDF package</p>
            </>
          )}
        </label>
        {error && <p className="text-red-500 text-[11px] font-bold mt-6 bg-red-50 p-4 rounded-[14px] border border-red-100">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 px-2">Managed Registry</h3>
          {resumes.length === 0 ? (
            <div className="p-10 border border-dashed border-slate-200 rounded-[24px] text-center bg-slate-50/50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Repository Null</p>
            </div>
          ) : (
            <div className="space-y-3 custom-scrollbar">
              {resumes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`w-full bg-white border border-slate-100 rounded-[24px] p-5 text-left transition-all duration-300 ${
                    selected?.id === r.id ? 'bg-[#e8f0fe] border-[#4285F4]' : 'hover:border-[#d2e3fc]'
                  }`}
                >
                  <p className="font-bold text-sm truncate text-slate-900">{r.parsed_data?.name || r.filename}</p>
                  <p className="text-[10px] font-bold text-[#1a73e8] uppercase tracking-widest mt-1.5">{new Date(r.created_at).toLocaleDateString()}</p>
                </button>
              ))}             
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          {selectedResume ? (
            <div className="bg-white border border-slate-100 rounded-[24px] p-10 min-h-[600px] animate-fade-in">
              <div className="flex justify-between items-start border-b border-slate-50 mb-10 pb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{parsed.name || 'Asset Discovery'}</h3>
                  <p className="text-sm font-bold text-[#4285F4] mt-1">{parsed.email || 'analytics@system.core'}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => autoMatchResume(selectedResume)}
                    disabled={matching}
                    className="px-8 py-3 rounded-full bg-[#4285F4] text-white text-xs font-bold hover:bg-[#1a73e8] transition-all border border-[#d2e3fc] disabled:opacity-60"
                  >
                    {matching ? 'Refreshing…' : 'Refresh Recommendations'}
                  </button>
                  <button className="px-8 py-3 rounded-full bg-blue-50 text-[#1a73e8] text-xs font-bold hover:bg-blue-100 transition-all border border-[#d2e3fc]">
                    Export Asset
                  </button>
                </div>
              </div>

              <div className="space-y-12">
                {matchError && <p className="text-red-500 text-[11px] font-bold bg-red-50 p-3 rounded-[14px] border border-red-100">{matchError}</p>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Location</p>
                    <p className="text-sm font-bold text-slate-900 mt-2">{parsed.location || 'Not specified'}</p>
                  </div>
                  <div className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Phone</p>
                    <p className="text-sm font-bold text-slate-900 mt-2">{parsed.phone || 'Not specified'}</p>
                  </div>
                  <div className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Experience</p>
                    <p className="text-sm font-bold text-slate-900 mt-2">{parsed.total_experience_years ?? 0} years</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Recommended Jobs</p>
                    <a href="/jobs" className="text-[11px] font-bold text-[#4285F4] hover:underline">Go to Jobs</a>
                  </div>
                  {recommended.length === 0 ? (
                    <p className="text-sm font-medium text-slate-400 italic">No recommendations yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {recommended.map((m) => (
                        <div key={m.id} className="border border-slate-100 rounded-[16px] p-4 flex items-center justify-between bg-slate-50/40">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{m.job_title}</p>
                            <p className="text-xs font-semibold text-slate-500">{m.job_company || 'Unknown company'}</p>
                            <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2">{m.analysis?.fit_summary || 'Match analysis available.'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full text-[10px] font-black text-[#4285F4] bg-blue-50 border border-blue-100">{m.score}% fit</span>
                            <a href="/match" className="text-[11px] font-bold text-[#4285F4] hover:underline">Details</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Profile Summary</p>
                  <div className="bg-slate-50/30 p-8 rounded-[24px] border border-slate-100">
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{parsed.summary || 'No summary extracted.'}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Competency Vectors</p>
                  <div className="flex flex-wrap gap-2.5">
                    {parsed.skills.length > 0 ? (
                      parsed.skills.map((s, i) => (
                        <span key={i} className="px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-[#1a73e8] border border-[#d2e3fc]">{s}</span>
                      ))
                    ) : (
                      <span className="text-sm font-medium text-slate-400 italic">No competency data extracted.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Historical Operation</p>
                  <div className="space-y-4">
                    {parsed.experience.length > 0 ? (
                      parsed.experience.map((exp, i) => (
                        <div key={i} className="bg-slate-50/30 p-8 rounded-[24px] border border-slate-100">
                          <h4 className="text-sm font-black text-slate-900 leading-none">{exp.title}</h4>
                          <p className="text-[10px] font-bold text-[#4285F4] mt-2 uppercase tracking-widest">
                            {exp.company}
                            {exp.duration ? ` - ${exp.duration}` : ''}
                          </p>
                          {exp.highlights.length > 0 ? (
                            <ul className="mt-6 space-y-2">
                              {exp.highlights.map((item, itemIndex) => (
                                <li key={itemIndex} className="text-xs font-semibold text-slate-500 leading-relaxed">{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs font-semibold text-slate-500 mt-6 leading-relaxed">No highlights extracted.</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-10 border border-dashed border-slate-100 rounded-[24px] text-center bg-slate-50/20">
                        <p className="text-[10px] font-bold text-slate-400 italic uppercase">Trace Null</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Credential Baseline</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsed.education.length > 0 ? (
                      parsed.education.map((edu, i) => (
                        <div key={i} className="bg-white border border-slate-100 p-8 rounded-[24px]">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{edu.degree}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            {edu.institution}
                            {edu.year ? ` - ${edu.year}` : ''}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-6 text-slate-400 text-[10px] font-bold italic uppercase">Registry Reflected Null.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-[24px] min-h-[600px] flex flex-col items-center justify-center text-center p-12 overflow-hidden">
              <div className="w-20 h-20 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center mb-6 text-slate-300">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Asset Node Ready</h4>
              <p className="text-xs font-bold text-slate-400 max-w-xs mt-2 uppercase tracking-widest leading-relaxed">Select or upload a profile node to access detailed intelligence traces.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
