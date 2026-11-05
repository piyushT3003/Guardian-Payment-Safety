import React, { useEffect } from 'react';
import Lenis from 'lenis';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children, enabled = true }) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    // Respect reduced motion accessibility
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      prevent: (node: Element) => {
        // Prevent Lenis from intercepting wheel events inside any modal, drawer, or scrollable container
        return (
          node.hasAttribute('data-lenis-prevent') ||
          Boolean(node.closest('[data-lenis-prevent]')) ||
          Boolean(node.closest('.overflow-y-auto')) ||
          Boolean(node.closest('.overflow-auto')) ||
          Boolean(node.closest('main'))
        );
      },
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [enabled]);

  return <>{children}</>;
};
