import React, { useState } from 'react';
import { HeartHandshake, PhoneCall, MessageSquare, ExternalLink, X, ShieldAlert, Sparkles } from 'lucide-react';
import { GroundingPacer } from './GroundingPacer';

interface CrisisBannerProps {
  distressScore?: number;
  onDismiss?: () => void;
}

export const CrisisBanner: React.FC<CrisisBannerProps> = ({ distressScore = 0.8, onDismiss }) => {
  const [showPacer, setShowPacer] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-rose-500/20 dark:border-rose-400/20 p-6 backdrop-blur-2xl shadow-[0_20px_40px_-15px_rgba(244,63,94,0.1)] transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Gentle Support Guardrail
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300">
                Emotional Distress {Math.round(distressScore * 100)}%
              </span>
            </div>
            <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              You don&apos;t have to hold heavy moments alone.
            </h3>
            <p className="text-xs text-[#86868B] leading-relaxed max-w-2xl">
              We noticed intense emotional weight in your recent thoughts. If you are experiencing overwhelming feelings,
              free, confidential support is available 24/7. Your privacy is paramount—this guardrail is local and no diagnostic data is stored.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white p-1 rounded-lg transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        <a
          href="tel:988"
          className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[#2C2C2E]/70 border border-black/5 dark:border-white/10 hover:border-rose-500/40 transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Call or Text 988
            </div>
            <div className="text-[11px] text-[#86868B]">Suicide & Crisis Lifeline (US/CA)</div>
          </div>
        </a>

        <a
          href="sms:741741?body=HOME"
          className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[#2C2C2E]/70 border border-black/5 dark:border-white/10 hover:border-amber-500/40 transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Text HOME to 741741
            </div>
            <div className="text-[11px] text-[#86868B]">Crisis Text Line (Free, 24/7)</div>
          </div>
        </a>

        <button
          onClick={() => setShowPacer(!showPacer)}
          className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-[#2C2C2E]/70 border border-black/5 dark:border-white/10 hover:border-[#0071E3]/40 transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {showPacer ? 'Hide Grounding' : '4-7-8 Breathing Pacer'}
            </div>
            <div className="text-[11px] text-[#86868B]">Tactile parasympathetic reset</div>
          </div>
        </button>
      </div>

      {/* Expandable Grounding Module */}
      {showPacer && (
        <div className="mt-5">
          <GroundingPacer onClose={() => setShowPacer(false)} />
        </div>
      )}
    </div>
  );
};
