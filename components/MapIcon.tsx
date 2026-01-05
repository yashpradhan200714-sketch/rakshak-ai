import React from 'react';

interface MapIconProps {
  onClick: () => void;
  isEmergency?: boolean;
}

export const MapIcon: React.FC<MapIconProps> = ({ onClick, isEmergency }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 transform active:scale-90
        ${isEmergency 
          ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)] border-2 border-red-400' 
          : 'bg-slate-800 border border-slate-700 hover:border-blue-500 shadow-lg'}
      `}
    >
      <svg className={`w-7 h-7 ${isEmergency ? 'text-white' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
      {isEmergency && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      )}
    </button>
  );
};