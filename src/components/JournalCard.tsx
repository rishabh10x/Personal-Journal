import React from 'react';
import { Lock, Unlock, MapPin, Compass, Sparkles, Trash2, ChevronRight } from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalCardProps {
  entry: JournalEntry;
  encryptionUnlocked: boolean;
  decryptedContent?: string;
  onSelect: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onPromptUnlock: () => void;
}

export const JournalCard: React.FC<JournalCardProps> = ({
  entry,
  encryptionUnlocked,
  decryptedContent,
  onSelect,
  onDelete,
  onPromptUnlock,
}) => {
  const getSentimentPillStyle = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'calm':
      case 'peaceful':
      case 'grounded':
        return 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300';
      case 'inspired':
      case 'grateful':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300';
      case 'reflective':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300';
      case 'anxious':
      case 'overwhelmed':
      case 'fatigued':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300';
    }
  };

  const displayText = entry.isEncrypted
    ? encryptionUnlocked && decryptedContent
      ? decryptedContent
      : null
    : entry.rawContent;

  const formattedDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      onClick={() => onSelect(entry)}
      className="group bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 rounded-[22px] border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md hover:border-[#007AFF]/30 dark:hover:border-[#2997FF]/30 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
    >
      {/* Top Meta Row */}
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[10px] font-bold tracking-wider text-[#8E8E93] uppercase font-mono">
            {formattedDate}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span
              className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${getSentimentPillStyle(
                entry.sentiment
              )}`}
            >
              {entry.sentiment || 'REFLECTIVE'}
            </span>

            {entry.isEncrypted && (
              <span
                onClick={(e) => {
                  if (!encryptionUnlocked) {
                    e.stopPropagation();
                    onPromptUnlock();
                  }
                }}
                className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all ${
                  encryptionUnlocked
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/20'
                }`}
              >
                {encryptionUnlocked ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                {encryptionUnlocked ? 'AES-256' : 'ENCRYPTED'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm sm:text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#007AFF] dark:group-hover:text-[#2997FF] transition-colors line-clamp-1">
          {entry.title}
        </h4>

        {/* Content Snippet */}
        {entry.isEncrypted && !encryptionUnlocked ? (
          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10 flex items-center justify-between gap-2 text-xs text-[#8E8E93]">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[11px]">Zero-Knowledge Ciphertext</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPromptUnlock();
              }}
              className="text-[#007AFF] dark:text-[#2997FF] hover:underline font-semibold text-[11px] shrink-0"
            >
              Unlock Vault
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#8E8E93] line-clamp-2 leading-relaxed">
            {displayText || 'No raw content preview available.'}
          </p>
        )}

        {/* AI Cognitive Reflection Quote (if available) */}
        {entry.aiSummary && (
          <div className="p-2.5 rounded-xl bg-[#007AFF]/5 dark:bg-[#007AFF]/10 border border-[#007AFF]/10 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#2997FF] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#1D1D1F] dark:text-[#D1D1D6] line-clamp-2 italic font-serif">
              &ldquo;{entry.aiSummary}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Card Footer: Location Tag & Actions */}
      <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-[10px] text-[#1D1D1F] dark:text-[#F5F5F7] font-medium truncate">
          {entry.location?.placename ? (
            <div className="flex items-center space-x-1 truncate">
              <MapPin className="w-3 h-3 text-[#FF3B30] shrink-0 fill-[#FF3B30]/20" />
              <span className="truncate max-w-[170px]">{entry.location.placename}</span>
            </div>
          ) : entry.environmentalTag ? (
            <div className="flex items-center space-x-1 text-[#8E8E93]">
              <Compass className="w-3 h-3 text-[#007AFF]" />
              <span>{entry.environmentalTag}</span>
            </div>
          ) : (
            <span className="text-[#8E8E93]">Personal Reflection</span>
          )}
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Permanently delete this journal entry from your isolated Firestore path?')) {
                onDelete(entry.id);
              }
            }}
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Delete entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="p-1 text-[#8E8E93] group-hover:text-[#007AFF] dark:group-hover:text-[#2997FF] group-hover:translate-x-0.5 transition-all">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
