
import React, { useState, useRef, useEffect } from 'react';
import { SOS_HOLD_DURATION_MS } from '../constants';

interface SOSButtonProps {
  onTrigger: () => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onTrigger }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const holdSeconds = SOS_HOLD_DURATION_MS / 1000;

  const startPress = () => {
    setIsPressed(true);
    startTimeRef.current = Date.now();
    
    if (navigator.vibrate) navigator.vibrate(50);

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / SOS_HOLD_DURATION_MS) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        if (navigator.vibrate) navigator.vibrate([200, 100, 500]);
        onTrigger();
        resetPress();
      }
    };

    requestRef.current = requestAnimationFrame(animate);
  };

  const endPress = () => {
    resetPress();
  };

  const resetPress = () => {
    setIsPressed(false);
    setProgress(0);
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  };

  // Concentric ring scaling based on progress for visceral feedback
  const ringScale = 1 + (progress / 100) * 0.15;

  return (
    <div className="relative flex flex-col items-center justify-center py-8 overflow-visible">
      {/* Visual Ripple Containers - Increased base size slightly for alignment and preventing clip */}
      <div className="relative w-80 h-80 flex items-center justify-center overflow-visible">
        
        {/* Animated Background Ripples - Using scale to expand from center */}
        <div 
          className={`absolute rounded-full bg-red-600/10 border border-red-500/20 transition-all duration-150 pointer-events-none`}
          style={{ 
            width: '320px', 
            height: '320px',
            transform: `scale(${isPressed ? 1.25 * ringScale : 1})`,
            opacity: isPressed ? 1 : 0
          }}
        ></div>
        
        <div 
          className={`absolute rounded-full bg-red-600/5 border border-red-500/10 transition-all duration-300 pointer-events-none`}
          style={{ 
            width: '320px', 
            height: '320px',
            animationDuration: '0.8s',
            transform: `scale(${isPressed ? 1.45 * ringScale : 1})`,
            opacity: isPressed ? 1 : 0,
            animationName: isPressed ? 'pulse' : 'none'
          }}
        ></div>
        
        {/* Glow Layer */}
        <div 
          className={`absolute rounded-full transition-all duration-500 blur-3xl pointer-events-none ${isPressed ? 'bg-red-600/30' : 'bg-red-900/5'}`}
          style={{ width: '320px', height: '320px' }}
        ></div>

        {/* Master SVG for perfectly centered concentric rings */}
        <svg 
          viewBox="0 0 320 320" 
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] overflow-visible"
        >
          {/* Outer Dashed Track - Mathematically Centered */}
          <circle
            cx="160"
            cy="160"
            r="145"
            fill="none"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeDasharray="4 8"
            className="opacity-40"
          />

          {/* Static Inner Track */}
          <circle
            cx="160"
            cy="160"
            r="138"
            fill="none"
            stroke="#1e293b"
            strokeWidth="4"
            className="opacity-50"
          />

          {/* Dynamic Progress Ring */}
          <circle
            cx="160"
            cy="160"
            r="138"
            fill="none"
            stroke={progress === 100 ? '#10b981' : '#ef4444'}
            strokeWidth="8"
            strokeDasharray={867}
            strokeDashoffset={867 - (867 * progress) / 100}
            strokeLinecap="round"
            className="transition-all duration-75 ease-linear"
          />
        </svg>

        {/* The Core Button - Absolutely centered via Flex */}
        <button
          className={`
            relative w-56 h-56 rounded-full 
            flex flex-col items-center justify-center overflow-hidden
            transition-all duration-200 ease-out touch-none select-none z-10
            ${isPressed 
              ? 'scale-95 shadow-[0_0_80px_rgba(239,68,68,0.5)] border-4 border-red-400' 
              : 'scale-100 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-4 border-slate-800'}
          `}
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
        >
          {/* Internal Progress Fill */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-red-600/30 transition-all duration-75"
            style={{ height: `${progress}%` }}
          ></div>

          {/* Tactical Background */}
          <div className={`absolute inset-0 bg-gradient-to-br transition-colors duration-500 ${isPressed ? 'from-red-600 to-red-900' : 'from-slate-900 to-slate-950'}`}></div>
          
          <div className="relative z-20 flex flex-col items-center">
            <span className={`text-6xl font-black tracking-tighter transition-all duration-200 ${isPressed ? 'text-white scale-110' : 'text-red-500'}`}>
              SOS
            </span>
            <div className={`mt-4 h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden border border-slate-700`}>
              <div className="h-full bg-red-500 transition-all duration-75" style={{ width: `${progress}%` }}></div>
            </div>
            <span className={`text-[11px] font-black mt-4 uppercase tracking-[0.4em] transition-colors ${isPressed ? 'text-red-200' : 'text-slate-500'}`}>
              {isPressed ? "ACTIVATE" : `HOLD ${holdSeconds}S`}
            </span>
          </div>

          {/* Scanline / CRT Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,4px_100%] opacity-30"></div>
        </button>
      </div>

      {/* Warning Status Subtext */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className={`flex items-center gap-3 px-8 py-3 rounded-full border transition-all duration-300 ${isPressed ? 'bg-red-600/20 border-red-500/50 scale-110 shadow-lg' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${isPressed ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
            {isPressed ? "LINKING SATELLITE" : "PROTOCOL: STANDBY"}
          </span>
        </div>
        {!isPressed && (
           <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.15em] opacity-80">High-Priority Signal Broadcast</p>
        )}
      </div>
    </div>
  );
};
