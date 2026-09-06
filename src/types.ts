export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  isMockDemo?: boolean;
}

export interface GeolocationData {
  lat: number;
  lng: number;
  placename?: string;
  city?: string;
  environmentalTag?: string;
}

export interface ReflectionTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  distressScore?: number;
}

export interface GroundingExercise {
  type: 'box-breathing' | '4-7-8' | '5-4-3-2-1-sensory';
  title: string;
  instructions: string[];
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  // Zero-Knowledge payload
  encryptedData?: string;
  iv?: string;
  salt?: string;
  isEncrypted: boolean;
  // Decrypted in-memory representation
  rawContent?: string;
  // Cognitive & emotional attributes
  sentiment: string;
  distressScore: number;
  crisisDetected: boolean;
  themes: string[];
  growthMilestone?: string;
  environmentalTag: string;
  location?: GeolocationData;
  aiSummary?: string;
  reflections: ReflectionTurn[];
  groundingExercise?: GroundingExercise;
  createdAt: string;
  updatedAt: string;
}

export interface SystemStatus {
  service: string;
  geminiKeyConfigured: boolean;
  secretSource: 'env' | 'secret-manager' | 'cached' | 'none';
  firebaseAdminReady: boolean;
  environment: string;
  mapsApiKey: string;
}

export interface ThreatZoneEvaluation {
  zone: 'Input Surfaces' | 'Planning & Reasoning' | 'Tool Execution' | 'Memory & State' | 'Inter-System Communication';
  threatDescription: string;
  attackVector: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  technicalMitigation: string;
  implementationArtifact: string;
  verificationStatus: 'Enforced' | 'Hardened' | 'Active';
}

export interface DailyAffirmationData {
  id: string;
  dateKey: string;
  affirmation: string;
  theme: string;
  mindfulPrompt: string;
  author: string;
  modelUsed: string;
  generatedAt: number;
}

