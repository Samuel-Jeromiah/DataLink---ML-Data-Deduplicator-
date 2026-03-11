"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Lazy load Plotly to prevent SSR issues since Plotly uses the `window` object
const PlotlyChart = dynamic(() => import('react-plotly.js'), { 
    ssr: false, 
    loading: () => <div className="h-[300px] w-full flex items-center justify-center text-slate-400 animate-pulse">Loading Chart...</div> 
});

interface PlotProps {
  data: any[];
  layout?: any;
  config?: any;
  className?: string;
}

export default function Plot({ data, layout = {}, config = {}, className }: PlotProps) {
  // Merge premium darkly aesthetic defaults
  const premiumLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'inter', color: '#e2e8f0' },
    margin: { t: 40, r: 20, l: 40, b: 40 },
    xaxis: { gridcolor: '#334155', zerolinecolor: '#334155' },
    yaxis: { gridcolor: '#334155', zerolinecolor: '#334155' },
    ...layout
  };

  const premiumConfig = {
    displayModeBar: false,
    responsive: true,
    ...config
  };

  return (
    <div className={`w-full h-full ${className || ''}`}>
      <PlotlyChart
        data={data}
        layout={premiumLayout}
        config={premiumConfig}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
