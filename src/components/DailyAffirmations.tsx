import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Quote, ArrowRight, Copy, Check, Clock, Sun } from 'lucide-react';
import { DailyAffirmationData } from '../types';

interface DailyAffirmationsProps {
  onStartReflectionWithPrompt?: (prompt: string) => void;
}

const STORAGE_KEY = 'gemini_journal_daily_affirmation';

export const DailyAffirmations: React.FC<DailyAffirmationsProps> = ({
  onStartReflectionWithPrompt,
}) => {
  const [affirmation, setAffirmation] = useState<DailyAffirmationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  // Calculate time until midnight local time (24-hour reset)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeftStr(`${hours}h ${mins}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAffirmation = async (force: boolean = false) => {
    if (force) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Check client-side cache first if not forced
      if (!force) {
        const cachedStr = localStorage.getItem(STORAGE_KEY);
        if (cachedStr) {
          try {
            const parsed: DailyAffirmationData = JSON.parse(cachedStr);
            const todayKey = new Date().toISOString().slice(0, 10);
            const now = Date.now();
            // Cache valid if generated within last 24h and matches today's date key
            if (parsed.dateKey === todayKey && now - (parsed.generatedAt || 0) < 24 * 60 * 60 * 1000) {
              setAffirmation(parsed);
              setIsLoading(false);
              return;
            }
          } catch {
            // Bad cache, re-fetch
          }
        }
      }

      const res = await fetch(`/api/journal/daily-affirmation${force ? '?force=true' : ''}`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data: DailyAffirmationData = await res.json();
      setAffirmation(data);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {}
    } catch (err) {
      console.warn('[Affirmation] Failed to fetch affirmation from Gemini API:', err);
      // Fallback default
      if (!affirmation) {
        const fallback: DailyAffirmationData = {
          id: 'affirmation-fallback',
          dateKey: new Date().toISOString().slice(0, 10),
          affirmation: 'Today, I honor my pace and meet each moment with presence, kindness, and calm confidence.',
          theme: 'Inner Harmony',
          mindfulPrompt: 'What small kindness can you offer yourself today as you navigate your day?',
          author: 'Mindful Reflection',
          modelUsed: 'gemini-fallback',
          generatedAt: Date.now(),
        };
        setAffirmation(fallback);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAffirmation(false);
  }, []);

  const handleCopy = () => {
    if (!affirmation) return;
    const textToCopy = `"${affirmation.affirmation}" — ${affirmation.author}\nToday's Reflection: ${affirmation.mindfulPrompt}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReflect = () => {
    if (!affirmation || !onStartReflectionWithPrompt) return;
    const prompt = `Daily Affirmation: "${affirmation.affirmation}" (${affirmation.theme})\n\nMindful Inquiry: ${affirmation.mindfulPrompt}`;
    onStartReflectionWithPrompt(prompt);
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-white/90 via-white/80 to-[#F2F7FF]/90 dark:from-[#1C1C1E]/90 dark:via-[#1C1C1E]/80 dark:to-[#162032]/90 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-sm p-6 sm:p-8 transition-all">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-amber-400/10 via-rose-400/10 to-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Top bar: Header, Theme Tag, Countdown, Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/10 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-white shadow-xs">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Daily Affirmation
                </h3>
                {affirmation && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#007AFF]/20 dark:text-[#2997FF]">
                    {affirmation.theme}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8E8E93]">
                AI-curated mindful contemplation • Powered by Gemini API
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 24h Reset Timer Badge */}
            <div
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[11px] font-mono text-[#8E8E93] dark:text-[#A1A1A6]"
              title="Affirmation automatically resets every 24 hours"
            >
              <Clock className="w-3 h-3 text-[#007AFF]" />
              <span>Resets in {timeLeftStr || '24h'}</span>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              disabled={isLoading || !affirmation}
              title="Copy affirmation"
              className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchAffirmation(true)}
              disabled={isLoading || isRefreshing}
              title="Generate fresh affirmation"
              className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#007AFF]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-6 space-y-3 animate-pulse">
            <div className="h-6 bg-black/5 dark:bg-white/10 rounded-xl w-4/5" />
            <div className="h-4 bg-black/5 dark:bg-white/10 rounded-xl w-2/3" />
          </div>
        ) : affirmation ? (
          <div className="space-y-4">
            {/* Affirmation Quote */}
            <div className="relative pl-6 sm:pl-8 border-l-2 border-[#007AFF]/40">
              <Quote className="absolute -top-1 left-0 w-4 h-4 text-[#007AFF]/50 rotate-180" />
              <blockquote className="text-base sm:text-lg lg:text-xl font-medium text-[#1D1D1F] dark:text-[#F5F5F7] leading-relaxed tracking-tight">
                "{affirmation.affirmation}"
              </blockquote>
              <div className="text-xs text-[#8E8E93] mt-2 flex items-center space-x-2">
                <span>— {affirmation.author}</span>
                <span className="text-[10px] opacity-60">• Model: {affirmation.modelUsed || 'Gemini 2.5'}</span>
              </div>
            </div>

            {/* Mindful Inquiry / Reflection Prompt Box */}
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF]">
                  Today's Contemplation Cue
                </div>
                <div className="text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] font-normal">
                  {affirmation.mindfulPrompt}
                </div>
              </div>

              {onStartReflectionWithPrompt && (
                <button
                  onClick={handleReflect}
                  className="shrink-0 inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <span>Reflect on this</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
