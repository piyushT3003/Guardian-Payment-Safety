import React, { useRef, useState, useCallback, useEffect } from 'react';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
  borderGlow?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  maxTilt = 8,
  scale = 1.025,
  glare = true,
  borderGlow = true,
  className = '',
  onClick,
  style,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const currentTiltRef = useRef({ x: 0, y: 0 });
  const targetTiltRef = useRef({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);
  const [transformStr, setTransformStr] = useState<string>(
    'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  );

  // Spring-based smooth interpolation loop
  const springLoop = useCallback(() => {
    const lerpFactor = isHovered ? 0.1 : 0.07;
    const cur = currentTiltRef.current;
    const tgt = targetTiltRef.current;

    cur.x += (tgt.x - cur.x) * lerpFactor;
    cur.y += (tgt.y - cur.y) * lerpFactor;

    const sc = isHovered ? scale : 1;
    setCurrentScale((prev) => prev + (sc - prev) * 0.08);

    setTransformStr(
      `perspective(1200px) rotateX(${cur.x.toFixed(3)}deg) rotateY(${cur.y.toFixed(3)}deg) scale3d(${sc.toFixed(3)}, ${sc.toFixed(3)}, 1)`
    );

    const dist = Math.abs(cur.x - tgt.x) + Math.abs(cur.y - tgt.y);
    if (!isHovered && dist < 0.01) {
      return; // Stop loop when settled
    }

    rafRef.current = requestAnimationFrame(springLoop);
  }, [isHovered, scale]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      targetTiltRef.current = {
        x: (0.5 - y) * maxTilt * 2,
        y: (x - 0.5) * maxTilt * 2,
      };

      setGlarePosition({ x: x * 100, y: y * 100, opacity: 0.16 });
    },
    [maxTilt]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(springLoop);
  }, [springLoop]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    targetTiltRef.current = { x: 0, y: 0 };
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(springLoop);
  }, [springLoop]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: transformStr,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        ...style,
      }}
      className={`relative ${className}`}
      {...rest}
    >
      {/* Dynamic border highlight following cursor */}
      {borderGlow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[1px] rounded-[inherit] z-10"
          style={{
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            background: `radial-gradient(320px circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(139,92,246,0.4), rgba(6,182,212,0.18) 50%, transparent 80%)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
      )}

      {children}

      {/* Specular glare reflection */}
      {glare && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden z-20"
          style={{
            opacity: glarePosition.opacity,
            transition: 'opacity 0.25s ease',
            background: `radial-gradient(circle 280px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.65), transparent 70%)`,
          }}
        />
      )}
    </div>
  );
};
