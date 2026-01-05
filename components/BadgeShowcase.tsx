
import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import { Badge } from '../types';
import { AVAILABLE_BADGES } from '../constants';

interface BadgeShowcaseProps {
  userBadgeIds: string[];
}

export const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ userBadgeIds }) => {
  const [filter, setFilter] = useState<'All' | 'Speed' | 'Community' | 'Elite'>('All');
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  const filteredBadges = AVAILABLE_BADGES.filter(b => 
    filter === 'All' || b.category === filter
  );

  const renderBadge = (badge: Badge) => {
    const isEarned = userBadgeIds.includes(badge.id);
    const isSelected = selectedBadgeId === badge.id;
    const IconComponent = (Lucide as any)[badge.icon] || Lucide.Award;
    
    return (
      <div 
        key={badge.id}
        onClick={() => setSelectedBadgeId(isSelected ? null : badge.id)}
        className="flex flex-col items-center gap-3 transition-all cursor-pointer group"
      >
        <div className={`
          relative w-20 h-20 rounded-[1.75rem] flex items-center justify-center transition-all duration-500
          ${isEarned 
            ? `${badge.color} shadow-lg badge-glow scale-100` 
            : 'bg-slate-800 border-2 border-slate-700 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105'}
          ${isSelected ? 'ring-4 ring-blue-500 ring-offset-4 ring-offset-slate-950' : ''}
        `}>
          <IconComponent size={36} className={isEarned ? "text-white" : "text-slate-600"} />
          
          {!isEarned && (
            <div className="absolute -top-1 -right-1 bg-slate-900 p-1.5 rounded-full border border-slate-700 shadow-lg">
              <Lucide.Lock size={12} className="text-slate-500" />
            </div>
          )}
        </div>
        
        <span className={`text-[9px] font-black uppercase tracking-tighter text-center leading-tight transition-colors ${isEarned ? 'text-white' : 'text-slate-600'}`}>
          {badge.name}
        </span>

        {/* Tactical Intel / Progress Card */}
        {isSelected && (
          <div className="fixed bottom-24 left-6 right-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
             <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                   <IconComponent size={80} />
                </div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{badge.category} Category</div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight">{badge.name}</h4>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${isEarned ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                    {isEarned ? 'Authenticated' : 'Locked'}
                  </div>
                </div>

                <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                  {badge.description}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Mission Progress</span>
                    <span>{badge.progress} / {badge.target}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${isEarned ? 'bg-green-500' : 'bg-blue-600'}`}
                      style={{ width: `${(badge.progress / badge.target) * 100}%` }}
                    ></div>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Category Tabs */}
      <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 mb-8 overflow-x-auto scrollbar-hide">
        {['All', 'Speed', 'Community', 'Elite'].map((cat) => (
          <button
            key={cat}
            onClick={() => { setFilter(cat as any); setSelectedBadgeId(null); }}
            className={`
              flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
              ${filter === cat ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-y-10 gap-x-4 pb-20">
        {filteredBadges.map(renderBadge)}
      </div>

      {/* Backdrop for selected card */}
      {selectedBadgeId && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30" 
          onClick={() => setSelectedBadgeId(null)}
        />
      )}
    </div>
  );
};
