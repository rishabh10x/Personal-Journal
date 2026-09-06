import React, { useState } from 'react';
import { Lock, Unlock, Key, Shield, X, AlertCircle } from 'lucide-react';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultPassphrase: string;
  onSetPassphrase: (passphrase: string) => void;
  isUnlocked: boolean;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  vaultPassphrase,
  onSetPassphrase,
  isUnlocked,
}) => {
  const [inputPass, setInputPass] = useState(vaultPassphrase);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPass.trim()) {
      setError('Please enter a vault passphrase.');
      return;
    }
    onSetPassphrase(inputPass.trim());
    setError(null);
    onClose();
  };

  const handleLock = () => {
    onSetPassphrase('');
    setInputPass('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 rounded-3xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#34C759]/15 text-[#34C759] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Zero-Knowledge Vault
              </h3>
              <p className="text-xs text-[#86868B]">Client-Side AES-256-GCM Decryption</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#86868B] leading-relaxed">
          Your journal text is encrypted locally using the Web Crypto API before syncing to Firestore.
          Enter your passphrase below to derive the 256-bit PBKDF2 key and unlock your thoughts in memory.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative">
            <Key className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              autoFocus
              value={inputPass}
              placeholder="Enter your personal passphrase..."
              onChange={(e) => {
                setInputPass(e.target.value);
                setError(null);
              }}
              className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#34C759]/30"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            {isUnlocked && (
              <button
                type="button"
                onClick={handleLock}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Lock Vault
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium shadow-sm active:scale-[0.98] transition-all"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{isUnlocked ? 'Update Passphrase' : 'Unlock Entries'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
