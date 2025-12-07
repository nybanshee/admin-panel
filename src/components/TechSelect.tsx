import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { ChangeEvent } from 'react';

interface TechSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  label?: string;
  color?: 'cyan' | 'purple' | 'green' | 'red' | 'yellow' | 'orange';
}

export function TechSelect({ 
  value, 
  options, 
  onChange, 
  label, 
  color = 'cyan' 
}: TechSelectProps) {
  
  const colors = {
    cyan: { border: 'focus:border-cyan-500', text: 'text-cyan-400', ring: 'focus:ring-cyan-500/20' },
    purple: { border: 'focus:border-purple-500', text: 'text-purple-400', ring: 'focus:ring-purple-500/20' },
    green: { border: 'focus:border-green-500', text: 'text-green-400', ring: 'focus:ring-green-500/20' },
    red: { border: 'focus:border-red-500', text: 'text-red-400', ring: 'focus:ring-red-500/20' },
    yellow: { border: 'focus:border-yellow-500', text: 'text-yellow-400', ring: 'focus:ring-yellow-500/20' },
    orange: { border: 'focus:border-orange-500', text: 'text-orange-400', ring: 'focus:ring-orange-500/20' },
  };

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="text-xs uppercase tracking-wider font-bold text-slate-400 block mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          className={cn(
            "w-full appearance-none bg-slate-950 border border-slate-700 rounded-none px-3 py-2 text-sm text-slate-200 font-medium transition-all outline-none focus:ring-2",
            colors[color].border,
            colors[color].ring,
            // Clip path for cut corner
            "[clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]"
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <ChevronDown className={cn("h-4 w-4", colors[color].text)} />
        </div>
        
        {/* Decor corner */}
        <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-r border-b opacity-50 pointer-events-none", colors[color].text.replace('text-', 'border-'))} />
      </div>
    </div>
  );
}
