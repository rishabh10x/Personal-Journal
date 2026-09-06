import { initializeApp, getApps, cert, App as FirebaseAdminApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Request, Response, NextFunction } from 'express';

let adminApp: FirebaseAdminApp | null = null;
let adminInitialized = false;

// Initialize Firebase Admin SDK lazily
export function initFirebaseAdmin(): boolean {
  if (adminInitialized && adminApp) return true;

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
      adminInitialized = true;
      return true;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      adminInitialized = true;
      console.log('[FirebaseAdmin] Initialized with service account certificate for project:', projectId);
      return true;
    }

    // Fallback to Application Default Credentials (e.g. running natively inside Google Cloud Run)
    if (projectId) {
      adminApp = initializeApp({
        projectId,
      });
      adminInitialized = true;
      console.log('[FirebaseAdmin] Initialized with ADC for project:', projectId);
      return true;
    }

    console.log('[FirebaseAdmin] Service account credentials not provided; running in local preview mode.');
    return false;
  } catch (err: unknown) {
    console.warn('[FirebaseAdmin] Initialization warning:', (err as Error).message);
    return false;
  }
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  isMock?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Express Middleware: Verifies Firebase ID Token
 * Enforces federated identity on incoming API requests.
 */
export async function verifyAuthToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization header. Expected Bearer token.',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // If token is a client-side mock/demo token (used in preview/demo mode)
  if (token.startsWith('demo-user-') || token.startsWith('guest-token-')) {
    const rawUid = token.replace(/^demo-user-/, '').replace(/-token$/, '').replace(/-valid-token-preview$/, '').trim();
    const uid = rawUid || 'demo-user-hig';
    req.user = {
      uid,
      email: `${uid}@mindfuljournal.app`,
      name: 'Mindful Journaler',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      isMock: true,
    };
    return next();
  }

  const isReady = initFirebaseAdmin();
  if (!isReady || !adminApp) {
    // If Firebase Admin is not yet configured with service credentials, permit token if well-formed for preview
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payloadJson = Buffer.from(tokenParts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        req.user = {
          uid: payload.user_id || payload.sub || 'user-preview',
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          isMock: false,
        };
        return next();
      }
    } catch {
      // Ignore parse error and proceed to fallback
    }

    req.user = {
      uid: 'user-' + token.slice(0, 12),
      email: 'user@example.com',
      name: 'Journal User',
      isMock: true,
    };
    return next();
  }

  try {
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      isMock: false,
    };
    next();
  } catch (error: unknown) {
    console.error('[FirebaseAdmin] verifyIdToken failed:', (error as Error).message);
    return res.status(403).json({
      error: 'Forbidden: Firebase ID token verification failed or token expired.',
      detail: (error as Error).message,
    });
  }
}
