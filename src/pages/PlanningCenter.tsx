import { useState, useRef, useEffect, memo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Move, StickyNote, Type, X, Network, LayoutGrid, Image as ImageIcon, Box, PenTool, Palette, Save, Trash2, Cuboid, Eraser } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Stage, OrbitControls } from '@react-three/drei';
import { TechTabControl } from '../components/TechTabControl';
import { RoadMap } from './RoadMap';
import { Network3DCanvas } from '../components/Network3DCanvas';
import { cn } from '../lib/utils';
import { useAuthStore, hasPermission } from '../store/auth';
import { ColorPicker } from '../components/ColorPicker';

interface PlanNode {
    id: string;
    type: 'note' | 'task' | 'image' | 'container' | 'model3d' | 'whiteboard';
    x: number;
    y: number;
    content: string;
    color: string;
    width?: number;
    height?: number;
}

interface DrawingPath {
    id: string;
    points: { x: number, y: number }[];
    color: string;
    width: number;
}

const COLORS = [
    'bg-yellow-400', // Classic Sticky
    'bg-cyan-400',   // Tech
    'bg-red-400',    // Urgent
    'bg-green-400',  // Success
    'bg-purple-400', // Idea
    'bg-slate-800',  // Dark Mode
];

const ModelViewer = ({ url }: { url: string }) => {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
};

const WhiteboardEditor = ({ 
    initialPaths, 
    onChange, 
    isVisitor 
}: { 
    initialPaths: DrawingPath[], 
    onChange: (paths: DrawingPath[]) => void,
    isVisitor: boolean 
}) => {
    const [paths, setPaths] = useState<DrawingPath[]>(initialPaths);
    const [color, setColor] = useState('#000000');
    const isDrawing = useRef(false);
    const currentPath = useRef<DrawingPath | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Sync external changes
    useEffect(() => {
        setPaths(initialPaths);
    }, [initialPaths]);

    const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (isVisitor) return;
        e.stopPropagation();
        isDrawing.current = true;
        const point = getPoint(e);
        const newPath: DrawingPath = {
            id: Date.now().toString(),
            points: [point],
            color,
            width: 3
        };
        currentPath.current = newPath;
        setPaths(prev => [...prev, newPath]);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current || !currentPath.current) return;
        e.stopPropagation();
        const point = getPoint(e);
        currentPath.current.points.push(point);
        setPaths(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = { ...currentPath.current! };
            return copy;
        });
    };

    const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        e.stopPropagation();
        isDrawing.current = false;
        onChange(paths);
        currentPath.current = null;
    };

    return (
        <div className="w-full h-full flex flex-col bg-white rounded overflow-hidden">
            {!isVisitor && (
                <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-2 gap-2" onMouseDown={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                        {['#000000', '#ef4444', '#22c55e', '#3b82f6'].map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={cn("w-4 h-4 rounded-full border border-slate-300", color === c && "ring-2 ring-slate-400")}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <div className="w-px h-4 bg-slate-300 mx-1" />
                    <button 
                        onClick={() => { setPaths([]); onChange([]); }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        title="Clear Board"
                    >
                        <Eraser className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-[10px] text-slate-400 font-mono text-right uppercase tracking-wider">
                        Whiteboard
                    </div>
                </div>
            )}
            <svg
                ref={svgRef}
                className="flex-1 w-full h-full touch-none cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            >
                {paths.map(path => (
                    <polyline
                        key={path.id}
                        points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke={path.color}
                        strokeWidth={path.width}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ))}
            </svg>
        </div>
    );
};

const BoardNode = memo(({ 
    node, 
    isVisitor, 
    zoom, 
    isSelected, 
    isHovered, 
    onDrag, 
    onDragEnd, 
    onUpdate, 
    onDelete, 
    onSelect 
}: {
    node: PlanNode;
    isVisitor: boolean;
    zoom: number;
    isSelected: boolean;
    isHovered: boolean;
    onDrag: (id: string, offset: {x:number, y:number}) => void;
    onDragEnd: (id: string, offset: {x:number, y:number}) => void;
    onUpdate: (id: string, updates: Partial<PlanNode>) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
}) => {
    const [resizing, setResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

    const handleResizeStart = (e: React.MouseEvent) => {
        if (isVisitor) return;
        e.stopPropagation();
        setResizing(true);
        setResizeStart({ 
            x: e.clientX, 
            y: e.clientY, 
            w: node.width || (node.type === 'container' ? 400 : 256), 
            h: node.height || (node.type === 'container' ? 400 : 'auto') as number 
        });
    };

    useEffect(() => {
        if (!resizing) return;
        
        const handleMove = (e: MouseEvent) => {
            const dx = (e.clientX - resizeStart.x) / zoom;
            const dy = (e.clientY - resizeStart.y) / zoom;
            onUpdate(node.id, { 
                width: Math.max(200, resizeStart.w + dx),
                height: Math.max(100, resizeStart.h + dy)
            });
        };

        const handleUp = () => {
            setResizing(false);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [resizing, resizeStart, zoom, node.id, onUpdate]);

    return (
        <motion.div
            key={node.id}
            drag={!isVisitor && !resizing}
            dragMomentum={false}
            dragElastic={0}
            // Remove initial/exit animations for better performance
            style={{
                x: node.x,
                y: node.y,
                width: node.width || (node.type === 'container' ? 400 : 256),
                height: node.height || (node.type === 'container' ? 400 : 'auto'),
                minHeight: node.type === 'container' || node.type === 'model3d' || node.type === 'whiteboard' ? 300 : undefined
            }}
            onDrag={(_, info) => onDrag(node.id, info.offset)}
            onDragEnd={(_, info) => onDragEnd(node.id, info.offset)}
            onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
            className={cn(
                "absolute rounded shadow-xl cursor-default group pointer-events-auto",
                node.type === 'container' ? cn(
                    "border-2 border-dashed transition-all duration-200",
                    // Only apply bg color change on hover, no border change to save paint
                    isHovered ? "bg-cyan-900/20 border-cyan-500/50" : "border-slate-700 bg-transparent"
                ) : node.color,
                node.type === 'container' ? "z-0" : "z-10",
                isSelected ? "ring-2 ring-white z-50 scale-105" : "hover:z-20"
            )}
        >
            {/* Container Resize Handle */}
            {(node.type === 'container' || node.type === 'model3d' || node.type === 'whiteboard') && !isVisitor && (
                <div 
                    className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize hover:bg-white/20 rounded-br z-50"
                    onMouseDown={handleResizeStart}
                />
            )}

            {/* Drag Handle */}
            {!isVisitor && (
            <div className="absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                <Move className="w-4 h-4 text-black/50" />
            </div>
            )}

            {/* Delete Button */}
            {!isVisitor && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(node.id);
                }}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity text-black/50 hover:text-red-600"
            >
                <X className="w-4 h-4" />
            </button>
            )}
            
            {/* Edit Color Button */}
            {!isVisitor && node.type !== 'image' && node.type !== 'model3d' && node.type !== 'whiteboard' && (
                <div className="absolute top-2 right-8 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const currIdx = COLORS.indexOf(node.color);
                            const nextColor = COLORS[(currIdx + 1) % COLORS.length];
                            onUpdate(node.id, { color: nextColor });
                        }}
                        className="p-1 rounded-full hover:bg-black/10 text-black/50 hover:text-white"
                    >
                        <Palette className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Content */}
            {node.type === 'whiteboard' ? (
                <WhiteboardEditor 
                    initialPaths={JSON.parse(node.content || '[]')} 
                    onChange={(paths) => onUpdate(node.id, { content: JSON.stringify(paths) })}
                    isVisitor={isVisitor}
                />
            ) : node.type === 'model3d' ? (
                <div className="w-full h-full flex flex-col p-2 bg-black/40 rounded overflow-hidden">
                    <div className="h-8 flex gap-2 mb-2 z-50 pr-8">
                        <input
                            value={node.content}
                            onChange={(e) => onUpdate(node.id, { content: e.target.value })}
                            className="flex-1 bg-slate-900/50 border border-slate-700 rounded px-2 text-xs text-white placeholder-slate-500"
                            placeholder="Paste GLB/GLTF URL here..."
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="flex-1 relative rounded border border-slate-800 bg-slate-900/50 overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
                        {node.content ? (
                            <Suspense fallback={<div className="flex items-center justify-center h-full text-xs text-cyan-500 animate-pulse">Loading Model...</div>}>
                                <Canvas shadows dpr={[1, 2]} camera={{ fov: 45, position: [0, 0, 4] }}>
                                    <Stage environment="city" intensity={0.5}>
                                        <ModelViewer url={node.content} />
                                    </Stage>
                                    <OrbitControls makeDefault />
                                </Canvas>
                            </Suspense>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-600 text-xs font-mono">
                                NO MODEL LOADED
                            </div>
                        )}
                    </div>
                </div>
            ) : node.type === 'image' ? (
                <div className="mt-4 space-y-2 p-4">
                    {!isVisitor ? (
                    <input 
                        value={node.content}
                        onChange={(e) => onUpdate(node.id, { content: e.target.value })}
                        className="w-full bg-transparent border border-black/20 px-2 py-1 text-slate-900"
                        placeholder="Image URL"
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    ) : null}
                    {node.content && (
                        <img src={node.content} alt="" className="w-full h-32 object-cover rounded" onMouseDown={(e)=>e.stopPropagation()} />
                    )}
                </div>
            ) : node.type === 'container' ? (
                <div className="p-4 h-full flex flex-col">
                    <input
                        value={node.content}
                        onChange={(e) => onUpdate(node.id, { content: e.target.value })}
                        className="bg-transparent border-none text-slate-300 font-bold text-lg mb-2 focus:ring-0 w-full"
                        placeholder="Container Title"
                    />
                    <div className="flex-1 rounded border-2 border-dashed border-slate-800/50 bg-slate-950/30 flex items-center justify-center text-slate-700 font-mono text-xs uppercase tracking-widest pointer-events-none">
                        Drop items here
                    </div>
                </div>
            ) : (
                <textarea
                    readOnly={isVisitor}
                    value={node.content}
                    onChange={(e) => onUpdate(node.id, { content: e.target.value })}
                    className="w-full h-32 mt-4 bg-transparent border-none resize-none focus:ring-0 text-slate-900 font-medium placeholder-black/30 p-4"
                    placeholder={isVisitor ? "" : "Type something..."}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            )}
            
            {/* Footer info */}
            <div className="absolute bottom-2 right-2 text-[10px] text-black/40 font-mono uppercase">
                {node.type} • {node.id.slice(-4)}
            </div>
        </motion.div>
    );
}, (prev, next) => {
    return (
        prev.node === next.node &&
        prev.isVisitor === next.isVisitor &&
        prev.zoom === next.zoom &&
        prev.isSelected === next.isSelected &&
        prev.isHovered === next.isHovered
    );
});

export function PlanningCenter() {
    const user = useAuthStore(s => s.user);
    const workspace = useAuthStore(s => s.workspace);
    const roles = useAuthStore(s => s.roles);
    const { updateTheme, saveColor, deleteColor } = useAuthStore();
    
    const canEdit = hasPermission(user, roles, 'edit_planning');
    const isVisitor = !canEdit;

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'trello';
    const setActiveTab = (tab: string) => setSearchParams({ tab });

    const [socket, setSocket] = useState<any>(null);
    const [online, setOnline] = useState(false);
    const BOARD_ID = workspace?.id ? `planning_${workspace.id}` : 'main_planning';
    const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
    const containerRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<PlanNode[]>([]);
    const [paths, setPaths] = useState<DrawingPath[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoverContainerId, setHoverContainerId] = useState<string | null>(null);
    
    // Refs for performance optimization in drag handlers
    const nodesRef = useRef(nodes);
    const containerNodesRef = useRef<PlanNode[]>([]); // Cache for containers
    const hoverContainerIdRef = useRef(hoverContainerId);

    useEffect(() => { 
        nodesRef.current = nodes; 
        containerNodesRef.current = nodes.filter(n => n.type === 'container'); // Update cache on node change
    }, [nodes]);
    useEffect(() => { hoverContainerIdRef.current = hoverContainerId; }, [hoverContainerId]);

    // Tools
    const [activeTool, setActiveTool] = useState<'cursor' | 'draw'>('cursor');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [drawingColor, setDrawingColor] = useState(user?.theme?.primaryColor || '#000000');
    
    // Infinite Canvas State
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const isDraggingCanvas = useRef(false);
    const isDrawing = useRef(false);
    const currentPath = useRef<DrawingPath | null>(null);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Persist to local storage whenever nodes change
    useEffect(() => {
        const s = io(API_URL, { transports: ['websocket'] });
        setSocket(s);
        s.on('connect', ()=> setOnline(true));
        s.on('disconnect', ()=> setOnline(false));
        s.emit('join_board', { boardId: BOARD_ID });
        s.on('nodes_update', (payload: { nodes: PlanNode[], paths: DrawingPath[] }) => {
            setNodes(payload.nodes ?? []);
            setPaths(payload.paths ?? []);
        });
        fetch(`${API_URL}/boards/${BOARD_ID}`).then(r=>r.json()).then(b=>{
            setNodes(b.nodes ?? []);
            setPaths(b.paths ?? []);
            setOnline(true);
        }).catch(()=>{ setOnline(false); });
        return () => { s.disconnect(); };
    }, [BOARD_ID]); // Depend on BOARD_ID

    const syncBoard = useCallback((newNodes: PlanNode[], newPaths: DrawingPath[]) => {
        if (online) {
            socket?.emit('nodes_update', { boardId: BOARD_ID, nodes: newNodes, paths: newPaths });
            fetch(`${API_URL}/boards/${BOARD_ID}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nodes: newNodes, paths: newPaths }) }).catch(()=>{});
        }
    }, [online, socket, BOARD_ID, API_URL]);

    const addNode = (type: PlanNode['type']) => {
        if (isVisitor) return;

        // Add node at center of current view
        const centerX = -pan.x + (containerRef.current?.clientWidth || 800) / 2 / zoom;
        const centerY = -pan.y + (containerRef.current?.clientHeight || 600) / 2 / zoom;
        
        const newNode: PlanNode = {
            id: Date.now().toString(),
            type,
            x: centerX - 100, // Center offset
            y: centerY - 75,
            content: type === 'note' ? 'New Note' : type === 'container' ? 'New Container' : type === 'model3d' ? '' : type === 'whiteboard' ? '[]' : 'New Task',
            color: type === 'container' ? 'rgba(255,255,255,0.1)' : COLORS[Math.floor(Math.random() * (COLORS.length - 1))],
            width: type === 'container' || type === 'model3d' || type === 'whiteboard' ? 400 : undefined,
            height: type === 'container' || type === 'model3d' || type === 'whiteboard' ? 400 : undefined,
        };
        const next = [...nodes, newNode];
        setNodes(next);
        syncBoard(next, paths);
    };

    const updateNode = useCallback((id: string, updates: Partial<PlanNode>) => {
        if (isVisitor) return;
        setNodes(prev => {
            const next = prev.map(n => n.id === id ? { ...n, ...updates } : n);
            syncBoard(next, paths); // Note: paths dependency might be stale here if we don't ref it, but activeTool=cursor so paths shouldn't change
            return next;
        });
    }, [isVisitor, syncBoard, paths]);

    const deleteNode = useCallback((id: string) => {
        if (isVisitor) return;
        setNodes(prev => {
            const next = prev.filter(n => n.id !== id);
            syncBoard(next, paths);
            return next;
        });
        setSelectedId(null);
    }, [isVisitor, syncBoard, paths]);
    
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

    const getCanvasPoint = (clientX: number, clientY: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (clientX - rect.left - pan.x) / zoom,
            y: (clientY - rect.top - pan.y) / zoom
        };
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (activeTool === 'draw') {
            isDrawing.current = true;
            const point = getCanvasPoint(e.clientX, e.clientY);
            const newPath: DrawingPath = {
                id: Date.now().toString(),
                points: [point],
                color: drawingColor,
                width: 2 / zoom
            };
            currentPath.current = newPath;
            setPaths(prev => [...prev, newPath]);
            return;
        }

        if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
            isDraggingCanvas.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isDrawing.current && currentPath.current) {
            const point = getCanvasPoint(e.clientX, e.clientY);
            currentPath.current.points.push(point);
            // Force re-render of paths (optimization: could use a ref for the active path only)
            setPaths(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...currentPath.current! };
                return copy;
            });
            return;
        }

        if (isDraggingCanvas.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleCanvasMouseUp = () => {
        if (isDrawing.current) {
            isDrawing.current = false;
            syncBoard(nodes, paths);
            currentPath.current = null;
        }
        isDraggingCanvas.current = false;
    };

    const handleNodeDrag = useCallback((id: string, offset: {x:number, y:number}) => {
        if (isVisitor) return;
        
        // Simple throttle: Only run this logic every 5th frame roughly (using simple counter or time)
        // But since we can't store state in callback easily without ref, let's just optimize the loop
        
        const node = nodesRef.current.find(n => n.id === id);
        if (!node || node.type === 'container') return;

        const currX = node.x + offset.x / zoom;
        const currY = node.y + offset.y / zoom;
        const cx = currX + 128; 
        const cy = currY + 75;
        
        // Use cached container list
        let targetId: string | null = null;
        const containers = containerNodesRef.current;
        for (let i = 0; i < containers.length; i++) {
            const n = containers[i];
            if (cx > n.x && cx < n.x + (n.width || 400) && cy > n.y && cy < n.y + (n.height || 400)) {
                targetId = n.id;
                break;
            }
        }

        if (targetId !== hoverContainerIdRef.current) {
            setHoverContainerId(targetId);
        }
    }, [isVisitor, zoom]);

    const handleNodeDragEnd = useCallback((id: string, offset: {x:number, y:number}) => {
        setHoverContainerId(null);
        if (isVisitor) return;
        
        // We must use nodesRef.current to get the latest state without triggering re-renders during drag
        // But for final update we need state setter
        const node = nodesRef.current.find(n => n.id === id);
        if (!node) return;

        // Calculate delta
        const deltaX = offset.x / zoom;
        const deltaY = offset.y / zoom;
        
        // Apply to self
        const nextX = node.x + deltaX;
        const nextY = node.y + deltaY;

        setNodes(prevNodes => {
            // If this is a container, find children and move them too
            if (node.type === 'container') {
                const width = node.width || 400;
                const height = node.height || 400;
                
                // Original bounds (before move)
                const left = node.x;
                const right = node.x + width;
                const top = node.y;
                const bottom = node.y + height;

                // Update all nodes
                const nextNodes = prevNodes.map(n => {
                    if (n.id === node.id) {
                        return { ...n, x: nextX, y: nextY };
                    }
                    // Check if n was inside the container
                    // (Simple center point check)
                    const cx = n.x + 128; // approx center of note
                    const cy = n.y + 100;
                    if (cx > left && cx < right && cy > top && cy < bottom && n.type !== 'container') {
                        return { ...n, x: n.x + deltaX, y: n.y + deltaY };
                    }
                    return n;
                });
                syncBoard(nextNodes, paths);
                return nextNodes;
            } else {
                // Normal node move
                const nextNodes = prevNodes.map(n => n.id === id ? { ...n, x: nextX, y: nextY } : n);
                syncBoard(nextNodes, paths);
                return nextNodes;
            }
        });
    }, [isVisitor, zoom, syncBoard, paths]);

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
            {activeTab === 'trello' && !isVisitor && (
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
                <button 
                    onClick={() => addNode('container')}
                    className="p-3 rounded-full hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Add Container"
                >
                    <Box className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => addNode('model3d')}
                    className="p-3 rounded-full hover:bg-slate-800 text-slate-400 hover:text-orange-400 transition-colors"
                    title="Add 3D Model"
                >
                    <Cuboid className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => addNode('whiteboard')}
                    className="p-3 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Add Whiteboard"
                >
                    <PenTool className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-slate-700 mx-1" />
                
                <button 
                    onClick={() => setActiveTool(activeTool === 'cursor' ? 'draw' : 'cursor')}
                    className={cn(
                        "p-3 rounded-full transition-colors relative",
                        activeTool === 'draw' ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-slate-800 text-slate-400"
                    )}
                    title="Draw Tool"
                >
                    <PenTool className="w-5 h-5" />
                </button>
                
                <div className="relative">
                    <button 
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-3 rounded-full hover:bg-slate-800 transition-colors"
                        title="Pick Color"
                    >
                        <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: drawingColor }} />
                    </button>
                    {showColorPicker && (
                        <div className="absolute top-14 left-0 z-50 shadow-2xl">
                            <ColorPicker 
                                color={drawingColor}
                                onChange={(c) => {
                                    setDrawingColor(c);
                                    updateTheme({ primaryColor: c });
                                }}
                                savedColors={user?.theme?.savedColors}
                                onSaveColor={saveColor}
                                onDeleteColor={deleteColor}
                            />
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-slate-700 mx-1" />
                <div className="px-3 text-xs font-mono text-slate-500 uppercase">
                    {Math.round(zoom * 100)}%
                </div>
                <button onClick={() => { setPan({x:0,y:0}); setZoom(1); }} className="text-xs text-cyan-400 hover:underline">
                    Reset
                </button>
            </div>
            )}
            {/* View only zoom control for visitor */}
            {activeTab === 'trello' && isVisitor && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full shadow-2xl">
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

                {/* Drawing Layer */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
                    style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'top left'
                    }}
                >
                    {paths.map(path => (
                        <polyline
                            key={path.id}
                            points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke={path.color}
                            strokeWidth={path.width}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}
                </svg>

                <motion.div 
                    className="absolute top-0 left-0 w-full h-full origin-top-left pointer-events-none"
                    style={{ 
                        x: pan.x, 
                        y: pan.y, 
                        scale: zoom 
                    }}
                >
                    <AnimatePresence>
                        {/* 1. Render Containers First (Bottom Layer) */}
                        {nodes
                            .filter(n => n.type === 'container')
                            .map((node) => (
                                <BoardNode
                                    key={node.id}
                                    node={node}
                                    isVisitor={isVisitor}
                                    zoom={zoom}
                                    isSelected={selectedId === node.id}
                                    isHovered={hoverContainerId === node.id}
                                    onDrag={handleNodeDrag}
                                    onDragEnd={handleNodeDragEnd}
                                    onUpdate={updateNode}
                                    onDelete={deleteNode}
                                    onSelect={setSelectedId}
                                />
                        ))}
                        
                        {/* 2. Render Non-Container Nodes (Top Layer) */}
                        {nodes
                            .filter(n => n.type !== 'container')
                            .map((node) => (
                                <BoardNode
                                    key={node.id}
                                    node={node}
                                    isVisitor={isVisitor}
                                    zoom={zoom}
                                    isSelected={selectedId === node.id}
                                    isHovered={hoverContainerId === node.id}
                                    onDrag={handleNodeDrag}
                                    onDragEnd={handleNodeDragEnd}
                                    onUpdate={updateNode}
                                    onDelete={deleteNode}
                                    onSelect={setSelectedId}
                                />
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
                  Scroll/Drag to Pan • Ctrl+Scroll to Zoom { !isVisitor && "• Double Click to edit" }
              </div>
            )}
        </div>
    );
}

 
