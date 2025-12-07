import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Flag, Lock, Shield, Swords, Users, Map as MapIcon, Settings, Crosshair } from 'lucide-react';
import { cn } from '../lib/utils';

interface SkillNode {
    id: string;
    title: string;
    description: string;
    status: 'locked' | 'unlocked' | 'mastered' | 'researching';
    x: number; // Grid Column (0-4)
    y: number; // Grid Row (0-4)
    parents: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
}

const SKILL_TREE_DATA: SkillNode[] = [
    // Column 0: Core / Prototype
    { id: 'engine', title: 'Core Engine', description: 'Physics & Rendering', status: 'mastered', x: 0, y: 2, parents: [], icon: Rocket },
    
    // Column 1: Systems
    { id: 'weapons', title: 'Weapon System', description: 'Ballistics & Recoil', status: 'mastered', x: 1, y: 1, parents: ['engine'], icon: Crosshair },
    { id: 'networking', title: 'Networking', description: 'Server Replication', status: 'unlocked', x: 1, y: 3, parents: ['engine'], icon: Users },
    
    // Column 2: Tools & Gameplay
    { id: 'admin', title: 'Admin Panel', description: 'Game Config Dashboard', status: 'researching', x: 2, y: 0, parents: ['weapons'], icon: Settings },
    { id: 'customization', title: 'Customization', description: 'Skins & Attachments', status: 'locked', x: 2, y: 1, parents: ['weapons'], icon: Swords },
    { id: 'map_editor', title: 'Map Editor', description: 'Level Design Tools', status: 'locked', x: 2, y: 2, parents: ['engine'], icon: MapIcon },
    { id: 'matchmaking', title: 'Ranked Play', description: 'ELO System', status: 'locked', x: 2, y: 3, parents: ['networking'], icon: Flag },
    
    // Column 3: Security & Polish
    { id: 'anticheat', title: 'Anti-Cheat', description: 'Kernel Security', status: 'locked', x: 3, y: 3, parents: ['matchmaking'], icon: Shield },
    
    // Column 4: Launch
    { id: 'release', title: 'Global Release', description: 'v1.0 Launch', status: 'locked', x: 4, y: 2, parents: ['anticheat', 'map_editor', 'admin'], icon: Rocket },
];

const GRID_SIZE_X = 250;
const GRID_SIZE_Y = 150;
const OFFSET_X = 100;
const OFFSET_Y = 100;

export function RoadMap() {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    
    // Drag constraints reference
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate node positions
    const getNodePos = (node: SkillNode) => ({
        x: node.x * GRID_SIZE_X + OFFSET_X,
        y: node.y * GRID_SIZE_Y + OFFSET_Y
    });

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 to-slate-950 pointer-events-none" />
            
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-8 pointer-events-none">
                <div className="pointer-events-auto">
                    <h1 className="text-3xl font-bold tracking-widest text-white uppercase">
                        <span className="text-purple-500">Tech</span> Tree
                    </h1>
                    <p className="text-slate-500 font-mono text-sm mt-1">Research & Development Path</p>
                </div>
                <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-wider pointer-events-auto">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 border border-green-500 bg-green-500/20" /> Mastered</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 border border-cyan-500 bg-cyan-500/20 animate-pulse" /> Researching</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 border border-slate-700 bg-slate-900" /> Locked</div>
                </div>
            </div>

            {/* Draggable Tree Area */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden bg-slate-950/50 rounded-lg border border-slate-800 cursor-grab active:cursor-grabbing">
                <motion.div 
                    drag
                    dragConstraints={containerRef}
                    className="min-w-[1200px] min-h-[800px] relative origin-top-left"
                >
                    
                    {/* Connection Lines Layer (SVG) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {SKILL_TREE_DATA.map(node => {
                            const start = getNodePos(node);
                            return node.parents.map(parentId => {
                                const parent = SKILL_TREE_DATA.find(n => n.id === parentId);
                                if (!parent) return null;
                                const end = getNodePos(parent);
                                
                                const isUnlocked = node.status !== 'locked';
                                
                                return (
                                    <g key={`${node.id}-${parentId}`}>
                                        {/* Background Line */}
                                        <line 
                                            x1={end.x + 32} y1={end.y + 32} // +32 for half-width of 64px node
                                            x2={start.x + 32} y2={start.y + 32} 
                                            stroke="#1e293b" 
                                            strokeWidth="4" 
                                        />
                                        {/* Active Line (if unlocked path) */}
                                        {isUnlocked && (
                                            <motion.line
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                x1={end.x + 32} y1={end.y + 32}
                                                x2={start.x + 32} y2={start.y + 32}
                                                stroke={node.status === 'researching' ? '#22d3ee' : '#22c55e'}
                                                strokeWidth="2"
                                                strokeDasharray="4 4"
                                            />
                                        )}
                                    </g>
                                );
                            });
                        })}
                    </svg>

                    {/* Nodes Layer */}
                    {SKILL_TREE_DATA.map((node) => {
                        const pos = getNodePos(node);
                        const isMastered = node.status === 'mastered';
                        const isResearching = node.status === 'researching';
                        const isLocked = node.status === 'locked';

                        return (
                            <motion.div
                                key={node.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: node.x * 0.1 }}
                                className="absolute z-10"
                                style={{ left: pos.x, top: pos.y }}
                            >
                                {/* Hexagon / Node Container */}
                                <div 
                                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                                    className={cn(
                                        "w-16 h-16 flex items-center justify-center relative cursor-pointer transition-all duration-300 group",
                                        isMastered ? "bg-green-950 border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]" :
                                        isResearching ? "bg-cyan-950 border-2 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse" :
                                        "bg-slate-900 border-2 border-slate-700 grayscale opacity-70 hover:opacity-100 hover:border-slate-500"
                                    )}
                                    style={{ transform: 'rotate(45deg)', borderRadius: '12px' }}
                                >
                                    {/* Icon (Counter-rotated) */}
                                    <div style={{ transform: 'rotate(-45deg)' }}>
                                        <node.icon className={cn(
                                            "w-8 h-8",
                                            isMastered ? "text-green-400" :
                                            isResearching ? "text-cyan-400" :
                                            "text-slate-500"
                                        )} />
                                    </div>

                                    {/* Status Badge */}
                                    {isLocked && (
                                        <div className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-1 border border-slate-600 z-20" style={{ transform: 'rotate(-45deg)' }}>
                                            <Lock className="w-3 h-3 text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Label */}
                                <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center w-32">
                                    <div className={cn(
                                        "text-xs font-bold uppercase tracking-wider mb-1",
                                        isMastered ? "text-green-400" :
                                        isResearching ? "text-cyan-400" :
                                        "text-slate-500"
                                    )}>
                                        {node.title}
                                    </div>
                                    <div className="text-[10px] text-slate-600 font-mono leading-tight">
                                        {node.description}
                                    </div>
                                </div>

                                {/* Details Popover (On Click) */}
                                {selectedNode === node.id && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute top-full mt-12 left-1/2 -translate-x-1/2 w-64 bg-slate-900/95 border border-slate-700 p-4 rounded-lg shadow-2xl z-50 backdrop-blur"
                                    >
                                        <h3 className="text-white font-bold mb-1">{node.title}</h3>
                                        <p className="text-slate-400 text-xs mb-3">{node.description}</p>
                                        
                                        <div className="flex justify-between items-center text-[10px] font-mono uppercase text-slate-500">
                                            <span>Status:</span>
                                            <span className={cn(
                                                isMastered ? "text-green-400" :
                                                isResearching ? "text-cyan-400" : "text-slate-500"
                                            )}>{node.status}</span>
                                        </div>
                                        
                                        {isResearching && (
                                            <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                                                <div className="bg-cyan-500 h-full w-[60%]" />
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}
