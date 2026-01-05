
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCnZLVrWBLZCeAkaqDhukZiM4no2VdpF4k",
  authDomain: "jagannath-47cc1.firebaseapp.com",
  projectId: "jagannath-47cc1",
  storageBucket: "jagannath-47cc1.firebasestorage.app",
  messagingSenderId: "1066200725716",
  appId: "1:1066200725716:web:a67796948138892f90e341"
};

// Global state to track if backend is unreachable
let backendHealthy = true;

// Initialize Firebase App - Singleton pattern
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Authentication - Ensures internal component registration
// The 'getAuth' function registers itself with the 'app' instance automatically.
export const auth = getAuth(app);

// Initialize Storage with safety check
let storageInstance = null;
try {
  storageInstance = getStorage(app);
} catch (e: any) {
  console.warn("Firebase Storage Service Registration Delayed or Unavailable:", e.message);
}
export const storage = storageInstance;

// Initialize Firestore with fallback and persistence
let dbInstance;
try {
  // Try initializing with persistence enabled
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  console.warn("Advanced Firestore cache initialization failed, falling back to default.", e);
  try {
    dbInstance = getFirestore(app);
  } catch (e2) {
    console.error("Critical: Firestore initialization failed completely.", e2);
    backendHealthy = false;
    dbInstance = {} as any; 
  }
}

export const db = dbInstance;

/**
 * Marks the backend as compromised (API disabled, permission denied, or hard offline).
 * This prevents the app from hanging on failed database requests.
 */
export const setBackendCompromised = () => {
  if (backendHealthy) {
    console.warn("SYSTEM ALERT: Switching to Local Simulation Mode.");
    backendHealthy = false;
  }
};

/**
 * Checks if the Firebase configuration is valid and if the backend has been marked healthy.
 */
export const isBackendHealthy = () => {
  return backendHealthy && 
         firebaseConfig.apiKey && 
         firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE";
};

// Maintain compatibility for components checking config status
export const isFirebaseConfigured = isBackendHealthy;
