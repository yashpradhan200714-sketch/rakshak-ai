
import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs, query, orderBy, limit, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, isBackendHealthy, setBackendCompromised } from "./firebase";
import { User, UserRole, Contact } from "../types";
import { MOCK_USER, RANK_THRESHOLDS } from "../constants";

const COLLECTION = "users";

/**
 * Synchronizes the Firebase Auth user with the Firestore Profile.
 * Falls back to a rich Mock Profile if the API is disabled or the client is offline.
 */
export const syncUserProfile = async (authData: any): Promise<User> => {
  if (!isBackendHealthy()) {
    return createMockProfile(authData);
  }

  const userRef = doc(db, COLLECTION, authData.uid);
  try {
    // Attempt to fetch profile. This is the primary point where "Permission Denied" (API disabled) is caught.
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    } else {
      const newUser: User = {
        id: authData.uid,
        email: authData.email || "",
        name: authData.displayName || "Guardian", 
        photoUrl: authData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(authData.displayName || 'Guardian')}&background=random`,
        role: UserRole.USER,
        phone: authData.phoneNumber || "",
        isPhoneVerified: !!authData.phoneNumber,
        score: 0,
        rank: "Bronze Helper",
        trustRating: 100,
        badges: [],
        followers: 0,
        following: 0,
        blockedUsers: [],
        emergencyContacts: [],
        safeLocations: [],
        helpCount: 0
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
  } catch (error: any) {
    console.error("Firestore Core Sync Error:", error.code, error.message);
    
    // Explicit check for the error reported: permission-denied (usually means API disabled in console)
    if (
      error.code === 'permission-denied' || 
      error.code === 'unavailable' || 
      error.message?.includes('offline') ||
      error.message?.includes('Cloud Firestore API')
    ) {
      setBackendCompromised();
      return createMockProfile(authData);
    }
    
    // Total fallback for any other unexpected database issues
    setBackendCompromised();
    return createMockProfile(authData);
  }
};

const createMockProfile = (authData: any): User => ({
  ...MOCK_USER,
  id: authData.uid || 'mock_uid',
  name: authData.displayName || "Guardian (Simulated)",
  photoUrl: authData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(authData.displayName || 'G')}&background=random`,
  email: authData.email || undefined,
  isOfflineMode: true // Used by App.tsx to show the warning banner
} as any);

export const awardPoints = async (userId: string, points: number) => {
    if (!isBackendHealthy()) return;
    try {
        const userRef = doc(db, COLLECTION, userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const userData = snap.data() as User;
            const newScore = userData.score + points;
            let newRank = userData.rank;
            for (const threshold of RANK_THRESHOLDS) {
                if (newScore >= threshold.min) {
                    newRank = threshold.name;
                }
            }
            await updateDoc(userRef, {
                score: newScore,
                rank: newRank,
                helpCount: increment(1)
            });
        }
    } catch (e) {
        setBackendCompromised();
    }
};

export const addEmergencyContact = async (userId: string, contact: Contact) => {
  if (!isBackendHealthy()) return;
  try {
    const userRef = doc(db, COLLECTION, userId);
    await updateDoc(userRef, { emergencyContacts: arrayUnion(contact) });
  } catch (e) { setBackendCompromised(); }
};

export const removeEmergencyContact = async (userId: string, contact: Contact) => {
  if (!isBackendHealthy()) return;
  try {
    const userRef = doc(db, COLLECTION, userId);
    await updateDoc(userRef, { emergencyContacts: arrayRemove(contact) });
  } catch (e) { setBackendCompromised(); }
};

export const getLeaderboard = async (period: 'weekly' | 'all-time'): Promise<User[]> => {
    if (!isBackendHealthy()) return mockLeaderboard();
    try {
        const q = query(collection(db, COLLECTION), orderBy("score", "desc"), limit(10));
        const snap = await getDocs(q);
        return snap.docs.map(doc => doc.data() as User);
    } catch (e) {
        setBackendCompromised();
        return mockLeaderboard();
    }
};

const mockLeaderboard = () => [
    { ...MOCK_USER, id: 'l1', name: 'Kabir Singh', score: 8400, rank: 'Platinum Guardian' },
    { ...MOCK_USER, id: 'l2', name: 'Priya Verma', score: 5200, rank: 'Platinum Guardian' },
    { ...MOCK_USER, id: 'l3', name: 'Rohan Gupta', score: 3100, rank: 'Gold Helper' },
];

export const getCommunityStats = async () => {
    return {
        totalLivesImpacted: 14205,
        activeHelpers: 850,
        avgResponseTime: "3.2m",
        safetyIndex: "94%"
    };
};

export const followUser = async (currentUserId: string, targetUserId: string) => {
  if (!isBackendHealthy()) return true;
  try {
    const currentUserRef = doc(db, COLLECTION, currentUserId);
    const targetUserRef = doc(db, COLLECTION, targetUserId);
    await updateDoc(currentUserRef, { following: increment(1) });
    await updateDoc(targetUserRef, { followers: increment(1) });
    return true;
  } catch (error) {
    setBackendCompromised();
    return true;
  }
};

export const getCommunityUsers = async (): Promise<User[]> => {
  if (!isBackendHealthy()) {
     return [
         { ...MOCK_USER, id: 'u2', name: 'Sarah Khan', role: UserRole.HELPER, score: 3200, rank: 'Gold Helper' },
         { ...MOCK_USER, id: 'u4', name: 'Dr. Emily R.', role: UserRole.HELPER, score: 5000, rank: 'Platinum Guardian' },
     ];
  }
  try {
      const querySnapshot = await getDocs(collection(db, COLLECTION));
      return querySnapshot.docs.map(doc => doc.data() as User).slice(0, 10);
  } catch (e) {
      setBackendCompromised();
      return [];
  }
};

export const updateUserLocation = async (userId: string, lat: number, lng: number) => {
    if (!isBackendHealthy()) return;
    try {
        const userRef = doc(db, COLLECTION, userId);
        await updateDoc(userRef, {
            location: { lat, lng },
            lastActive: new Date()
        });
    } catch (e) { setBackendCompromised(); }
};

export const updateUserData = async (userId: string, data: Partial<User>) => {
    if (!isBackendHealthy()) return;
    try {
        const userRef = doc(db, COLLECTION, userId);
        await updateDoc(userRef, data);
    } catch (e) { setBackendCompromised(); }
};
