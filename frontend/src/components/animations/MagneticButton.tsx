import React, { useRef, useState, useCallback, useEffect } from 'react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 0.28,
  className = '',
  onClick,
  ...rest
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const [displayPos, setDisplayPos] = useState({ x: 0, y: 0 });
  const [lightPos, setLightPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const springLoop = useCallback(() => {
    const cur = posRef.current;
    const tgt = targetPosRef.current;
    const factor = isHovered ? 0.12 : 0.08;
    cur.x += (tgt.x - cur.x) * factor;
    cur.y += (tgt.y - cur.y) * factor;
    setDisplayPos({ x: cur.x, y: cur.y });

    const dist = Math.abs(cur.x - tgt.x) + Math.abs(cur.y - tgt.y);
    if (!isHovered && dist < 0.05) return;
    rafRef.current = requestAnimationFrame(springLoop);
  }, [isHovered]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetPosRef.current = { x: (e.clientX - cx) * strength, y: (e.clientY - cy) * strength };
      setLightPos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    },
    [strength]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(springLoop);
  }, [springLoop]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    targetPosRef.current = { x: 0, y: 0 };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(springLoop);
  }, [springLoop]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2.2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        const id = Date.now();
        setRipples((prev) => [...prev, { x, y, size, id }]);
        setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
      }
      onClick?.(e);
    },
    [onClick]
  );

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        transform: `translate3d(${displayPos.x.toFixed(2)}px, ${displayPos.y.toFixed(2)}px, 0)`,
        willChange: 'transform',
      }}
      className={`relative overflow-hidden cursor-pointer select-none ${className}`}
      {...rest}
    >
      {/* Hover sheen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-0"
        style={{
          opacity: isHovered ? 0.4 : 0,
          transition: 'opacity 0.25s ease',
          background: `radial-gradient(circle 90px at ${lightPos.x}% ${lightPos.y}%, rgba(255,255,255,0.75), transparent 70%)`,
        }}
      />

      {/* Click ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          className="ripple-effect"
          style={{ top: r.y, left: r.x, width: r.size, height: r.size }}
        />
      ))}

      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};
