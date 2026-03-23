import Link from 'next/link';
import './globals.css';
import { ToastProvider } from '@/lib/ToastProvider';

export const metadata = {
  title: 'JobHunter AI | Professional Market Intelligence',
  description: 'AI-driven job analysis and resume intelligence system powering high-conversion outreaches.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-50 text-slate-800 antialiased font-poppins selection:bg-blue-100 selection:text-blue-900">
        <ToastProvider>
          <div className="flex min-h-screen">
            {/* Sidebar Navigation */}
            <aside className="w-[280px] border-r border-slate-100 flex flex-col fixed inset-y-0 z-50 bg-white">
              <div className="p-10 pb-12 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-[14px] bg-[#4285F4] flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
                 <h1 className="text-xl font-bold text-slate-900 tracking-tight">JobHunter<span className="text-[#4285F4]">.</span></h1>
              </div>

              <nav className="flex-1 px-6 space-y-1 overflow-y-auto">
                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Command Center</p>
                {[
                  { href: "/", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
                  { href: "/resume", label: "Resume Intel", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                  { href: "/jobs", label: "Market Intel", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                  { href: "/match", label: "Match Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
                  { href: "/email", label: "Outreach Engine", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                  { href: "/search", label: "Search Library", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="flex items-center gap-4 px-4 py-3.5 text-[13px] font-semibold text-slate-500 rounded-[14px] hover:bg-[#e8f0fe] hover:text-[#1a73e8] transition-all group">
                    <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d={item.icon} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="p-8 border-t border-slate-50">
                 <div className="bg-[#e8f0fe] rounded-[24px] p-6 text-center">
                    <p className="text-[10px] font-bold text-[#1a73e8] uppercase tracking-widest mb-2">Pro Access</p>
                    <p className="text-[11px] font-medium text-slate-600 mb-4 leading-relaxed">Unlock unlimited AI market insights.</p>
                    <button className="w-full bg-[#1a73e8] text-white py-3 rounded-full text-xs font-bold transition-all hover:bg-[#174ea6]">Upgrade</button>
                 </div>
              </div>
            </aside>

            {/* Application Workspace */}
            <main className="flex-1 ml-[280px]">
              {/* Header */}
              <header className="h-[80px] px-12 border-b border-slate-100 flex items-center justify-between sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
                <div className="flex-1 max-w-lg relative group">
                  <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4285F4] transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg>
                  <input type="text" placeholder="Access analytics or candidate data..." className="w-full bg-slate-50 border border-slate-100 rounded-full py-3 pl-14 pr-6 text-xs font-semibold focus:bg-white focus:border-[#4285F4] outline-none transition-all placeholder:text-slate-400" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1">
                    <button className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/></svg></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                       <p className="text-xs font-bold text-slate-900 leading-none mb-1">Felix Vance</p>
                       <p className="text-[10px] font-bold text-[#4285F4] uppercase tracking-wider">Analyst</p>
                    </div>
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200" alt="" />
                  </div>
                </div>
              </header>

              <div className="p-12 pb-24 max-w-[1300px] mx-auto animate-fade-in relative z-10">
                {children}
              </div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
