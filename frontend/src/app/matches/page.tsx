"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, X, Layers, ChevronRight } from 'lucide-react';

export default function ConfirmedMatches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetch('http://localhost:8001/api/results/matches?limit=100').then(r => r.json()).then(setMatches).catch(console.error);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
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

      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Confirmed Matches</h2>
        <p className="text-slate-400 mt-2 font-medium">Auto-resolved entity clusters passing the highest model confidence thresholds</p>
      </header>

      <div className="glass rounded-xl p-1 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search records..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand/50 transition-colors" />
          </div>
          <span className="text-xs text-brand bg-brand/10 px-2 py-1 rounded-md font-medium">Showing top 100</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Match Score</th>
                  <th className="px-6 py-4">Record L</th>
                  <th className="px-6 py-4">Record R</th>
                  <th className="px-6 py-4">Source Dataset Difference</th>
                  <th className="px-6 py-4">Diagnostics</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(matches) ? matches : []).map((m, i) => (
                  <motion.tr 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-success">
                      {(m.match_probability * 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="font-medium text-white">{m.given_name_l} {m.surname_l}</div>
                      <div className="text-xs">{m.address_1_l}, {m.suburb_l}</div>
                      <div className="text-xs opacity-50">{m.rec_id_l}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="font-medium text-white">{m.given_name_r} {m.surname_r}</div>
                      <div className="text-xs">{m.address_1_r}, {m.suburb_r}</div>
                      <div className="text-xs opacity-50">{m.rec_id_r}</div>
                    </td>
                    <td className="px-6 py-4">
                      {m.postcode_l !== m.postcode_r ? (
                         <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded">PC: {m.postcode_l} → {m.postcode_r}</span>
                      ) : <span className="text-xs text-slate-500">Verified</span>}
                    </td>
                    <td className="px-6 py-4">
                        <button onClick={() => fetchWaterfall(m)} className="text-xs text-slate-300 border border-white/10 rounded px-2 py-1 bg-black/50 hover:bg-brand/20 hover:border-brand/50 hover:text-brand transition-colors whitespace-nowrap">
                            View Waterfall
                        </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
