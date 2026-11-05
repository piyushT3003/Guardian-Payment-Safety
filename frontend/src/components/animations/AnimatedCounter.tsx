import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number | string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1.4,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    // Extract numerical part from string if needed
    let targetNum = 0;
    let autoPrefix = prefix;
    let autoSuffix = suffix;

    if (typeof value === 'number') {
      targetNum = value;
    } else {
      const rawStr = String(value).trim();
      if (rawStr.startsWith('₹')) {
        autoPrefix = '₹';
      }
      if (rawStr.endsWith('%')) {
        autoSuffix = '%';
      } else if (rawStr.endsWith('L')) {
        autoSuffix = 'L';
      }

      const parsed = parseFloat(rawStr.replace(/[^0-9.-]/g, ''));
      targetNum = isNaN(parsed) ? 0 : parsed;
    }

    const startNum = prevValueRef.current;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    let animId: number;

    const easeOutExpo = (t: number) => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutExpo(progress);

      const current = startNum + (targetNum - startNum) * easedProgress;

      // Format formatted string
      let formatted: string;
      if (decimals > 0 || (typeof value === 'string' && value.includes('.'))) {
        formatted = current.toFixed(decimals || 1);
      } else {
        formatted = Math.round(current).toLocaleString('en-IN');
      }

      setDisplayValue(`${autoPrefix}${formatted}${autoSuffix}`);

      if (progress < 1) {
        animId = requestAnimationFrame(updateCounter);
      } else {
        prevValueRef.current = targetNum;
      }
    };

    animId = requestAnimationFrame(updateCounter);

    return () => cancelAnimationFrame(animId);
  }, [value, duration, prefix, suffix, decimals]);

  return <span className={className}>{displayValue}</span>;
};
