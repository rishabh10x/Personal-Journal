import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Play, Pause, RefreshCw, Heart } from 'lucide-react';

interface GroundingPacerProps {
  onClose?: () => void;
}

export const GroundingPacer: React.FC<GroundingPacerProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(true);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phases
        if (phase === 'Inhale') {
          setPhase('Hold');
          return 7;
        } else if (phase === 'Hold') {
          setPhase('Exhale');
          return 8;
        } else {
          setPhase('Inhale');
          setCycleCount((c) => c + 1);
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase]);

  const getScale = () => {
    if (phase === 'Inhale') return 1.35;
    if (phase === 'Hold') return 1.35;
    return 0.85;
  };

  const getInstruction = () => {
    switch (phase) {
      case 'Inhale':
        return 'Inhale gently through your nose';
      case 'Hold':
        return 'Hold the breath in still awareness';
      case 'Exhale':
        return 'Release through the mouth with a soft sigh';
    }
  };

  const getColorClass = () => {
    switch (phase) {
      case 'Inhale':
        return 'from-[#34C759]/30 to-[#30B0C7]/30 border-[#34C759]/40 text-[#34C759]';
      case 'Hold':
        return 'from-[#0071E3]/30 to-[#5856D6]/30 border-[#0071E3]/40 text-[#0071E3] dark:text-[#2997FF]';
      case 'Exhale':
        return 'from-[#FF9500]/30 to-[#FF2D55]/30 border-[#FF9500]/40 text-[#FF9500]';
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] dark:text-[#2997FF]">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              4-7-8 Grounding Breath
            </h4>
            <p className="text-xs text-[#86868B]">Soothing vagal tone regulator</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 text-[#86868B]">
            Cycle {cycleCount + 1}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white px-2 py-1 rounded-lg"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Breathing Sphere */}
      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Outer Ambient Ripple */}
          <motion.div
            animate={{
              scale: getScale(),
              opacity: phase === 'Hold' ? 0.7 : 0.4,
            }}
            transition={{
              duration: phase === 'Inhale' ? 4 : phase === 'Hold' ? 7 : 8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`absolute inset-0 rounded-full bg-gradient-to-tr ${getColorClass()} blur-xl`}
          />

          {/* Primary Fluid Core */}
          <motion.div
            animate={{
              scale: getScale(),
            }}
            transition={{
              duration: phase === 'Inhale' ? 4 : phase === 'Hold' ? 7 : 8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`w-36 h-36 rounded-full border-2 bg-gradient-to-br ${getColorClass()} backdrop-blur-xl flex flex-col items-center justify-center shadow-lg transition-colors`}
          >
            <span className="text-xs font-semibold tracking-wider uppercase opacity-80">
              {phase}
            </span>
            <span className="text-3xl font-light font-mono my-0.5">
              {secondsLeft}s
            </span>
          </motion.div>
        </div>

        <p className="text-xs font-medium text-center text-[#86868B] mt-4 max-w-xs transition-opacity duration-300">
          {getInstruction()}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => setIsActive(!isActive)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/10 dark:hover:bg-white/15 active:scale-[0.98] transition-all"
        >
          {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isActive ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={() => {
            setPhase('Inhale');
            setSecondsLeft(4);
            setCycleCount(0);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white active:scale-[0.98] transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
};
