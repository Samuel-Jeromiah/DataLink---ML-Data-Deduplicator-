"use client";
import { useEffect, useState } from 'react';
import Plot from '@/components/Plot';
import { Target, Search, BarChart3, Fingerprint, PieChart, Activity } from 'lucide-react';

export default function MetricsPage() {
    const [metricsData, setMetricsData] = useState<any>(null);

    useEffect(() => {
        fetch('http://localhost:8001/api/metrics').then(r => r.json()).then(data => setMetricsData(data));
    }, []);

    if (!metricsData) return <div className="animate-pulse h-96 glass mt-8 rounded-xl" />;

    const models = metricsData.metrics || [];
    
    // Summary Cards using best model
    const bestModel = models.find((m:any) => m.Model === metricsData.best_model) || models[0] || {};

    // Plot Data
    const rocPlotData = models.map((m:any) => ({
        type: 'scatter', mode: 'lines', name: `${m.Model} (AUC: ${((m.AUC||0)*100).toFixed(1)}%)`,
        x: m.roc?.fpr || [0,1], y: m.roc?.tpr || [0,1],
        line: { width: m.Model === metricsData.best_model ? 4 : 2, dash: m.Model === metricsData.best_model ? 'solid' : 'dot' }
    }));
    // Base diagonal
    rocPlotData.push({ type: 'scatter', mode: 'lines', name: 'Random', x: [0,1], y: [0,1], line: { dash: 'dash', color: '#334155' }});

    const prPlotData = models.map((m:any) => ({
        type: 'scatter', mode: 'lines', name: m.Model,
        x: m.pr?.rec || [0,1], y: m.pr?.prec || [0,1],
        line: { width: m.Model === metricsData.best_model ? 4 : 2 }
    }));

    // Confusion Matrix visualization (Heatmap)
    const cm = bestModel?.CM || [0,0,0,0]; // TN, FP, FN, TP
    const cmZ = [[cm[2], cm[3]], [cm[0], cm[1]]];

    const cmPlotData = [{
        type: 'heatmap',
        z: cmZ, x: ['Predicted Negative', 'Predicted Positive'], y: ['Actual Positive', 'Actual Negative'],
        colorscale: 'Purples', showscale: false,
        text: cmZ.map((r:any) => r.map((v:any) => String(v))), texttemplate: "%{text}", textfont: { size: 24, color: 'white' }
    }];

    return (
        <div className="space-y-6 pt-6 pb-12">
             <header className="mb-8">
                 <h2 className="text-3xl font-bold text-white tracking-tight">Ensemble Metrics Overview</h2>
                 <p className="text-slate-400 mt-2 font-medium">Deep dive into algorithm performance and classification thresholds.</p>
             </header>
             
             {/* Summary Cards */}
             <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                 {[
                     { title: "Precision", val: bestModel?.Precision, icon: Target, color: "text-brand" },
                     { title: "Recall", val: bestModel?.Recall, icon: Search, color: "text-purple-400" },
                     { title: "F1 Score", val: bestModel?.F1, icon: Activity, color: "text-success" },
                     { title: "AUC-ROC", val: bestModel?.AUC, icon: PieChart, color: "text-blue-400" }
                 ].map((c, i) => (
                      <div key={i} className="glass rounded-xl p-5 border border-white/5 relative overflow-hidden group">
                           <div className={`absolute -right-4 -top-4 w-20 h-20 bg-current opacity-[0.03] rounded-full blur-xl group-hover:opacity-10 transition-opacity ${c.color}`} />
                           <h3 className="text-sm font-medium text-slate-400 mb-3">{c.title}</h3>
                           <div className="flex items-center justify-between">
                                <div className="text-3xl font-bold text-white tracking-tight">{(c.val * 100).toFixed(1)}<span className="text-lg text-slate-500 ml-1">%</span></div>
                                <c.icon className={`w-6 h-6 ${c.color} opacity-80`} />
                           </div>
                      </div>
                 ))}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="glass rounded-xl p-6 flex flex-col h-[500px]">
                     <h3 className="text-lg font-bold text-white mb-2">Receiver Operating Characteristic (ROC)</h3>
                     <p className="text-xs text-slate-400 mb-4">Diagnostic ability of the binary classifiers as discrimination thresholds vary.</p>
                     <div className="flex-1 min-h-[300px]">
                          <Plot data={rocPlotData as any} layout={{ 
                              xaxis: { title: 'False Positive Rate' }, yaxis: { title: 'True Positive Rate' },
                              legend: { orientation: 'h', y: -0.2 }
                          }} />
                     </div>
                 </div>
                 
                 <div className="glass rounded-xl p-6 flex flex-col h-[500px]">
                     <h3 className="text-lg font-bold text-white mb-2">Precision-Recall Trajectories</h3>
                     <p className="text-xs text-slate-400 mb-4">Highlights model stability against class imbalances.</p>
                     <div className="flex-1 min-h-[300px]">
                          <Plot data={prPlotData as any} layout={{ 
                              xaxis: { title: 'Recall' }, yaxis: { title: 'Precision', range: [0, 1.05] },
                              legend: { orientation: 'h', y: -0.2 }
                          }} />
                     </div>
                 </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 glass rounded-xl p-6 h-[400px] flex flex-col">
                      <h3 className="text-lg font-bold text-white mb-2">Confusion Matrix ({bestModel?.Model})</h3>
                      <p className="text-xs text-slate-400 mb-4">True/False Postives vs Negatives.</p>
                      <div className="flex-1 min-h-[200px]">
                          <Plot data={cmPlotData as any} layout={{ margin: {l: 120, b: 60, t: 30, r: 30} }} />
                      </div>
                  </div>
                  
                  <div className="lg:col-span-2 glass rounded-xl p-6 overflow-hidden flex flex-col">
                      <h3 className="text-lg font-bold text-white mb-4">Match Threshold Sensitivity Analysis</h3>
                      <div className="flex-1 overflow-x-auto">
                           <table className="w-full text-sm text-left">
                               <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/5">
                                   <tr>
                                       <th className="px-5 py-3 rounded-tl-lg">Threshold</th>
                                       <th className="px-5 py-3">Precision Impact</th>
                                       <th className="px-5 py-3">Recall Impact</th>
                                       <th className="px-5 py-3 rounded-tr-lg">Action Recommendation</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-white/5">
                                   <tr className="hover:bg-white/5 transition-colors">
                                       <td className="px-5 py-4 font-bold text-white">0.50 (Loose)</td>
                                       <td className="px-5 py-4 text-warning">Drops significantly (High False Positives)</td>
                                       <td className="px-5 py-4 text-success">Maximum Record Coverage</td>
                                       <td className="px-5 py-4 text-slate-400 text-xs">Best for extensive triage queues</td>
                                   </tr>
                                   <tr className="bg-brand/10 border-brand/20">
                                       <td className="px-5 py-4 font-bold text-brand">0.85 (Balanced)</td>
                                       <td className="px-5 py-4 text-brand">Stabilised peak performance</td>
                                       <td className="px-5 py-4 text-brand">Acceptable minor losses</td>
                                       <td className="px-5 py-4 text-white font-medium text-xs flex items-center gap-2">
                                           <Fingerprint className="w-3 h-3"/> Ideal Default Production Setting
                                       </td>
                                   </tr>
                                   <tr className="hover:bg-white/5 transition-colors">
                                       <td className="px-5 py-4 font-bold text-white">0.99 (Strict)</td>
                                       <td className="px-5 py-4 text-success">Near 100% certainty</td>
                                       <td className="px-5 py-4 text-danger">Severe coverage contraction</td>
                                       <td className="px-5 py-4 text-slate-400 text-xs">Best for zero-human-loop automation</td>
                                   </tr>
                               </tbody>
                           </table>
                      </div>
                  </div>
             </div>
        </div>
    )
}
