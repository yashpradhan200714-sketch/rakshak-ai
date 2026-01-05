
import React, { useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { Badge } from '../types';

interface BadgeUnlockModalProps {
  badge: Badge;
  onClose: () => void;
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ badge, onClose }) => {
  const IconComponent = (Lucide as any)[badge.icon] || Lucide.Award;

  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Confetti simulation with divs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-2 h-2 rounded-full bg-blue-500 confetti-slow"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `-10%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'][Math.floor(Math.random() * 4)]
            }}
          ></div>
        ))}
      </div>

      <div className="bg-slate-900 border-2 border-blue-500/50 rounded-[3rem] p-10 w-full max-w-sm text-center shadow-[0_0_50px_rgba(59,130,246,0.5)] animate-in zoom-in slide-in-from-bottom-10 duration-500">
        <div className={`w-32 h-32 ${badge.color} rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce border-4 border-white/20`}>
          <IconComponent size={64} className="text-white" />
        </div>
        
        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Achievement Unlocked</h2>
        <div className="text-blue-400 font-black text-xs uppercase tracking-[0.3em] mb-6 italic">Valor Certified</div>
        
        <h3 className="text-xl font-black text-white mb-4 bg-slate-800 py-3 rounded-2xl border border-slate-700">{badge.name}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-10">{badge.description}</p>
        
        <button 
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-900/40"
        >
          Dismiss & Continue
        </button>
      </div>
    </div>
  );
};
