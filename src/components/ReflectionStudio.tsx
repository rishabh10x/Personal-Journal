import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Lock,
  Unlock,
  Send,
  Save,
  Compass,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Brain,
  Wind,
  Shield,
  Loader2,
  ArrowLeft,
  Key,
  Mic,
  Square,
  X,
} from 'lucide-react';
import { JournalEntry, ReflectionTurn, GeolocationData, UserProfile } from '../types';
import { encryptJournalText, decryptJournalText } from '../lib/crypto';
import { saveJournalEntry } from '../lib/journalRepository';
import { getAuthIdToken } from '../lib/firebase';
import { SpatialLocationPicker } from './SpatialLocationPicker';
import { CrisisBanner } from './CrisisBanner';
import { GroundingPacer } from './GroundingPacer';

interface ReflectionStudioProps {
  entry?: JournalEntry | null;
  user: UserProfile;
  vaultPassphrase: string;
  onSaveSuccess: (savedEntry: JournalEntry) => void;
  onCancel: () => void;
  mapsApiKey?: string;
  initialDraftPrompt?: string;
}

export const ReflectionStudio: React.FC<ReflectionStudioProps> = ({
  entry,
  user,
  vaultPassphrase,
  onSaveSuccess,
  onCancel,
  mapsApiKey,
  initialDraftPrompt,
}) => {
  // Form State
  const [title, setTitle] = useState(entry?.title || (initialDraftPrompt ? 'Quick Perspective' : ''));
  const [content, setContent] = useState(entry?.rawContent || initialDraftPrompt || '');
  const [isEncrypted, setIsEncrypted] = useState(entry ? entry.isEncrypted : true);
  const [passphrase, setPassphrase] = useState(vaultPassphrase || '');
  const [environmentalTag, setEnvironmentalTag] = useState(entry?.environmentalTag || 'Nature Walk');
  const [location, setLocation] = useState<GeolocationData>(
    entry?.location || {
      lat: 37.7749,
      lng: -122.4194,
      placename: 'San Francisco, CA',
      environmentalTag: 'Nature Walk',
    }
  );

  // AI Conversational Reflection State
  const [reflections, setReflections] = useState<ReflectionTurn[]>(entry?.reflections || []);
  const [chatInput, setChatInput] = useState('');
  const [isReflecting, setIsReflecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Guardrail & Cognitive State
  const [distressScore, setDistressScore] = useState(entry?.distressScore || 0.05);
  const [crisisDetected, setCrisisDetected] = useState(entry?.crisisDetected || false);
  const [showBreathingPacer, setShowBreathingPacer] = useState(false);
  const [sentiment, setSentiment] = useState(entry?.sentiment || 'Reflective');
  const [themes, setThemes] = useState<string[]>(entry?.themes || ['Mindfulness']);
  const [growthMilestone, setGrowthMilestone] = useState(entry?.growthMilestone || '');
  const [aiSummary, setAiSummary] = useState(entry?.aiSummary || '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Voice Recording & MediaRecorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup active audio tracks and intervals on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatusMessage('Microphone recording is not supported in this browser environment.');
        return;
      }

      setStatusMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        // Release microphone stream
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }

        if (audioBlob.size === 0) {
          return;
        }

        // Send to background transcription service
        setIsTranscribing(true);
        setStatusMessage('Transcribing speech using Gemini AI...');

        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Result = reader.result as string;
              const audioBase64 = base64Result.includes(',') ? base64Result.split(',')[1] : base64Result;
              const idToken = await getAuthIdToken();

              const res = await fetch('/api/journal/transcribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                  audioBase64,
                  mimeType: audioBlob.type || 'audio/webm',
                }),
              });

              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || errData.error || `Server HTTP ${res.status}`);
              }

              const data = await res.json();
              if (data.text && data.text.trim()) {
                const transcribedText = data.text.trim();
                setContent((prev) => (prev && prev.trim() ? `${prev.trim()}\n\n${transcribedText}` : transcribedText));
                setStatusMessage(`Voice transcribed successfully! (Powered by ${data.modelUsed || 'Gemini'})`);
              } else {
                setStatusMessage('Recording captured, but no clear speech was detected.');
              }
            } catch (err: unknown) {
              console.error('Transcription service error:', err);
              setStatusMessage(`Transcription failed: ${(err as Error).message}`);
            } finally {
              setIsTranscribing(false);
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (err: unknown) {
          console.error('Blob reading error:', err);
          setStatusMessage(`Could not process audio: ${(err as Error).message}`);
          setIsTranscribing(false);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error('Failed to access microphone:', err);
      setStatusMessage(`Microphone access error: ${(err as Error).message}. Please enable permissions.`);
    }
  };

  const stopVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setStatusMessage('Voice recording cancelled.');
  };

  // If entry was encrypted and vaultPassphrase provided, auto-decrypt on mount
  useEffect(() => {
    if (entry && entry.isEncrypted && entry.encryptedData && entry.iv && entry.salt && vaultPassphrase) {
      decryptJournalText(entry.encryptedData, entry.iv, entry.salt, vaultPassphrase)
        .then((decrypted) => {
          setContent(decrypted);
        })
        .catch((err) => {
          console.warn('Auto-decrypt failed with current passphrase:', err.message);
        });
    }
  }, [entry, vaultPassphrase]);

  // Multi-turn Conversational Reflection with Resilient Gemini API
  const handleSendReflection = async () => {
    const userMsg = chatInput.trim() || content.trim();
    if (!userMsg) return;

    setIsReflecting(true);
    setStatusMessage(null);

    // Append user message to state
    const newTurn: ReflectionTurn = {
      id: `turn-${Date.now()}`,
      role: 'user',
      text: userMsg,
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [...reflections, newTurn];
    setReflections(updatedHistory);
    setChatInput('');

    try {
      const idToken = await getAuthIdToken();
      const response = await fetch('/api/journal/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          history: updatedHistory.map((h) => ({ role: h.role, text: h.text })),
          message: userMsg,
          geolocation: {
            latitude: location.lat,
            longitude: location.lng,
            placename: location.placename,
            environmentTag: environmentalTag,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server reflection failed with HTTP ${response.status}`);
      }

      const data = await response.json();

      // Append model response
      const modelTurn: ReflectionTurn = {
        id: `turn-ai-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed,
        distressScore: data.distressScore,
      };

      setReflections([...updatedHistory, modelTurn]);

      if (data.sentiment) setSentiment(data.sentiment);
      if (typeof data.distressScore === 'number') setDistressScore(data.distressScore);
      if (data.crisisDetected) {
        setCrisisDetected(true);
        setShowBreathingPacer(true);
      }
      if (data.reply) {
        setAiSummary(data.reply.slice(0, 180) + '...');
      }
    } catch (err: unknown) {
      console.error('Reflection request error:', err);
      setStatusMessage('Reflection connection retry failed. Please check Gemini API status.');
    } finally {
      setIsReflecting(false);
    }
  };

  // Perform Deep Cognitive Analysis
  const handleRunAnalysis = async () => {
    if (!content.trim()) {
      setStatusMessage('Please write your thoughts before running cognitive analysis.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const idToken = await getAuthIdToken();
      const response = await fetch('/api/journal/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: title || 'Journal Reflection',
          content,
          environmentTag: environmentalTag,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sentiment) setSentiment(data.sentiment);
        if (Array.isArray(data.themes)) setThemes(data.themes);
        if (data.growthMilestone) setGrowthMilestone(data.growthMilestone);
        if (typeof data.distressScore === 'number') setDistressScore(data.distressScore);
        if (data.crisisDetected) setCrisisDetected(true);
        setStatusMessage(`Analyzed via ${data.modelUsed} • Extracted ${data.themes?.length || 0} themes.`);
      }
    } catch (err: unknown) {
      console.warn('Cognitive analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save Journal Entry to Isolated Firestore Path with Zero-Knowledge Encryption
  const handleSave = async () => {
    if (!title.trim()) {
      setStatusMessage('Please provide a title for this journal reflection.');
      return;
    }
    if (!content.trim()) {
      setStatusMessage('Journal content cannot be empty.');
      return;
    }
    if (isEncrypted && !passphrase) {
      setStatusMessage('Zero-Knowledge encryption requires a personal passphrase.');
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const entryId = entry?.id || `journal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      let encryptedPayload = { ciphertext: '', iv: '', salt: '' };

      if (isEncrypted) {
        // Native AES-256-GCM + PBKDF2 encryption in browser
        encryptedPayload = await encryptJournalText(content, passphrase);
      }

      const journalPayload: JournalEntry = {
        id: entryId,
        userId: user.uid,
        title: title.trim(),
        isEncrypted,
        encryptedData: isEncrypted ? encryptedPayload.ciphertext : undefined,
        iv: isEncrypted ? encryptedPayload.iv : undefined,
        salt: isEncrypted ? encryptedPayload.salt : undefined,
        rawContent: isEncrypted ? undefined : content,
        sentiment,
        distressScore,
        crisisDetected,
        themes,
        growthMilestone,
        environmentalTag,
        location,
        aiSummary: aiSummary || (reflections.length > 0 ? reflections[reflections.length - 1].text.slice(0, 180) : undefined),
        reflections,
        createdAt: entry?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      // 1. Write to isolated Cloud Firestore path /users/{userId}/journals/{journalId}
      await saveJournalEntry(user.uid, journalPayload);

      // 2. Perform server sync audit
      try {
        const idToken = await getAuthIdToken();
        await fetch('/api/journal/sync-audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            journalId: entryId,
            isEncrypted,
            ivPresent: Boolean(encryptedPayload.iv),
            saltPresent: Boolean(encryptedPayload.salt),
          }),
        });
      } catch {
        // Audit is non-blocking
      }

      // Memory copy retains raw text for active session
      journalPayload.rawContent = content;
      onSaveSuccess(journalPayload);
    } catch (err: unknown) {
      console.error('Save failed:', err);
      setStatusMessage(`Save failed: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Journals</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || !content}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/10 dark:hover:bg-white/15 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#2997FF]" />}
            <span>Cognitive Analysis</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Securing...' : 'Save Reflection'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Crisis & Distress Guardrail */}
      {(crisisDetected || distressScore >= 0.7) && (
        <CrisisBanner distressScore={distressScore} onDismiss={() => setCrisisDetected(false)} />
      )}

      {/* Notification / Status message */}
      {statusMessage && (
        <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-[#86868B] hover:text-black dark:hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Journal Composition Surface */}
      <div className="p-8 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] space-y-6">
        {/* Title Input */}
        <div>
          <input
            type="text"
            value={title}
            placeholder="Title of this reflection..."
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] bg-transparent border-b border-black/5 dark:border-white/10 pb-3 focus:outline-none focus:border-[#0071E3] transition-colors"
          />
        </div>

        {/* Narrative & Voice Recording Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-2">
            <span>Mindful Journal Narrative</span>
            {content && (
              <span className="text-[10px] font-normal lowercase opacity-70">
                ({content.split(/\s+/).filter(Boolean).length} words)
              </span>
            )}
          </div>

          {/* Voice Recording Actions (MediaRecorder API + Gemini Audio Service) */}
          <div className="flex items-center gap-2">
            {isRecording ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="font-mono font-semibold">
                  {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:
                  {(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-[11px] hidden sm:inline text-rose-500 font-medium">Recording audio...</span>
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="ml-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-all active:scale-95 shadow-xs cursor-pointer"
                  title="Stop recording and transcribe to journal"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Transcribe</span>
                </button>
                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-all cursor-pointer"
                  title="Cancel recording"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : isTranscribing ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#0071E3]/10 border border-[#0071E3]/20 text-[#0071E3] dark:text-[#2997FF] text-xs font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Transcribing voice speech via Gemini...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Dictate reflection using browser microphone and transcribe with Gemini"
              >
                <Mic className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#2997FF]" />
                <span>Voice Record</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Textarea */}
        <div>
          <textarea
            rows={8}
            value={content}
            placeholder="Pour your mindful thoughts freely. Validated with zero judgment..."
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-base sm:text-lg leading-relaxed text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] bg-transparent resize-y focus:outline-none"
          />
        </div>

        {/* Zero-Knowledge Encryption Control Surface */}
        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Zero-Knowledge Client Encryption (AES-256-GCM)
                </h4>
                <p className="text-[11px] text-[#86868B]">
                  Encrypted locally before sending to Cloud Firestore. Key is never transmitted.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEncrypted(!isEncrypted)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                isEncrypted
                  ? 'bg-[#34C759]/10 border-[#34C759]/30 text-[#34C759]'
                  : 'bg-black/5 dark:bg-white/10 border-transparent text-[#86868B]'
              }`}
            >
              {isEncrypted ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isEncrypted ? 'Encrypted' : 'Plain Text'}</span>
            </button>
          </div>

          {isEncrypted && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Key className="w-3.5 h-3.5 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passphrase}
                  placeholder="Vault Passphrase (used to derive PBKDF2 256-bit key)"
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#34C759]/30"
                />
              </div>
              <span className="text-[10px] text-[#86868B] font-mono shrink-0">
                100,000 PBKDF2 iterations
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Spatial & Geolocation Context Module */}
      <SpatialLocationPicker
        currentLocation={location}
        onChange={setLocation}
        selectedEnvironment={environmentalTag}
        onEnvironmentChange={setEnvironmentalTag}
        mapsApiKey={mapsApiKey}
      />

      {/* Conversational AI Reflection Studio (Gemini Multi-Turn) */}
      <div className="p-8 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0071E3] to-[#5856D6] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Mindful AI Reflection Companion
              </h3>
              <p className="text-xs text-[#86868B]">
                Multi-turn cognitive dialogue with Gemini fallback chain
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-[#86868B]">
              Sentiment: {sentiment}
            </span>
            <button
              onClick={() => setShowBreathingPacer(!showBreathingPacer)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#34C759]/10 text-[#34C759] text-xs font-medium hover:bg-[#34C759]/20 transition-all"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>{showBreathingPacer ? 'Hide Breath' : '4-7-8 Breath'}</span>
            </button>
          </div>
        </div>

        {/* Breathing Pacer inline if requested */}
        {showBreathingPacer && (
          <div className="pt-2">
            <GroundingPacer onClose={() => setShowBreathingPacer(false)} />
          </div>
        )}

        {/* Multi-turn Chat Stream */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {reflections.length === 0 ? (
            <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10 text-center space-y-2">
              <Sparkles className="w-5 h-5 text-[#0071E3] dark:text-[#2997FF] mx-auto" />
              <p className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                No reflection turns initiated yet.
              </p>
              <p className="text-xs text-[#86868B] max-w-md mx-auto">
                Write your journal thoughts above, then ask Gemini for an empathetic reflection,
                or type a specific question below.
              </p>
            </div>
          ) : (
            reflections.map((turn) => {
              const isUser = turn.role === 'user';
              return (
                <div
                  key={turn.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#0071E3] text-white rounded-br-md shadow-sm'
                        : 'bg-black/5 dark:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{turn.text}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-2 text-[10px] text-[#86868B] font-mono">
                    <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {turn.modelUsed && <span>• {turn.modelUsed}</span>}
                  </div>
                </div>
              );
            })
          )}

          {isReflecting && (
            <div className="flex items-center gap-2 p-4 rounded-3xl bg-black/5 dark:bg-white/10 text-xs text-[#86868B] w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0071E3] dark:text-[#2997FF]" />
              <span>Contemplating and attuning to your emotional state...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
          <input
            type="text"
            value={chatInput}
            placeholder={
              reflections.length === 0
                ? 'Ask for a reflection on your entry, or explore a thought...'
                : 'Follow up on this reflection...'
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendReflection();
              }
            }}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
          />

          <button
            onClick={handleSendReflection}
            disabled={isReflecting || (!chatInput.trim() && !content.trim())}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reflect</span>
          </button>
        </div>
      </div>
    </div>
  );
};
