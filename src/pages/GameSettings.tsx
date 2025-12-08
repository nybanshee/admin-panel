import { useState } from 'react';
import { TechCard } from '../components/TechCard';
import { NeonSwitch } from '../components/NeonSwitch';
import { TechSlider } from '../components/TechSlider';
import { TechSelect } from '../components/TechSelect';
import { TechVector3 } from '../components/TechVector3';
import { ConfigSection } from '../components/ConfigSection';
import { TechTabControl } from '../components/TechTabControl';
import { MagazineSequenceEditor } from '../components/MagazineSequenceEditor';
import { BulletConfigPanel } from '../components/BulletConfigPanel';
import { AttachmentConfigPanel } from '../components/AttachmentConfigPanel';
import { RecoilPatternEditor } from '../components/RecoilPatternEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Crosshair, Move3d, Activity, Target, Component, Layers, PenTool, Map, Swords, Lock, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { WeaponConfig, BulletConfig, AttachmentConfig, GameModeConfig, MapConfig, RecoilPattern } from '../types/game';
import { useAuthStore, hasPermission } from '../store/auth';

// Default Config Template
const defaultWeaponConfig: Omit<WeaponConfig, 'id' | 'name' | 'category' | 'enabled' | 'dualWield' | 'magSequence'> = {
  stats: {
    weight: 3.5,
    gravity: 1,
    gripStrength: 1,
    damage: 30,
    fireRate: 600,
    burstAmount: 1,
    accuracy: 95,
    spread: 0.02,
    recoilPattern: 'Vertical',
    magSize: 30,
    reloadTime: 2.5,
  },
  unlockLevel: 0,
  visuals: {
    skin: 'Default',
    rarity: 'Common',
    fireSound: 'Gunshot_Default',
    tracerColor: 'Green',
  },
  offsets: {
    view: { x: 0, y: 0, z: 0 },
    aim: { x: 0, y: 0, z: 0 },
    muzzle: { x: 0, y: 0, z: -1 },
  },
  springs: {
    recoil: { stiffness: 100, damping: 0.5 },
    sway: { stiffness: 8, damping: 0.6 },
    adsZoom: { stiffness: 50, damping: 0.9 },
    ads: { stiffness: 50, damping: 0.8 },
    movement: { stiffness: 20, damping: 0.6 },
    reload: { stiffness: 40, damping: 0.7 },
    fire: { stiffness: 80, damping: 0.5 },
  },
};

// --- Mock Data ---
const initialBullets: BulletConfig[] = [
    { id: 'std', label: 'Standard FMJ', color: 'bg-slate-400', damageMult: 1.0, penetration: 20, velocity: 1.0, gravity: 1.0, spread: 5, recoilMult: 1.0, isExplosive: false },
    { id: 'ap', label: 'Armor Piercing', color: 'bg-cyan-500', damageMult: 0.9, penetration: 80, velocity: 1.2, gravity: 0.9, spread: 3, recoilMult: 1.2, isExplosive: false },
    { id: 'hp', label: 'Hollow Point', color: 'bg-red-500', damageMult: 1.3, penetration: 5, velocity: 0.9, gravity: 1.0, spread: 8, recoilMult: 1.0, isExplosive: false },
    { id: 'inc', label: 'Incendiary', color: 'bg-orange-500', damageMult: 1.1, penetration: 10, velocity: 1.0, gravity: 1.0, spread: 6, recoilMult: 1.0, isExplosive: false },
    { id: 'exp', label: 'Explosive', color: 'bg-yellow-400', damageMult: 0.8, penetration: 10, velocity: 0.8, gravity: 1.5, spread: 12, recoilMult: 1.5, isExplosive: true },
    { id: 'trc', label: 'Tracer', color: 'bg-green-400', damageMult: 1.0, penetration: 20, velocity: 1.0, gravity: 1.0, spread: 4, recoilMult: 1.0, isExplosive: false },
];

const initialAttachments: AttachmentConfig[] = [
    { id: 'red_dot', name: 'Red Dot Sight', type: 'optic', weight: 0.2, unlockLevel: 0, pros: ['Precision', 'Acquisition'], cons: [] },
    { id: 'acog', name: 'ACOG 4x', type: 'optic', weight: 0.4, unlockLevel: 5, pros: ['Zoom', 'Range'], cons: ['ADS Speed'] },
    { id: 'suppressor', name: 'Tac Suppressor', type: 'muzzle', weight: 0.3, unlockLevel: 10, pros: ['Sound', 'Flash'], cons: ['Range', 'ADS Speed'] },
    { id: 'vert_grip', name: 'Vertical Grip', type: 'grip', weight: 0.2, unlockLevel: 3, pros: ['Recoil Control'], cons: ['Move Speed'] },
    { id: 'ext_mag', name: 'Extended Mag', type: 'mag', weight: 0.5, unlockLevel: 7, pros: ['Ammo Capacity'], cons: ['Reload Speed', 'ADS Speed'] },
];

const gunCategories = [
    { id: 'pistol', label: 'Pistols' },
    { id: 'smg', label: 'SMGs' },
    { id: 'ar', label: 'Assault Rifles' },
    { id: 'sniper', label: 'Snipers' },
    { id: 'shotgun', label: 'Shotguns' },
    { id: 'lmg', label: 'LMGs' },
    { id: 'heavy', label: 'Heavy/Launcher' },
];

export function GameSettings() {
  const user = useAuthStore(s => s.user);
  const roles = useAuthStore(s => s.roles);
  const canEdit = hasPermission(user, roles, 'edit_game_settings');
  const isVisitor = !canEdit;

  const [activeTab, setActiveTab] = useState('guns');
  const [activeGunCategory, setActiveGunCategory] = useState('ar');
  const [expandedGun, setExpandedGun] = useState<string | null>(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // State
  const [bullets, setBullets] = useState<BulletConfig[]>(initialBullets);
  const [attachments, setAttachments] = useState<AttachmentConfig[]>(initialAttachments);
  
  // Data Sync
  const [dataSource, setDataSource] = useState<'manual' | 'http'>('manual');
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
  const [dataUrl, setDataUrl] = useState(`${API_URL}/game-config`);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
      // if (dataSource !== 'http') return; // Allow manual fetch even if not in http mode
      setIsSyncing(true);
      try {
          const res = await fetch(`${API_URL}/game-config`);
          const data = await res.json();
          if (data.guns && Object.keys(data.guns).length > 0) setGuns(data.guns);
          if (data.bullets && data.bullets.length > 0) setBullets(data.bullets);
          if (data.attachments && data.attachments.length > 0) setAttachments(data.attachments);
          if (data.maps && data.maps.length > 0) setMaps(data.maps);
          if (data.gamemodes && data.gamemodes.length > 0) setGamemodes(data.gamemodes);
          if (data.recoilPatterns && data.recoilPatterns.length > 0) setRecoilPatterns(data.recoilPatterns);
      } catch (e) {
          console.error("Failed to sync", e);
      } finally {
          setIsSyncing(false);
      }
  };

  const saveData = async () => {
      if (isVisitor) return;
      setIsSaving(true);
      try {
          await fetch(`${API_URL}/game-config`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  guns,
                  bullets,
                  attachments,
                  maps,
                  gamemodes,
                  recoilPatterns
              })
          });
          // Show success feedback if needed
      } catch (e) {
          console.error("Failed to save", e);
      } finally {
          setIsSaving(false);
      }
  };
  const [maps, setMaps] = useState<MapConfig[]>([
    { id: 'arena', name: 'Cyber Arena', tags: ['small','symmetrical'], enabled: true },
    { id: 'docks', name: 'Neon Docks', tags: ['mid','lanes'], enabled: true },
    { id: 'spire', name: 'Crystal Spire', tags: ['large','vertical'], enabled: true }
  ]);
  const [gamemodes, setGamemodes] = useState<GameModeConfig[]>([
    { id: 'tdm', name: 'Team Deathmatch', enabled: true, mapBanningEnabled: false, bansPerTeam: 1, candidateCount: 3, rotation: [
      { mapId: 'arena', weight: 50 }, { mapId: 'docks', weight: 30 }, { mapId: 'spire', weight: 20 }
    ] },
    { id: 'ctf', name: 'Capture The Flag', enabled: true, mapBanningEnabled: true, bansPerTeam: 2, candidateCount: 5, rotation: [
      { mapId: 'docks', weight: 60 }, { mapId: 'spire', weight: 40 }
    ] }
  ]);
  const [recoilPatterns, setRecoilPatterns] = useState<RecoilPattern[]>(() => {
    const raw = localStorage.getItem('recoilPatterns');
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  const saveRecoilPatterns = (next: RecoilPattern[]) => {
    setRecoilPatterns(next);
    localStorage.setItem('recoilPatterns', JSON.stringify(next));
  };
  
  const [guns, setGuns] = useState<Record<string, WeaponConfig>>({
    ak47: { 
        ...defaultWeaponConfig, 
        id: 'ak47', name: 'AK-47', category: 'ar',
        enabled: true, dualWield: false, magSequence: ['std', 'std', 'trc'],
        stats: { ...defaultWeaponConfig.stats, damage: 35, fireRate: 600, recoilPattern: 'Vertical' },
        attachmentSlots: {
          optic: { allowed: ['red_dot','acog'] },
          muzzle: { allowed: ['suppressor'] },
          grip: { allowed: ['vert_grip'] },
          mag: { allowed: ['ext_mag'] },
          barrel: { allowed: [] },
          stock: { allowed: [] },
        }
    },
    m4a1: { 
        ...defaultWeaponConfig, 
        id: 'm4a1', name: 'M4A1 Carbine', category: 'ar',
        enabled: true, dualWield: false, magSequence: ['std'],
        stats: { ...defaultWeaponConfig.stats, damage: 28, fireRate: 800, weight: 3.2 },
        attachmentSlots: {
          optic: { allowed: ['red_dot','acog'] },
          muzzle: { allowed: ['suppressor'] },
          grip: { allowed: ['vert_grip'] },
          mag: { allowed: ['ext_mag'] },
          barrel: { allowed: [] },
          stock: { allowed: [] },
        }
    },
    deagle: { 
        ...defaultWeaponConfig, 
        id: 'deagle', name: 'Desert Eagle', category: 'pistol',
        enabled: true, dualWield: true, magSequence: ['hp'],
        stats: { ...defaultWeaponConfig.stats, damage: 50, fireRate: 300, magSize: 7, weight: 1.8 },
        attachmentSlots: {
          optic: { allowed: ['red_dot'] },
          muzzle: { allowed: ['suppressor'] },
          grip: { allowed: [] },
          mag: { allowed: [] },
          barrel: { allowed: [] },
          stock: { allowed: [] },
        }
    },
    mp5: {
        ...defaultWeaponConfig,
        id: 'mp5', name: 'MP5 Submachine Gun', category: 'smg',
        enabled: true, dualWield: false, magSequence: ['std'],
        stats: { ...defaultWeaponConfig.stats, fireRate: 900, damage: 22 },
        attachmentSlots: {
          optic: { allowed: ['red_dot','acog'] },
          muzzle: { allowed: ['suppressor'] },
          grip: { allowed: ['vert_grip'] },
          mag: { allowed: ['ext_mag'] },
          barrel: { allowed: [] },
          stock: { allowed: [] },
        }
    }
  });

  // Search Logic
  const searchResults = searchQuery.length > 0 ? [
    ...Object.values(guns).filter(g => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        g.id.includes(searchQuery.toLowerCase())
    ).map(g => ({ type: 'gun', item: g })),
    ...bullets.filter(b => 
        b.label.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(b => ({ type: 'bullet', item: b })),
    ...attachments.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(a => ({ type: 'attachment', item: a })),
    ...maps.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(m => ({ type: 'map', item: m }))
  ] : [];

  // Helpers
  const updateGun = (gunKey: string, path: string[], value: unknown) => {
    setGuns(prev => {
        const newGuns = { ...prev };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = newGuns[gunKey];
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        return newGuns;
    });
  };

  const filteredGuns = Object.values(guns).filter(g => g.category === activeGunCategory);

  const renderGunEditor = (gun: WeaponConfig) => (
    <div key={gun.id} className="relative mb-4">
        {/* Main Gun Row */}
        <div className={cn(
            "flex items-center justify-between p-3 rounded-none border-l-2 transition-all duration-300",
            gun.enabled ? "bg-slate-800/50 border-cyan-500" : "bg-slate-900/50 border-slate-700"
        )}>
            <div className="flex items-center space-x-4 flex-1 cursor-pointer" onClick={() => setExpandedGun(expandedGun === gun.id ? null : gun.id)}>
                <motion.div 
                    animate={{ rotate: expandedGun === gun.id ? 90 : 0 }}
                    className="text-slate-400"
                >
                    <ChevronRight className="h-5 w-5" />
                </motion.div>
                <div className="flex flex-col">
                    <span className={cn(
                        "font-bold uppercase tracking-wide",
                        gun.enabled ? "text-white" : "text-slate-500"
                    )}>
                        {gun.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{gun.id} // {gun.category}</span>
                </div>
            </div>
            <div className="flex items-center space-x-6">
                 {/* Quick Dual Wield Toggle */}
                 <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-bold uppercase", gun.dualWield ? "text-purple-400" : "text-slate-600")}>
                        Dual Wield
                    </span>
                    {isVisitor ? (
                        <div className={cn("w-8 h-4 rounded-full relative transition-colors", gun.dualWield ? "bg-purple-900/50" : "bg-slate-800")}>
                             <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-slate-600 transition-transform", gun.dualWield && "translate-x-4")} />
                        </div>
                    ) : (
                        <NeonSwitch 
                            isOn={gun.dualWield} 
                            onToggle={() => updateGun(gun.id, ['dualWield'], !gun.dualWield)}
                            color="purple"
                        />
                    )}
                 </div>

                <div className="h-6 w-px bg-slate-700 mx-2" />

                <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-mono", gun.enabled ? "text-green-400" : "text-red-400")}>
                        {gun.enabled ? 'ACTIVE' : 'OFF'}
                    </span>
                    {isVisitor ? (
                        <div className={cn("w-8 h-4 rounded-full relative transition-colors", gun.enabled ? "bg-cyan-900/50" : "bg-slate-800")}>
                             <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-slate-600 transition-transform", gun.enabled && "translate-x-4")} />
                        </div>
                    ) : (
                        <NeonSwitch 
                            isOn={gun.enabled} 
                            onToggle={() => updateGun(gun.id, ['enabled'], !gun.enabled)}
                            color={gun.enabled ? "cyan" : "red"}
                        />
                    )}
                </div>
            </div>
        </div>

        {/* Expanded Config Area */}
        <AnimatePresence>
            {expandedGun === gun.id && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="relative ml-6 pl-6 py-4 border-l border-slate-700 space-y-2">
                        {/* Circuit Line Visuals */}
                        <div className="absolute top-0 left-0 w-6 h-full border-l border-slate-700/0">
                            <div className="absolute top-0 left-[-1px] w-4 h-6 border-b border-l border-slate-700 rounded-bl-lg" />
                        </div>

                        {/* Read Only Overlay for Visitor */}
                        {isVisitor && (
                            <div className="mb-4 p-3 bg-slate-900/50 border border-slate-800 rounded flex items-center gap-2 text-yellow-500 text-xs font-mono">
                                <Lock className="w-4 h-4" />
                                <span>VIEW ONLY MODE • CHANGES DISABLED</span>
                            </div>
                        )}

                        {/* Level Unlock & Magazine Sequence Editor */}
                        <div className={cn("mb-6 p-4 bg-slate-900/30 border border-slate-800 rounded-lg space-y-4", isVisitor && "pointer-events-none opacity-70")}>
                            <div className="flex items-center gap-4">
                                <div className="w-32">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Unlock Level</label>
                                    <input 
                                        type="number"
                                        value={gun.unlockLevel || 0}
                                        onChange={(e) => updateGun(gun.id, ['unlockLevel'], parseInt(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:border-cyan-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <MagazineSequenceEditor 
                                        sequence={gun.magSequence}
                                        availableBullets={bullets}
                                        onChange={(newSeq) => updateGun(gun.id, ['magSequence'], newSeq)}
                                        maxSize={gun.stats.magSize}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 1. Core Stats Section */}
                        <ConfigSection title="Core Stats" icon={<Crosshair className="h-4 w-4 text-red-400" />} color="red">
                            <div className={cn("grid grid-cols-2 gap-4", isVisitor && "pointer-events-none opacity-80")}>
                                <TechSlider 
                                    label="Damage" value={gun.stats.damage} min={0} max={200} unit="HP" color="red"
                                    onChange={(val) => updateGun(gun.id, ['stats', 'damage'], val)}
                                />
                                <TechSlider 
                                    label="Fire Rate" value={gun.stats.fireRate} min={0} max={1200} step={10} unit="RPM" color="red"
                                    onChange={(val) => updateGun(gun.id, ['stats', 'fireRate'], val)}
                                />
                                <TechSlider 
                                    label="Mag Size" value={gun.stats.magSize} min={1} max={100} step={1} color="red"
                                    onChange={(val) => updateGun(gun.id, ['stats', 'magSize'], val)}
                                />
                                <TechSelect 
                                    label="Recoil Pattern"
                                    value={gun.statsRecoilPatternId ?? ''}
                                    options={[{ value: '', label: 'None' }, ...recoilPatterns.map(p=>({ value: p.id, label: p.name }))]}
                                    color="red"
                                    onChange={(val) => updateGun(gun.id, ['statsRecoilPatternId'], val)}
                                />
                            </div>
                        </ConfigSection>

                        {/* 2. Offsets (Vectors) */}
                        <ConfigSection title="Offsets & Position" icon={<Move3d className="h-4 w-4 text-cyan-400" />} color="cyan">
                            <div className={cn("space-y-4", isVisitor && "pointer-events-none opacity-80")}>
                                <TechVector3 
                                    label="View Model" value={gun.offsets.view} 
                                    onChange={(val) => updateGun(gun.id, ['offsets', 'view'], val)}
                                />
                                <TechVector3 
                                    label="Aim Down Sights" value={gun.offsets.aim} 
                                    onChange={(val) => updateGun(gun.id, ['offsets', 'aim'], val)}
                                />
                            </div>
                        </ConfigSection>

                        {/* 3. Dynamics (Springs) */}
                        <ConfigSection title="Spring Dynamics" icon={<Activity className="h-4 w-4 text-green-400" />} color="green">
                            <div className={cn("grid grid-cols-2 gap-4", isVisitor && "pointer-events-none opacity-80")}>
                                <div className="p-3 border border-slate-800 bg-slate-900/50">
                                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">Recoil Spring</h4>
                                    <TechSlider 
                                        label="Stiffness" value={gun.springs.recoil.stiffness} min={0} max={200} color="green"
                                        onChange={(val) => updateGun(gun.id, ['springs', 'recoil', 'stiffness'], val)}
                                    />
                                    <TechSlider 
                                        label="Damping" value={gun.springs.recoil.damping} min={0} max={5} step={0.1} color="green"
                                        onChange={(val) => updateGun(gun.id, ['springs', 'recoil', 'damping'], val)}
                                    />
                                </div>
                                <div className="p-3 border border-slate-800 bg-slate-900/50">
                                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">ADS Spring</h4>
                                    <TechSlider label="Stiffness" value={gun.springs.ads.stiffness} min={0} max={200} color="green" onChange={(val)=>updateGun(gun.id,['springs','ads','stiffness'],val)} />
                                    <TechSlider label="Damping" value={gun.springs.ads.damping} min={0} max={5} step={0.1} color="green" onChange={(val)=>updateGun(gun.id,['springs','ads','damping'],val)} />
                                </div>
                                <div className="p-3 border border-slate-800 bg-slate-900/50">
                                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">Movement Spring</h4>
                                    <TechSlider label="Stiffness" value={gun.springs.movement.stiffness} min={0} max={200} color="green" onChange={(val)=>updateGun(gun.id,['springs','movement','stiffness'],val)} />
                                    <TechSlider label="Damping" value={gun.springs.movement.damping} min={0} max={5} step={0.1} color="green" onChange={(val)=>updateGun(gun.id,['springs','movement','damping'],val)} />
                                </div>
                                <div className="p-3 border border-slate-800 bg-slate-900/50">
                                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase">Reload/Firing Springs</h4>
                                    <TechSlider label="Reload Stiffness" value={gun.springs.reload.stiffness} min={0} max={200} color="green" onChange={(val)=>updateGun(gun.id,['springs','reload','stiffness'],val)} />
                                    <TechSlider label="Reload Damping" value={gun.springs.reload.damping} min={0} max={5} step={0.1} color="green" onChange={(val)=>updateGun(gun.id,['springs','reload','damping'],val)} />
                                    <TechSlider label="Fire Stiffness" value={gun.springs.fire.stiffness} min={0} max={200} color="green" onChange={(val)=>updateGun(gun.id,['springs','fire','stiffness'],val)} />
                                    <TechSlider label="Fire Damping" value={gun.springs.fire.damping} min={0} max={5} step={0.1} color="green" onChange={(val)=>updateGun(gun.id,['springs','fire','damping'],val)} />
                                </div>
                            </div>
                        </ConfigSection>

                        <ConfigSection title="Attachment Slots" icon={<Component className="h-4 w-4 text-purple-400" />} color="purple">
                            <div className={cn("grid grid-cols-2 gap-4", isVisitor && "pointer-events-none opacity-80")}>
                                {['optic','muzzle','grip','mag','barrel','stock'].map(slot => (
                                    <div key={slot} className="p-3 border border-slate-800 bg-slate-900/50">
                                        <div className="text-xs font-bold text-slate-500 mb-2 uppercase">{slot}</div>
                                        <div className="mb-2 text-[10px] text-slate-500">Allowed</div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {attachments.filter(a=>a.type===slot || (slot==='barrel' || slot==='stock')===false).map(a=> (
                                                <label key={a.id} className="flex items-center gap-2 text-xs text-slate-300">
                                                    <input type="checkbox" checked={Boolean(gun.attachmentSlots?.[slot as keyof NonNullable<typeof gun.attachmentSlots>]?.allowed.includes(a.id))}
                                                    onChange={(e)=>{
                                                        const cur = gun.attachmentSlots ?? { optic:{allowed:[]}, muzzle:{allowed:[]}, grip:{allowed:[]}, mag:{allowed:[]}, barrel:{allowed:[]}, stock:{allowed:[]} };
                                                        const list = new Set(cur[slot as keyof typeof cur].allowed);
                                                        if(e.target.checked) list.add(a.id); else list.delete(a.id);
                                                        updateGun(gun.id,['attachmentSlots', slot, 'allowed'], Array.from(list));
                                                    }} />
                                                    {a.name}
                                                </label>
                                            ))}
                                        </div>
                                        <div className="mb-2 text-[10px] text-slate-500">Equipped</div>
                                        <select className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-300" value={gun.attachmentSlots?.[slot as keyof NonNullable<typeof gun.attachmentSlots>]?.equipped ?? ''} onChange={(e)=>{
                                            updateGun(gun.id,['attachmentSlots', slot, 'equipped'], e.target.value || undefined);
                                        }}>
                                            <option value="">None</option>
                                            {(gun.attachmentSlots?.[slot as keyof NonNullable<typeof gun.attachmentSlots>]?.allowed ?? []).map(id=>{
                                                const att = attachments.find(a=>a.id===id);
                                                return <option key={id} value={id}>{att?.name ?? id}</option>;
                                            })}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </ConfigSection>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );

  return (
    <div className="space-y-6">
       <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-widest text-white uppercase">
            <span className="text-cyan-500">System</span> Config
            </h1>
            <div className="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-cyan-400 border border-cyan-500/30">
            SYS_VER_4.2.0
        </div>
    </div>
    
    <div className="flex gap-2">
         <button 
            onClick={fetchData} 
            disabled={isSyncing}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-50"
            title="Load from Server"
        >
            <Activity className={cn("w-5 h-5", isSyncing && "animate-spin")} />
        </button>
        {!isVisitor && (
            <button 
                onClick={saveData} 
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-bold disabled:opacity-50 transition-colors"
            >
                {isSaving ? 'Saving...' : 'Save Config'}
                <Save className="w-4 h-4" />
            </button>
        )}
    </div>
    
    {/* Search Bar */}
    <div className="relative w-full md:w-96">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Target className="w-4 h-4" />
            </div>
            <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none transition-colors"
            />
        </div>
      </motion.div>

      {/* Main Tab Control (Hidden when searching) */}
      {!searchQuery && (
      <TechTabControl 
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
            { id: 'guns', label: 'Weapons', icon: <Target className="w-4 h-4" /> },
            { id: 'bullets', label: 'Ammunition', icon: <Layers className="w-4 h-4" /> },
            { id: 'attachments', label: 'Attachments', icon: <Component className="w-4 h-4" /> },
            { id: 'gamemodes', label: 'Gamemodes', icon: <Swords className="w-4 h-4" /> },
            { id: 'maps', label: 'Maps', icon: <Map className="w-4 h-4" /> },
            { id: 'recoil', label: 'Recoil Lab', icon: <PenTool className="w-4 h-4" /> },
        ]}
      />
      )}
      

      {/* Content Area */}
      <div className="min-h-[600px]">
        {searchQuery ? (
            <div className="space-y-4">
                <h2 className="text-slate-400 font-mono text-sm uppercase tracking-wider">Search Results ({searchResults.length})</h2>
                {searchResults.length === 0 ? (
                    <div className="text-center py-12 text-slate-600 italic border border-dashed border-slate-800 rounded">
                        No matches found.
                    </div>
                ) : (
                    searchResults.map((result: any, i) => (
                        <div key={i}>
                            {result.type === 'gun' && renderGunEditor(result.item)}
                            {result.type === 'bullet' && (
                                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-3 h-3 rounded-full", result.item.color)} />
                                        <span className="text-white font-bold">{result.item.label}</span>
                                        <span className="text-xs text-slate-500 uppercase">Ammo Type</span>
                                    </div>
                                    <button onClick={() => { setSearchQuery(''); setActiveTab('bullets'); }} className="text-xs text-cyan-400 hover:underline">
                                        Go to Editor
                                    </button>
                                </div>
                            )}
                            {result.type === 'attachment' && (
                                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Component className="w-4 h-4 text-purple-400" />
                                        <span className="text-white font-bold">{result.item.name}</span>
                                        <span className="text-xs text-slate-500 uppercase">{result.item.type}</span>
                                    </div>
                                    <button onClick={() => { setSearchQuery(''); setActiveTab('attachments'); }} className="text-xs text-cyan-400 hover:underline">
                                        Go to Editor
                                    </button>
                                </div>
                            )}
                            {result.type === 'map' && (
                                <div className="p-4 bg-slate-900/50 border border-slate-700 rounded flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Map className="w-4 h-4 text-green-400" />
                                        <span className="text-white font-bold">{result.item.name}</span>
                                        <span className="text-xs text-slate-500 uppercase">{result.item.id}</span>
                                    </div>
                                    <button onClick={() => { setSearchQuery(''); setActiveTab('maps'); }} className="text-xs text-cyan-400 hover:underline">
                                        Go to Editor
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        ) : (
        <div>
        {activeTab === 'guns' && (
            <div className="space-y-6">
                {/* Gun Category Filter */}
                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {gunCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveGunCategory(cat.id)}
                            className={cn(
                                "px-4 py-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider border transition-all",
                                activeGunCategory === cat.id 
                                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" 
                                    : "bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <TechCard>
                    <div className="space-y-2">
                        {filteredGuns.length > 0 ? (
                            filteredGuns.map(renderGunEditor)
                        ) : (
                            <div className="text-center py-12 text-slate-600 italic">
                                No weapons found in this category.
                            </div>
                        )}
                    </div>
                </TechCard>
            </div>
        )}

        {activeTab === 'bullets' && (
            <div className={cn(isVisitor && "pointer-events-none opacity-80")}>
                <BulletConfigPanel 
                    bullets={bullets} 
                    onUpdate={setBullets} 
                />
            </div>
        )}

        {activeTab === 'attachments' && (
             <div className={cn(isVisitor && "pointer-events-none opacity-80")}>
                <AttachmentConfigPanel 
                    attachments={attachments}
                    onUpdate={setAttachments}
                />
            </div>
        )}

        {activeTab === 'gamemodes' && (
          <TechCard>
            <div className={cn("space-y-6", isVisitor && "pointer-events-none opacity-80")}>
              {gamemodes.map((gm, idx) => (
                <div key={gm.id} className="p-4 border border-slate-800 bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-white font-bold uppercase tracking-wider">{gm.name}</span>
                      <NeonSwitch isOn={gm.enabled} color={gm.enabled ? 'cyan':'red'} onToggle={() => {
                        setGamemodes(prev => prev.map(g => g.id===gm.id ? { ...g, enabled: !g.enabled } : g));
                      }} />
                      <div className="h-6 w-px bg-slate-700" />
                      <span className="text-xs text-slate-400">Map Banning</span>
                      <NeonSwitch isOn={gm.mapBanningEnabled} color={gm.mapBanningEnabled ? 'yellow':'red'} onToggle={() => {
                        setGamemodes(prev => prev.map(g => g.id===gm.id ? { ...g, mapBanningEnabled: !g.mapBanningEnabled } : g));
                      }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <TechSlider label="Bans Per Team" value={gm.bansPerTeam} min={0} max={5} step={1} color="yellow" onChange={(val)=>{
                      setGamemodes(prev=>prev.map(g=>g.id===gm.id?{...g,bansPerTeam:val}:g));
                    }} />
                    <TechSlider label="Candidate Map Count" value={gm.candidateCount} min={1} max={10} step={1} color="yellow" onChange={(val)=>{
                      setGamemodes(prev=>prev.map(g=>g.id===gm.id?{...g,candidateCount:val}:g));
                    }} />
                  </div>
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Rotation Weights</h4>
                    <div className="space-y-3">
                      {gm.rotation.map((entry, i) => {
                        const map = maps.find(m=>m.id===entry.mapId);
                        return (
                          <div key={entry.mapId} className="grid grid-cols-6 gap-3 items-center">
                            <span className="col-span-2 text-slate-300 text-sm">{map?.name ?? entry.mapId}</span>
                            <TechSlider label="Weight" value={entry.weight} min={0} max={100} step={1} color="cyan" onChange={(val)=>{
                              setGamemodes(prev=>prev.map(g=>{
                                if(g.id!==gm.id) return g;
                                const rot = g.rotation.slice();
                                rot[i] = { ...rot[i], weight: val };
                                return { ...g, rotation: rot };
                              }));
                            }} />
                            <button className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-300" onClick={()=>{
                              setGamemodes(prev=>prev.map(g=>{
                                if(g.id!==gm.id) return g;
                                const rot = g.rotation.filter(r=>r.mapId!==entry.mapId);
                                return { ...g, rotation: rot };
                              }));
                            }}>Remove</button>
                          </div>
                        );
                      })}
                      <div className="flex gap-2">
                        <select className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-300" onChange={(e)=>{
                          const mapId = e.target.value;
                          if(!mapId) return;
                          setGamemodes(prev=>prev.map(g=> g.id===gm.id ? { ...g, rotation: [...g.rotation, { mapId, weight: 10 }] } : g));
                          e.currentTarget.selectedIndex = 0;
                        }}>
                          <option value="">Add Map to Rotation</option>
                          {maps.filter(m=>!gm.rotation.some(r=>r.mapId===m.id)).map(m=> (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TechCard>
        )}

        {activeTab === 'maps' && (
          <TechCard>
            <div className={cn("space-y-4", isVisitor && "pointer-events-none opacity-80")}>
              {maps.map((m, i)=> (
                <div key={m.id} className="p-4 border border-slate-800 bg-slate-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-300" value={m.name} onChange={(e)=>{
                      setMaps(prev=>prev.map(mm=> mm.id===m.id ? { ...mm, name: e.target.value } : mm));
                    }} />
                    <span className="text-xs text-slate-500">{m.id}</span>
                    <NeonSwitch isOn={m.enabled} color={m.enabled?'cyan':'red'} onToggle={()=>{
                      setMaps(prev=>prev.map(mm=> mm.id===m.id ? { ...mm, enabled: !mm.enabled } : mm));
                    }} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <input className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-300" placeholder="tag,tag" value={m.tags.join(',')} onChange={(e)=>{
                      const tags = e.target.value.split(',').map(t=>t.trim()).filter(Boolean);
                      setMaps(prev=>prev.map(mm=> mm.id===m.id ? { ...mm, tags } : mm));
                    }} />
                  </div>
                </div>
              ))}
              <button className="px-4 py-2 bg-cyan-500 text-slate-900 font-bold" onClick={()=>{
                const nid = `map_${Date.now()}`;
                setMaps(prev=> [...prev, { id: nid, name: 'New Map', tags: [], enabled: true }]);
              }}>Add Map</button>
            </div>
          </TechCard>
        )}

        {activeTab === 'recoil' && (
            <div className={cn("grid grid-cols-3 gap-4 min-h-[600px]", isVisitor && "pointer-events-none opacity-80")}>
                <div className="col-span-2 h-[600px]">
                    <RecoilPatternEditor 
                        onSave={(pattern) => {
                            const id = `rp_${Date.now()}`;
                            const createdAt = Date.now();
                            const name = `Pattern ${new Date().toLocaleTimeString()}`;
                            const next: RecoilPattern = { id, name, points: pattern, createdAt };
                            saveRecoilPatterns([ ...recoilPatterns, next ]);
                        }} 
                    />
                </div>
                <div className="col-span-1">
                    <TechCard>
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Saved Patterns</h3>
                            {recoilPatterns.length === 0 && (
                                <div className="text-xs text-slate-500">No patterns saved.</div>
                            )}
                            {recoilPatterns.map(p=> (
                                <div key={p.id} className="flex items-center justify-between border border-slate-800 bg-slate-900/40 p-3">
                                    <div>
                                        <div className="text-white text-sm font-bold">{p.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">{p.points.length} pts</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-red-400" onClick={()=>{
                                            const next = recoilPatterns.filter(r=>r.id!==p.id);
                                            saveRecoilPatterns(next);
                                        }}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TechCard>
                </div>
            </div>
        )}
      </div>
      )}
    </div>
  </div>
  );
}
