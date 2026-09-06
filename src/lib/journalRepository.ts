import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  getDb,
  getAuthClient,
  isFirebaseReady,
  handleFirestoreError,
  OperationType,
} from './firebase';
import type { JournalEntry } from '../types';

const LOCAL_STORAGE_KEY = 'personal_gemini_journals_cache';

// Seed sample entry for immediate visual immersion
const INITIAL_DEMO_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-hig-001',
    userId: 'demo-user-apple-hig',
    title: 'Morning Clarity at the Coastal Redwood Grove',
    encryptedData: 'a4f91b72e90c812d48f93e18a8b8c8d8e8f808182838485868788898a8b8c8d8',
    iv: 'b9e73d1f04aa812f90112233',
    salt: 'c1d2e3f4a5b6c7d8e9f0112233445566',
    isEncrypted: false,
    rawContent: 'Walked among the towering redwoods as the morning coastal fog began to lift. Inhale the scent of damp moss and pine needles. The quiet stillness felt expansive—a reminder that not every thought requires an immediate answer.',
    sentiment: 'Peaceful',
    distressScore: 0.08,
    crisisDetected: false,
    themes: ['Mindfulness', 'Nature', 'Mental Clarity', 'Patience'],
    growthMilestone: 'Embracing quiet reflection without distraction',
    environmentalTag: 'Nature Walk',
    location: {
      lat: 37.8967,
      lng: -122.5807,
      placename: 'Muir Woods Redwood Creek Trail',
      city: 'Mill Valley, CA',
      environmentalTag: 'Nature Walk',
    },
    aiSummary: 'You found deep grounded presence in the Redwood grove. The tactile sensory awareness of pine and coastal air helped dissolve mental urgency.',
    reflections: [
      {
        id: 'turn-1',
        role: 'user',
        text: 'The quiet stillness felt expansive—a reminder that not every thought requires an immediate answer.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
      {
        id: 'turn-2',
        role: 'model',
        text: 'That is a profound realization. When we allow stillness to hold our thoughts without rushing to solve them, what becomes clear to you about where you want your energy to flow next?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        modelUsed: 'gemini-3.6-flash',
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

/**
 * Subscribe to real-time journal changes for an isolated user path:
 * /users/{userId}/journals/{journalId}
 */
export function subscribeUserJournals(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void
): () => void {
  const database = getDb();
  const authInstance = getAuthClient();

  if (isFirebaseReady() && database && authInstance?.currentUser) {
    const journalCollectionPath = `users/${userId}/journals`;
    try {
      const q = query(collection(database, journalCollectionPath), orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const remoteEntries: JournalEntry[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as JournalEntry;
            remoteEntries.push({
              ...data,
              id: docSnap.id,
            });
          });
          onUpdate(remoteEntries);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, journalCollectionPath, authInstance ?? undefined);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.warn('[Firestore] Falling back to local store:', err);
    }
  }

  // Local persistent store fallback
  const getLocalEntries = (): JournalEntry[] => {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    if (userId === 'demo-user-apple-hig') {
      return INITIAL_DEMO_ENTRIES;
    }
    // Seed an initial personalized entry for this unique user
    const firstEntry: JournalEntry = {
      id: `entry-${userId}-init`,
      userId: userId,
      title: 'My First Secret Journal Entry 🌟',
      isEncrypted: false,
      rawContent: 'Today I opened my personal secret journal! I can write about my day, fun games with friends, exciting things I learned at school, or feelings I want to reflect on.',
      sentiment: 'Peaceful',
      distressScore: 0.05,
      crisisDetected: false,
      themes: ['Excitement', 'Beginning', 'Curiosity'],
      growthMilestone: 'Starting my mindful reflection habit',
      environmentalTag: 'Home Desk',
      aiSummary: 'Welcome to your journal! Writing down your thoughts is a wonderful way to express yourself and keep your mind calm.',
      reflections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify([firstEntry]));
    } catch {}
    return [firstEntry];
  };

  onUpdate(getLocalEntries());

  const handleStorageChange = () => {
    onUpdate(getLocalEntries());
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}

/**
 * Recursively strips undefined values to guarantee Zero-Crash Payload Hygiene for Firestore writes.
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = stripUndefined(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Persist journal entry to isolated Firestore path /users/{userId}/journals/{journalId}
 */
export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  const path = `users/${userId}/journals`;
  const database = getDb();
  const authInstance = getAuthClient();
  
  if (isFirebaseReady() && database) {
    try {
      // Clean payload for Firestore conforming to firestore.rules
      const firestorePayload: Record<string, unknown> = {
        id: entry.id,
        userId: entry.userId,
        title: (entry.title || 'Untitled Entry').slice(0, 200),
        isEncrypted: Boolean(entry.isEncrypted),
        sentiment: entry.sentiment || 'Reflective',
        distressScore: typeof entry.distressScore === 'number' ? entry.distressScore : 0.1,
        crisisDetected: Boolean(entry.crisisDetected),
        environmentTag: entry.environmentalTag || 'Standard Space',
        aiSummary: entry.aiSummary ? entry.aiSummary.slice(0, 2000) : '',
        tags: Array.isArray(entry.themes) ? entry.themes : [],
        createdAt: entry.createdAt,
        updatedAt: new Date().toISOString(),
      };

      if (entry.isEncrypted && entry.encryptedData) {
        firestorePayload.encryptedData = entry.encryptedData;
        firestorePayload.iv = entry.iv || '';
        firestorePayload.salt = entry.salt || '';
      } else if (!entry.isEncrypted && entry.rawContent) {
        firestorePayload.rawContent = entry.rawContent;
      }

      // Strip any undefined keys before writing to Firestore
      const sanitizedPayload = stripUndefined(firestorePayload);

      await setDoc(doc(database, path, entry.id), sanitizedPayload);
      console.log(`[Firestore] Successfully written isolated journal ${entry.id} to ${path}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${path}/${entry.id}`, authInstance ?? undefined);
    }
  }

  // Always update local cache
  try {
    const key = `${LOCAL_STORAGE_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    let list: JournalEntry[] = raw ? JSON.parse(raw) : [...INITIAL_DEMO_ENTRIES];
    const index = list.findIndex((e) => e.id === entry.id);
    if (index >= 0) {
      list[index] = entry;
    } else {
      list = [entry, ...list];
    }
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to write to local storage cache:', e);
  }
}

/**
 * Remove journal entry from isolated path
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  const path = `users/${userId}/journals`;
  const database = getDb();
  const authInstance = getAuthClient();

  if (isFirebaseReady() && database) {
    try {
      await deleteDoc(doc(database, path, entryId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${path}/${entryId}`, authInstance ?? undefined);
    }
  }

  try {
    const key = `${LOCAL_STORAGE_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: JournalEntry[] = JSON.parse(raw);
      const updated = list.filter((e) => e.id !== entryId);
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {
    console.error('Failed to delete local cache:', e);
  }
}
