"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Database, GitMerge, AlertCircle, Activity } from 'lucide-react';
import Plot from './Plot';

interface SummaryData {
  dataset_a_records: number;
  dataset_b_records: number;
  total_pairs_evaluated: number;
  high_confidence_matches: number;
  needs_review: number;
  best_model: string;
  f1_score: number;
  quality_score_a: string;
}

export default function OverviewDashboard() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [quality, setQuality] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/api/metrics/summary').then(r => r.json()),
      fetch('http://localhost:8000/api/metrics/quality').then(r => r.json()),
      fetch('http://localhost:8000/api/metrics/models').then(r => r.json())
    ]).then(([sum, qual, mods]) => {
      setSummary(sum);
      setQuality(qual);
      setModels(mods);
    }).catch(e => console.error("API Error", e));
  }, []);

  if (!summary) return <div className="h-96 glass rounded-xl animate-pulse"></div>;

  const cards = [
    { title: 'Total Pairs Evaluated', value: summary.total_pairs_evaluated.toLocaleString(), icon: Database, color: 'text-blue-400' },
    { title: 'Confirmed Matches', value: summary.high_confidence_matches.toLocaleString(), icon: GitMerge, color: 'text-brand' },
    { title: 'Manual Review Queue', value: summary.needs_review.toLocaleString(), icon: AlertCircle, color: 'text-warning' },
    { title: 'Data Quality (Set A)', value: summary.quality_score_a, icon: ShieldCheck, color: 'text-success' },
    { title: 'Best ML Model', value: summary.best_model, value2: `F1: ${(summary.f1_score * 100).toFixed(1)}%`, icon: Activity, color: 'text-purple-400' },
  ];

  const qualityPlotData = [
    {
      type: 'bar',
      x: quality.map(q => q.Field),
      y: quality.map(q => q['Completeness (%)']),
      marker: { color: 'hsl(252, 100%, 65%)' }
    }
  ];

  const modelPlotData = [
    {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'F1 Score',
      x: models.map(m => m.Model),
      y: models.map(m => m.F1),
      line: { color: 'hsl(252, 100%, 65%)', width: 3 }
    },
    {
      type: 'scatter',
      mode: 'lines+markers',
      name: 'AUC',
      x: models.map(m => m.Model),
      y: models.map(m => m.AUC),
      line: { color: 'hsl(142, 70%, 50%)', width: 3 }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-5 relative overflow-hidden group"
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-current opacity-[0.03] rounded-full blur-xl group-hover:opacity-10 transition-opacity ${c.color}`} />
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-slate-400">{c.title}</h3>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{c.value}</div>
            {c.value2 && <div className="text-sm text-slate-400 mt-1 font-medium">{c.value2}</div>}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6 h-[400px] flex flex-col"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Data Quality (Completeness %)</h3>
          <div className="flex-1 min-h-0">
            <Plot data={qualityPlotData} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
          className="glass rounded-xl p-6 h-[400px] flex flex-col"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Model Pipeline Performance</h3>
          <div className="flex-1 min-h-0">
            <Plot data={modelPlotData} layout={{ yaxis: { range: [0.8, 1.05] } }} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
