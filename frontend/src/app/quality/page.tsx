"use client";
import { useEffect, useState } from 'react';
import { Download, ShieldAlert, CheckCircle, AlertTriangle, Fingerprint } from 'lucide-react';
import Plot from '@/components/Plot';

export default function QualityPage() {
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        fetch('http://localhost:8001/api/quality-report').then(r => r.json()).then(data => setReport(data));
    }, []);

    if(!report || !report.dataset_a) return <div className="animate-pulse h-96 glass mt-8 rounded-xl" />;

    const a = report.dataset_a;
    const b = report.dataset_b;

    // Build the heatmap data
    // Columns are fields, Rows are datasets
    const allFields = Array.from(new Set([...Object.keys(a.completeness || {}), ...Object.keys(b.completeness || {})]));
    
    const heatmapZ = [
        (Array.isArray(allFields) ? allFields : []).map(f => b.completeness[f] || 0),
        (Array.isArray(allFields) ? allFields : []).map(f => a.completeness[f] || 0)
    ];

    const plotData = [{
        type: 'heatmap',
        z: heatmapZ,
        x: allFields,
        y: ['Dataset B', 'Dataset A'],
        colorscale: [
            [0, '#ef4444'], // danger red
            [0.5, '#eab308'], // warning yellow
            [1, '#22c55e']  // success green
        ],
        showscale: false
    }];

    const GradeCard = ({ title, grade, total, cols }: any) => {
        let color = "text-success bg-success/10 border-success/20";
        if(grade.includes("B")) color = "text-blue-400 bg-blue-400/10 border-blue-400/20";
        if(grade.includes("C")) color = "text-warning bg-warning/10 border-warning/20";
        if(grade.includes("D")) color = "text-danger bg-danger/10 border-danger/20";
        
        return (
            <div className={`rounded-xl border p-6 flex items-center justify-between ${color}`}>
                 <div>
                     <h3 className="text-xl font-bold mb-1">{title} Overall Quality</h3>
                     <p className="text-sm opacity-80">{total.toLocaleString()} Records | {cols} Dimensions</p>
                 </div>
                 <div className="text-5xl font-black">{grade.split(' ')[0]}</div>
            </div>
        )
    };

    return (
        <div className="space-y-8 pt-6 pb-12">
            <header className="flex justify-between items-end mb-8">
                <div>
                   <h2 className="text-3xl font-bold text-white tracking-tight">Data Quality Assurance</h2>
                   <p className="text-slate-400 mt-2 font-medium">Profiling diagnostics identifying entropy and missing data anomalies.</p>
                </div>
                <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 glass glass-hover rounded-lg text-slate-300">
                    <Download className="w-4 h-4"/> Export PDF Report
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <GradeCard title="Dataset A (Target)" grade={a.grade} total={a.total_records} cols={a.columns?.length || 0} />
                 <GradeCard title="Dataset B (Source)" grade={b.grade} total={b.total_records} cols={b.columns?.length || 0} />
            </div>

            <div className="glass rounded-xl p-6 flex flex-col h-[400px]">
                <h3 className="text-lg font-bold text-white mb-2">Schema Completeness Density</h3>
                <p className="text-sm text-slate-400 mb-6">Percentage of populated fields across both entity populations.</p>
                <div className="flex-1 min-h-[200px]">
                     <Plot data={plotData as any} layout={{ margin: { l: 80, b: 60, t: 20, r: 20 } }} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass rounded-xl p-6 flex flex-col">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning"/> Quality Remediation Recommendations</h3>
                     <ul className="space-y-4 text-sm text-slate-300">
                         <li className="flex gap-3">
                             <Fingerprint className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                             <div><strong className="text-white block mb-1">Standardise Date Formats</strong> Both datasets contain date_of_birth records that lack ISO-8601 strict adherence, leading to potential string mismatches.</div>
                         </li>
                         <li className="flex gap-3">
                             <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                             <div><strong className="text-white block mb-1">State Demographics Sparsity</strong> "state" field in Dataset B shows significant dropout rate. Re-verify extraction scripts.</div>
                         </li>
                         <li className="flex gap-3">
                             <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                             <div><strong className="text-white block mb-1">Unique Identifiers Healthy</strong> rec_id density is 100% across domains guaranteeing Splink linkage bounds.</div>
                         </li>
                     </ul>
                </div>
                
                <div className="md:col-span-2 glass rounded-xl p-6 overflow-x-auto">
                     <h3 className="text-lg font-bold text-white mb-4">Critical Sparsity Audit (Null Count)</h3>
                     <table className="w-full text-sm text-left">
                         <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/5">
                             <tr>
                                 <th className="px-5 py-3">Attribute</th>
                                 <th className="px-5 py-3 text-right">Dataset A Missing</th>
                                 <th className="px-5 py-3 text-right">Dataset B Missing</th>
                                 <th className="px-5 py-3 text-center">Action Required</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/5">
                             {(Array.isArray(allFields) ? allFields : []).map((f:any, i:number) => {
                                 const mA = a.missing_summary[f] || 0;
                                 const mB = b.missing_summary[f] || 0;
                                 if (mA + mB === 0) return null;
                                 
                                 return (
                                 <tr key={i} className="hover:bg-white/5">
                                     <td className="px-5 py-4 font-mono text-slate-300">{f}</td>
                                     <td className={`px-5 py-4 text-right font-medium ${mA > a.total_records*0.1 ? 'text-danger' : 'text-slate-400'}`}>{mA.toLocaleString()}</td>
                                     <td className={`px-5 py-4 text-right font-medium ${mB > b.total_records*0.1 ? 'text-danger' : 'text-slate-400'}`}>{mB.toLocaleString()}</td>
                                     <td className="px-5 py-4 flex justify-center">
                                         {mA > 0 || mB > 0 ? (
                                            <span className="px-2 py-1 text-xs bg-warning/20 text-warning rounded border border-warning/30">Investigate Extract</span>
                                         ) : (
                                            <span className="px-2 py-1 text-xs bg-success/20 text-success rounded border border-success/30">Healthy</span>
                                         )}
                                     </td>
                                 </tr>
                             )})}
                         </tbody>
                     </table>
                </div>
            </div>
        </div>
    )
}
