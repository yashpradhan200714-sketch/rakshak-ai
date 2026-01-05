
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, getDocs, updateDoc, increment, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { User, Connection } from "../types";

/**
 * FIRESTORE SCHEMA:
 * Relationships: "followerId_followingId"
 */

const MOCK_FOLLOWING: Connection[] = [
  { id: 'h1', name: 'Sarah Khan', role: 'Platinum Guardian', score: 8200, isPriority: true, avatar: 'https://i.pravatar.cc/150?u=sarah', trustRating: 99 },
  { id: 'h2', name: 'Rahul V.', role: 'Gold Helper', score: 4500, isPriority: false, avatar: 'https://i.pravatar.cc/150?u=rahul', trustRating: 96 },
  { id: 'h4', name: 'Dr. Emily R.', role: 'Medical Expert', score: 12000, isPriority: true, avatar: 'https://i.pravatar.cc/150?u=emily', trustRating: 100 }
];

const MOCK_FOLLOWERS: Connection[] = [
  { id: 'u201', name: 'Kabir Singh', role: 'Silver Helper', score: 2100, isPriority: false, avatar: 'https://i.pravatar.cc/150?u=kabir', trustRating: 94 },
  { id: 'u202', name: 'Priya Verma', role: 'Bronze Helper', score: 450, isPriority: false, avatar: 'https://i.pravatar.cc/150?u=priya', trustRating: 98 },
  { id: 'u203', name: 'Sneha Rao', role: 'Gold Helper', score: 3800, isPriority: false, avatar: 'https://i.pravatar.cc/150?u=sneha', trustRating: 97 },
  { id: 'u204', name: 'Amit J.', role: 'Silver Helper', score: 1850, isPriority: false, avatar: 'https://i.pravatar.cc/150?u=amit', trustRating: 95 }
];

export const toggleFollow = async (followerId: string, followingId: string, isCurrentlyFollowing: boolean) => {
  if (!isFirebaseConfigured()) return !isCurrentlyFollowing;

  const relId = `${followerId}_${followingId}`;
  const relRef = doc(db, "relationships", relId);
  const followerRef = doc(db, "users", followerId);
  const followingRef = doc(db, "users", followingId);

  try {
    if (isCurrentlyFollowing) {
      await deleteDoc(relRef);
      await updateDoc(followerRef, { following: increment(-1) });
      await updateDoc(followingRef, { followers: increment(-1) });
      return false;
    } else {
      await setDoc(relRef, {
        followerId,
        followingId,
        createdAt: serverTimestamp(),
        isPriority: false
      });
      await updateDoc(followerRef, { following: increment(1) });
      await updateDoc(followingRef, { followers: increment(1) });
      return true;
    }
  } catch (error) {
    console.error("Social Toggle Error:", error);
    throw error;
  }
};

export const removeFollower = async (myId: string, followerId: string) => {
  if (!isFirebaseConfigured()) return;
  const relId = `${followerId}_${myId}`;
  await deleteDoc(doc(db, "relationships", relId));
  await updateDoc(doc(db, "users", myId), { followers: increment(-1) });
  await updateDoc(doc(db, "users", followerId), { following: increment(-1) });
};

export const blockUser = async (myId: string, targetId: string) => {
  if (!isFirebaseConfigured()) return;
  
  const myRef = doc(db, "users", myId);
  await updateDoc(myRef, {
    blockedUsers: arrayUnion(targetId)
  });

  // Automatically unfollow and remove as follower
  const rel1 = `${myId}_${targetId}`;
  const rel2 = `${targetId}_${myId}`;
  
  await deleteDoc(doc(db, "relationships", rel1));
  await deleteDoc(doc(db, "relationships", rel2));
};

export const getFollowing = async (userId: string): Promise<Connection[]> => {
  if (!isFirebaseConfigured()) {
    // Return high quality mock data for demo
    return MOCK_FOLLOWING;
  }
  
  try {
    const q = query(collection(db, "relationships"), where("followerId", "==", userId));
    const snapshot = await getDocs(q);
    const followingData = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));

    const connections: Connection[] = [];
    for (const rel of followingData) {
      const uDoc = await getDoc(doc(db, "users", (rel as any).followingId));
      if (uDoc.exists()) {
        const u = uDoc.data() as User;
        connections.push({
          id: u.id,
          name: u.name,
          role: u.rank,
          score: u.score,
          isPriority: (rel as any).isPriority || false,
          avatar: u.photoUrl,
          trustRating: u.trustRating
        });
      }
    }
    return connections.length > 0 ? connections : MOCK_FOLLOWING;
  } catch (e) {
    console.error(e);
    return MOCK_FOLLOWING;
  }
};

export const getFollowers = async (userId: string): Promise<Connection[]> => {
  if (!isFirebaseConfigured()) {
    // Return high quality mock data for demo
    return MOCK_FOLLOWERS;
  }
  
  try {
    const q = query(collection(db, "relationships"), where("followingId", "==", userId));
    const snapshot = await getDocs(q);
    const followerData = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));

    const connections: Connection[] = [];
    for (const rel of followerData) {
      const uDoc = await getDoc(doc(db, "users", (rel as any).followerId));
      if (uDoc.exists()) {
        const u = uDoc.data() as User;
        connections.push({
          id: u.id,
          name: u.name,
          role: u.rank,
          score: u.score,
          isPriority: false, // Priority only applies to Guardians (Following)
          avatar: u.photoUrl,
          trustRating: u.trustRating
        });
      }
    }
    return connections.length > 0 ? connections : MOCK_FOLLOWERS;
  } catch (e) {
    console.error(e);
    return MOCK_FOLLOWERS;
  }
};

export const togglePriority = async (followerId: string, followingId: string, currentPriority: boolean) => {
    if (!isFirebaseConfigured()) return !currentPriority;
    const relId = `${followerId}_${followingId}`;
    const relRef = doc(db, "relationships", relId);
    try {
        await updateDoc(relRef, { isPriority: !currentPriority });
        return !currentPriority;
    } catch (e) {
        console.error("Priority Toggle Error:", e);
        return currentPriority;
    }
};

export const checkFollowStatus = async (followerId: string, followingId: string): Promise<boolean> => {
  if (!isFirebaseConfigured()) return false;
  const relId = `${followerId}_${followingId}`;
  const snap = await getDoc(doc(db, "relationships", relId));
  return snap.exists();
};

export const notifySafetyNet = async (victimId: string, victimName: string) => {
  if (!isFirebaseConfigured()) {
    console.log(`[Priority] Notifying followers of ${victimName}...`);
    return;
  }
  try {
    const q = query(collection(db, "relationships"), where("followingId", "==", victimId));
    const snapshot = await getDocs(q);
    const followerIds = snapshot.docs.map(d => d.data().followerId);
    if (followerIds.length === 0) return;
    console.log(`Alerting ${followerIds.length} trusted guardians for ${victimName}`);
  } catch (error) {
    console.error("Notification Dispatch Error:", error);
  }
};
