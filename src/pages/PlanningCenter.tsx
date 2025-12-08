import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Move, StickyNote, Type, X, Network, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { TechTabControl } from '../components/TechTabControl';
import { RoadMap } from './RoadMap';
import { Network3DCanvas } from '../components/Network3DCanvas';
import { cn } from '../lib/utils';

interface PlanNode {
    id: string;
    type: 'note' | 'task' | 'image';
    x: number;
    y: number;
    content: string;
    color: string;
    width?: number;
    height?: number;
}

const COLORS = [
    'bg-yellow-400', // Classic Sticky
    'bg-cyan-400',   // Tech
    'bg-red-400',    // Urgent
    'bg-green-400',  // Success
    'bg-purple-400', // Idea
    'bg-slate-800',  // Dark Mode
];

export function PlanningCenter() {
    const [activeTab, setActiveTab] = useState('trello');
    const [socket, setSocket] = useState<any>(null);
    const [online, setOnline] = useState(false);
    const BOARD_ID = 'main';
    const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
    const containerRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<PlanNode[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    
    // Infinite Canvas State
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const isDraggingCanvas = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Persist to local storage whenever nodes change
    useEffect(() => {
        const s = io(API_URL, { transports: ['websocket'] });
        setSocket(s);
        s.on('connect', ()=> setOnline(true));
        s.on('disconnect', ()=> setOnline(false));
        s.emit('join_board', { boardId: BOARD_ID });
        s.on('nodes_update', (payload: { nodes: PlanNode[] }) => {
            setNodes(payload.nodes ?? []);
        });
        fetch(`${API_URL}/boards/${BOARD_ID}`).then(r=>r.json()).then(b=>{
            setNodes(b.nodes ?? []);
            setOnline(true);
        }).catch(()=>{ setOnline(false); });
        return () => { s.disconnect(); };
    }, []);

    const addNode = (type: PlanNode['type']) => {
        // Add node at center of current view
        const centerX = -pan.x + (containerRef.current?.clientWidth || 800) / 2 / zoom;
        const centerY = -pan.y + (containerRef.current?.clientHeight || 600) / 2 / zoom;
        
        const newNode: PlanNode = {
            id: Date.now().toString(),
            type,
            x: centerX - 100, // Center offset
            y: centerY - 75,
            content: type === 'note' ? 'New Note' : 'New Task',
            color: COLORS[Math.floor(Math.random() * (COLORS.length - 1))], // Random light color
        };
        const next = [...nodes, newNode];
        setNodes(next);
        if (online) {
            socket?.emit('nodes_update', { boardId: BOARD_ID, nodes: next });
            fetch(`${API_URL}/boards/${BOARD_ID}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nodes: next }) }).catch(()=>{});
        }
    };

    const updateNode = (id: string, updates: Partial<PlanNode>) => {
        const next = nodes.map(n => n.id === id ? { ...n, ...updates } : n);
        setNodes(next);
        if (online) {
            socket?.emit('nodes_update', { boardId: BOARD_ID, nodes: next });
            fetch(`${API_URL}/boards/${BOARD_ID}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nodes: next }) }).catch(()=>{});
        }
    };

    const deleteNode = (id: string) => {
        const next = nodes.filter(n => n.id !== id);
        setNodes(next);
        setSelectedId(null);
        if (online) {
            socket?.emit('nodes_update', { boardId: BOARD_ID, nodes: next });
            fetch(`${API_URL}/boards/${BOARD_ID}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nodes: next }) }).catch(()=>{});
        }
    };
    
    // Canvas Interaction Handlers
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            // Zoom
            e.preventDefault();
            const scale = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(z => Math.min(Math.max(z * scale, 0.1), 5));
        } else {
            // Pan
            setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
            isDraggingCanvas.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isDraggingCanvas.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleCanvasMouseUp = () => {
        isDraggingCanvas.current = false;
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col relative overflow-hidden bg-slate-950 border border-slate-800 rounded-lg">
            {!online && (
              <div className="absolute top-0 left-0 right-0 z-50 p-3 bg-red-500/15 border-b border-red-500/30 text-red-300 text-xs font-mono text-center">
                Realtime server offline. Changes won’t be saved for collaborators.
              </div>
            )}
            <div className="p-4 z-50 relative pointer-events-none">
                <div className="pointer-events-auto inline-block">
                    <TechTabControl
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        tabs={[
                            { id: 'trello', label: 'Infinite Board', icon: <LayoutGrid className="w-4 h-4" /> },
                            { id: 'roadmap', label: 'Road Map', icon: <LayoutGrid className="w-4 h-4" /> },
                            { id: 'network', label: '3D Network', icon: <Network className="w-4 h-4" /> },
                        ]}
                    />
                </div>
            </div>
            
            {/* Header / Toolbar */}
            {activeTab === 'trello' && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full shadow-2xl">
                <button 
                    onClick={() => addNode('note')}
                    className="p-3 rounded-full hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Add Note"
                >
                    <StickyNote className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => addNode('task')}
                    className="p-3 rounded-full hover:bg-slate-800 text-slate-400 hover:text-green-400 transition-colors"
                    title="Add Task"
                >
                    <Type className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => addNode('image')}
                    className="p-3 rounded-full hover:bg-slate-800 text-slate-400 hover:text-purple-400 transition-colors"
                    title="Add Image"
                >
                    <ImageIcon className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-slate-700 mx-1" />
                <div className="px-3 text-xs font-mono text-slate-500 uppercase">
                    {Math.round(zoom * 100)}%
                </div>
                <button onClick={() => { setPan({x:0,y:0}); setZoom(1); }} className="text-xs text-cyan-400 hover:underline">
                    Reset
                </button>
            </div>
            )}

            {/* Trello Canvas Area */}
            {activeTab === 'trello' && (
            <div 
                ref={containerRef} 
                className="flex-1 w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing bg-slate-950 canvas-bg"
                onWheel={handleWheel}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
            >
                {/* Background Grid */}
                <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
                        backgroundPosition: `${pan.x}px ${pan.y}px`
                    }}
                />

                <motion.div 
                    className="absolute top-0 left-0 w-full h-full origin-top-left pointer-events-none"
                    style={{ 
                        x: pan.x, 
                        y: pan.y, 
                        scale: zoom 
                    }}
                >
                    <AnimatePresence>
                        {nodes.map((node) => (
                            <motion.div
                                key={node.id}
                                drag
                                dragMomentum={false}
                                // Remove constraints for infinite canvas
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1, x: node.x, y: node.y }}
                                exit={{ scale: 0, opacity: 0 }}
                                onDragEnd={(_, info) => {
                                    // Update position relative to canvas origin, accounting for zoom is tricky with Framer Motion drag
                                    // Framer Motion updates the x/y in the style. 
                                    // We need to sync the final visual position back to state.
                                    // The visual position is relative to the parent motion.div which is panned/zoomed.
                                    // Actually, simpler: Framer Motion drag applies transform to the element itself.
                                    // If we want "infinite" canvas where position is absolute coordinate space:
                                    // We update state x/y.
                                    
                                    // For simplicity in this hybrid mode:
                                    // We let Framer Motion handle the drag visual.
                                    // On drag end, we take the delta, divide by zoom, and update state.
                                    
                                    // Note: This simple update logic might drift if zoom != 1.
                                    // Robust infinite canvas usually doesn't use Framer Motion drag for elements inside a zoomed container easily.
                                    // But let's try:
                                    updateNode(node.id, { 
                                        x: node.x + info.offset.x / zoom, 
                                        y: node.y + info.offset.y / zoom 
                                    });
                                }}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); }}
                                className={cn(
                                    "absolute w-64 p-4 rounded shadow-xl cursor-default group pointer-events-auto",
                                    node.color,
                                    selectedId === node.id ? "ring-2 ring-white z-50 scale-105" : "z-10 hover:z-20"
                                )}
                                // Important: Don't bind x/y here if using layout/animate props for position, 
                                // but we need to set initial position. 
                                // Actually, for an infinite canvas, it's better to position via `style={{ left: node.x, top: node.y }}` 
                                // and NOT use `animate={{ x, y }}` for positioning if we want precise control.
                                // But keeping current style for consistency with previous code.
                            >
                                {/* Drag Handle */}
                                <div className="absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Move className="w-4 h-4 text-black/50" />
                                </div>

                                {/* Delete Button */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNode(node.id);
                                    }}
                                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity text-black/50 hover:text-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* Content */}
                                {node.type === 'image' ? (
                                    <div className="mt-4 space-y-2">
                                        <input 
                                            value={node.content}
                                            onChange={(e) => updateNode(node.id, { content: e.target.value })}
                                            className="w-full bg-transparent border border-black/20 px-2 py-1 text-slate-900"
                                            placeholder="Image URL"
                                            onMouseDown={(e) => e.stopPropagation()}
                                        />
                                        {node.content && (
                                            <img src={node.content} alt="" className="w-full h-32 object-cover rounded" onMouseDown={(e)=>e.stopPropagation()} />
                                        )}
                                    </div>
                                ) : (
                                    <textarea
                                        value={node.content}
                                        onChange={(e) => updateNode(node.id, { content: e.target.value })}
                                        className="w-full h-32 mt-4 bg-transparent border-none resize-none focus:ring-0 text-slate-900 font-medium placeholder-black/30"
                                        placeholder="Type something..."
                                        onMouseDown={(e) => e.stopPropagation()}
                                    />
                                )}
                                
                                {/* Footer info */}
                                <div className="absolute bottom-2 right-2 text-[10px] text-black/40 font-mono uppercase">
                                    {node.type} • {node.id.slice(-4)}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
            )}

            {activeTab === 'roadmap' && (
              <div className="flex-1 overflow-auto p-4">
                <RoadMap />
              </div>
            )}

            {activeTab === 'network' && (
              <div className="flex-1 relative p-4 h-full">
                <div className="h-[calc(100vh-12rem)]">
                  <Network3DCanvas />
                </div>
              </div>
            )}

            {activeTab === 'trello' && (
              <div className="absolute bottom-4 left-4 text-xs text-slate-600 font-mono pointer-events-none z-50">
                  Scroll/Drag to Pan • Ctrl+Scroll to Zoom • Double Click to edit
              </div>
            )}
        </div>
    );
}

 
