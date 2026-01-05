
export enum UserRole {
  USER = 'USER',
  HELPER = 'HELPER',
  AUTHORITY = 'AUTHORITY'
}

export enum EmergencyStatus {
  NONE = 'NONE',
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  RESOLVED = 'RESOLVED'
}

export enum EmergencyType {
  MEDICAL = 'Medical',
  ACCIDENT = 'Accident',
  FIRE = 'Fire',
  HARASSMENT = 'Harassment',
  DISASTER = 'Disaster',
  UNCERTAIN = 'Uncertain'
}

export interface Badge {
  id: string;
  name: string;
  icon: string; // Key for Lucide component
  category: 'Speed' | 'Community' | 'Elite' | 'All';
  earned: boolean;
  progress: number;
  target: number;
  description: string;
  color: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface SafeLocation {
  id: string;
  name: string;
  address: string; 
}

export interface Hazard {
  id: string;
  lat: number;
  lng: number;
  type: 'Crime' | 'Light' | 'Road' | 'Other';
  description: string;
  reportedBy: string;
  timestamp: Date;
}

export interface User {
  id: string;
  email?: string;
  name: string;
  photoUrl?: string;
  role: UserRole;
  phone: string;
  isPhoneVerified: boolean;
  score: number;
  rank: string;
  trustRating: number;
  badges: string[]; // IDs of earned badges
  followers: number;
  following: number;
  isAvailable?: boolean;
  location?: { lat: number; lng: number };
  blockedUsers?: string[];
  emergencyContacts: Contact[];
  safeLocations: SafeLocation[];
  helpCount?: number;
}

export interface Connection {
  id: string;
  name: string;
  role: string;
  score: number;
  isPriority: boolean;
  avatar?: string;
  trustRating: number;
}

export interface Helper {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  distance: string;
  eta: string;
  location: { lat: number; lng: number };
  skills: string[];
  trustScore: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
  groundingMetadata?: any;
}

export interface EmergencySession {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  location: { lat: number; lng: number };
  startTime: any;
  status: EmergencyStatus;
  type: EmergencyType;
  helperId?: string;
  active: boolean;
}
