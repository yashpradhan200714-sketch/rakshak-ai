import React from 'react';

export const RadarView: React.FC<{ active: boolean }> = ({ active }) => {
  return (
    <div className="relative w-full h-64 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-inner my-4">
      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-20" 
           style={{
             backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
             backgroundSize: '30px 30px'
           }}>
      </div>
      
      {/* Center (User) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_#3b82f6] z-10 animate-pulse"></div>
      
      {/* Radar Sweep Animation - only active in emergency or scanning */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-r from-transparent via-green-500/10 to-transparent rounded-full origin-bottom-left ${active ? 'radar-sweep' : 'hidden'}`}></div>
      
      {/* Mock Helpers */}
      <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]">
        <div className="absolute -top-6 -left-2 text-[10px] text-green-400 whitespace-nowrap bg-black/50 px-1 rounded">Volunteer</div>
      </div>
      <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
      
      {active && (
         <div className="absolute top-2 right-2 px-2 py-1 bg-red-900/80 border border-red-500 text-red-200 text-xs rounded animate-pulse">
           LIVE TRACKING ON
         </div>
      )}
    </div>
  );
};