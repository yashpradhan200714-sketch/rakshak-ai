
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db, isBackendHealthy, setBackendCompromised } from "./firebase";
import { EmergencyStatus, EmergencyType, User } from "../types";

const COLLECTION = "emergencies";

export const triggerSOS = async (user: User, location: { lat: number, lng: number }) => {
  if (!isBackendHealthy()) {
    console.log("Mock SOS Triggered for", user.name);
    return "mock_emergency_id_" + Date.now();
  }

  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      location: location,
      startTime: serverTimestamp(),
      status: EmergencyStatus.REQUESTED,
      type: EmergencyType.UNCERTAIN,
      active: true,
      helpersNotified: []
    });
    return docRef.id;
  } catch (error: any) {
    console.error("Error triggering SOS:", error);
    if (error.code === 'permission-denied' || error.code === 'unavailable') {
        setBackendCompromised();
        return "mock_emergency_id_" + Date.now();
    }
    throw error;
  }
};

export const acceptEmergency = async (emergencyId: string, helperId: string) => {
  if (!isBackendHealthy() || emergencyId.startsWith('mock_')) {
    console.log("Mock Emergency Accepted by", helperId);
    return true;
  }

  try {
    const ref = doc(db, COLLECTION, emergencyId);
    await updateDoc(ref, {
      status: EmergencyStatus.ACCEPTED,
      helperId: helperId,
      acceptedTime: serverTimestamp()
    });
    return true;
  } catch (e) {
    setBackendCompromised();
    return true;
  }
};

export const denyEmergency = async (emergencyId: string, helperId: string) => {
  if (!isBackendHealthy() || emergencyId.startsWith('mock_')) {
    console.log("Mock Emergency Denied by", helperId);
    return true;
  }

  try {
    // In a real system, we'd add the helper to a 'declinedBy' array
    // For this hackathon, we simply stop the local notification
    return true;
  } catch (e) {
    setBackendCompromised();
    return true;
  }
};

export const cancelSOS = async (emergencyId: string) => {
    if (!isBackendHealthy() || emergencyId.startsWith('mock_')) return;
    
    try {
        const ref = doc(db, COLLECTION, emergencyId);
        await updateDoc(ref, {
            status: EmergencyStatus.RESOLVED,
            active: false,
            endTime: serverTimestamp()
        });
    } catch (e) {
        setBackendCompromised();
    }
};

export const listenForNearbyEmergencies = (
    helperLocation: { lat: number, lng: number }, 
    onUpdate: (emergencies: any[]) => void
) => {
    if (!isBackendHealthy()) return () => {};

    try {
        const q = query(collection(db, COLLECTION), where("active", "==", true), where("status", "==", EmergencyStatus.REQUESTED));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const emergencies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            onUpdate(emergencies);
        }, (error) => {
            console.error("Snapshot error:", error);
            if (error.code === 'permission-denied' || error.code === 'unavailable') {
                setBackendCompromised();
            }
        });

        return unsubscribe;
    } catch (e) {
        setBackendCompromised();
        return () => {};
    }
};
