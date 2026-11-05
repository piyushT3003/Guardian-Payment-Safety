import React from 'react';
import { motion } from 'framer-motion';

interface RiskScoreGaugeProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({
  score,
  size = 80,
  strokeWidth = 7,
  className = '',
  showLabel = true,
}) => {
  // Semi-circle arc (180 deg)
  const radius = (size - strokeWidth * 2) / 2;
  const arcLength = Math.PI * radius; // half circumference
  const dashOffset = arcLength * (1 - Math.min(1, score / 100));

  const color =
    score >= 75 ? '#ef4444' :
    score >= 45 ? '#f59e0b' :
    '#10b981';

  const label =
    score >= 75 ? 'HIGH' :
    score >= 45 ? 'MED' :
    'LOW';

  const labelColor =
    score >= 75 ? 'text-rose-500' :
    score >= 45 ? 'text-amber-500' :
    'text-emerald-500';

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg width={size} height={size / 2 + strokeWidth} overflow="visible">
        {/* Background track (half arc) */}
        <path
          d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
          fill="none"
          stroke="rgba(148,163,184,0.2)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Animated filled arc */}
        <motion.path
          d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          animate={{ strokeDashoffset: dashOffset }}
          initial={{ strokeDashoffset: arcLength }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}
        />
      </svg>
      {showLabel && (
        <motion.div
          className="flex flex-col items-center -mt-1"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <span className="font-black text-xl text-slate-900">{Math.round(score)}</span>
          <span className={`text-[9px] font-extrabold uppercase tracking-wider ${labelColor}`}>{label} RISK</span>
        </motion.div>
      )}
    </div>
  );
};
