import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { ReactNode } from 'react';

interface TechCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function TechCard({ children, className, delay = 0 }: TechCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "relative bg-slate-900/80 border-l-2 border-cyan-500/50 backdrop-blur-sm p-6 overflow-hidden",
        "before:absolute before:top-0 before:right-0 before:w-4 before:h-4 before:border-t-2 before:border-r-2 before:border-cyan-500/50",
        "after:absolute after:bottom-0 after:left-0 after:w-4 after:h-4 before:content-[''] after:content-['']",
         // Clip path for cut corner
        "[clip-path:polygon(0_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%)]",
        className
      )}
    >
        {/* Subtle grid background pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
