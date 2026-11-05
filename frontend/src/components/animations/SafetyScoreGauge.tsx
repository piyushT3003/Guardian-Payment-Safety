import React, { useEffect, useState } from 'react';
import { AnimatedCounter } from './AnimatedCounter';

interface SafetyScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const SafetyScoreGauge: React.FC<SafetyScoreGaugeProps> = ({
  score,
  size = 180,
  strokeWidth = 14,
  className = '',
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 150);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const isSafe = score >= 80;
  const isModerate = score >= 50 && score < 80;

  const strokeColor = isSafe
    ? '#10b981'
    : isModerate
    ? '#f59e0b'
    : '#f43f5e';

  const labelText = isSafe
    ? 'High Safety Score'
    : isModerate
    ? 'Moderate Safety'
    : 'Elevated Risk';

  const labelColor = isSafe
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : isModerate
    ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-rose-600 bg-rose-50 border-rose-200';

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.6s ease-out',
            filter: `drop-shadow(0 0 6px ${strokeColor}44)`,
          }}
        />
      </svg>

      {/* Centered Counter & Score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-black text-slate-900 tracking-tight">
          <AnimatedCounter value={score} decimals={0} />
          <span className="text-base font-bold text-slate-400">/100</span>
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${labelColor}`}
        >
          {labelText}
        </span>
      </div>
    </div>
  );
};
