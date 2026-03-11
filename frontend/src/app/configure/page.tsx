"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Cpu, Gauge, Loader2, CheckCircle2, ChevronRight, Layers } from 'lucide-react';

export default function ConfigurePage() {
  const router = useRouter();
  const [blockingRules, setBlockingRules] = useState<string[]>(['postcode', 'exact match']); // default selection
  const [availableRules] = useState(['given_name', 'surname', 'postcode', 'suburb', 'state', 'date_of_birth']);
  
  const [models, setModels] = useState<string[]>(['Logistic Regression', 'Random Forest']);
  const [availableModels] = useState(['Logistic Regression', 'Random Forest', 'Gradient Boosting']);
  
  const [threshold, setThreshold] = useState<number>(0.9);
  
  const [blockStats, setBlockStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [running, setRunning] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  // Debounced effect to fetch blocking stats
  useEffect(() => {
    if (blockingRules.length === 0) {
        setBlockStats(null);
        return;
    }
    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await fetch('http://localhost:8001/api/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rules: blockingRules })
            });
            if(res.ok) {
                const data = await res.json();
                setBlockStats(data);
            }
        } catch(e) { console.error(e); }
        setLoadingStats(false);
    }
    const t = setTimeout(fetchStats, 500);
    return () => clearTimeout(t);
  }, [blockingRules]);

  const toggleRule = (r: string) => {
      setBlockingRules(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };
  
  const toggleModel = (m: string) => {
      setModels(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const executePipeline = async () => {
      if(blockingRules.length === 0 || models.length === 0) return;
      
      setRunning(true);
      
      // Artificial UI delays sequentially simulating the pipeline logic since backend is monolithic for the whole process
      const steps = [
          "Pre-processing incoming DataFrames...",
          "Analyzing Blocking geometries via DuckDB...",
          "Training Splink Expectation-Maximisation Engine...",
          "Generating Probabilistic predictions...",
          "Engineering Scikit-Learn Text Distance features...",
          "Training ML Classifiers (" + models.join(', ') + ")...",
          "Evaluating model pipeline metrics...",
          "Finalizing Result Dumps..."
      ];
      
      // Spin up backend execution concurrently while UI progresses artificially
      const backendPromise = fetch('http://localhost:8001/api/run-matching', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocking_rules: blockingRules, models: models, threshold: threshold })
      }).then(r => r.json());
      
      for(let i=0; i<steps.length; i++) {
          setProgressStep(i);
          // Wait random time between 800ms to 2000ms
          await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
      }
      
      try {
          await backendPromise;
          router.push('/results');
      } catch(e) {
          console.error("Pipeline Failed", e);
          setRunning(false);
          alert("Pipeline failed execution. Check backend logs.");
      }
  }

  if (running) {
      return (
          <div className="max-w-2xl mx-auto pt-24 space-y-8 animate-in fade-in duration-500">
               <div className="text-center space-y-4">
                   <div className="relative w-32 h-32 mx-auto">
                       <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-full h-full rounded-full border-4 border-brand/20 border-t-brand" />
                       <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">{Math.round((progressStep / 7) * 100)}%</span>
                       </div>
                   </div>
                   <h2 className="text-2xl font-bold text-white tracking-tight">Executing Central Pipeline</h2>
                   <p className="text-brand font-medium h-6">{[
                      "Pre-processing datasets...", "Analyzing duckdb geometry...", "Training Splink Engine...",
                      "Generating probabilities...", "Engineering Sklearn distances...", "Training selected models...",
                      "Evaluating Metrics...", "Finalising Dashboard Exports..."
                   ][progressStep]}</p>
               </div>
               
               <div className="glass rounded-xl p-6">
                    <ul className="space-y-4">
                        {[0,1,2,3,4,5,6,7].map(i => (
                            <li key={i} className={`flex items-center gap-3 text-sm ${i < progressStep ? 'text-slate-400' : i === progressStep ? 'text-white font-medium' : 'text-slate-600'}`}>
                                {i < progressStep ? <CheckCircle2 className="w-5 h-5 text-success" /> : i === progressStep ? <Loader2 className="w-5 h-5 text-brand animate-spin" /> : <div className="w-5 h-5 rounded-full border border-slate-700" />}
                                {[
                                    "Pre-processing incoming DataFrames",
                                    "Analyzing Blocking geometries via DuckDB",
                                    "Training Splink Expectation-Maximisation Engine",
                                    "Generating Probabilistic predictions",
                                    "Engineering Scikit-Learn Text Distance features",
                                    "Training ML Classifiers",
                                    "Evaluating model pipeline metrics",
                                    "Finalizing Result Dumps"
                                ][i]}
                            </li>
                        ))}
                    </ul>
               </div>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pt-6 pb-12">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Configure Pipeline</h2>
        <p className="text-slate-400 mt-2 font-medium">Fine-tune the engine architecture and specify evaluation constraints.</p>
      </header>

      <section className="glass rounded-2xl p-8 relative overflow-hidden group">
         <div className="flex items-start justify-between mb-6">
             <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-brand" />
                    1. Splink Blocking Rules
                </h3>
                <p className="text-sm text-slate-400 mt-1">Deterministically narrow down the N x M Cartesian product to highly likely candidate domains.</p>
             </div>
             
             <div className={`p-4 rounded-xl border ${blockStats?.estimated_total > 5000000 ? 'bg-danger/10 border-danger/30' : 'bg-black/30 border-white/5'} text-right min-w-[200px]`}>
                 <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Estimated Comparisons</div>
                 {loadingStats ? (
                     <div className="h-8 flex items-center justify-end"><Loader2 className="w-5 h-5 animate-spin text-slate-500" /></div>
                 ) : (
                     <div className={`text-2xl font-bold tracking-tight ${blockStats?.estimated_total > 5000000 ? 'text-danger' : 'text-white'}`}>
                         {blockStats?.estimated_total?.toLocaleString() || "0"}
                     </div>
                 )}
                 {blockStats?.estimated_total > 5000000 && <div className="text-[10px] text-danger mt-1">Warning: Extensively High Load</div>}
             </div>
         </div>
         
         <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
             {availableRules.map(rule => (
                 <button 
                    key={rule} 
                    onClick={() => toggleRule(rule)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all border ${blockingRules.includes(rule) ? 'bg-brand/20 border-brand text-white shadow-[0_0_10px_var(--color-brand-glow)]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                     {rule.replace('_', ' ').toUpperCase()}
                 </button>
             ))}
         </div>
      </section>

      <section className="glass rounded-2xl p-8">
         <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            2. ML Ensemble Classifiers
         </h3>
         <p className="text-sm text-slate-400 mb-6">Select downstream Machine Learning models to run validation grids against the probabilisitc scores.</p>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {availableModels.map(model => (
                 <label key={model} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${models.includes(model) ? 'bg-purple-500/10 border-purple-400/50' : 'bg-white/5 border-white/10'}`}>
                     <input type="checkbox" checked={models.includes(model)} onChange={() => toggleModel(model)} className="w-4 h-4 rounded border-white/20 text-purple-500 focus:ring-purple-500 bg-white/5" />
                     <span className={models.includes(model) ? 'text-white font-medium' : 'text-slate-400'}>{model}</span>
                 </label>
             ))}
         </div>
         
         <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex justify-between items-center mb-4">
                   <h4 className="font-semibold text-white flex items-center gap-2"><Gauge className="w-4 h-4 text-slate-400"/> Confirmation Threshold</h4>
                   <span className="text-brand font-mono font-bold">{threshold} ({threshold >= 0.9 ? 'High' : threshold >= 0.7 ? 'Medium' : 'Broad'})</span>
              </div>
              <input type="range" min="0.5" max="0.99" step="0.01" value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} className="w-full accent-brand bg-white/10 rounded-lg appearance-none h-2 cursor-pointer" />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>Looser (0.50)</span>
                  <span>Strict (0.99)</span>
              </div>
         </div>
      </section>

      <div className="flex justify-end pt-4">
          <button 
             onClick={executePipeline} 
             disabled={blockingRules.length === 0 || models.length === 0}
             className="bg-gradient-to-r from-success/90 to-brand hover:from-success hover:to-brand text-white font-bold px-10 py-4 rounded-xl shadow-lg transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
              <Layers className="w-5 h-5"/> Execute Linkage Pipeline
          </button>
      </div>
    </div>
  );
}
