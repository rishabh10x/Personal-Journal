import React from 'react';
import {
  Shield,
  Lock,
  Sparkles,
  Server,
  Database,
  Key,
  Heart,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Users,
  Compass,
  Cpu,
  Layers,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile, SystemStatus } from '../types';

interface LandingPageProps {
  onOpenAuthModal: () => void;
  onSelectQuickProfile: (profile: Partial<UserProfile>) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  systemStatus: SystemStatus | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuthModal,
  onSelectQuickProfile,
  isDarkMode,
  onToggleTheme,
  systemStatus,
}) => {
  const quickProfiles = [
    {
      uid: 'student-alex-grade5',
      displayName: 'Alex (Grade 5)',
      roleTag: 'Student Explorer',
      email: 'alex.adventurer@school.org',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      avatarEmoji: '🎒',
      color: 'blue',
    },
    {
      uid: 'student-maya-grade5',
      displayName: 'Maya (Grade 5)',
      roleTag: 'Creative Writer',
      email: 'maya.writer@school.org',
      photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      avatarEmoji: '🎨',
      color: 'purple',
    },
    {
      uid: 'student-leo-grade5',
      displayName: 'Leo (Grade 5)',
      roleTag: 'Space Enthusiast',
      email: 'leo.space@school.org',
      photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
      avatarEmoji: '🚀',
      color: 'amber',
    },
    {
      uid: 'demo-user-apple-hig',
      displayName: 'Adrian S.',
      roleTag: 'Enterprise Architect',
      email: 'mindful.architect@icloud.apple.com',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      avatarEmoji: '💼',
      color: 'emerald',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors duration-300 flex flex-col antialiased selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
      {/* Top Floating Glassmorphism Navbar */}
      <header className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 backdrop-blur-xl bg-white/75 dark:bg-[#1C1C1E]/75 border-b border-black/5 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white shadow-md shadow-[#007AFF]/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                Personal Gemini Journal
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/5 dark:bg-white/10 text-[#8E8E93] dark:text-[#A1A1A6]">
                Enterprise Edition
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 flex items-center justify-center text-[#1D1D1F] dark:text-[#F5F5F7] transition-all cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Main Sign In CTA */}
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-full bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs sm:text-sm font-medium shadow-md shadow-[#007AFF]/25 active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Get Started / Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-16 space-y-20 sm:space-y-28">
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-4 sm:pt-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#007AFF]/10 dark:bg-[#007AFF]/20 text-[#007AFF] dark:text-[#2997FF] border border-[#007AFF]/25 text-xs font-semibold tracking-wide uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>Enterprise Security • Google Cloud Run & Firebase Auth</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] leading-[1.12]">
            Enterprise-Grade Mindful AI Journaling with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] via-[#5856D6] to-[#AF52DE]">
              Zero-Knowledge Security
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#8E8E93] dark:text-[#A1A1A6] max-w-2xl mx-auto leading-relaxed">
            A private cognitive reflection sanctuary designed with Apple HIG precision. Experience multi-turn empathetic AI reasoning powered by Gemini 2.5 Flash with absolute client-side AES-256-GCM encryption and owner-isolated Cloud Firestore vaults.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenAuthModal}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#007AFF] hover:bg-[#0071E3] text-white text-sm sm:text-base font-semibold shadow-lg shadow-[#007AFF]/30 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Get Started / Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#student-profiles"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/80 dark:bg-[#1C1C1E]/80 hover:bg-white dark:hover:bg-[#2C2C2E] border border-black/10 dark:border-white/10 text-xs sm:text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs transition-all flex items-center justify-center space-x-2"
            >
              <Users className="w-4 h-4 text-[#8E8E93]" />
              <span>Explore Student & Demo Profiles</span>
            </a>
          </div>

          {/* System Compliance Chips */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#8E8E93]">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Owner-Bound Firestore Rules</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>GCP Secret Manager Dynamic Resolution</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>4-Tier Model Resilience Ladder</span>
            </span>
          </div>
        </section>

        {/* HERO VISUAL MOCKUP CARD */}
        <section className="relative max-w-5xl mx-auto">
          <div className="rounded-[28px] sm:rounded-[36px] bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-white/10 pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center space-x-2">
                    <span>Active Encryption Vault</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      AES-256-GCM
                    </span>
                  </div>
                  <div className="text-xs text-[#8E8E93]">
                    PBKDF2 100,000 Iterations • Client-Side Zero-Knowledge Derivation
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono text-[#8E8E93]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Container: Google Cloud Run (us-central1)</span>
              </div>
            </div>

            {/* Split Preview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 space-y-2.5">
                <div className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                  1. Multi-Turn Reflection
                </div>
                <div className="text-sm font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  "Reflected on today's breakthrough in team communication..."
                </div>
                <div className="text-xs text-[#8E8E93] leading-relaxed">
                  Gemini analyzes cognitive themes, highlights growth markers, and detects crisis keywords automatically.
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 space-y-2.5">
                <div className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                  2. Tenant Isolation
                </div>
                <div className="text-xs font-mono text-[#007AFF] bg-[#007AFF]/10 dark:bg-[#007AFF]/20 p-2 rounded-xl break-all">
                  /users/{'{userId}'}/journals/{'{journalId}'}
                </div>
                <div className="text-xs text-[#8E8E93]">
                  Documents are locked behind <span className="font-mono text-[11px]">request.auth.uid == userId</span>. Cross-tenant leakage is mathematically impossible.
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 space-y-2.5">
                <div className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                  3. Model Resilience
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Ladder: gemini-3.6-flash</span>
                </div>
                <div className="text-xs text-[#8E8E93]">
                  Automatic fallback across 4 Gemini tiers with backoff against 429 rate limits, 503 overloads, and 500 server errors.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ENTERPRISE SECURITY SHOWCASE (4 PILLARS) */}
        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Engineered for Highest Security Standards
            </h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Every design choice adheres strictly to Google Cloud Enterprise Architecture and Apple's Human Interface Guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 shadow-xs space-y-4 hover:border-[#007AFF]/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Zero-Knowledge AES-256-GCM
              </h3>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                Reflections are encrypted in the browser using PBKDF2 (100,000 rounds) before transmission. Decryption keys never leave your device.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 shadow-xs space-y-4 hover:border-[#007AFF]/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Isolated Firestore Paths
              </h3>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                Stored under strictly partitioned subcollections. Firestore security rules enforce cryptographic token ownership on all read and write queries.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 shadow-xs space-y-4 hover:border-[#007AFF]/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                GCP Secret Manager
              </h3>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                Zero hardcoded API keys. The Cloud Run server pulls secrets at runtime using IAM Service Account identity and the official Secret Manager SDK.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 shadow-xs space-y-4 hover:border-[#007AFF]/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Cloud Run Resilience
              </h3>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                Deployable with Cloud Run autoscaling and multi-tier model fallback catching HTTP 429 quota exhaustion and 503 transient outages.
              </p>
            </div>
          </div>
        </section>

        {/* MULTI-USER & CLASSROOM QUICK LAUNCH SECTION */}
        <section id="student-profiles" className="space-y-8 scroll-mt-24">
          <div className="p-8 sm:p-12 rounded-[32px] bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 shadow-sm space-y-8">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#007AFF]">
                <Users className="w-3.5 h-3.5" />
                <span>Multi-Profile Architecture & Classroom Support</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                Designed for Students, Families & Professionals
              </h2>
              <p className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed">
                Select any profile below to launch an instant isolated session. Each profile maintains its own completely segregated journal history and encrypted records.
              </p>
            </div>

            {/* Profile Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickProfiles.map((p) => (
                <div
                  key={p.uid}
                  onClick={() => onSelectQuickProfile(p)}
                  className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/5 dark:border-white/10 hover:border-[#007AFF]/50 cursor-pointer transition-all space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <img
                      src={p.photoURL}
                      alt={p.displayName}
                      className="w-12 h-12 rounded-full object-cover border border-black/10 dark:border-white/20 shadow-xs"
                    />
                    <span className="text-2xl">{p.avatarEmoji}</span>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#007AFF] transition-colors flex items-center justify-between">
                      <span>{p.displayName}</span>
                      <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-xs text-[#8E8E93]">{p.roleTag}</div>
                  </div>

                  <div className="text-[11px] font-mono text-[#8E8E93] truncate pt-1 border-t border-black/5 dark:border-white/5">
                    {p.email}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={onOpenAuthModal}
                className="text-xs sm:text-sm font-semibold text-[#007AFF] hover:underline"
              >
                Or sign in with your own Google Account or Email →
              </button>
            </div>
          </div>
        </section>

        {/* FINAL CONVERSION CALL TO ACTION */}
        <section className="text-center max-w-2xl mx-auto space-y-6 pb-12">
          <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            Start Your Private Reflection Today
          </h2>
          <p className="text-sm text-[#8E8E93]">
            No credit card required. Free tier ready on Google Cloud Run with Gemini 2.5 Flash and Cloud Firestore.
          </p>
          <button
            onClick={onOpenAuthModal}
            className="px-8 py-3.5 rounded-full bg-[#007AFF] hover:bg-[#0071E3] text-white text-sm sm:text-base font-semibold shadow-lg shadow-[#007AFF]/30 active:scale-95 transition-all cursor-pointer inline-flex items-center space-x-2"
          >
            <span>Launch Mindful Journal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-black/5 dark:border-white/10 py-8 px-4 sm:px-8 text-center text-xs text-[#8E8E93] space-y-2">
        <div>Personal Gemini Journal • Deployed to Google Cloud Run with Firebase Authentication & Cloud Firestore</div>
        <div className="text-[10px] font-mono text-[#8E8E93]/80">
          Labels: dev-tutorial=cloud-run-ai-challenge • Region: us-central1 / asia-southeast1
        </div>
      </footer>
    </div>
  );
};
