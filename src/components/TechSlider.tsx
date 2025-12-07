import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { ChangeEvent } from 'react';

interface TechSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  color?: 'cyan' | 'purple' | 'green' | 'red' | 'yellow' | 'orange';
}

export function TechSlider({ 
  value, 
  min, 
  max, 
  step = 1, 
  onChange, 
  label, 
  unit, 
  color = 'cyan' 
}: TechSliderProps) {
  
  const percentage = ((value - min) / (max - min)) * 100;

  const colors = {
    cyan: { bg: 'bg-cyan-500', text: 'text-cyan-400', shadow: 'shadow-cyan-500/50' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-400', shadow: 'shadow-purple-500/50' },
    green: { bg: 'bg-green-500', text: 'text-green-400', shadow: 'shadow-green-500/50' },
    red: { bg: 'bg-red-500', text: 'text-red-400', shadow: 'shadow-red-500/50' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-400', shadow: 'shadow-yellow-500/50' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-400', shadow: 'shadow-orange-500/50' },
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-xs uppercase tracking-wider font-bold">
        <span className="text-slate-400">{label}</span>
        <span className={cn("font-mono", colors[color].text)}>
          {value} <span className="text-slate-600 ml-1">{unit}</span>
        </span>
      </div>
      
      <div className="relative h-4 flex items-center">
        {/* Track Background */}
        <div className="absolute w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            {/* Grid pattern on track */}
            <div className="w-full h-full opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.1) 50%)', backgroundSize: '4px 100%' }} />
        </div>

        {/* Fill Track */}
        <motion.div 
            className={cn("absolute h-1 rounded-full", colors[color].bg)}
            style={{ width: `${percentage}%` }}
            initial={false}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {/* Thumb */}
        <input 
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className="absolute w-full h-full opacity-0 cursor-pointer z-20"
        />
        
        {/* Custom Thumb Visual */}
        <motion.div 
            className={cn(
                "absolute h-4 w-4 bg-slate-950 border-2 rounded-none z-10 rotate-45", 
                colors[color].bg.replace('bg-', 'border-'),
                colors[color].shadow,
                "shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            )}
            style={{ left: `calc(${percentage}% - 8px)` }}
            initial={false}
            animate={{ left: `calc(${percentage}% - 8px)` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className={cn("absolute inset-1 rounded-none opacity-50", colors[color].bg)} />
        </motion.div>
      </div>
    </div>
  );
}
