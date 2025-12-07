import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

export interface BulletType {
  id: string;
  label: string;
  color: string; // Tailwind class for bg color, e.g., "bg-red-500"
}

interface MagazineSequenceEditorProps {
  sequence: string[]; // Array of bullet IDs
  availableBullets: BulletType[];
  onChange: (newSequence: string[]) => void;
  maxSize?: number;
}

export function MagazineSequenceEditor({ 
  sequence, 
  availableBullets, 
  onChange, 
  maxSize = 30 
}: MagazineSequenceEditorProps) {

  const addBullet = (bulletId: string) => {
    if (sequence.length >= maxSize) return;
    onChange([...sequence, bulletId]);
  };

  const removeBullet = (index: number) => {
    const newSeq = [...sequence];
    newSeq.splice(index, 1);
    onChange(newSeq);
  };

  const clearSequence = () => onChange([]);

  const getBulletColor = (id: string) => {
    const bullet = availableBullets.find(b => b.id === id);
    return bullet ? bullet.color : 'bg-slate-500';
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ammo Loading</h4>
            <div className="text-xs font-mono text-cyan-500/50">DRAG_n_DROP_V1.0</div>
        </div>

        {/* Available Bullets */}
        <div className="flex flex-wrap gap-2">
            {availableBullets.map(bullet => (
                <button
                    key={bullet.id}
                    onClick={() => addBullet(bullet.id)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 transition-colors group",
                        "text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
                    )}
                >
                    <div className={cn("w-2 h-2 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.5)]", bullet.color)} />
                    {bullet.label}
                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                </button>
            ))}
        </div>

        {/* Magazine Strip */}
        <div className="relative min-h-[120px] p-4 bg-slate-900/50 border border-slate-800/50 rounded-none clip-path-panel">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_100%]" />

             <div className="absolute top-2 right-2 flex items-center gap-4 text-xs text-slate-500 z-10">
                <span className="font-mono">{sequence.length} / {maxSize} RNDS</span>
                <button onClick={clearSequence} className="flex items-center gap-1 hover:text-red-400 transition-colors" title="Clear Magazine">
                    <RotateCcw className="w-3 h-3" />
                    RESET
                </button>
            </div>

            <div className="flex flex-wrap content-start gap-1 mt-6 relative z-0">
                <AnimatePresence mode='popLayout'>
                    {sequence.map((bulletId, index) => (
                        <motion.div
                            key={`${bulletId}-${index}`}
                            initial={{ scale: 0, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0 }}
                            onClick={() => removeBullet(index)}
                            className={cn(
                                "relative group w-3 h-8 cursor-pointer hover:scale-110 transition-transform rounded-sm",
                                getBulletColor(bulletId),
                                "shadow-lg"
                            )}
                            title={`Round ${index + 1}: ${availableBullets.find(b => b.id === bulletId)?.label || 'Unknown'}`}
                        >
                             {/* Glow effect */}
                             <div className={cn("absolute inset-0 opacity-50 blur-[2px]", getBulletColor(bulletId))} />
                             
                             {/* Index marker for every 5th round for readability */}
                             {(index + 1) % 5 === 0 && (
                                 <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-600 font-mono pointer-events-none">
                                     {index + 1}
                                 </div>
                             )}
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {sequence.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-slate-700 text-sm font-bold uppercase tracking-[0.2em]">Magazine Empty</span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
