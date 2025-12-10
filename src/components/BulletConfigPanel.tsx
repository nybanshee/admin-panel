import { useState } from 'react';
import { BulletConfig } from '../types/game';
import { TechCard } from './TechCard';
import { TechSlider } from './TechSlider';
import { NeonSwitch } from './NeonSwitch';
import { cn } from '../lib/utils';
import { Plus, Zap, Trash2, Palette } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { useAuthStore } from '../store/auth';

interface BulletConfigPanelProps {
    bullets: BulletConfig[];
    onUpdate: (bullets: BulletConfig[]) => void;
}

export function BulletConfigPanel({ bullets, onUpdate }: BulletConfigPanelProps) {
    const { user, saveColor, deleteColor } = useAuthStore();
    const [selectedId, setSelectedId] = useState<string | null>(bullets[0]?.id || null);
    const [showColorPicker, setShowColorPicker] = useState(false);

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
            color: '#64748b', // Default hex
            damageMult: 1.0,
            penetration: 0,
            velocity: 1.0,
            gravity: 1.0,
            spread: 0,
            recoilMult: 1.0,
            isExplosive: false,
            grain: 55,
            recoilSpring: { stiffness: 100, damping: 0.5 },
            recoilForce: { x: 0.0, y: 0.5, z: -1.0 },
            recoilRotation: { pitch: -1.0, yaw: 0.2, roll: 0.0 },
            recoilRandomness: { forceJitter: 0.1, rotationJitter: 0.1 }
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
                                <div 
                                    className={cn("w-3 h-3 rounded-full border border-slate-600", b.color.startsWith('bg-') && b.color)}
                                    style={{ backgroundColor: b.color.startsWith('bg-') ? undefined : b.color }}
                                />
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

                            {/* Bullet-centric Recoil */}
                            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded space-y-4">
                                <div className="text-xs font-bold text-slate-400 uppercase">Recoil • Bullet Properties</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <TechSlider 
                                        label="Bullet Grain" 
                                        value={selectedBullet.grain ?? 55} min={10} max={300} step={1} color="yellow"
                                        onChange={(v) => updateBullet('grain', v)}
                                    />
                                    <TechSlider 
                                        label="Spring Stiffness" 
                                        value={selectedBullet.recoilSpring?.stiffness ?? 100} min={0} max={300} step={1} color="green"
                                        onChange={(v) => updateBullet('recoilSpring', { ...(selectedBullet.recoilSpring ?? { damping: 0.5 }), stiffness: v })}
                                    />
                                    <TechSlider 
                                        label="Spring Damping" 
                                        value={selectedBullet.recoilSpring?.damping ?? 0.5} min={0} max={5} step={0.1} color="green"
                                        onChange={(v) => updateBullet('recoilSpring', { ...(selectedBullet.recoilSpring ?? { stiffness: 100 }), damping: v })}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <TechSlider label="Force X" value={selectedBullet.recoilForce?.x ?? 0} min={-2} max={2} step={0.05} color="cyan" onChange={(v)=>updateBullet('recoilForce', { ...(selectedBullet.recoilForce ?? { y:0, z:0 }), x: v })} />
                                    <TechSlider label="Force Y" value={selectedBullet.recoilForce?.y ?? 0.5} min={-2} max={2} step={0.05} color="cyan" onChange={(v)=>updateBullet('recoilForce', { ...(selectedBullet.recoilForce ?? { x:0, z:0 }), y: v })} />
                                    <TechSlider label="Force Z" value={selectedBullet.recoilForce?.z ?? -1.0} min={-2} max={2} step={0.05} color="cyan" onChange={(v)=>updateBullet('recoilForce', { ...(selectedBullet.recoilForce ?? { x:0, y:0 }), z: v })} />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <TechSlider label="Pitch" value={selectedBullet.recoilRotation?.pitch ?? -1.0} min={-10} max={10} step={0.1} color="purple" onChange={(v)=>updateBullet('recoilRotation', { ...(selectedBullet.recoilRotation ?? { yaw:0, roll:0 }), pitch: v })} />
                                    <TechSlider label="Yaw" value={selectedBullet.recoilRotation?.yaw ?? 0.2} min={-10} max={10} step={0.1} color="purple" onChange={(v)=>updateBullet('recoilRotation', { ...(selectedBullet.recoilRotation ?? { pitch:0, roll:0 }), yaw: v })} />
                                    <TechSlider label="Roll" value={selectedBullet.recoilRotation?.roll ?? 0.0} min={-10} max={10} step={0.1} color="purple" onChange={(v)=>updateBullet('recoilRotation', { ...(selectedBullet.recoilRotation ?? { pitch:0, yaw:0 }), roll: v })} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <TechSlider label="Force Jitter" value={selectedBullet.recoilRandomness?.forceJitter ?? 0.1} min={0} max={1} step={0.01} color="orange" onChange={(v)=>updateBullet('recoilRandomness', { ...(selectedBullet.recoilRandomness ?? { rotationJitter: 0.1 }), forceJitter: v })} />
                                    <TechSlider label="Rotation Jitter" value={selectedBullet.recoilRandomness?.rotationJitter ?? 0.1} min={0} max={1} step={0.01} color="orange" onChange={(v)=>updateBullet('recoilRandomness', { ...(selectedBullet.recoilRandomness ?? { forceJitter: 0.1 }), rotationJitter: v })} />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded space-y-4">
                                <NeonSwitch 
                                    label="Explosive Payload"
                                    isOn={selectedBullet.isExplosive}
                                    onToggle={() => updateBullet('isExplosive', !selectedBullet.isExplosive)}
                                    color="red"
                                />
                                
                                <div className="relative">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Tracer Color</label>
                                    <button
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                        className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-700 hover:border-cyan-500 transition-colors"
                                    >
                                        <div 
                                            className={cn("w-6 h-6 rounded-full border border-white/20", selectedBullet.color.startsWith('bg-') && selectedBullet.color)}
                                            style={{ backgroundColor: selectedBullet.color.startsWith('bg-') ? undefined : selectedBullet.color }}
                                        />
                                        <span className="text-xs font-mono text-slate-300">
                                            {selectedBullet.color}
                                        </span>
                                        <Palette className="w-4 h-4 text-slate-500 ml-auto" />
                                    </button>

                                    {showColorPicker && (
                                        <div className="absolute bottom-full left-0 mb-2 z-50 shadow-2xl">
                                            <ColorPicker 
                                                color={selectedBullet.color.startsWith('bg-') ? '#ffffff' : selectedBullet.color}
                                                onChange={(c) => updateBullet('color', c)}
                                                savedColors={user?.theme?.savedColors}
                                                onSaveColor={saveColor}
                                                onDeleteColor={deleteColor}
                                            />
                                        </div>
                                    )}
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
