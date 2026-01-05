
import React, { useState, useEffect } from 'react';
import { SOSButton } from '../components/SOSButton';
import { RadarView } from '../components/RadarView';
import { MapIcon } from '../components/MapIcon';
import { User, EmergencyStatus } from '../types';
import { triggerSOS, listenForNearbyEmergencies, acceptEmergency, denyEmergency } from '../services/emergencyService';
import { updateUserData } from '../services/userService';
import { SOS_HOLD_DURATION_MS, APP_NAME } from '../constants';
import { CheckCircle2, ShieldAlert, X, Zap, Navigation, PhoneCall } from 'lucide-react';

interface DashboardProps {
  onSOS: () => void;
  onOpenMap: () => void;
  onSearchNearby: (query: string) => void;
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSOS, onOpenMap, onSearchNearby, user }) => {
  const [userMode, setUserMode] = useState<'VICTIM' | 'HELPER'>('VICTIM');
  const [nearbyAlerts, setNearbyAlerts] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [isAvailable, setIsAvailable] = useState(user.isAvailable ?? true);
  const [showSOSPopup, setShowSOSPopup] = useState(false);
  const [isCurrentlyHelping, setIsCurrentlyHelping] = useState(false);

  const holdSeconds = SOS_HOLD_DURATION_MS / 1000;

  // Monitor nearby emergencies for Helpers
  useEffect(() => {
    if (userMode === 'HELPER' && isAvailable && !isCurrentlyHelping) {
        const loc = user.location || { lat: 28.6139, lng: 77.2090 };
        const unsubscribe = listenForNearbyEmergencies(loc, (alerts) => {
            const others = alerts.filter(a => a.userId !== user.id);
            if (others.length > 0 && !activeRequest) {
              setActiveRequest(others[0]);
              // Trigger a tactical vibration if supported
              if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);
            }
            setNearbyAlerts(others);
        });
        
        // Push a "Fake" notification for demo purposes if nothing happens for 10 seconds
        const demoTimer = setTimeout(() => {
          if (nearbyAlerts.length === 0 && !activeRequest) {
            setActiveRequest({
              id: 'demo_sos_' + Date.now(),
              userName: 'Priya Sharma',
              type: 'Medical',
              distance: '450m',
              location: { lat: 28.6139 + 0.002, lng: 77.2090 + 0.001 }
            });
          }
        }, 12000);

        return () => {
          unsubscribe();
          clearTimeout(demoTimer);
        };
    }
  }, [userMode, user.location, user.id, isAvailable, isCurrentlyHelping, activeRequest]);

  const toggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    try {
      await updateUserData(user.id, { isAvailable: nextState });
    } catch (e) {
      console.error("Failed to sync availability", e);
    }
  };

  const handleSOSPress = async () => {
      const loc = user.location || { lat: 0, lng: 0 };
      const doTrigger = async (preciseLoc: {lat: number, lng: number}) => {
          await triggerSOS(user, preciseLoc);
          setShowSOSPopup(true);
      };
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
             const preciseLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
             await doTrigger(preciseLoc);
          }, async (err) => {
             await doTrigger(loc);
          });
      } else {
          await doTrigger(loc);
      }
  };

  const handleAcceptRequest = async () => {
    if (!activeRequest) return;
    
    // LIMIT: Helper can only have 1 active emergency
    setIsCurrentlyHelping(true);
    
    await acceptEmergency(activeRequest.id, user.id);
    
    // Switch to Map to begin navigation
    onOpenMap();
    setActiveRequest(null);
  };

  const handleDenyRequest = async () => {
    if (!activeRequest) return;
    await denyEmergency(activeRequest.id, user.id);
    setActiveRequest(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-screen p-6 pb-24 relative">
      
      <header className="w-full mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{APP_NAME}</h1>
            <p className="text-slate-400 text-xs">Community Safety Network</p>
          </div>
          <div className="flex items-center gap-3">
             <MapIcon onClick={onOpenMap} />
             <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                    <div className={`w-2 h-2 ${userMode === 'VICTIM' ? 'bg-green-500' : isAvailable ? 'bg-blue-500' : 'bg-slate-500'} rounded-full`}></div>
                    <span className="text-xs font-medium text-slate-300">
                      {userMode === 'VICTIM' ? 'Protected' : isAvailable ? 'Active' : 'Offline'}
                    </span>
                </div>
             </div>
          </div>
        </div>

        <div className="mb-4">
           <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] italic">
             WHEN SECONDS MATTER, COMMUNITY RESPONDS
           </p>
        </div>

        <div className="bg-slate-800 p-1 rounded-xl flex shadow-inner border border-slate-700">
          <button
            onClick={() => setUserMode('VICTIM')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${userMode === 'VICTIM' ? 'bg-red-900/50 text-red-200 shadow-sm border border-red-900' : 'text-slate-400 hover:text-slate-200'}`}
          >
            I Need Help
          </button>
          <button
            onClick={() => setUserMode('HELPER')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${userMode === 'HELPER' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            I Can Help
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full gap-6 relative">
        {userMode === 'VICTIM' ? (
          <>
            <div className="mt-4 flex flex-col items-center justify-center gap-6">
              <SOSButton onTrigger={handleSOSPress} />
              <p className="text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest max-w-[250px]">
                Hold {holdSeconds}s to alert your network via {APP_NAME}
              </p>
            </div>

            <div className="w-full mt-6">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Nearby Rescue</h2>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => onSearchNearby("Nearest Hospital")} className="bg-blue-900/20 p-4 rounded-3xl border border-blue-900/40 flex flex-col items-center gap-2 hover:bg-blue-900/30 transition-all active:scale-95 group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">🏥</span>
                  <span className="text-[9px] font-black text-blue-200 uppercase">Hospital</span>
                </button>
                <button onClick={() => onSearchNearby("Nearest Police Station")} className="bg-red-900/20 p-4 rounded-3xl border border-red-900/40 flex flex-col items-center gap-2 hover:bg-red-900/30 transition-all active:scale-95 group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">🚓</span>
                  <span className="text-[9px] font-black text-red-200 uppercase">Police</span>
                </button>
                <button onClick={() => onSearchNearby("Nearest Pharmacy")} className="bg-green-900/20 p-4 rounded-3xl border border-green-900/40 flex flex-col items-center gap-2 hover:bg-green-900/30 transition-all active:scale-95 group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">💊</span>
                  <span className="text-[9px] font-black text-green-200 uppercase">Medical</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full flex justify-between items-center mb-6 bg-slate-900/50 p-5 rounded-3xl border border-slate-800">
              <div className="flex flex-col">
                <span className="text-xs font-black text-white uppercase tracking-widest">Duty Status</span>
                <span className={`text-[10px] font-bold uppercase mt-0.5 ${isAvailable ? 'text-blue-400' : 'text-slate-500'}`}>
                  {isAvailable ? 'Visible to those in need' : 'Stealth mode active'}
                </span>
              </div>
              <button 
                onClick={toggleAvailability}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${isAvailable ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <RadarView active={isAvailable} />

            {/* Helper Stats */}
            <div className="w-full mt-6 grid grid-cols-2 gap-4">
               <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Nearby Alerts</div>
                  <div className="text-2xl font-black text-white">{nearbyAlerts.length}</div>
               </div>
               <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Trust Score</div>
                  <div className="text-2xl font-black text-blue-400">{user.trustRating * 20}%</div>
               </div>
            </div>
          </div>
        )}

        {/* INBOUND EMERGENCY NOTIFICATION (Real-time Accept/Deny) */}
        {activeRequest && userMode === 'HELPER' && (
          <div className="fixed inset-x-6 top-24 z-[110] animate-in slide-in-from-top-10 duration-500">
            <div className="bg-slate-900/95 backdrop-blur-2xl border-2 border-red-500/50 rounded-[2.5rem] p-6 shadow-[0_20px_60px_rgba(239,68,68,0.4)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
              
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse shrink-0">
                  <ShieldAlert size={32} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={10} fill="currentColor" />
                    Incoming SOS
                  </div>
                  <h4 className="text-white font-black truncate text-lg leading-tight mt-1">{activeRequest.userName}</h4>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    {activeRequest.type} • {activeRequest.distance || 'Calculating...'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleDenyRequest}
                  className="py-4 rounded-2xl border-2 border-slate-800 bg-slate-950 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all active:scale-95"
                >
                  Ignore
                </button>
                <button 
                  onClick={handleAcceptRequest}
                  className="py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Accept Mission
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SOS Success Popup Overlay (For Victim) */}
      {showSOSPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 border-red-500/50 rounded-[3rem] p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in zoom-in duration-500 relative">
            <button 
              onClick={() => setShowSOSPopup(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              <X size={24} />
            </button>
            <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
               <ShieldAlert size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Emergency Alert Sent</h2>
            <div className="text-red-400 font-black text-[10px] uppercase tracking-[0.3em] mb-6 italic underline underline-offset-4">{APP_NAME} Sync Active</div>
            <p className="bg-slate-800/50 p-6 rounded-3xl border border-slate-800 text-white font-bold text-sm leading-relaxed mb-8">
              Your location is shared with nearby users for immediate help.
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => { setShowSOSPopup(false); onOpenMap(); }}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-900/20"
              >
                Track Help on Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer / Copyright */}
      <footer className="mt-12 py-8 flex flex-col items-center gap-2 opacity-40">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">
          © 2025 {APP_NAME}. All rights reserved.
        </div>
        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 text-center">
          Made with ❤️ by <span className="text-blue-400 font-black">Indians For India</span>
        </div>
      </footer>
    </div>
  );
};
