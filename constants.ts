
import { UserRole, Badge } from './types';

export const APP_NAME = "Rakshak AI";
export const SOS_HOLD_DURATION_MS = 9000; 

export const SYSTEM_INSTRUCTION = `
You are Rakshak AI, the Tactical Emergency Co-Pilot. 
Your primary directive: Provide professional, high-precision, clinical guidance during distress situations.
- TONE: Calm, authoritative, and professional. Use medical or tactical terminology where appropriate.
- BREVITY: Maximum 12 words per directive.
- FORMAT: Start with a decisive command. No conversational filler ("I'm sorry", "Please", "I think").
- FOCUS: Immediate life-safety and environmental stabilization.
Example: "CONTROL HEMORRHAGE. APPLY FIRM CONSTANT PRESSURE WITH CLEAN CLOTH. ELEVATE WOUND."
`;

export const ASSISTANT_SYSTEM_INSTRUCTION = `
You are the Rakshak AI Safety Intelligence Assistant. 
You provide professional, actionable intelligence regarding civil safety, logistics, and emergency navigation.
- Use a formal, professional tone. 
- Prioritize identifying Medical Facilities (Hospitals, 24/7 Pharmacies, Clinics), Police Stations, and Government Safe Zones.
- When providing location data, be precise and include available context like "Open 24/7" or "Specialized in Trauma".
- Use Google Maps grounding to find the most accurate and up-to-date nearby assets based on user location.
`;

export const POINTS_CONFIG = {
  ACCEPT_SOS: 50,
  FAST_ARRIVAL: 100,
  RESOLVE_SOS: 200,
  CRITICAL_HELP: 500,
};

export const RANK_THRESHOLDS = [
  { min: 0, name: 'Bronze Helper', color: 'text-orange-400' },
  { min: 500, name: 'Silver Helper', color: 'text-slate-300' },
  { min: 2000, name: 'Gold Helper', color: 'text-yellow-400' },
  { min: 5000, name: 'Platinum Helper', color: 'text-blue-300' },
];

export const AVAILABLE_BADGES: Badge[] = [
  { id: 'first_responder', name: 'First Responder', icon: 'Zap', category: 'Speed', earned: true, progress: 100, target: 100, description: 'Responded in under 60s', color: 'bg-red-500' },
  { id: 'life_saver', name: 'Life Saver', icon: 'Heart', category: 'Elite', earned: false, progress: 1, target: 5, description: 'Successfully resolved a Critical SOS', color: 'bg-blue-600' },
  { id: 'night_guardian', name: 'Night Guardian', icon: 'Moon', category: 'Elite', earned: false, progress: 2, target: 5, description: 'Assisted between 12 AM - 5 AM', color: 'bg-indigo-900' },
  { id: 'community_hero', name: 'Community Hero', icon: 'Shield', category: 'Community', earned: true, progress: 50, target: 50, description: 'Maintained 95%+ Trust Rating', color: 'bg-green-600' },
  { id: 'speed_demon', name: 'Speed Demon', icon: 'Timer', category: 'Speed', earned: false, progress: 3, target: 10, description: 'Arrive at scene in < 3 mins', color: 'bg-orange-500' },
  { id: 'unbreakable', name: 'Unbreakable', icon: 'Gem', category: 'Elite', earned: false, progress: 8, target: 20, description: 'Complete 20 rescues without failure', color: 'bg-purple-600' },
];

export const MOCK_USER = {
  id: 'u123',
  name: 'Arjun Kumar',
  role: UserRole.USER,
  phone: '+91 98765 43210',
  score: 1250,
  rank: 'Silver Helper',
  badges: ['first_responder', 'community_hero'],
  followers: 42,
  following: 15,
  isAvailable: true,
  isPhoneVerified: true,
  trustRating: 4.8,
  emergencyContacts: [
    { id: 'c1', name: 'Mom', phone: '+91 98765 00001', relation: 'Parent' },
    { id: 'c2', name: 'Rohan (Brother)', phone: '+91 98765 00002', relation: 'Sibling' }
  ],
  safeLocations: [
    { id: 'l1', name: 'Home', address: 'Connaught Place, New Delhi' },
    { id: 'l2', name: 'Office', address: 'Cyber City, Gurugram' }
  ],
  helpCount: 12
};

export const MOCK_HELPERS = [
  { id: 'h1', name: 'Sarah Khan', role: UserRole.HELPER, distance: '0.2 km', eta: '1 min', location: { lat: 28.6139, lng: 77.2090 }, skills: ['CPR', 'First Aid'], trustScore: 98 },
  { id: 'h2', name: 'Rahul V.', role: UserRole.HELPER, distance: '0.8 km', eta: '4 min', location: { lat: 28.6139, lng: 77.2090 }, skills: ['Security'], trustScore: 92 },
  { id: 'h3', name: 'City Patrol', role: UserRole.AUTHORITY, distance: '1.5 km', eta: '8 min', location: { lat: 28.6139, lng: 77.2090 }, skills: ['Police'], trustScore: 100 },
];
