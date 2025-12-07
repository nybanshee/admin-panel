import { useState } from 'react';
import { BulletConfig } from '../types/game';
import { TechCard } from './TechCard';
import { TechSlider } from './TechSlider';
import { NeonSwitch } from './NeonSwitch';
import { cn } from '../lib/utils';
import { Plus, Zap, Trash2 } from 'lucide-react';

interface BulletConfigPanelProps {
    bullets: BulletConfig[];
    onUpdate: (bullets: BulletConfig[]) => void;
}

export function BulletConfigPanel({ bullets, onUpdate }: BulletConfigPanelProps) {
    const [selectedId, setSelectedId] = useState<string | null>(bullets[0]?.id || null);

    const selectedBullet = bullets.find(b => b.id === selectedId);

    const updateBullet = (key: keyof BulletConfig, value: BulletConfig[keyof BulletConfig]) => {
        if (!selectedId) return;
        const newBullets = bullets.map(b => 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            b.id === selectedId ? { ...b, [key]: value } as any : b
        );
        onUpdate(newBullets);
    };

    const createBullet = () => {
        const newId = `custom_${Date.now()}`;
        const newBullet: BulletConfig = {
            id: newId,
            label: 'New Ammo Type',
            color: 'bg-slate-500',
            damageMult: 1.0,
            penetration: 0,
            velocity: 1.0,
            gravity: 1.0,
            spread: 0,
            recoilMult: 1.0,
            isExplosive: false
        };
        onUpdate([...bullets, newBullet]);
        setSelectedId(newId);
    };

    const deleteBullet = (id: string) => {
        const newBullets = bullets.filter(b => b.id !== id);
        onUpdate(newBullets);
        if (selectedId === id) {
            setSelectedId(newBullets[0]?.id || null);
        }
    };

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* List */}
            <div className="col-span-4 space-y-2">
                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {bullets.map(b => (
                        <div 
                            key={b.id}
                            onClick={() => setSelectedId(b.id)}
                            className={cn(
                                "p-3 border-l-2 cursor-pointer transition-all flex items-center justify-between group",
                                selectedId === b.id 
                                    ? "bg-slate-800 border-cyan-500" 
                                    : "bg-slate-900/50 border-slate-700 hover:bg-slate-800/50"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("w-3 h-3 rounded-full", b.color)} />
                                <span className={cn("font-bold uppercase text-sm", selectedId === b.id ? "text-white" : "text-slate-400")}>
                                    {b.label}
                                </span>
                            </div>
                            {bullets.length > 1 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteBullet(b.id); }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                
                <button 
                    onClick={createBullet}
                    className="w-full p-3 border border-dashed border-slate-700 text-slate-500 uppercase font-bold text-xs hover:border-cyan-500 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Create New Ammo
                </button>
            </div>

            {/* Editor */}
            <div className="col-span-8">
                <TechCard className="min-h-[400px]">
                    {selectedBullet ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-yellow-400" />
                                    <input 
                                        type="text"
                                        value={selectedBullet.label}
                                        onChange={(e) => updateBullet('label', e.target.value)}
                                        className="bg-transparent text-xl font-bold text-white uppercase tracking-wider outline-none border-b border-transparent focus:border-cyan-500 transition-colors w-full"
                                    />
                                </div>
                                <div className="text-xs font-mono text-slate-500">ID: {selectedBullet.id}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <TechSlider 
                                    label="Damage Multiplier" 
                                    value={selectedBullet.damageMult || 1.0} 
                                    min={0.1} max={5.0} step={0.1} 
                                    color="red"
                                    onChange={(v) => updateBullet('damageMult', v)}
                                />
                                <TechSlider 
                                    label="Penetration" 
                                    value={selectedBullet.penetration || 0} 
                                    min={0} max={100} 
                                    color="yellow"
                                    onChange={(v) => updateBullet('penetration', v)}
                                />
                                <TechSlider 
                                    label="Velocity Scale" 
                                    value={selectedBullet.velocity || 1.0} 
                                    min={0.5} max={3.0} step={0.1} 
                                    color="cyan"
                                    onChange={(v) => updateBullet('velocity', v)}
                                />
                                <TechSlider 
                                    label="Gravity Scale" 
                                    value={selectedBullet.gravity || 1.0} 
                                    min={0} max={2.0} step={0.1} 
                                    color="purple"
                                    onChange={(v) => updateBullet('gravity', v)}
                                />
                                 <TechSlider 
                                    label="Spread" 
                                    value={selectedBullet.spread || 0} 
                                    min={0} max={45} step={1} 
                                    color="orange" 
                                    onChange={(v) => updateBullet('spread', v)} 
                                />
                                <TechSlider 
                                    label="Recoil Modifier" 
                                    value={selectedBullet.recoilMult || 1.0} 
                                    min={0.5} max={2.0} step={0.1} 
                                    color="green" 
                                    onChange={(v) => updateBullet('recoilMult', v)} 
                                />
                            </div>

                            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded space-y-4">
                                <NeonSwitch 
                                    label="Explosive Payload"
                                    isOn={selectedBullet.isExplosive}
                                    onToggle={() => updateBullet('isExplosive', !selectedBullet.isExplosive)}
                                    color="red"
                                />
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Tracer Color</label>
                                    <div className="flex gap-2">
                                        {['bg-slate-400', 'bg-cyan-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-green-400', 'bg-purple-500'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => updateBullet('color', color)}
                                                className={cn(
                                                    "w-6 h-6 rounded-full border-2 transition-all",
                                                    color,
                                                    selectedBullet.color === color ? "border-white scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            Select an ammo type to configure
                        </div>
                    )}
                </TechCard>
            </div>
        </div>
    );
}
