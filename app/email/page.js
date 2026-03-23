'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/ToastProvider';

export default function EmailPage() {
  const [matches, setMatches] = useState([]);
  const [emails, setEmails] = useState([]);
  const [matchId, setMatchId] = useState('');
  const [tone, setTone] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [m, e] = await Promise.all([
        fetch('/api/match').then((r) => r.json().catch(() => [])),
        fetch('/api/email').then((r) => r.json().catch(() => [])),
      ]);
      const normalizedMatches = Array.isArray(m) ? m : [];
      const normalizedEmails = Array.isArray(e) ? e : [];
      setMatches(normalizedMatches);
      setEmails(normalizedEmails);
      if (normalizedEmails.length > 0 && !selected) setSelected(normalizedEmails[0]);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!matchId) return;

    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: Number(matchId), tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEmails((prev) => [data, ...prev]);
      setSelected(data);
      showToast('Outreach draft generated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Intelligence copied to clipboard.');
  };

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Outreach Engine</h2>
        <p className="text-sm font-medium text-slate-400 mt-1">High-conversion outreach generation protocol for global mandates.</p>
      </header>

      {/* Composition Engine */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-10">
        <div className="flex items-center gap-5 mb-12">
           <div className="w-12 h-12 rounded-[14px] bg-blue-50 text-[#4285F4] flex items-center justify-center border border-[#d2e3fc]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
           </div>
           <div>
              <h3 className="text-lg font-bold text-slate-900 leading-none">Draft Outreach</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Voice Modulation & Link Trace</p>
           </div>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-8 space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Alignment Hub Link</label>
              <div className="relative group/select">
                <select 
                  value={matchId} 
                  onChange={(e) => setMatchId(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-full px-8 py-4 text-xs font-bold text-slate-700 focus:bg-white focus:border-[#4285F4] outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select a previous alignment insight...</option>
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.job_title} - {m.job_company} ({m.score}%)
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-[#4285F4] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            
            <div className="space-y-5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Voice Protocol Target</label>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {['professional', 'enthusiastic', 'concise', 'bold'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`h-12 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                        tone === t ? 'bg-[#4285F4] border-[#4285F4] text-white' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
               </div>
            </div>
          </div>
          <div className="md:col-span-4">
             <button type="submit" className="w-full h-[140px] rounded-full bg-[#4285F4] text-white font-bold flex flex-col items-center justify-center gap-3 hover:bg-[#1a73e8] transition-all disabled:opacity-50 active:scale-[0.98]" disabled={generating}>
               {generating ? (
                  <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
               ) : (
                 <>
                   <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </div>
                   <span className="text-[11px] font-black uppercase tracking-[0.2em]">Generate Draft</span>
                 </>
               )}
             </button>
          </div>
        </form>
        {error && <p className="text-red-500 text-[11px] font-bold mt-8 bg-red-50 p-5 rounded-[14px] border border-red-100">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Registry Sidebar */}
        <div className="lg:col-span-4 space-y-4">
           <h3 className="text-lg font-bold text-slate-900 px-2 uppercase tracking-tight">Draft Registry</h3>
           {emails.length === 0 ? (
             <div className="p-12 border border-dashed border-slate-200 rounded-[24px] text-center bg-slate-50/30">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Null</p>
             </div>
           ) : (
             <div className="space-y-3 custom-scrollbar">
               {emails.map((e) => (
                 <button
                   key={e.id}
                   onClick={() => setSelected(e)}
                   className={`w-full bg-white border border-slate-100 rounded-[24px] p-6 text-left transition-all duration-300 ${
                     selected?.id === e.id ? 'bg-[#e8f0fe] border-[#4285F4]' : 'hover:border-[#d2e3fc]'
                   }`}
                 >
                   <p className="font-bold text-[13px] truncate text-slate-900 uppercase tracking-tight">{e.subject}</p>
                   <div className="flex items-center justify-between mt-3">
                      <span className="text-[9px] font-black text-[#1a73e8] border border-[#d2e3fc] px-3 py-1 rounded-full bg-white uppercase tracking-widest">{e.tone}</span>
                      <span className="text-[8px] font-black text-slate-300 uppercase">{new Date(e.created_at).toLocaleDateString()}</span>
                   </div>
                 </button>
               ))}
             </div>
           )}
        </div>

        {/* Intelligence Deep Dive */}
        <div className="lg:col-span-8">
           {selected ? (
             <div className="bg-white border border-slate-100 rounded-[24px] min-h-[600px] animate-fade-in relative flex flex-col overflow-hidden">
                <div className="p-10 border-b border-slate-50 bg-[#f8fafc]/50">
                   <div className="flex justify-between items-start mb-8">
                      <div className="flex-1 min-w-0 pr-8">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Protocol Header: Subject</p>
                         <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{selected.subject}</h3>
                      </div>
                      <button onClick={() => copyToClipboard(`Subject: ${selected.subject}\n\n${selected.body}`)} className="w-14 h-14 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#4285F4] hover:border-[#4285F4] transition-all bg-white shrink-0">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a1 1 0 012-2h2a1 1 0 012 2" /></svg>
                      </button>
                   </div>
                   <div className="flex flex-wrap gap-2.5">
                      <span className="px-5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white border border-slate-100 text-slate-500">Tone: {selected.tone}</span>
                      <span className="px-5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white border border-slate-100 text-slate-500">Processor: Alpha V2</span>
                   </div>
                </div>
                <div className="p-10 flex-1 bg-white scrollbar-clean overflow-y-auto max-h-[500px]">
                   <p className="text-sm font-medium text-slate-700 leading-[1.8] whitespace-pre-line font-poppins">{selected.body}</p>
                </div>
                <div className="p-8 border-t border-slate-50 bg-slate-50/20 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
                   <span>Outcome: Final Mandate Trace</span>
                   <span>System Security Encrypted</span>
                </div>
             </div>
           ) : (
            <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-[24px] min-h-[600px] flex flex-col items-center justify-center text-center p-12 overflow-hidden">
               <div className="w-20 h-20 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center mb-6 text-slate-300">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
               </div>
               <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Outreach Console Offline</h4>
               <p className="text-xs font-bold text-slate-400 max-w-xs mt-2 uppercase tracking-widest leading-relaxed">Select an alignment or load repository to access detailed intelligence draft traces.</p>
            </div>
           )}
        </div>
      </div>
    </div>
  );
}


