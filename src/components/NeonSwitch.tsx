import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface NeonSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  label?: string;
  color?: 'cyan' | 'purple' | 'green' | 'red' | 'yellow' | 'orange';
}

export function NeonSwitch({ isOn, onToggle, label, color = 'cyan' }: NeonSwitchProps) {
  const colors = {
    cyan: {
      bg: 'bg-cyan-500',
      shadow: 'shadow-cyan-500/50',
      text: 'text-cyan-400',
      border: 'border-cyan-500/50'
    },
    purple: {
      bg: 'bg-purple-500',
      shadow: 'shadow-purple-500/50',
      text: 'text-purple-400',
      border: 'border-purple-500/50'
    },
    green: {
      bg: 'bg-green-500',
      shadow: 'shadow-green-500/50',
      text: 'text-green-400',
      border: 'border-green-500/50'
    },
    red: {
      bg: 'bg-red-500',
      shadow: 'shadow-red-500/50',
      text: 'text-red-400',
      border: 'border-red-500/50'
    },
    yellow: {
      bg: 'bg-yellow-500',
      shadow: 'shadow-yellow-500/50',
      text: 'text-yellow-400',
      border: 'border-yellow-500/50'
    },
    orange: {
      bg: 'bg-orange-500',
      shadow: 'shadow-orange-500/50',
      text: 'text-orange-400',
      border: 'border-orange-500/50'
    },
  };

  return (
    <div className="flex items-center justify-between py-2">
      {label && <span className="text-slate-300 font-medium tracking-wide text-sm uppercase">{label}</span>}
      <div
        className={cn(
          "w-14 h-7 flex items-center bg-slate-800 rounded-none cursor-pointer p-1 border border-slate-700 transition-colors duration-300",
          isOn && colors[color].border
        )}
        onClick={onToggle}
        style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }}
      >
        <motion.div
          initial={false}
          animate={{ x: isOn ? 28 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "w-5 h-5 shadow-lg",
            isOn ? colors[color].bg : "bg-slate-500",
            isOn && `shadow-[0_0_10px_2px_rgba(0,0,0,0.3)] ${colors[color].shadow}`
          )}
          style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
        />
      </div>
    </div>
  );
}
