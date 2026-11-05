import React from 'react';
import { motion, HTMLMotionProps, Variants } from 'framer-motion';

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'zoom' | 'fade' | 'blur';
  delay?: number;
  duration?: number;
  distance?: number;
  staggerIndex?: number;
  once?: boolean;
  className?: string;
}

const directionVariants: Record<string, Variants> = {
  up: {
    hidden: { opacity: 0, y: 32, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  },
  down: {
    hidden: { opacity: 0, y: -32, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  },
  left: {
    hidden: { opacity: 0, x: 32, filter: 'blur(3px)' },
    visible: { opacity: 1, x: 0, filter: 'blur(0px)' },
  },
  right: {
    hidden: { opacity: 0, x: -32, filter: 'blur(3px)' },
    visible: { opacity: 1, x: 0, filter: 'blur(0px)' },
  },
  zoom: {
    hidden: { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
    visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(12px)', scale: 0.97 },
    visible: { opacity: 1, filter: 'blur(0px)', scale: 1 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 32,
  staggerIndex = 0,
  once = true,
  className = '',
  ...rest
}) => {
  const totalDelay = delay + staggerIndex * 0.09;
  const variants = directionVariants[direction] || directionVariants.fade;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-48px' }}
      variants={variants}
      transition={{
        duration,
        delay: totalDelay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/**
 * Container that staggers children in view.
 * Wrap multiple ScrollReveal items or raw children with this.
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  once?: boolean;
}> = ({ children, staggerDelay = 0.08, className = '', once = true }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once, margin: '-48px' }}
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: staggerDelay } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * Individual item inside StaggerContainer.
 */
export const StaggerItem: React.FC<{
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'zoom' | 'fade';
  className?: string;
}> = ({ children, direction = 'up', className = '' }) => {
  const variants = directionVariants[direction] || directionVariants.fade;
  return (
    <motion.div
      variants={variants}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
