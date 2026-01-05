
import React, { useState, useEffect } from 'react';
import { ChatInterface } from '../components/ChatInterface';
import { RadarView } from '../components/RadarView';
import { EmergencyStatus, Helper, EmergencyType } from '../types';
import { MOCK_HELPERS, APP_NAME } from '../constants';

interface EmergencyModeProps {
  onResolve: () => void;
  onUpdateHelper?: (helper: Helper) => void;
}

export const EmergencyMode: React.FC<EmergencyModeProps> = ({ onResolve, onUpdateHelper }) => {
  const [status, setStatus] = useState<EmergencyStatus>(EmergencyStatus.REQUESTED);
  const [helper, setHelper] = useState<Helper | null>(null);
  const [emergencyType, setEmergencyType] = useState<EmergencyType>(EmergencyType.UNCERTAIN);
  const [severity, setSeverity] = useState<string>('');

  // Simulate finding a helper
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStatus(EmergencyStatus.ACCEPTED);
      const chosenHelper = { ...MOCK_HELPERS[0], phone: '+91 98765 00111' };
      setHelper(chosenHelper);
      if (onUpdateHelper) onUpdateHelper(chosenHelper);
    }, 5000);

    return () => clearTimeout(timer1);
  }, []);

  const handleClassification = (type: EmergencyType, sev: string) => {
    setEmergencyType(type);
    setSeverity(sev);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-slate-950 relative overflow-hidden">
      {/* Urgent Header */}
      <div className="bg-red-600 p-4 pt-6 pb-6 shadow-2xl z-20">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-wider animate-pulse">SOS ACTIVE</h1>
              {severity && (
                <span className="bg-red-900 border border-red-400 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                  {severity}
                </span>
              )}
            </div>
            
            <p className="text-red-100 text-xs mt-1">
              {emergencyType !== EmergencyType.UNCERTAIN ? (
                <span className="font-bold uppercase tracking-wide bg-red-800/50 px-1 rounded mr-1">
                  {emergencyType} ALERT
                </span>
              ) : (
                 "Analyzing situation..." 
              )}
            </p>
          </div>
          <button 
            onClick={onResolve}
            className="bg-red-800 hover:bg-red-900 text-white text-xs px-3 py-1 rounded border border-red-400 whitespace-nowrap font-bold uppercase"
          >
            I AM SAFE
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden relative z-10">
        
        {/* Helper Status Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl shrink-0">
          {status === EmergencyStatus.REQUESTED && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-t-blue-500 border-slate-700 animate-spin"></div>
              <div>
                <p className="font-black text-white uppercase text-xs tracking-widest">Searching Guardians</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Notifying {MOCK_HELPERS.length} active responders</p>
              </div>
            </div>
          )}
          
          {status === EmergencyStatus.ACCEPTED && helper && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">
                {helper.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-green-400 text-[10px] uppercase tracking-widest">Help Dispatched</p>
                <h3 className="text-white font-bold truncate">{helper.name}</h3>
                <div className="flex gap-3 text-[10px] text-slate-400 mt-1 uppercase font-black">
                  <span>📍 {helper.distance}</span>
                  <span className="text-green-500">⏱ {helper.eta}</span>
                </div>
              </div>
              <a href={`tel:${helper.phone || '100'}`} className="bg-green-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl text-white transform active:scale-90 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <ChatInterface 
            initialMessage={`Emergency SOS Broadcasted. I'm ${APP_NAME}. Describe your situation clearly so I can guide you and responders.`} 
            helper={helper}
            status={status}
            onEmergencyClassified={handleClassification}
          />
        </div>

        <div className="h-28 shrink-0 opacity-80 pointer-events-none">
           <RadarView active={true} />
        </div>

      </div>

      <div className="absolute inset-0 bg-red-600/5 pointer-events-none animate-pulse-fast z-0"></div>
    </div>
  );
};
