import { cn } from '../lib/utils';

interface TechVector3Props {
  label: string;
  value: { x: number; y: number; z: number };
  onChange: (value: { x: number; y: number; z: number }) => void;
  step?: number;
}

export function TechVector3({ label, value, onChange, step = 0.1 }: TechVector3Props) {
  const handleChange = (axis: 'x' | 'y' | 'z', newVal: string) => {
    const numVal = parseFloat(newVal);
    if (!isNaN(numVal)) {
      onChange({ ...value, [axis]: numVal });
    }
  };

  return (
    <div className="w-full space-y-2">
      <span className="text-xs uppercase tracking-wider font-bold text-slate-400">{label}</span>
      <div className="grid grid-cols-3 gap-2">
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="relative group">
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center text-xs font-bold uppercase",
              axis === 'x' ? "bg-red-500/20 text-red-400" :
              axis === 'y' ? "bg-green-500/20 text-green-400" :
              "bg-blue-500/20 text-blue-400"
            )}>
              {axis}
            </div>
            <input
              type="number"
              step={step}
              value={value[axis]}
              onChange={(e) => handleChange(axis, e.target.value)}
              className={cn(
                "w-full bg-slate-950 border border-slate-700 py-1 pl-8 pr-2 text-sm text-slate-200 font-mono outline-none focus:ring-1 transition-all",
                axis === 'x' ? "focus:border-red-500/50 focus:ring-red-500/20" :
                axis === 'y' ? "focus:border-green-500/50 focus:ring-green-500/20" :
                "focus:border-blue-500/50 focus:ring-blue-500/20",
                "[clip-path:polygon(0_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%)]"
              )}
            />
            {/* Corner Decor */}
            <div className={cn(
              "absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b pointer-events-none opacity-50",
              axis === 'x' ? "border-red-500" :
              axis === 'y' ? "border-green-500" :
              "border-blue-500"
            )} />
          </div>
        ))}
      </div>
    </div>
  );
}
