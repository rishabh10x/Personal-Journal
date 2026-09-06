import React, { useState, useEffect } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  signInWithGoogleFederated,
  signInWithEmail,
  signUpWithEmail,
  signInWithQuickProfile,
  getKnownUserProfiles,
  removeUserFromHistory,
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onAuthSuccess: (user: UserProfile) => void;
  onSignOut: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'switch' | 'email-signin' | 'email-signup' | 'new-student'>('switch');
  const [knownUsers, setKnownUsers] = useState<UserProfile[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const AVATAR_OPTIONS = [
    { label: 'Explorer', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
    { label: 'Writer', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80' },
    { label: 'Astronaut', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80' },
    { label: 'Scientist', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    { label: 'Artist', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  ];

  useEffect(() => {
    if (isOpen) {
      setKnownUsers(getKnownUserProfiles());
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const user = await signInWithGoogleFederated();
      setSuccessMessage(`Signed in as ${user.displayName || user.email}!`);
      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
      }, 500);
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Google sign-in was interrupted. You can also sign in with Email or Student Profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }
    try {
      setLoading(true);
      setErrorMessage('');
      const user = await signInWithEmail(email, password);
      setSuccessMessage(`Welcome back, ${user.displayName || user.email}!`);
      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
      }, 500);
    } catch (err: unknown) {
      console.error('Email sign in error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Sign-in failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter an email and a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password should be at least 6 characters long.');
      return;
    }
    try {
      setLoading(true);
      setErrorMessage('');
      const user = await signUpWithEmail(email, password, displayName.trim() || undefined);
      setSuccessMessage(`Account created! Welcome, ${user.displayName || user.email}!`);
      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
      }, 600);
    } catch (err: unknown) {
      console.error('Sign up error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Sign-up failed. That email might already be registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudentProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      setErrorMessage('Please enter your name or nickname.');
      return;
    }
    const cleanId = 'student-' + newStudentName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const newProfile: UserProfile = {
      uid: cleanId,
      email: `${newStudentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@mindfuljournal.school`,
      displayName: newStudentName.trim(),
      photoURL: selectedAvatar,
      isMockDemo: true,
    };
    const user = signInWithQuickProfile(newProfile);
    setSuccessMessage(`Student profile created for ${user.displayName}!`);
    setTimeout(() => {
      onAuthSuccess(user);
      onClose();
    }, 500);
  };

  const handleSelectKnownProfile = (profile: UserProfile) => {
    const user = signInWithQuickProfile(profile);
    setSuccessMessage(`Switched to ${user.displayName || user.email}!`);
    setTimeout(() => {
      onAuthSuccess(user);
      onClose();
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 rounded-[28px] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,122,255,0.3)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
                Account & History Access
              </h2>
              <p className="text-xs text-[#8E8E93]">
                Log in or switch accounts to access your private diary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Status Banner */}
        {currentUser && (
          <div className="mx-6 sm:mx-8 mt-4 p-3.5 bg-[#007AFF]/10 dark:bg-[#007AFF]/15 border border-[#007AFF]/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate">
              <img
                src={currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt="Active User"
                className="w-10 h-10 rounded-full border border-[#007AFF]/30 object-cover"
              />
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold text-[#007AFF] dark:text-[#2997FF] tracking-wider">
                  Active Logged-In User
                </div>
                <div className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                  {currentUser.displayName || currentUser.email}
                </div>
                <div className="text-[11px] text-[#8E8E93] truncate font-mono">
                  {currentUser.email || currentUser.uid}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onSignOut();
                setSuccessMessage('Successfully logged out.');
                setKnownUsers(getKnownUserProfiles());
              }}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center space-x-1 shrink-0 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 sm:px-8 pt-4 pb-2 flex gap-1.5 overflow-x-auto border-b border-black/5 dark:border-white/10">
          <button
            onClick={() => {
              setActiveTab('switch');
              setErrorMessage('');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'switch'
                ? 'bg-[#1D1D1F] dark:bg-[#F5F5F7] text-white dark:text-black shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Switch User / History</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('new-student');
              setErrorMessage('');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'new-student'
                ? 'bg-[#1D1D1F] dark:bg-[#F5F5F7] text-white dark:text-black shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Student Profile</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('email-signin');
              setErrorMessage('');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'email-signin'
                ? 'bg-[#1D1D1F] dark:bg-[#F5F5F7] text-white dark:text-black shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Login</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('email-signup');
              setErrorMessage('');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'email-signup'
                ? 'bg-[#1D1D1F] dark:bg-[#F5F5F7] text-white dark:text-black shadow-xs'
                : 'text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: SWITCH USER / PROFILES LIST */}
          {activeTab === 'switch' && (
            <div className="space-y-4">
              {/* Google Fast Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-black/[0.03] dark:hover:bg-white/10 text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs transition-all active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google Account</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-black/10 dark:border-white/10 w-full"></div>
                <span className="bg-white dark:bg-[#1C1C1E] px-3 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider absolute">
                  Or select saved user account
                </span>
              </div>

              {/* Profiles List */}
              <div className="space-y-2.5">
                {knownUsers.map((profile) => {
                  const isCurrent = currentUser?.uid === profile.uid;
                  return (
                    <div
                      key={profile.uid}
                      onClick={() => handleSelectKnownProfile(profile)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isCurrent
                          ? 'bg-[#007AFF]/10 border-[#007AFF]/30'
                          : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/10 hover:border-[#007AFF]/40 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <img
                          src={profile.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                          alt={profile.displayName || 'User'}
                          className="w-10 h-10 rounded-full border border-black/10 dark:border-white/20 object-cover shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#007AFF] transition-colors truncate">
                              {profile.displayName || 'Explorer'}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#8E8E93] truncate font-mono">
                            {profile.email || profile.uid}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUserFromHistory(profile.uid);
                            setKnownUsers(getKnownUserProfiles());
                          }}
                          className="p-1.5 text-[#8E8E93] hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Remove from saved history"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="p-1 text-[#8E8E93] group-hover:text-[#007AFF] group-hover:translate-x-0.5 transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('new-student')}
                  className="w-full py-2.5 rounded-xl border border-dashed border-[#007AFF]/40 text-[#007AFF] dark:text-[#2997FF] hover:bg-[#007AFF]/5 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add New Student or Family Account</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE NEW STUDENT PROFILE */}
          {activeTab === 'new-student' && (
            <form onSubmit={handleCreateStudentProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  Student Name or Nickname
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="e.g., Emily (Grade 5)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-2">
                  Choose an Avatar
                </label>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.label}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.url)}
                      className={`relative rounded-full p-1 transition-all ${
                        selectedAvatar === avatar.url
                          ? 'ring-3 ring-[#007AFF] scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.label}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-sm font-semibold shadow-md active:scale-[0.99] transition-all"
                >
                  Create & Start Journaling
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: EMAIL SIGN IN */}
          {activeTab === 'email-signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-sm font-semibold shadow-md active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : 'Sign In with Email'}</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('email-signup')}
                  className="text-xs text-[#007AFF] hover:underline"
                >
                  Need an account? Register here
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: EMAIL SIGN UP */}
          {activeTab === 'email-signup' && (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Smith"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  Choose a Password (minimum 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-sm font-semibold shadow-md active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('email-signin')}
                  className="text-xs text-[#007AFF] hover:underline"
                >
                  Already have an account? Sign in here
                </button>
              </div>
            </form>
          )}

          {/* Privacy & Isolation Note */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Private & Isolated Storage:</strong> Each user has their own private space in Cloud Firestore (<code>/users/&#123;userId&#125;/journals</code>). Your entries, secrets, and emotional metrics are never shared with other users on this device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
