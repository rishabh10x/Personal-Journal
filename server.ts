import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getGeminiApiKey } from './server/secrets';
import { verifyAuthToken, initFirebaseAdmin, AuthenticatedRequest } from './server/firebaseAdmin';
import { generateJournalReflection, analyzeJournalEntry, transcribeAudio, getDailyAffirmation } from './server/geminiResilient';

dotenv.config();

// Attempt reading provisioned Firebase applet config
let appletFirebaseConfig: Record<string, string> | null = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    appletFirebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (appletFirebaseConfig?.projectId && !process.env.FIREBASE_PROJECT_ID) {
      process.env.FIREBASE_PROJECT_ID = appletFirebaseConfig.projectId;
    }
  }
} catch (e) {
  console.warn('[Server] Could not read firebase-applet-config.json:', e);
}

const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize Firebase Admin lazily
  initFirebaseAdmin();

  // 1. Health & Status Probe
  app.get('/api/health', async (_req, res) => {
    const { key, source } = await getGeminiApiKey();
    res.json({
      status: 'ok',
      service: 'Personal Gemini Journal API',
      timestamp: new Date().toISOString(),
      geminiKeyConfigured: Boolean(key && key.length > 5),
      secretSource: source,
      firebaseAdminReady: initFirebaseAdmin(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // 2. Public Runtime Configuration for Client
  app.get('/api/config', async (_req, res) => {
    const { key, source } = await getGeminiApiKey();
    res.json({
      mapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || '',
      firebaseConfig: {
        apiKey: appletFirebaseConfig?.apiKey || process.env.VITE_FIREBASE_API_KEY || '',
        authDomain: appletFirebaseConfig?.authDomain || process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: appletFirebaseConfig?.projectId || process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
        firestoreDatabaseId: appletFirebaseConfig?.firestoreDatabaseId || '',
        storageBucket: appletFirebaseConfig?.storageBucket || process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: appletFirebaseConfig?.messagingSenderId || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: appletFirebaseConfig?.appId || process.env.VITE_FIREBASE_APP_ID || '',
      },
      hasServerGeminiKey: Boolean(key && key.length > 5),
      secretSource: source,
    });
  });

  // 3. Multi-turn AI Reflection with Fallback Chain & Guardrails
  app.post('/api/journal/reflect', verifyAuthToken, async (req: AuthenticatedRequest, res) => {
    try {
      const body = req.body ?? {};
      const { history = [], message, geolocation } = body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Journal reflection message is required.' });
      }

      console.log(`[JournalAPI] Reflection request from user ${req.user?.uid} (${(Array.isArray(history) ? history : []).length} prior turns)`);
      const reflection = await generateJournalReflection(Array.isArray(history) ? history : [], message, geolocation);

      res.json({
        success: true,
        user: req.user?.uid,
        ...reflection,
      });
    } catch (error: unknown) {
      console.error('[JournalAPI] Reflection generation error:', (error as Error).message);
      res.status(500).json({
        error: 'Failed to generate cognitive reflection.',
        detail: (error as Error).message,
      });
    }
  });

  // 4. Cognitive Pattern Analysis for Journal Entries
  app.post('/api/journal/analyze', verifyAuthToken, async (req: AuthenticatedRequest, res) => {
    try {
      const body = req.body ?? {};
      const { title, content, environmentTag } = body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Entry content is required for cognitive analysis.' });
      }

      console.log(`[JournalAPI] Analyzing cognitive patterns for user ${req.user?.uid}`);
      const analysis = await analyzeJournalEntry(title || 'Untitled Reflection', content, environmentTag);

      res.json({
        success: true,
        user: req.user?.uid,
        ...analysis,
      });
    } catch (error: unknown) {
      console.error('[JournalAPI] Cognitive analysis error:', (error as Error).message);
      res.status(500).json({
        error: 'Failed to perform cognitive analysis.',
        detail: (error as Error).message,
      });
    }
  });

  // 5. Server-side Journal Verification & Secure Sync endpoint
  app.post('/api/journal/sync-audit', verifyAuthToken, (req: AuthenticatedRequest, res) => {
    const body = req.body ?? {};
    const { journalId, isEncrypted, ivPresent, saltPresent } = body;
    console.log(`[Audit] Journal write audit for ${req.user?.uid}: ID ${journalId}, Zero-Knowledge Encrypted: ${isEncrypted}`);
    
    res.json({
      auditPassed: true,
      verifiedUser: req.user?.uid,
      zeroKnowledgeCompliant: Boolean(isEncrypted && ivPresent && saltPresent),
      timestamp: new Date().toISOString(),
    });
  });

  // 6. Voice Audio Transcription via Gemini Speech Understanding
  app.post('/api/journal/transcribe', verifyAuthToken, async (req: AuthenticatedRequest, res) => {
    try {
      const body = req.body ?? {};
      const { audioBase64, mimeType = 'audio/webm' } = body;

      if (!audioBase64 || typeof audioBase64 !== 'string') {
        return res.status(400).json({ error: 'Audio recording payload (audioBase64) is required.' });
      }

      console.log(`[JournalAPI] Transcribing voice audio for user ${req.user?.uid} (${Math.round(audioBase64.length / 1024)} KB)`);
      const { text, modelUsed } = await transcribeAudio(audioBase64, mimeType);

      res.json({
        success: true,
        text,
        modelUsed,
      });
    } catch (error: unknown) {
      console.error('[JournalAPI] Audio transcription error:', (error as Error).message);
      res.status(500).json({
        error: 'Failed to transcribe audio recording.',
        detail: (error as Error).message,
      });
    }
  });

  // 7. Daily Mindful Affirmation (resets every 24 hours)
  app.get('/api/journal/daily-affirmation', async (req, res) => {
    try {
      const forceRefresh = req.query.force === 'true';
      const affirmation = await getDailyAffirmation(forceRefresh);

      res.json({
        success: true,
        ...affirmation,
      });
    } catch (error: unknown) {
      console.error('[JournalAPI] Daily affirmation generation error:', (error as Error).message);
      res.status(500).json({
        error: 'Failed to retrieve daily affirmation.',
        detail: (error as Error).message,
      });
    }
  });

  // Vite middleware or Static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Server] Personal Gemini Journal running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
