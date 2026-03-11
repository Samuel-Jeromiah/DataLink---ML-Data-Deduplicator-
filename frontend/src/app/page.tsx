import Link from 'next/link';
import { ArrowRight, Database, Settings, ShieldCheck, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-12 pb-16">
      <header className="text-center max-w-3xl mx-auto pt-16">
        <h1 className="text-5xl font-extrabold text-white tracking-tight mb-6">
          Entity Resolution & Data Quality Dashboard
        </h1>
        <p className="text-xl text-slate-400 font-medium">
          A production-grade pipeline bridging deterministic logic and Probabilistic Expectation-Maximisation (Splink) to uncover hidden record linkages across disparate datasets.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/upload" className="bg-gradient-to-r from-brand to-purple-600 hover:from-brand/80 hover:to-purple-600/80 text-white font-semibold py-3 px-8 rounded-full shadow-lg shadow-brand/25 transition-all flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <section className="glass rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent pointer-events-none" />
        <h2 className="text-xl font-bold text-white mb-8 border-b border-white/5 pb-4">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center relative">
            <div className="w-16 h-16 mx-auto bg-brand/10 rounded-full flex items-center justify-center mb-4 z-10 relative">
              <Database className="w-8 h-8 text-brand" />
            </div>
            <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-gradient-to-r from-brand/20 to-transparent" />
            <h3 className="text-white font-semibold mb-2">1. Upload</h3>
            <p className="text-sm text-slate-400">Ingest Dataset A and B. Get instant quality grades.</p>
          </div>
          
          <div className="text-center relative">
            <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center mb-4 z-10 relative">
              <Settings className="w-8 h-8 text-purple-400" />
            </div>
            <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-gradient-to-r from-purple-500/20 to-transparent" />
            <h3 className="text-white font-semibold mb-2">2. Configure</h3>
            <p className="text-sm text-slate-400">Set Splink blocking rules and select ML Classifiers.</p>
          </div>
          
          <div className="text-center relative">
            <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-4 z-10 relative">
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
            <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-gradient-to-r from-blue-500/20 to-transparent" />
            <h3 className="text-white font-semibold mb-2">3. Analyse</h3>
            <p className="text-sm text-slate-400">Train models and synthesize cross-domain matches.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-white font-semibold mb-2">4. Results</h3>
            <p className="text-sm text-slate-400">Export high-confidence clusters and evaluate metrics.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6 hover:-translate-y-1 transition-transform">
          <h3 className="text-lg font-bold text-white mb-2">Probabilistic Matching</h3>
          <p className="text-slate-400 text-sm">Automated Expectation-Maximisation modeling using Splink & DuckDB to resolve complex typographical edge cases effortlessly.</p>
        </div>
         <div className="glass rounded-xl p-6 hover:-translate-y-1 transition-transform">
          <h3 className="text-lg font-bold text-white mb-2">ML Classification</h3>
          <p className="text-slate-400 text-sm">Supercharges standard record linkage with SciKit-Learn Random Forests, calculating optimized F1 thresholds live.</p>
        </div>
         <div className="glass rounded-xl p-6 hover:-translate-y-1 transition-transform">
          <h3 className="text-lg font-bold text-white mb-2">Data Quality Scoring</h3>
          <p className="text-slate-400 text-sm">Holistic dataset profiling detecting null densities ensuring garbage-in-garbage-out isn't a problem.</p>
        </div>
         <div className="glass rounded-xl p-6 hover:-translate-y-1 transition-transform">
          <h3 className="text-lg font-bold text-white mb-2">Interactive Visualisations</h3>
          <p className="text-slate-400 text-sm">Rendered natively with React-Plotly across intricate ROC & Precision-Recall dimensional sweeps.</p>
        </div>
      </section>
      
      <div className="flex justify-center flex-wrap gap-4 opacity-50 pt-8">
        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-white">Next.js 14</span>
        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-white">FastAPI</span>
        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-white">Tailwind v4</span>
        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-white">Scikit-Learn</span>
        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-white">Splink (DuckDB)</span>
        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-white">Plotly</span>
      </div>
    </div>
  );
}
