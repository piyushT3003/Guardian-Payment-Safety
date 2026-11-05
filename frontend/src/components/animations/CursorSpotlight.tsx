import React, { useEffect, useState } from 'react';

interface CursorSpotlightProps {
  className?: string;
}

export const CursorSpotlight: React.FC<CursorSpotlightProps> = ({ className = '' }) => {
  const [position, setPosition] = useState<{ x: number; y: number; opacity: number }>({
    x: -500,
    y: -500,
    opacity: 0,
  });

  useEffect(() => {
    let animId: number;
    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setPosition((prev) => ({ ...prev, opacity: 1 }));
    };

    const handleMouseLeave = () => {
      setPosition((prev) => ({ ...prev, opacity: 0 }));
    };

    const loop = () => {
      // Smooth lerp damping for organic cursor spotlight movement
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      setPosition((prev) => ({
        ...prev,
        x: Math.round(currentX),
        y: Math.round(currentY),
      }));

      animId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-20 transition-opacity duration-500 overflow-hidden ${className}`}
      style={{
        opacity: position.opacity,
        background: `radial-gradient(650px circle at ${position.x}px ${position.y}px, rgba(124, 58, 237, 0.075), rgba(6, 182, 212, 0.035) 45%, transparent 75%)`,
      }}
    />
  );
};
