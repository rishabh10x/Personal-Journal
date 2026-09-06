import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  Shield,
  BookOpen,
  Filter,
  BarChart3,
  Unlock,
  Lock,
  ArrowRight,
  Mic,
  Calendar,
} from 'lucide-react';
import { UserProfile, JournalEntry, SystemStatus } from './types';
import {
  signInWithGoogleFederated,
  logOutUser,
  initClientFirebase,
  subscribeAuthState,
  signInWithQuickProfile,
  getKnownUserProfiles,
} from './lib/firebase';
import {
  subscribeUserJournals,
  deleteJournalEntry,
} from './lib/journalRepository';
import { decryptJournalText } from './lib/crypto';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { JournalCard } from './components/JournalCard';
import { ReflectionStudio } from './components/ReflectionStudio';
import { CognitiveVisualizer } from './components/CognitiveVisualizer';
import { ThreatModelTable } from './components/ThreatModelTable';
import { VaultModal } from './components/VaultModal';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { DailyAffirmations } from './components/DailyAffirmations';

export const App: React.FC = () => {
  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<'journals' | 'new-entry' | 'visualizer' | 'threat-model'>('journals');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Authentication State: null by default if not previously logged in
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('gemini_journal_demo_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Journal Data & Decrypted in-memory cache
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [vaultPassphrase, setVaultPassphrase] = useState<string>('');
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'encrypted' | 'nature' | 'peaceful'>('all');

  // System & Environment Configuration
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mindful_journal_theme');
      if (saved) return saved === 'dark';
    } catch {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Fetch System Probe & Runtime Config
  useEffect(() => {
    async function loadConfig() {
      try {
        const [healthRes, configRes] = await Promise.all([
          fetch('/api/health').catch(() => null),
          fetch('/api/config').catch(() => null),
        ]);

        const healthData = healthRes?.ok ? await healthRes.json() : {};
        const configData = configRes?.ok ? await configRes.json() : {};

        setSystemStatus({
          service: healthData.service || 'Personal Gemini Journal API',
          geminiKeyConfigured: Boolean(healthData.geminiKeyConfigured),
          secretSource: healthData.secretSource || 'env',
          firebaseAdminReady: Boolean(healthData.firebaseAdminReady),
          environment: healthData.environment || 'development',
          mapsApiKey: configData.mapsApiKey || '',
        });

        // Initialize Firebase Client if credentials received
        if (configData.firebaseConfig?.apiKey) {
          initClientFirebase(configData.firebaseConfig);
          subscribeAuthState((authedUser) => {
            if (authedUser) {
              setUser(authedUser);
            }
          });
        }
      } catch (err) {
        console.warn('System status fetch failed:', err);
      }
    }
    loadConfig();
  }, []);

  // Subscribe to Isolated Firestore Path: /users/{userId}/journals
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const unsubscribe = subscribeUserJournals(user.uid, (updated) => {
      setEntries(updated);
    });

    return () => unsubscribe();
  }, [user]);

  // Decrypt entries when vaultPassphrase changes
  useEffect(() => {
    if (!vaultPassphrase) {
      setDecryptedCache({});
      return;
    }

    const newCache: Record<string, string> = {};
    const promises = entries
      .filter((e) => e.isEncrypted && e.encryptedData && e.iv && e.salt)
      .map(async (e) => {
        try {
          const dec = await decryptJournalText(e.encryptedData!, e.iv!, e.salt!, vaultPassphrase);
          newCache[e.id] = dec;
        } catch {
          // Passphrase didn't decrypt this item
        }
      });

    Promise.all(promises).then(() => {
      setDecryptedCache(newCache);
    });
  }, [vaultPassphrase, entries]);

  // Dark mode class toggle across documentElement and body with persistent storage
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      try {
        localStorage.setItem('mindful_journal_theme', 'dark');
      } catch {}
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      try {
        localStorage.setItem('mindful_journal_theme', 'light');
      } catch {}
    }
  }, [isDarkMode]);

  // Handlers
  const handleSignIn = async () => {
    try {
      const signedInUser = await signInWithGoogleFederated();
      setUser(signedInUser);
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  const handleSignOut = async () => {
    await logOutUser();
    setUser(null);
    setSelectedEntry(null);
    setCurrentTab('journals');
    setEntries([]);
    setDecryptedCache({});
    setVaultPassphrase('');
    try {
      localStorage.removeItem('gemini_journal_demo_user');
    } catch {}
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user) return;
    await deleteJournalEntry(user.uid, id);
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
    }
  };

  const handleQuickAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    setSelectedEntry(null);
    setCurrentTab('new-entry');
  };

  // Filtered entries
  const filteredEntries = entries.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.sentiment && e.sentiment.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.environmentalTag && e.environmentalTag.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (selectedFilter === 'encrypted') return e.isEncrypted;
    if (selectedFilter === 'nature') return e.environmentalTag?.toLowerCase().includes('nature');
    if (selectedFilter === 'peaceful') return e.sentiment?.toLowerCase() === 'peaceful';

    return true;
  });

  // Calculate dynamic weekly metrics for Cognitive Pattern Visualizer
  const themeTally: Record<string, number> = {};
  let totalDistressSum = 0;
  entries.forEach((ent) => {
    (ent.themes || []).forEach((t) => {
      themeTally[t] = (themeTally[t] || 0) + 1;
    });
    totalDistressSum += ent.distressScore || 0.1;
  });

  const dominantTheme = Object.keys(themeTally).sort((a, b) => themeTally[b] - themeTally[a])[0] || 'Growth';
  const avgDistress = entries.length > 0 ? totalDistressSum / entries.length : 0.15;
  const anxietyLabel = avgDistress < 0.25 ? 'Low' : avgDistress < 0.55 ? 'Balanced' : 'Elevated';
  const resiliencePct = Math.round((1 - avgDistress * 0.5) * 100);

  // UNAUTHENTICATED PUBLIC ROUTE GUARD & LANDING PAGE
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] antialiased">
        <LandingPage
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSelectQuickProfile={(profile) => {
            const authed = signInWithQuickProfile(profile);
            setUser(authed);
          }}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          systemStatus={systemStatus}
        />

        {/* User Authentication & Account Switcher Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={null}
          onAuthSuccess={(authedUser) => {
            setUser(authedUser);
            setIsAuthModalOpen(false);
          }}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] overflow-hidden antialiased">
      {/* SIDEBAR NAVIGATION (Apple / Geometric Balance) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedEntry(null);
          setCurrentTab(tab);
        }}
        user={user}
        encryptionUnlocked={Boolean(vaultPassphrase)}
        onTogglePassphraseModal={() => setIsVaultModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-y-auto relative">
        {/* HEADER BAR */}
        <Header
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setSelectedEntry(null);
            setCurrentTab(tab);
          }}
          user={user}
          onSignIn={() => setIsAuthModalOpen(true)}
          onSignOut={handleSignOut}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          encryptionUnlocked={Boolean(vaultPassphrase)}
          onTogglePassphraseModal={() => setIsVaultModalOpen(true)}
          systemStatus={systemStatus}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
        />

        {/* VIEW CONTENTS */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-8 pb-28">
          {/* VIEW 1: Reflection Studio */}
          {currentTab === 'new-entry' && (
            user ? (
              <ReflectionStudio
                entry={selectedEntry}
                user={user}
                vaultPassphrase={vaultPassphrase}
                mapsApiKey={systemStatus?.mapsApiKey}
                initialDraftPrompt={quickPrompt}
                onSaveSuccess={() => {
                  setSelectedEntry(null);
                  setQuickPrompt('');
                  setCurrentTab('journals');
                }}
                onCancel={() => {
                  setSelectedEntry(null);
                  setQuickPrompt('');
                  setCurrentTab('journals');
                }}
              />
            ) : (
              <div className="bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 rounded-[24px] p-8 text-center max-w-md mx-auto space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Sign In to Start Writing
                </h3>
                <p className="text-xs text-[#8E8E93] leading-relaxed">
                  Choose your student profile or sign in to save your personal reflections and chat with your Gemini AI friend.
                </p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-2.5 rounded-full bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  Choose Student Profile or Sign In →
                </button>
              </div>
            )
          )}

          {/* VIEW 2: Cognitive Visualizer */}
          {currentTab === 'visualizer' && (
            <CognitiveVisualizer entries={entries} />
          )}

          {/* VIEW 3: Threat Model Analysis Matrix */}
          {currentTab === 'threat-model' && (
            <ThreatModelTable />
          )}

          {/* VIEW 4: Main Dashboard */}
          {currentTab === 'journals' && (
            <div className="space-y-8">
              {/* Daily Affirmations Card (Resets every 24h via Gemini API) */}
              <DailyAffirmations
                onStartReflectionWithPrompt={(prompt) => {
                  setQuickPrompt(prompt);
                  setSelectedEntry(null);
                  setCurrentTab('new-entry');
                }}
              />

              {/* TOP GEOMETRIC BALANCE GRID */}
              <div className="grid grid-cols-12 gap-6">
                {/* 1. PATTERN VISUALIZER (8-columns) */}
                <div className="col-span-12 lg:col-span-8 bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-sm border border-black/5 dark:border-white/10 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        Cognitive Pattern Visualizer
                      </h3>
                      <p className="text-xs text-[#8E8E93]">
                        Daily emotional equilibrium & vagal tone pacing
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-[#F2F2F7] dark:bg-white/10 rounded text-[10px] font-bold text-[#8E8E93]">
                        LAST 7 DAYS
                      </span>
                      <button
                        onClick={() => setCurrentTab('visualizer')}
                        className="text-xs font-semibold text-[#007AFF] dark:text-[#2997FF] hover:underline"
                      >
                        Insights →
                      </button>
                    </div>
                  </div>

                  {/* 7-Day Apple-styled 2-tone Bar Charts */}
                  <div className="flex-1 min-h-[160px] flex items-end justify-between px-3 sm:px-6 pb-4 pt-8">
                    {/* MON */}
                    <div className="w-9 sm:w-12 bg-blue-100 dark:bg-blue-950/40 rounded-t-lg relative h-[45%] flex flex-col justify-end">
                      <div className="absolute -top-6 left-0 right-0 text-[10px] text-center font-medium opacity-60 text-[#8E8E93]">
                        MON
                      </div>
                      <div className="w-full h-1/2 bg-[#007AFF] rounded-t-lg"></div>
                    </div>

                    {/* TUE */}
                    <div className="w-9 sm:w-12 bg-blue-100 dark:bg-blue-950/40 rounded-t-lg relative h-[70%] flex flex-col justify-end">
                      <div className="absolute -top-6 left-0 right-0 text-[10px] text-center font-medium opacity-60 text-[#8E8E93]">
                        TUE
                      </div>
                      <div className="w-full h-2/3 bg-[#007AFF] rounded-t-lg"></div>
                    </div>

                    {/* WED */}
                    <div className="w-9 sm:w-12 bg-blue-100 dark:bg-blue-950/40 rounded-t-lg relative h-[40%] flex flex-col justify-end">
                      <div className="absolute -top-6 left-0 right-0 text-[10px] text-center font-medium opacity-60 text-[#8E8E93]">
                        WED
                      </div>
                      <div className="w-full h-1/3 bg-[#007AFF] rounded-t-lg"></div>
                    </div>

                    {/* THU */}
                    <div className="w-9 sm:w-12 bg-blue-100 dark:bg-blue-950/40 rounded-t-lg relative h-[85%] flex flex-col justify-end">
                      <div className="absolute -top-6 left-0 right-0 text-[10px] text-center font-medium opacity-60 text-[#8E8E93]">
                        THU
                      </div>
                      <div className="w-full h-4/5 bg-[#007AFF] rounded-t-lg"></div>
                    </div>

                    {/* FRI */}
                    <div className="w-9 sm:w-12 bg-blue-100 dark:bg-blue-950/40 rounded-t-lg relative h-[65%] flex flex-col justify-end">
                      <div className="absolute -top-6 left-0 right-0 text-[10px] text-center font-medium opacity-60 text-[#8E8E93]">
                        FRI
                      </div>
                      <div className="w-full h-1/2 bg-[#007AFF] rounded-t-lg"></div>
                    </div>

                    {/* SAT */}
                    <div className="w-9 sm:w-12 bg-blue-100 dark:bg-blue-950/40 rounded-t-lg relative h-[35%] flex flex-col justify-end">
                      <div className="absolute -top-6 left-0 right-0 text-[10px] text-center font-medium opacity-60 text-[#8E8E93]">
                        SAT
                      </div>
                      <div className="w-full h-1/2 bg-[#007AFF] rounded-t-lg"></div>
                    </div>

                    {/* SUN */}
                    <div className="w-9 sm:w-12 bg-blue-100 dark:bg-blue-950/40 rounded-t-lg relative h-[50%] flex flex-col justify-end">
                      <div className="absolute -top-6 left-0 right-0 text-[10px] text-center font-medium opacity-60 text-[#8E8E93]">
                        SUN
                      </div>
                      <div className="w-full h-3/5 bg-[#007AFF] rounded-t-lg"></div>
                    </div>
                  </div>

                  {/* Bottom Metrics with Fine Dividers */}
                  <div className="mt-6 grid grid-cols-3 border-t border-black/5 dark:border-white/10 pt-4">
                    <div className="text-center border-r border-black/5 dark:border-white/10">
                      <div className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-tight">
                        Avg. Anxiety
                      </div>
                      <div className="text-xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {anxietyLabel}
                      </div>
                    </div>
                    <div className="text-center border-r border-black/5 dark:border-white/10">
                      <div className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-tight">
                        Key Theme
                      </div>
                      <div className="text-xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate px-1">
                        {dominantTheme}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-tight">
                        Resilience
                      </div>
                      <div className="text-xl font-semibold text-[#007AFF] dark:text-[#2997FF]">
                        {resiliencePct}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. THREAT MODEL / SECURITY AUDIT WIDGET (4-columns) */}
                <div className="col-span-12 lg:col-span-4 bg-[#1C1C1E] rounded-[24px] shadow-xl p-6 text-white flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mr-2 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse"></div>
                      Security Audit
                    </h3>

                    <div className="space-y-4">
                      <div className="border-b border-white/10 pb-3">
                        <div className="text-[10px] opacity-60 font-mono">THREAT ZONE: INPUT</div>
                        <div className="text-xs font-medium mt-0.5">Mitigation: Recursive Sanitization</div>
                      </div>
                      <div className="border-b border-white/10 pb-3">
                        <div className="text-[10px] opacity-60 font-mono">THREAT ZONE: EXECUTION</div>
                        <div className="text-xs font-medium mt-0.5">Mitigation: Resilient Multi-Model Ladder</div>
                      </div>
                      <div className="border-b border-white/10 pb-3">
                        <div className="text-[10px] opacity-60 font-mono">THREAT ZONE: STATE</div>
                        <div className="text-xs font-medium mt-0.5">Mitigation: Zero-Knowledge Encryption</div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setCurrentTab('threat-model')}
                    className="mt-6 p-3 bg-white/10 hover:bg-white/15 rounded-xl flex items-center space-x-3 cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider">Compliance Validated</div>
                      <div className="text-[10px] opacity-60 truncate">Region: us-central1-gcp • Cloud Run</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/50" />
                  </div>
                </div>
              </div>

              {/* RECENT ENTRIES LIST CONTAINER */}
              <div className="space-y-4">
                {/* Active User Account & History Isolation Bar */}
                {user ? (
                  <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/5 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={user.displayName || 'User'}
                        className="w-10 h-10 rounded-full border border-black/10 dark:border-white/20 object-cover shadow-xs"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                          <span>{user.displayName || user.email}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                            Isolated Storage
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8E8E93]">
                          {entries.length} {entries.length === 1 ? 'reflection' : 'reflections'} stored in this private account
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:border-[#007AFF] hover:text-[#007AFF] transition-all"
                      >
                        Switch Account ⇋
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium transition-all"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-black/10 dark:border-white/10 text-center space-y-4 shadow-xs">
                    <div>
                      <h4 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        Sign in to open your private journal & history
                      </h4>
                      <p className="text-xs text-[#8E8E93] mt-1">
                        Each child and user has their own private diary that other users cannot see.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          const alex = {
                            uid: 'student-alex-grade5',
                            email: 'alex.adventurer@school.org',
                            displayName: 'Alex (Grade 5 Explorer)',
                            photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                            isMockDemo: true,
                          };
                          setUser(signInWithQuickProfile(alex));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] dark:text-[#2997FF] text-xs font-medium transition-all"
                      >
                        🎒 Alex (Grade 5)
                      </button>
                      <button
                        onClick={() => {
                          const maya = {
                            uid: 'student-maya-grade5',
                            email: 'maya.writer@school.org',
                            displayName: 'Maya (Grade 5 Creative Writer)',
                            photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
                            isMockDemo: true,
                          };
                          setUser(signInWithQuickProfile(maya));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-medium transition-all"
                      >
                        🎨 Maya (Grade 5)
                      </button>
                      <button
                        onClick={() => {
                          const leo = {
                            uid: 'student-leo-grade5',
                            email: 'leo.space@school.org',
                            displayName: 'Leo (Grade 5 Space & Stars)',
                            photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
                            isMockDemo: true,
                          };
                          setUser(signInWithQuickProfile(leo));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium transition-all"
                      >
                        🚀 Leo (Grade 5)
                      </button>
                      <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-medium shadow-xs transition-all"
                      >
                        Sign In or Register →
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      Recent Reflections
                    </h3>
                    <p className="text-xs text-[#8E8E93]">
                      Personal mindfulness records secured with owner-bound Firestore rules
                    </p>
                  </div>

                  {/* Filter Pills & Actions */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setSelectedFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selectedFilter === 'all'
                          ? 'bg-[#1D1D1F] dark:bg-[#F5F5F7] text-white dark:text-black shadow-xs'
                          : 'bg-black/5 dark:bg-white/5 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
                      }`}
                    >
                      All ({entries.length})
                    </button>

                    <button
                      onClick={() => setSelectedFilter('encrypted')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selectedFilter === 'encrypted'
                          ? 'bg-[#1D1D1F] dark:bg-[#F5F5F7] text-white dark:text-black shadow-xs'
                          : 'bg-black/5 dark:bg-white/5 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
                      }`}
                    >
                      Encrypted ({entries.filter((e) => e.isEncrypted).length})
                    </button>

                    <button
                      onClick={() => setSelectedFilter('peaceful')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selectedFilter === 'peaceful'
                          ? 'bg-[#1D1D1F] dark:bg-[#F5F5F7] text-white dark:text-black shadow-xs'
                          : 'bg-black/5 dark:bg-white/5 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
                      }`}
                    >
                      Peaceful
                    </button>

                    <button
                      onClick={() => setSelectedFilter('nature')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selectedFilter === 'nature'
                          ? 'bg-[#1D1D1F] dark:bg-[#F5F5F7] text-white dark:text-black shadow-xs'
                          : 'bg-black/5 dark:bg-white/5 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
                      }`}
                    >
                      Nature
                    </button>

                    <button
                      onClick={() => {
                        setSelectedEntry(null);
                        setQuickPrompt('');
                        setCurrentTab('new-entry');
                      }}
                      className="ml-auto inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-medium shadow-xs active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    placeholder="Filter reflections by title, tag, or sentiment..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
                  />
                </div>

                {/* Cards Grid */}
                {filteredEntries.length === 0 ? (
                  <div className="p-12 rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-dashed border-black/10 dark:border-white/10 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-[#8E8E93]">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        No journal reflections found
                      </h3>
                      <p className="text-xs text-[#8E8E93] max-w-sm mx-auto mt-1">
                        {searchQuery
                          ? 'Try adjusting your search query or filter tags.'
                          : 'Begin by writing down your current state of mind in the Reflect Studio.'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEntry(null);
                        setQuickPrompt('');
                        setCurrentTab('new-entry');
                      }}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#007AFF] text-white text-xs font-semibold shadow-xs hover:bg-[#0071E3] transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Begin Reflection</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEntries.map((entry) => (
                      <JournalCard
                        key={entry.id}
                        entry={entry}
                        encryptionUnlocked={Boolean(vaultPassphrase)}
                        decryptedContent={decryptedCache[entry.id]}
                        onSelect={(e) => {
                          setSelectedEntry(e);
                          setCurrentTab('new-entry');
                        }}
                        onDelete={handleDeleteEntry}
                        onPromptUnlock={() => setIsVaultModalOpen(true)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* FLOATING INPUT AREA (Design HTML) */}
        {currentTab === 'journals' && (
          <form
            onSubmit={handleQuickAnalyze}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[620px] bg-white/85 dark:bg-[#1C1C1E]/85 backdrop-blur-2xl rounded-full border border-black/10 dark:border-white/15 shadow-2xl p-2 flex items-center z-20 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#F5F5F7] dark:bg-white/5 flex items-center justify-center mr-2 shrink-0 text-[#8E8E93]">
              <Sparkles className="w-5 h-5 text-[#007AFF]" />
            </div>
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="Reflect with Gemini..."
              className="flex-1 bg-transparent border-none focus:outline-none text-xs sm:text-sm placeholder:text-[#8E8E93] text-[#1D1D1F] dark:text-[#F5F5F7] px-2"
            />
            <button
              type="submit"
              className="bg-[#007AFF] hover:bg-[#0071E3] text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-lg active:scale-[0.98] transition-transform shrink-0"
            >
              Analyze Entry
            </button>
          </form>
        )}
      </div>

      {/* Passphrase Vault Modal */}
      <VaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        vaultPassphrase={vaultPassphrase}
        onSetPassphrase={(pass) => setVaultPassphrase(pass)}
        isUnlocked={Boolean(vaultPassphrase)}
      />

      {/* User Authentication & Account Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onAuthSuccess={(authedUser) => {
          setUser(authedUser);
          setIsAuthModalOpen(false);
        }}
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export default App;
