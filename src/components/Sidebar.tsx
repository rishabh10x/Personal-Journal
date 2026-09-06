import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  BarChart3,
  Shield,
  PlusCircle,
  Lock,
  Unlock,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentTab: 'journals' | 'new-entry' | 'visualizer' | 'threat-model';
  onSelectTab: (tab: 'journals' | 'new-entry' | 'visualizer' | 'threat-model') => void;
  user: UserProfile | null;
  encryptionUnlocked: boolean;
  onTogglePassphraseModal: () => void;
  onOpenAuthModal?: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  encryptionUnlocked,
  onTogglePassphraseModal,
  onOpenAuthModal,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'journals' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'new-entry' as const,
      label: 'Reflect Studio',
      icon: PlusCircle,
    },
    {
      id: 'visualizer' as const,
      label: 'Cognitive Insights',
      icon: BarChart3,
    },
    {
      id: 'threat-model' as const,
      label: 'Security Vault',
      icon: Shield,
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-6 space-y-8 select-none">
      {/* Top Header & Brand */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('journals')}>
            <div className="w-8 h-8 rounded-xl bg-[#007AFF] flex items-center justify-center shadow-[0_4px_12px_rgba(0,122,255,0.35)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">Reflect</span>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-black/5 dark:bg-white/10 text-[#007AFF] dark:text-[#2997FF] shadow-xs'
                    : 'text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Identity & Security Widget */}
      <div className="pt-6 border-t border-black/5 dark:border-white/10 space-y-3">
        {/* User Identity Box */}
        <div
          onClick={onOpenAuthModal}
          className="p-4 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-2xl text-white shadow-[0_10px_25px_-5px_rgba(0,122,255,0.3)] cursor-pointer hover:opacity-95 transition-opacity group"
          title="Click to Switch Account or Login"
        >
          <div className="flex items-center justify-between text-[11px] uppercase tracking-widest opacity-80 mb-1 font-semibold">
            <span>Identity</span>
            <span className="text-[10px] lowercase bg-white/20 px-2 py-0.5 rounded-full group-hover:bg-white/30 transition-colors">
              switch ⇋
            </span>
          </div>
          <div className="text-sm font-semibold truncate">
            {user?.displayName || 'Sign In to Journal'}
          </div>
          <div className="text-[11px] opacity-75 mb-3 truncate font-mono">
            {user ? (user.email || 'Authenticated User') : 'No Active User'}
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] bg-white/20 backdrop-blur-md w-max px-2.5 py-1 rounded-full">
            <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
            <span className="font-medium">{user ? 'Session Secure' : 'Click to Log In'}</span>
          </div>
        </div>

        {/* Quick Vault Toggle Trigger */}
        <button
          onClick={onTogglePassphraseModal}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
            encryptionUnlocked
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            {encryptionUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{encryptionUnlocked ? 'AES-256 Vault Open' : 'Zero-Knowledge Vault'}</span>
          </div>
          <span className="text-[10px] opacity-75 uppercase tracking-wider font-mono">
            {encryptionUnlocked ? 'Unlocked' : 'Locked'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-white/10 flex-col h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        >
          <div
            className="w-[280px] h-full bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border-r border-slate-200/50 dark:border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
