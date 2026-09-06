import React from 'react';
import { Sparkles, Brain, Award, Compass, TrendingUp, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { JournalEntry } from '../types';

interface CognitiveVisualizerProps {
  entries: JournalEntry[];
}

export const CognitiveVisualizer: React.FC<CognitiveVisualizerProps> = ({ entries }) => {
  // Aggregate sentiment counts
  const sentimentCounts: Record<string, number> = {};
  const themeCounts: Record<string, number> = {};
  const environmentalCounts: Record<string, number> = {};
  const milestones: Array<{ id: string; milestone: string; title: string; date: string }> = [];

  let totalDistress = 0;

  entries.forEach((entry) => {
    // Sentiment
    const s = entry.sentiment || 'Reflective';
    sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;

    // Distress
    totalDistress += entry.distressScore || 0.1;

    // Themes
    (entry.themes || []).forEach((t) => {
      themeCounts[t] = (themeCounts[t] || 0) + 1;
    });

    // Environment
    const env = entry.environmentalTag || 'Nature Walk';
    environmentalCounts[env] = (environmentalCounts[env] || 0) + 1;

    // Growth milestone
    if (entry.growthMilestone) {
      milestones.push({
        id: entry.id,
        milestone: entry.growthMilestone,
        title: entry.title,
        date: new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      });
    }
  });

  const averageDistress = entries.length > 0 ? (totalDistress / entries.length) : 0.15;
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const totalReflections = entries.reduce((acc, e) => acc + (e.reflections?.length || 0), 0);
  const encryptedCount = entries.filter((e) => e.isEncrypted).length;

  return (
    <div className="space-y-6">
      {/* Top Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] space-y-2">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-xs font-medium uppercase tracking-wider">Entries Analyzed</span>
            <Brain className="w-4 h-4 text-[#0071E3] dark:text-[#2997FF]" />
          </div>
          <div className="text-3xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
            {entries.length}
          </div>
          <p className="text-xs text-[#86868B]">
            {totalReflections} conversational AI turns processed
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] space-y-2">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-xs font-medium uppercase tracking-wider">Zero-Knowledge Ratio</span>
            <Award className="w-4 h-4 text-[#34C759]" />
          </div>
          <div className="text-3xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
            {entries.length > 0 ? Math.round((encryptedCount / entries.length) * 100) : 100}%
          </div>
          <p className="text-xs text-[#34C759] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            AES-256-GCM client encrypted
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] space-y-2">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-xs font-medium uppercase tracking-wider">Vagal Calm Index</span>
            <TrendingUp className="w-4 h-4 text-[#30B0C7]" />
          </div>
          <div className="text-3xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
            {Math.round((1 - averageDistress) * 100)}%
          </div>
          <p className="text-xs text-[#86868B]">
            High emotional resilience equilibrium
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] space-y-2">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-xs font-medium uppercase tracking-wider">Primary Vibe</span>
            <Compass className="w-4 h-4 text-[#AF52DE]" />
          </div>
          <div className="text-2xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
            {Object.keys(sentimentCounts)[0] || 'Grounded'}
          </div>
          <p className="text-xs text-[#86868B]">
            Dominant cognitive frequency
          </p>
        </div>
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recurring Cognitive Themes Cloud */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Recurring Cognitive Themes
            </h3>
            <Sparkles className="w-4 h-4 text-[#0071E3] dark:text-[#2997FF]" />
          </div>
          <p className="text-xs text-[#86868B]">
            Aggregated patterns detected across your reflection sessions
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {topThemes.length > 0 ? (
              topThemes.map(([theme, count]) => (
                <div
                  key={theme}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <span>{theme}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#0071E3]/15 text-[#0071E3] dark:text-[#2997FF]">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#86868B] py-6 text-center w-full">
                Write entries to generate cognitive theme insights.
              </div>
            )}
          </div>
        </div>

        {/* Sentiment & Emotional Distribution */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Emotional State Distribution
            </h3>
            <Sun className="w-4 h-4 text-[#FF9500]" />
          </div>
          <p className="text-xs text-[#86868B]">
            Proportion of journal entries grouped by cognitive tone
          </p>

          <div className="space-y-3 pt-2">
            {Object.entries(sentimentCounts).map(([sent, count]) => {
              const pct = Math.round((count / (entries.length || 1)) * 100);
              return (
                <div key={sent} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">{sent}</span>
                    <span className="font-mono text-[#86868B]">{pct}% ({count})</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0071E3] to-[#5856D6] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personal Growth Milestones */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Growth Milestones
            </h3>
            <Award className="w-4 h-4 text-[#34C759]" />
          </div>
          <p className="text-xs text-[#86868B]">
            Breakthroughs recognized by Gemini reflections
          </p>

          <div className="space-y-3 pt-1">
            {milestones.length > 0 ? (
              milestones.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#34C759] truncate max-w-[180px]">
                      {m.title}
                    </span>
                    <span className="text-[#86868B] font-mono">{m.date}</span>
                  </div>
                  <p className="text-xs text-[#1D1D1F] dark:text-[#E5E5EA] leading-relaxed">
                    &ldquo;{m.milestone}&rdquo;
                  </p>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#86868B] py-6 text-center w-full">
                Complete journal sessions to record personal growth breakthroughs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
