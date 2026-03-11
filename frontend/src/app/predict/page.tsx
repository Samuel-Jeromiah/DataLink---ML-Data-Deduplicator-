"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

export default function Prediction() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    given_name_l: 'john', surname_l: 'smith', date_of_birth_l: '19901010', postcode_l: '2000', suburb_l: 'sydney', state_l: 'nsw', address_1_l: '1 george st', soc_sec_id_l: '1234567',
    given_name_r: 'jon', surname_r: 'smith', date_of_birth_r: '19901010', postcode_r: '2000', suburb_r: 'sydney', state_r: 'nsw', address_1_r: '1 george st', soc_sec_id_r: '1234567'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/predict', form);
      setResult(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({...form, [e.target.name]: e.target.value});
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Live ML Predictor</h2>
        <p className="text-slate-400 mt-2 font-medium">Test the Random Forest algorithm in real-time with sample payloads</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Record */}
              <div className="space-y-4">
                <h3 className="text-brand font-semibold mb-4 pb-2 border-b border-white/10 uppercase tracking-widest text-xs">Dataset A Record</h3>
                {['given_name_l', 'surname_l', 'date_of_birth_l', 'postcode_l', 'suburb_l'].map(f => (
                  <div key={f}>
                    <label className="block text-xs text-slate-400 mb-1 uppercase">{f.replace('_l', '').replace(/_/g, ' ')}</label>
                    <input name={f} value={(form as any)[f]} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand/50 transition-colors" />
                  </div>
                ))}
              </div>
              
              {/* Right Record */}
              <div className="space-y-4">
                <h3 className="text-purple-400 font-semibold mb-4 pb-2 border-b border-white/10 uppercase tracking-widest text-xs">Dataset B Record</h3>
                {['given_name_r', 'surname_r', 'date_of_birth_r', 'postcode_r', 'suburb_r'].map(f => (
                  <div key={f}>
                    <label className="block text-xs text-slate-400 mb-1 uppercase">{f.replace('_r', '').replace(/_/g, ' ')}</label>
                    <input name={f} value={(form as any)[f]} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400/50 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand to-purple-600 hover:from-brand/80 hover:to-purple-600/80 text-white font-medium py-3 rounded-lg shadow-lg shadow-brand/20 transition-all flex justify-center items-center gap-2">
              <Cpu className="w-4 h-4" />
              {loading ? 'Running ML Pipeline...' : 'Run Entity Resolution Prediction'}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="glass rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
          {result ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center w-full">
               <div className="relative mb-8">
                  <div className="w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-brand to-purple-400">
                      {(result.match_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  {/* Glowing pulse ring */}
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className={`absolute inset-0 rounded-full border-2 ${result.is_match ? 'border-success' : 'border-danger'} z-[-1] blur-md`} />
               </div>
               
               <div className={`flex items-center gap-2 text-lg font-bold mb-6 ${result.is_match ? 'text-success' : 'text-danger'}`}>
                 {result.is_match ? <CheckCircle2 className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                 {result.is_match ? "HIGH CONFIDENCE MATCH" : "NON-MATCH"}
               </div>

               <div className="w-full text-left bg-black/20 p-4 rounded-lg border border-white/5">
                 <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Model Engineered Features</div>
                 <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <span className="text-slate-400">Jaro-Winkler Target:</span> <span className="text-white font-medium text-right">{result.features_calculated.jaro_winkler_given_name.toFixed(2)}</span>
                    <span className="text-slate-400">Address Similarity:</span> <span className="text-white font-medium text-right">{result.features_calculated.address_similarity.toFixed(2)}</span>
                    <span className="text-slate-400">Overall Synthesis:</span> <span className="text-brand font-bold text-right">{result.features_calculated.name_and_dob_score.toFixed(2)}</span>
                 </div>
               </div>
            </motion.div>
          ) : (
             <div className="text-slate-500 flex flex-col items-center gap-4 text-center">
               <SparklesIcon className="w-12 h-12 opacity-20" />
               <p className="text-sm">Submit records to evaluate <br/>probabilistic linkage model</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SparklesIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
)
