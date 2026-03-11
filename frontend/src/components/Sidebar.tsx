"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Database, Settings, Activity, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    { name: 'Upload Data', href: '/upload', icon: Database },
    { name: 'Configure Pipeline', href: '/configure', icon: Settings },
    { name: 'Results & Triage', href: '/results', icon: Users },
    { name: 'Model Metrics', href: '/metrics', icon: Activity },
    { name: 'Data Quality', href: '/quality', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 flex flex-col glass z-50">
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand to-purple-500 flex items-center justify-center shadow-[0_0_15px_var(--color-brand-glow)]">
          <Database className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Data<span className="text-gradient">Link</span></h1>
      </div>
      
      <div className="flex-1 py-6 px-4 flex flex-col gap-2">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2">Pipeline Dashboard</div>
        
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link key={link.name} href={link.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-brand/20 text-brand shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-brand/30" 
                  : "text-slate-400 hover:text-white glass-hover"
              )}
            >
              <Icon className={clsx("w-4 h-4", isActive ? "text-brand" : "text-slate-500")} />
              {link.name}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-white/5 flex flex-col items-center gap-1">
        <div className="text-[10px] text-brand/70 font-semibold uppercase tracking-widest mt-1">Built by Samuel Jeromiah</div>
        <div className="text-xs text-slate-500">DataLink AI v1.0.0</div>
      </div>
    </aside>
  );
}
