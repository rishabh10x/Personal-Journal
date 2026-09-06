import React from 'react';
import {
  Lock,
  Unlock,
  Sun,
  Moon,
  LogOut,
  LogIn,
  Menu,
  Database,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import type { UserProfile, SystemStatus } from '../types';

interface HeaderProps {
  currentTab: 'journals' | 'new-entry' | 'visualizer' | 'threat-model';
  onSelectTab: (tab: 'journals' | 'new-entry' | 'visualizer' | 'threat-model') => void;
  user: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenAuthModal?: () => void;
  encryptionUnlocked: boolean;
  onTogglePassphraseModal: () => void;
  systemStatus: SystemStatus | null;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  user,
  onSignIn,
  onSignOut,
  onOpenAuthModal,
  encryptionUnlocked,
  onTogglePassphraseModal,
  systemStatus,
  isDarkMode,
  onToggleTheme,
  onOpenMobileMenu,
}) => {
  const getGreetingTitle = () => {
    if (currentTab === 'new-entry') return 'Reflect Studio';
    if (currentTab === 'visualizer') return 'Cognitive Pattern Insights';
    if (currentTab === 'threat-model') return 'Agentic Threat Model Audit';

    const hour = new Date().getHours();
    if (hour < 12) return 'Morning Perspective';
    if (hour < 17) return 'Afternoon Reflection';
    return 'Evening Perspective';
  };

  return (
    <header className="h-20 shrink-0 flex items-center justify-between px-6 sm:px-10 border-b border-slate-200/50 dark:border-white/10 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl sticky top-0 z-20 select-none transition-colors">
      {/* View Title & Dynamic Synchronization Subtitle */}
      <div className="flex items-center space-x-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-2 rounded-xl text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            {getGreetingTitle()}
          </h1>
          <p className="text-xs text-[#8E8E93] flex items-center gap-1.5 font-medium">
            <span>Synchronized with Google Cloud Secret Manager</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-[#007AFF] dark:text-[#2997FF]">
              <Cpu className="w-3 h-3" />
              gemini-3.6-flash
            </span>
          </p>
        </div>
      </div>

      {/* Right Controls: Security Badge, Theme, and Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* AES-256-GCM ACTIVE Badge Pill */}
        <button
          onClick={onTogglePassphraseModal}
          title={encryptionUnlocked ? 'Zero-Knowledge Vault Unlocked' : 'Click to unlock client-side ciphertext'}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            encryptionUnlocked
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-black/5 dark:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] border border-slate-200/50 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/15'
          }`}
        >
          {encryptionUnlocked ? (
            <Unlock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Lock className="w-3 h-3 text-[#1D1D1F] dark:text-[#F5F5F7]" />
          )}
          <span className="font-semibold tracking-tight">
            {encryptionUnlocked ? 'AES-256-GCM UNLOCKED' : 'AES-256-GCM ACTIVE'}
          </span>
        </button>

        {/* Dark/Light Theme Button */}
        <button
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 border border-slate-200/50 dark:border-white/10 flex items-center justify-center cursor-pointer text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/10 dark:hover:bg-white/15 transition-all active:scale-95"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* User Profile / Switch Account / Sign-In */}
        {user ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAuthModal || onSignIn}
              title="Click to switch accounts or manage profile"
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:border-[#007AFF]/40 transition-all text-left group"
            >
              <img
                src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full border border-black/10 dark:border-white/20 object-cover shadow-xs"
              />
              <div className="hidden sm:block max-w-[120px]">
                <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate group-hover:text-[#007AFF] transition-colors">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-[#8E8E93] leading-none truncate">
                  Switch Account
                </div>
              </div>
            </button>
            <button
              onClick={onSignOut}
              title="Sign Out / Log Out"
              className="p-2 rounded-full text-[#8E8E93] hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal || onSignIn}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Switch Profile</span>
          </button>
        )}
      </div>
    </header>
  );
};
