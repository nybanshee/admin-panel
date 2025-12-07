import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfigSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  color?: 'cyan' | 'purple' | 'green' | 'red';
}

export function ConfigSection({ title, children, defaultOpen = false, icon, color = 'cyan' }: ConfigSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colors = {
    cyan: { text: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-500/10' },
    purple: { text: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
    green: { text: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-500/10' },
    red: { text: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10' },
  };

  return (
    <div className="relative">
      <div 
        className={cn(
          "flex items-center justify-between p-2 cursor-pointer hover:bg-slate-800/50 transition-colors rounded border-l-2 border-transparent",
          isOpen && colors[color].border,
          isOpen && colors[color].bg
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3">
            <motion.div animate={{ rotate: isOpen ? 90 : 0 }} className="text-slate-500">
                <ChevronRight className="h-4 w-4" />
            </motion.div>
            {icon || <Settings className={cn("h-4 w-4", colors[color].text)} />}
            <span className={cn("text-sm font-bold uppercase tracking-wide text-slate-300", isOpen && "text-white")}>
                {title}
            </span>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="relative ml-3 pl-4 pt-2 pb-4 space-y-4">
                 {/* Indent Line */}
                <div className="absolute top-0 left-0 w-px h-full bg-slate-800">
                    <div className={cn("absolute top-0 left-0 w-px h-4", colors[color].bg.replace('bg-', 'bg-').replace('/10', ''))} />
                </div>
                {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
