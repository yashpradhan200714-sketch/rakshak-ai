
import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { EmergencyMode } from './pages/EmergencyMode';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Assistant } from './pages/Assistant';
import { CommunityHub } from './pages/CommunityHub';
import { MapDashboard } from './pages/MapDashboard';
import { User, EmergencyStatus } from './types';
import { syncUserProfile, updateUserLocation } from './services/userService';
import { auth } from './services/firebase';
import { APP_NAME } from './constants';
import { WifiOff, AlertTriangle } from 'lucide-react';

enum View {
  DASHBOARD = 'DASHBOARD',
  COMMUNITY = 'COMMUNITY',
  EMERGENCY = 'EMERGENCY',
  PROFILE = 'PROFILE',
  ASSISTANT = 'ASSISTANT',
  MAP = 'MAP'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [emergencyState, setEmergencyState] = useState<{status: EmergencyStatus; helper: any | null}>({
    status: EmergencyStatus.NONE,
    helper: null
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  // Global High-Precision Tracking
  useEffect(() => {
    let watchId: number;
    if (currentUser && navigator.geolocation) {
        // Initial quick fix
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                updateUserLocation(currentUser.id, newLoc.lat, newLoc.lng);
                setCurrentUser(prev => prev ? { ...prev, location: newLoc } : null);
            },
            (err) => console.warn("Initial GPS Error:", err.message),
            { enableHighAccuracy: true }
        );

        // Continuous watch
        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                updateUserLocation(currentUser.id, newLoc.lat, newLoc.lng);
                setCurrentUser(prev => prev ? { ...prev, location: newLoc } : null);
            },
            (err) => console.warn("Watch GPS Error:", err.message),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
        );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [currentUser?.id]);

  const handleLoginSuccess = async (authData: any) => {
    setLoading(true);
    try {
      const userProfile = await syncUserProfile(authData);
      setCurrentUser(userProfile);
    } catch (e) {
      console.error("Critical Auth Sync Failure", e);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    if (auth.signOut) auth.signOut();
    setCurrentUser(null);
    setCurrentView(View.DASHBOARD);
  };

  const handleSOS = () => {
    setEmergencyState({ status: EmergencyStatus.REQUESTED, helper: null });
  };

  const handleSearchNearby = (query: string) => {
    setSearchQuery(query);
    setCurrentView(View.ASSISTANT);
  };

  const resolveEmergency = () => {
    if (window.confirm("Are you sure you are safe? This will cancel the alert.")) {
        setEmergencyState({ status: EmergencyStatus.NONE, helper: null });
        setCurrentView(View.DASHBOARD);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <span className="text-blue-500 font-black tracking-[0.2em] uppercase text-[10px]">Initializing {APP_NAME}</span>
    </div>;
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Check if we are in Simulation Mode due to Firestore permission/offline errors
  const isSimulationMode = (currentUser as any).isOfflineMode;

  const renderView = () => {
    switch (currentView) {
      case View.EMERGENCY:
        return <EmergencyMode onResolve={resolveEmergency} onUpdateHelper={(h) => setEmergencyState({ status: EmergencyStatus.ACCEPTED, helper: h })} />;
      case View.PROFILE:
        return <Profile user={currentUser} onLogout={handleLogout} />;
      case View.ASSISTANT:
        return <Assistant 
                 initialSearchQuery={searchQuery} 
                 onSearchProcessed={() => setSearchQuery(undefined)} 
                 userLocation={currentUser.location}
               />;
      case View.COMMUNITY:
        return <CommunityHub />;
      case View.MAP:
        return (
          <MapDashboard 
            user={currentUser} 
            isEmergencyMode={emergencyState.status !== EmergencyStatus.NONE}
            emergencyStatus={emergencyState.status}
            activeHelper={emergencyState.helper}
            onBack={() => setCurrentView(View.DASHBOARD)}
          />
        );
      case View.DASHBOARD:
      default:
        return <Dashboard 
          onSOS={handleSOS} 
          onOpenMap={() => setCurrentView(View.MAP)} 
          onSearchNearby={handleSearchNearby}
          user={currentUser} 
        />;
    }
  };

  const showNav = currentView !== View.EMERGENCY && currentView !== View.MAP;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Simulation/Offline Mode Banner */}
      {isSimulationMode && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-orange-600 text-white py-1 px-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl">
          <WifiOff size={12} />
          <span>Simulation Mode: Backend API Disabled</span>
          <AlertTriangle size={12} className="ml-2" />
        </div>
      )}

      {renderView()}

      {showNav && (
        <nav className="fixed bottom-0 w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 pb-safe z-50">
          <div className="flex justify-around items-center p-3 max-w-md mx-auto">
            <button 
              onClick={() => setCurrentView(View.DASHBOARD)}
              className={`flex flex-col items-center gap-1 transition-all ${currentView === View.DASHBOARD ? 'text-blue-500 scale-110' : 'text-slate-500'}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-tighter">Protect</span>
            </button>

            <button 
              onClick={() => setCurrentView(View.COMMUNITY)}
              className={`flex flex-col items-center gap-1 transition-all ${currentView === View.COMMUNITY ? 'text-blue-500 scale-110' : 'text-slate-500'}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-tighter">Grid</span>
            </button>
            
            <button 
              onClick={() => setCurrentView(View.ASSISTANT)}
              className={`flex flex-col items-center gap-1 transition-all ${currentView === View.ASSISTANT ? 'text-blue-500 scale-110' : 'text-slate-500'}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-tighter">AI Aide</span>
            </button>

            <button 
              onClick={() => setCurrentView(View.PROFILE)}
              className={`flex flex-col items-center gap-1 transition-all ${currentView === View.PROFILE ? 'text-blue-500 scale-110' : 'text-slate-500'}`}
            >
              <div className={`w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center font-bold text-[10px] ${currentView === View.PROFILE ? 'border-blue-500' : 'border-slate-500'}`}>
                {currentUser.name.charAt(0)}
              </div>
              <span className="text-[9px] font-black uppercase tracking-tighter">Me</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
