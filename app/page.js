'use client';

import { useState, useEffect } from 'react';

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeJobsResponse(value) {
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.jobs)) return value.jobs;
  return [];
}

function normalizeMatch(match) {
  return {
    ...match,
    resume_name: match.resume_name || match.resume_data?.name || match.resume_filename || 'Unnamed profile',
    job_title: match.job_title || match.job_data?.title || 'Untitled role',
    job_company: match.job_company || match.job_data?.company || 'Unknown company',
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState({ resumes: 0, jobs: 0, matches: 0, emails: 0 });
  const [recentMatches, setRecentMatches] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [resumePayload, jobsPayload, matchPayload, emailPayload] = await Promise.all([
          fetch('/api/resume').then((res) => res.json().catch(() => [])),
          fetch('/api/jobs').then((res) => res.json().catch(() => ({ data: [] }))),
          fetch('/api/match').then((res) => res.json().catch(() => [])),
          fetch('/api/email').then((res) => res.json().catch(() => [])),
        ]);

        const resumes = normalizeArray(resumePayload);
        const jobs = normalizeJobsResponse(jobsPayload);
        const matches = normalizeArray(matchPayload).map(normalizeMatch);
        const emails = normalizeArray(emailPayload);

        setStats({
          resumes: resumes.length,
          jobs: jobs.length,
          matches: matches.length,
          emails: emails.length,
        });
        setRecentMatches(matches.slice(0, 5));
      } catch (error) {
        console.error('Fetch error:', error);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h2>
        <p className="text-sm font-medium text-slate-400 mt-1">Real-time intelligence dashboard and market alignment metrics.</p>
      </header>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Resumes', value: stats.resumes, trend: '+12%', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'Jobs Analyzed', value: stats.jobs, trend: '+5%', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          { label: 'Matches Ready', value: stats.matches, trend: '+18%', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { label: 'Emails Drafted', value: stats.emails, trend: '+24%', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 p-7 flex flex-col justify-between group rounded-[24px]">
            <div className="flex items-start justify-between mb-4">
               <div className="w-12 h-12 rounded-[14px] bg-blue-50 flex items-center justify-center text-[#4285F4] border border-[#d2e3fc]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} /></svg>
               </div>
               <span className="px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-[#1a73e8] border border-[#d2e3fc]">{stat.trend}</span>
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
               <h3 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Alignments List */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[24px] p-8">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-lg font-bold text-slate-900">Recent Alignments</h3>
             <button className="text-xs font-bold text-[#4285F4] hover:underline">Full Repository</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Target</th>
                  <th className="text-left py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</th>
                  <th className="text-left py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fit Vector</th>
                  <th className="text-right py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail</th>
                </tr>
              </thead>
              <tbody>
                {recentMatches.map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 last:border-none group">
                    <td className="py-5 text-sm font-semibold text-slate-900">{m.resume_name}</td>
                    <td className="py-5 text-sm font-medium text-slate-400">{m.job_company || 'Global Entity'}</td>
                    <td className="py-5">
                      <span className="px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-[#1a73e8] border border-[#d2e3fc]">
                        {m.score}% Align
                      </span>
                    </td>
                    <td className="py-5 text-right">
                      <button className="w-10 h-10 rounded-full border border-slate-100 hover:border-[#4285F4] hover:text-[#4285F4] transition-all flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {recentMatches.length === 0 && (
                  <tr><td colSpan="4" className="py-12 text-center text-slate-400 font-medium text-sm italic">Intelligence stream initialization pending...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Console */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-[#e8f0fe] border-none rounded-[24px] p-8">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-[14px] bg-white flex items-center justify-center text-[#4285F4]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-slate-900">Quick Protocols</h3>
                    <p className="text-[10px] text-[#1a73e8] font-bold uppercase tracking-wider">Session Alpha</p>
                 </div>
              </div>
              <div className="space-y-3">
                 <button className="w-full bg-white hover:bg-slate-50 text-slate-900 rounded-full py-3.5 px-6 text-[13px] font-bold transition-all border border-[#d2e3fc]">Import Candidate Data</button>
                 <button className="w-full bg-[#1a73e8] hover:bg-[#174ea6] text-white rounded-full py-3.5 px-6 text-[13px] font-bold transition-all">Scan Market Trends</button>
              </div>
           </div>

           <div className="bg-white border border-slate-100 rounded-[24px] p-8">
              <h3 className="text-sm font-bold text-slate-900 mb-6">Process Integrity</h3>
              <div className="space-y-4">
                 {[
                   { label: 'Neural Engine', status: 'Sync', active: true },
                   { label: 'Flow Matrix', status: 'Active', active: true },
                   { label: 'Credential Link', status: 'Verified', active: true },
                 ].map((s, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{s.label}</span>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.status}</span>
                         <div className={`w-2 h-2 rounded-full ${s.active ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
