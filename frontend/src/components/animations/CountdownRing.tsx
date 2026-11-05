import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface CountdownRingProps {
  /** Total duration in seconds */
  totalSeconds: number;
  /** Remaining seconds (must be <= totalSeconds) */
  remainingSeconds: number;
  /** Display size in px */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color when time is ample */
  normalColor?: string;
  /** Color when under 60s */
  urgentColor?: string;
  /** Color when expired */
  expiredColor?: string;
  className?: string;
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  totalSeconds,
  remainingSeconds,
  size = 72,
  strokeWidth = 5,
  normalColor = '#10b981',
  urgentColor = '#f59e0b',
  expiredColor = '#ef4444',
  className = '',
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, remainingSeconds / Math.max(totalSeconds, 1)));
  const dashOffset = circumference * (1 - progress);

  const color =
    remainingSeconds <= 0
      ? expiredColor
      : remainingSeconds <= 60
      ? urgentColor
      : normalColor;

  const mins = Math.floor(remainingSeconds / 60);
  const secs = Math.floor(remainingSeconds % 60);
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-black text-sm leading-none"
          style={{ color, textShadow: `0 0 8px ${color}60` }}
        >
          {remainingSeconds <= 0 ? 'EXP' : timeStr}
        </span>
        {remainingSeconds > 0 && (
          <span className="text-[8px] font-bold text-slate-400 mt-0.5">LEFT</span>
        )}
      </div>
    </div>
  );
};
