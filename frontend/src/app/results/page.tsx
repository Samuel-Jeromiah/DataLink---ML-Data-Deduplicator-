"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Download, Activity, BarChart4, ChevronRight, Layers, Table, FlaskConical, CheckCircle2, X, Loader2 } from 'lucide-react';
import Plot from '@/components/Plot';

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState<'splink' | 'ml'>('splink');
  const [metrics, setMetrics] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [featureImportances, setFeatureImportances] = useState<any>(null);
  const [selectedPair, setSelectedPair] = useState<any>(null);
  const [waterfallData, setWaterfallData] = useState<any[] | null>(null);

  const fetchWaterfall = async (pair: any) => {
      setSelectedPair(pair);
      setWaterfallData(null);
      try {
          const res = await fetch(`http://localhost:8001/api/waterfall/${pair.base_id_l}`);
          const data = await res.json();
          setWaterfallData(data);
      } catch (e) {
          console.error(e);
          setWaterfallData([]);
      }
  };

  useEffect(() => {
     Promise.all([
         fetch('http://localhost:8001/api/metrics').then(r => r.json()),
         fetch('http://localhost:8001/api/results/matches?limit=100').then(r => r.json()),
         fetch('http://localhost:8001/api/feature-importance').then(r => r.json())
     ]).then(([m, mtchs, f]) => {
         setMetrics(m);
         setMatches(mtchs);
         setFeatureImportances(f);
     }).catch(console.error);
  }, []);

  const handleDownload = (type: string) => {
      window.open(`http://localhost:8001/api/download/${type}`, '_blank');
  };

  if(!metrics) return <div className="animate-pulse h-96 glass mt-8 rounded-xl" />;

  const importancePlotData = featureImportances ? [{
      type: 'bar',
      x: Object.values(featureImportances),
      y: Object.keys(featureImportances).map((str:any) => str.replace(/_/g, ' ')),
      orientation: 'h',
      marker: { color: 'hsl(252, 100%, 65%)' }
  }] : [];

  return (
    <div className="space-y-6 pt-6">
      {/* Waterfall Modal */}
      {selectedPair && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="glass bg-slate-900/90 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                      <h3 className="font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-brand" /> 
                          Diagnostic Waterfall: {selectedPair.rec_id_l}
                      </h3>
                      <button onClick={() => setSelectedPair(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="p-6">
                      <div className="flex justify-between items-center mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                          <div>
                              <div className="text-xs text-slate-500 uppercase">Entity A</div>
                              <div className="font-bold text-white">{selectedPair.given_name_l} {selectedPair.surname_l}</div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-600" />
                          <div className="text-right">
                              <div className="text-xs text-slate-500 uppercase">Entity B</div>
                              <div className="font-bold text-white">{selectedPair.given_name_r} {selectedPair.surname_r}</div>
                          </div>
                      </div>
                      
                      <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Metric Contributions</h4>
                      
                      {!waterfallData ? (
                          <div className="h-40 flex items-center justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
                      ) : (
                          <div className="space-y-3">
                              {waterfallData.map((w: any, i: number) => {
                                  // Normalize weight for UI bar width (assuming max weight is ~20 for Splink)
                                  const pct = Math.min(100, Math.max(0, (w.weight / 15) * 100));
                                  return (
                                  <div key={i}>
                                      <div className="flex justify-between text-sm mb-1">
                                          <span className="text-slate-300">{w.column}</span>
                                          <span className="text-brand font-mono">+{w.weight.toFixed(2)}</span>
                                      </div>
                                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                          <motion.div 
                                              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.1 }}
                                              className="h-full bg-brand rounded-full"
                                          />
                                      </div>
                                  </div>
                              )})}
                              <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                                  <span className="text-slate-400 font-medium">Final Ensemble Probability</span>
                                  <span className="text-2xl font-black text-white">{(selectedPair.match_probability * 100).toFixed(2)}%</span>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      <header className="flex justify-between items-end mb-8">
        <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Post-Execution Results</h2>
            <p className="text-slate-400 mt-2 font-medium">Evaluation metrics and candidate pair extraction.</p>
        </div>
        <div className="flex gap-3">
             <button onClick={() => setActiveTab('splink')} className={`px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all ${activeTab === 'splink' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'glass glass-hover text-slate-400'}`}>
                 <Layers className="w-4 h-4" /> Splink Resolution
             </button>
             <button onClick={() => setActiveTab('ml')} className={`px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all ${activeTab === 'ml' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'glass glass-hover text-slate-400'}`}>
                 <FlaskConical className="w-4 h-4" /> ML Pipeline
             </button>
        </div>
      </header>
      
      {/* Top Banner stats */}
      <div className="flex gap-4 p-4 glass rounded-xl overflow-x-auto scrollbar-hide">
           <div className="min-w-[150px] px-4 border-r border-white/10">
               <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Dataset Profiles</div>
               <div className="text-lg font-bold text-white">A vs B</div>
           </div>
           <div className="min-w-[150px] px-4 border-r border-white/10">
               <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cartesian Scape</div>
               <div className="text-lg font-bold text-slate-300">Filtered</div>
           </div>
           <div className="min-w-[150px] px-4 border-r border-white/10">
               <div className="text-xs text-brand uppercase tracking-wider mb-1">Matches Found</div>
               <div className="text-lg font-bold text-brand">{(Array.isArray(matches) ? matches : []).length}+ Candidates</div>
           </div>
           <div className="min-w-[150px] px-4">
               <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">Best Ensemble F1</div>
               <div className="text-lg font-bold text-purple-400">
                   {metrics?.metrics?.length > 0 ? (Math.max(...metrics.metrics.map((m:any) => m.F1)) * 100).toFixed(2) + "%" : "N/A"}
               </div>
           </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
          {activeTab === 'splink' ? (
              <div className="glass rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                      <div className="flex gap-2">
                           <button className="bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-colors border border-white/5"><Filter className="w-3 h-3"/> Filter &gt; 0.90 Score</button>
                      </div>
                      <button onClick={() => handleDownload('confirmed_matches')} className="text-brand hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                          <Download className="w-4 h-4"/> Export CSV
                      </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                          <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/5">
                              <tr>
                                  <th className="px-6 py-4">Probability</th>
                                  <th className="px-6 py-4">Entity Identity</th>
                                  <th className="px-6 py-4">Address Context</th>
                                  <th className="px-6 py-4">Status</th>
                              </tr>
                          </thead>
                          <tbody>
                              {(Array.isArray(matches) ? matches : []).map((m, i) => {
                                  let color = "text-success bg-success/10";
                                  if(m.match_probability < 0.9) color = "text-warning bg-warning/10";
                                  if(m.match_probability < 0.5) color = "text-danger bg-danger/10";
                                  
                                  return (
                                  <tr key={i} className="border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors group">
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded font-bold ${color}`}>
                                              {(m.match_probability * 100).toFixed(2)}%
                                          </span>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="flex flex-col gap-1">
                                              <div className="flex items-center gap-2 font-medium text-white">
                                                  {m.given_name_l} {m.surname_l} <ChevronRight className="w-3 h-3 text-slate-600"/> {m.given_name_r} {m.surname_r}
                                              </div>
                                              <div className="text-xs text-slate-500">DOB: {m.date_of_birth_l} vs {m.date_of_birth_r}</div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="text-slate-400">{m.address_1_l || '-'}</div>
                                          <div className="text-xs text-slate-600">{m.suburb_l || '-'}, {m.state_l || '-'} {m.postcode_l || '-'}</div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <button onClick={() => fetchWaterfall(m)} className="text-xs text-slate-300 border border-white/10 rounded px-2 py-1 bg-black/50 hover:bg-brand/20 hover:border-brand/50 hover:text-brand transition-colors">
                                              View Waterfall
                                          </button>
                                      </td>
                                  </tr>
                              )})}
                          </tbody>
                      </table>
                  </div>
              </div>
          ) : (
              <div className="space-y-6">
                  {/* ML Results Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="glass rounded-xl p-6 h-[450px] flex flex-col">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart4 className="w-5 h-5 text-brand" /> Deterministic Feature Importance</h3>
                          <div className="flex-1 min-h-[300px]">
                              {featureImportances ? (
                                  <Plot data={importancePlotData as any} layout={{ margin: { l: 150 }, yaxis: { autorange: 'reversed' } }} />
                              ) : <div className="h-full flex items-center justify-center text-slate-500">Loading...</div>}
                          </div>
                      </div>
                      
                      <div className="glass rounded-xl p-6 overflow-hidden flex flex-col">
                          <div className="flex justify-between items-center mb-6">
                               <h3 className="text-lg font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400" /> Ensemble Metric Comparison</h3>
                               <button onClick={() => handleDownload('all_matches')} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition-colors text-slate-300">Export Dumps</button>
                          </div>
                          
                          <div className="flex-1 overflow-x-auto">
                               <table className="w-full text-sm text-left">
                                  <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/5">
                                      <tr>
                                          <th className="px-4 py-3">Classifier</th>
                                          <th className="px-4 py-3">F1 Score</th>
                                          <th className="px-4 py-3">Precision</th>
                                          <th className="px-4 py-3">Recall</th>
                                          <th className="px-4 py-3">AUC-ROC</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {metrics?.metrics?.map((m: any, i: number) => (
                                          <tr key={i} className={`border-b border-white/5 ${m.Model === metrics.best_model ? 'bg-purple-500/10' : ''}`}>
                                              <td className="px-4 py-4 font-medium text-white flex items-center gap-2">
                                                  {m.Model === metrics.best_model && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                                  {m.Model}
                                              </td>
                                              <td className={`px-4 py-4 font-bold ${m.Model === metrics.best_model ? 'text-purple-400' : 'text-slate-300'}`}>{(m.F1 * 100).toFixed(2)}%</td>
                                              <td className="px-4 py-4 text-slate-400">{(m.Precision * 100).toFixed(2)}%</td>
                                              <td className="px-4 py-4 text-slate-400">{(m.Recall * 100).toFixed(2)}%</td>
                                              <td className="px-4 py-4 text-slate-400">{(m.AUC * 100).toFixed(2)}%</td>
                                          </tr>
                                      ))}
                                  </tbody>
                               </table>
                          </div>
                          
                          {metrics.best_model && (
                              <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex gap-2 items-start">
                                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                                  <p><strong>{metrics.best_model}</strong> was assigned as the active prediction framework, demonstrating the highest Harmonic Mean (F1) maximizing Candidate coverage against False Positives.</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}
      </motion.div>
    </div>
  );
}
