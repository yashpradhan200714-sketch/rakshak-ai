
declare var google: any;

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { User, Helper, Hazard, EmergencyStatus, UserRole } from '../types';

interface MapDashboardProps {
  user: User;
  isEmergencyMode: boolean;
  emergencyStatus?: EmergencyStatus;
  activeHelper?: Helper | null;
  onBack: () => void;
}

interface SafetyPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'Medical' | 'Police' | 'SafeZone';
  info: string;
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 }; // New Delhi

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
];

const mockHelpers: Helper[] = [
  { id: 'h1', name: 'Sarah Khan', role: UserRole.HELPER, phone: '+91 99999 11111', distance: '0.4 km', eta: '2 min', location: { lat: 28.6139 + 0.002, lng: 77.2090 + 0.002 }, skills: ['CPR'], trustScore: 98 },
  { id: 'h2', name: 'Rahul V.', role: UserRole.HELPER, phone: '+91 99999 22222', distance: '1.2 km', eta: '6 min', location: { lat: 28.6139 - 0.003, lng: 77.2090 - 0.001 }, skills: ['Security'], trustScore: 92 },
];

const mockSafetyPoints: SafetyPoint[] = [
  { id: 'm1', name: 'Apollo 24/7 Medical', lat: 28.6139 + 0.001, lng: 77.2090 + 0.0015, type: 'Medical', info: 'Emergency Hospital - Intensive Care' },
  { id: 'm2', name: 'HealthPlus Pharmacy', lat: 28.6139 - 0.0015, lng: 77.2090 + 0.002, type: 'Medical', info: '24/7 Emergency Pharmacy' },
  { id: 'm3', name: 'City Dental & Trauma', lat: 28.6139 + 0.001, lng: 77.2090 - 0.003, type: 'Medical', info: 'Medical Clinic - First Aid Available' },
  { id: 'p1', name: 'Police Control Room', lat: 28.6139 + 0.004, lng: 77.2090 - 0.002, type: 'Police', info: 'Local Patrol Unit - Fast Response' },
];

const mockDangerZones: Hazard[] = [
  { id: 'dz1', lat: 28.6139 + 0.001, lng: 77.2090 - 0.002, type: 'Light', description: 'Broken streetlights. Very dark at night.', reportedBy: 'System', timestamp: new Date() },
  { id: 'dz2', lat: 28.6139 - 0.001, lng: 77.2090 + 0.003, type: 'Crime', description: 'Reported snatching area.', reportedBy: 'Admin', timestamp: new Date() },
];

const MAP_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

/**
 * Inner component that uses the Maps hook.
 * Only rendered once we have a validated API key.
 */
const TacticalMapContent: React.FC<MapDashboardProps & { apiKey: string }> = ({ 
  apiKey, user, isEmergencyMode, emergencyStatus, activeHelper, onBack 
}) => {
  const [currentPosition, setCurrentPosition] = useState(user.location || DEFAULT_CENTER);
  const [gpsLocked, setGpsLocked] = useState(true);
  const [selectedHelper, setSelectedHelper] = useState<Helper | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [selectedSafetyPoint, setSelectedSafetyPoint] = useState<SafetyPoint | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [dangerZones, setDangerZones] = useState<Hazard[]>(mockDangerZones);
  const [showHazardModal, setShowHazardModal] = useState<{ lat: number; lng: number } | null>(null);
  const [hazardType, setHazardType] = useState<Hazard['type']>('Crime');
  const [hazardDesc, setHazardDesc] = useState('');

  const mapRef = useRef<any | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES
  });

  useEffect(() => {
    let watchId: number;
    if (navigator.geolocation && gpsLocked) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentPosition(newLoc);
        },
        (err) => console.warn("Watch position failure:", err.message),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [gpsLocked]);

  const onMapLoad = useCallback((map: any) => {
    mapRef.current = map;
  }, []);

  const onMapClick = useCallback((e: any) => {
    if (isReporting && e.latLng) {
      setShowHazardModal({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
    setGpsLocked(false);
  }, [isReporting]);

  const handleSaveHazard = () => {
    if (showHazardModal) {
      const newHazard: Hazard = {
        id: `dz-${Date.now()}`,
        lat: showHazardModal.lat,
        lng: showHazardModal.lng,
        type: hazardType,
        description: hazardDesc,
        reportedBy: user.name,
        timestamp: new Date()
      };
      setDangerZones([...dangerZones, newHazard]);
      setShowHazardModal(null);
      setIsReporting(false);
      setHazardDesc('');
    }
  };

  const mapOptions = useMemo(() => ({
    styles: darkMapStyle,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy',
  }), []);

  const relockGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentPosition(newLoc);
        setGpsLocked(true);
        if (mapRef.current) mapRef.current.panTo(newLoc);
      });
    }
  };

  if (loadError) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col p-8 items-center justify-center text-center">
         <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
         </div>
         <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">API Key Restriction</h3>
         <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">The current API Key is not authorized for Maps. Ensure the project has the "Maps JavaScript API" enabled and an active billing account.</p>
         <button onClick={async () => { await (window as any).aistudio.openSelectKey(); window.location.reload(); }} className="py-4 px-10 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest mb-4 shadow-xl shadow-blue-900/40">Switch API Key</button>
         <button onClick={onBack} className="text-[10px] font-black uppercase text-slate-600">Return to Safety</button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] animate-pulse">Syncing Grid Link</span>
          <span className="text-[9px] text-slate-600 font-bold uppercase">Establishing Secure Proxy...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-950 flex flex-col">
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
        <button onClick={onBack} className="bg-slate-900/95 p-3.5 rounded-2xl border border-slate-800 text-white shadow-2xl pointer-events-auto active:scale-90 transition-all backdrop-blur-xl">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="bg-slate-900/95 px-6 py-3 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl flex items-center gap-3 pointer-events-auto">
          <div className={`w-2.5 h-2.5 rounded-full ${isEmergencyMode ? 'bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`}></div>
          <span className={`${isEmergencyMode ? 'text-red-500' : 'text-blue-400'} font-black uppercase tracking-[0.25em] text-[9px]`}>{isEmergencyMode ? 'LIVE SOS TRACKING' : 'TACTICAL GRID'}</span>
          <div className="w-px h-3 bg-slate-700 mx-1"></div>
          <span className="text-teal-400 font-black uppercase tracking-[0.1em] text-[8px]">Medical Sync: Active</span>
        </div>
      </div>

      <GoogleMap 
        mapContainerStyle={containerStyle} 
        center={currentPosition} 
        zoom={17} 
        onLoad={onMapLoad}
        onClick={onMapClick} 
        options={mapOptions}
      >
        <Marker 
          position={currentPosition} 
          icon={{ 
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: isEmergencyMode ? '#ef4444' : '#3b82f6',
            fillOpacity: 1,
            strokeWeight: 8,
            strokeColor: '#ffffff',
            scale: 10
          }} 
        />
        
        {mockHelpers.map(h => (
          <Marker 
            key={h.id} 
            position={h.location} 
            onClick={() => { setSelectedHelper(h); setGpsLocked(false); }} 
            icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' }} 
          />
        ))}

        {mockSafetyPoints.map(sp => (
          <Marker 
            key={sp.id} 
            position={{ lat: sp.lat, lng: sp.lng }} 
            onClick={() => { setSelectedSafetyPoint(sp); setGpsLocked(false); }}
            icon={{ 
              url: sp.type === 'Medical' 
                ? 'https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png' 
                : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' 
            }}
          />
        ))}
        
        {dangerZones.map(hz => (
          <Marker 
            key={hz.id} 
            position={{ lat: hz.lat, lng: hz.lng }} 
            onClick={() => { setSelectedHazard(hz); setGpsLocked(false); }} 
            icon={{ url: hz.type === 'Crime' ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' : 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' }} 
          />
        ))}

        {selectedHelper && (
          <InfoWindow position={selectedHelper.location} onCloseClick={() => setSelectedHelper(null)}>
            <div className="p-3 text-slate-900 min-w-[150px]">
              <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Active Guardian</div>
              <h4 className="font-bold text-sm">{selectedHelper.name}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{selectedHelper.distance} • {selectedHelper.eta} ETA</p>
              <button className="mt-3 w-full text-[9px] font-black uppercase bg-blue-600 text-white px-2 py-2 rounded-lg shadow-lg">Request Escort</button>
            </div>
          </InfoWindow>
        )}

        {selectedSafetyPoint && (
          <InfoWindow position={{ lat: selectedSafetyPoint.lat, lng: selectedSafetyPoint.lng }} onCloseClick={() => setSelectedSafetyPoint(null)}>
            <div className="p-3 text-slate-900 min-w-[150px]">
              <div className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1">{selectedSafetyPoint.type} ASSET</div>
              <h4 className="font-bold text-sm">{selectedSafetyPoint.name}</h4>
              <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{selectedSafetyPoint.info}</p>
              <button className="mt-3 w-full text-[9px] font-black uppercase bg-teal-600 text-white px-2 py-2 rounded-lg shadow-lg">Navigate Direct</button>
            </div>
          </InfoWindow>
        )}

        {selectedHazard && (
          <InfoWindow position={{ lat: selectedHazard.lat, lng: selectedHazard.lng }} onCloseClick={() => setSelectedHazard(null)}>
            <div className="p-3 text-slate-900 min-w-[150px]">
              <div className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">{selectedHazard.type} ALERT</div>
              <h4 className="font-bold text-sm">{selectedHazard.type} Zone</h4>
              <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{selectedHazard.description}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <div className="absolute bottom-10 left-0 right-0 p-4 flex flex-col items-center gap-5 pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={relockGps}
            className={`p-5 rounded-full shadow-2xl transition-all active:scale-90 ${gpsLocked ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-slate-900/90 text-slate-400 border border-slate-800 backdrop-blur-xl hover:text-white'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <button 
            onClick={() => setIsReporting(!isReporting)}
            className={`px-10 py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all active:scale-95 ${isReporting ? 'bg-red-600 text-white ring-4 ring-red-500/20 animate-pulse' : 'bg-slate-900/90 text-slate-300 border border-slate-800 backdrop-blur-xl hover:border-slate-600'}`}
          >
            {isReporting ? 'MARK THREAT ON GRID' : 'DEPLOY HAZARD SIGNAL'}
          </button>
        </div>
      </div>

      {showHazardModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 w-full max-w-sm shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-white mb-8 tracking-tight uppercase tracking-widest">Signal Report</h3>
            <div className="space-y-8 mb-10">
               <div>
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 block">Signal Category</label>
                 <select value={hazardType} onChange={(e) => setHazardType(e.target.value as any)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500 transition-colors">
                   <option value="Crime">High Crime Zone</option>
                   <option value="Light">Zero Visibility (Dark)</option>
                   <option value="Road">Infrastructure Hazard</option>
                   <option value="Other">Unspecified Threat</option>
                 </select>
               </div>
               <div>
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 block">Briefing</label>
                 <textarea value={hazardDesc} onChange={(e) => setHazardDesc(e.target.value)} placeholder="Actionable intelligence..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-white h-32 resize-none font-medium outline-none focus:border-blue-500 transition-colors" />
               </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowHazardModal(null)} className="flex-1 py-5 text-[10px] font-black uppercase text-slate-500">Cancel</button>
              <button onClick={handleSaveHazard} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest">Broadcast</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const MapDashboard: React.FC<MapDashboardProps> = (props) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  
  const validatedKey = useMemo(() => {
      const k = process.env.API_KEY || '';
      return (k && k !== 'mock_key' && k !== 'PASTE_YOUR_API_KEY_HERE') ? k : null;
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(selected && validatedKey !== null);
    };
    checkKey();
  }, [validatedKey]);

  const handleSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    window.location.reload(); 
  };

  if (hasKey === false || !validatedKey) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mb-8 border border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
          <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Tactical Auth Required</h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-10">
          Google Maps protocol requires a valid API key with <span className="text-blue-400 font-bold">billing enabled</span>. Please select a valid key to unlock the Tactical Grid.
        </p>
        <div className="flex flex-col w-full gap-4 max-w-xs">
          <button 
            onClick={handleSelectKey} 
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/40 transition-all active:scale-95"
          >
            Connect Valid API Key
          </button>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest">Billing Documentation</a>
          <button onClick={props.onBack} className="mt-4 py-2 text-[10px] font-black uppercase text-slate-600 hover:text-white transition-colors">Abort Access</button>
        </div>
      </div>
    );
  }

  // Once key is confirmed, render content that uses useJsApiLoader
  return <TacticalMapContent {...props} apiKey={validatedKey} />;
};
