/**
 * Scroll-triggered fade-in wrapper.
 *
 * Uses Framer Motion `whileInView` for a single entry animation.
 * Easing follows Emil's principle: ease-out (fast start, gentle settle)
 * with a strong custom curve for perceived responsiveness.
 */

import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
