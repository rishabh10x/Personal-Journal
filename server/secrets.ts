import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let cachedApiKey: string | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes cache

/**
 * Dynamically retrieves the Gemini API Key.
 * Priority:
 * 1. Runtime environment variable GEMINI_API_KEY (injected by Cloud Run or local .env)
 * 2. GCP Secret Manager (via @google-cloud/secret-manager if GCP_PROJECT_ID or GEMINI_SECRET_NAME is set)
 * 3. In-memory cache
 */
export async function getGeminiApiKey(): Promise<{ key: string; source: 'env' | 'secret-manager' | 'cached' | 'none' }> {
  // Check in-memory cache first if valid
  if (cachedApiKey && Date.now() - lastFetchTime < CACHE_TTL_MS) {
    return { key: cachedApiKey, source: 'cached' };
  }

  // Check direct environment variable
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim() !== '' && envKey !== 'MY_GEMINI_API_KEY') {
    cachedApiKey = envKey.trim();
    lastFetchTime = Date.now();
    return { key: cachedApiKey, source: 'env' };
  }

  // Attempt Secret Manager dynamic fetch
  const effectiveProjectId = process.env.GCP_PROJECT_ID || 
    process.env.GOOGLE_CLOUD_PROJECT || 
    process.env.FIREBASE_PROJECT_ID || 
    process.env.GCLOUD_PROJECT;

  const secretName = process.env.GEMINI_SECRET_NAME || 
    (effectiveProjectId ? `projects/${effectiveProjectId}/secrets/gemini-api-key/versions/latest` : null);

  if (secretName) {
    try {
      const client = new SecretManagerServiceClient();
      const [version] = await client.accessSecretVersion({
        name: secretName,
      });

      const payload = version.payload?.data?.toString();
      if (payload && payload.trim() && payload.trim() !== 'MY_GEMINI_API_KEY') {
        cachedApiKey = payload.trim();
        lastFetchTime = Date.now();
        console.log(`[SecretManager] Successfully resolved GEMINI_API_KEY from ${secretName}`);
        return { key: cachedApiKey, source: 'secret-manager' };
      }
    } catch (err: unknown) {
      console.warn(`[SecretManager] Failed to access secret "${secretName}":`, (err as Error).message);
    }
  }

  // If still empty, return fallback env if any
  if (envKey) {
    return { key: envKey, source: 'env' };
  }

  return { key: '', source: 'none' };
}
