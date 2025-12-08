import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, TransformControls, Select, Grid } from '@react-three/drei'
import { useMemo, useRef, useState, useEffect } from 'react'
import { Mesh, BufferGeometry, Float32BufferAttribute } from 'three'
import { useNetwork3DStore, NetworkNode3D } from '../store/network3d'
import { io } from 'socket.io-client'
import * as THREE from 'three'
import { Search, Tag, Settings, Plus, X, Maximize2, Minimize2, Undo, Redo, Trash2, Link, LayoutTemplate, Sliders, Grid3X3, MousePointer2, Wand2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuthStore, hasPermission } from '../store/auth';

function SupermassiveBlackHole() {
    return (
        <group position={[0, 0, 0]}>
            {/* Event Horizon */}
            <mesh>
                <sphereGeometry args={[4, 64, 64]} />
                <meshStandardMaterial color="#000000" roughness={0} metalness={0} />
            </mesh>
            {/* Accretion Disk - Inner */}
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[8, 1, 32, 100]} />
                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} toneMapped={false} />
            </mesh>
            {/* Accretion Disk - Outer */}
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[12, 2, 32, 100]} />
                <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={1} transparent opacity={0.6} toneMapped={false} />
            </mesh>
            {/* Particle Glow */}
            <mesh>
                <sphereGeometry args={[15, 32, 32]} />
                <meshBasicMaterial color="#7c3aed" transparent opacity={0.05} side={THREE.BackSide} />
            </mesh>
        </group>
    )
}

function NodeMesh({ id, type, isSelected, color, hovered }: { id: string, type?: string, isSelected: boolean, color?: string, hovered: boolean }) {
  const materialColor = hovered || isSelected ? '#22d3ee' : color || '#64748b';
  
  if (type === 'game') {
      return (
          <group userData={{ id }}>
             {/* Event Horizon */}
             <mesh userData={{ id }}>
                 <sphereGeometry args={[isSelected ? 0.6 : 0.5, 32, 32]} />
                 <meshStandardMaterial color="#000000" roughness={0} metalness={0} />
             </mesh>
             {/* Accretion Disk */}
             <mesh rotation={[Math.PI/2, 0, 0]} userData={{ id }}>
                 <torusGeometry args={[isSelected ? 1.2 : 1.0, 0.1, 16, 100]} />
                 <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} toneMapped={false} />
             </mesh>
             {/* Glow Effect (Simulated with transparent sphere) */}
             <mesh userData={{ id }}>
                 <sphereGeometry args={[1.5, 32, 32]} />
                 <meshBasicMaterial color="#3b82f6" transparent opacity={0.1} side={THREE.BackSide} />
             </mesh>
          </group>
      )
  }

  if (type === 'router') {
    return (
      <mesh userData={{ id }}>
        <boxGeometry args={[isSelected ? 0.4 : 0.3, isSelected ? 0.4 : 0.3, isSelected ? 0.4 : 0.3]} />
        <meshStandardMaterial color={materialColor} />
      </mesh>
    );
  }
  if (type === 'hub') {
    return (
      <mesh rotation={[Math.PI/2, 0, 0]} userData={{ id }}>
        <cylinderGeometry args={[isSelected ? 0.25 : 0.2, isSelected ? 0.25 : 0.2, 0.1, 8]} />
        <meshStandardMaterial color={materialColor} />
      </mesh>
    );
  }
  // Default node
  return (
    <mesh userData={{ id }}>
      <sphereGeometry args={[isSelected ? 0.18 : 0.14, 24, 24]} />
      <meshStandardMaterial color={materialColor} />
    </mesh>
  );
}

function MultiSelectionControls({ selectedIds, snapToGrid }: { selectedIds: string[], snapToGrid: boolean }) {
    const nodes = useNetwork3DStore(s => s.nodes)
    const moveNodes = useNetwork3DStore(s => s.moveNodes)
    const startMoveNodes = useNetwork3DStore(s => s.startMoveNodes)
    const endMoveNodes = useNetwork3DStore(s => s.endMoveNodes)
    
    // Calculate centroid
    const centroid = useMemo(() => {
        if (selectedIds.length <= 1) return null;
        const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
        if (selectedNodes.length === 0) return null;
        
        const sum = selectedNodes.reduce((acc, n) => {
            return [acc[0] + n.position[0], acc[1] + n.position[1], acc[2] + n.position[2]] as [number, number, number]
        }, [0, 0, 0] as [number, number, number]);
        
        return [sum[0] / selectedNodes.length, sum[1] / selectedNodes.length, sum[2] / selectedNodes.length] as [number, number, number];
    }, [selectedIds, nodes]); // Recalculate if selection or nodes change (position update)

    const groupRef = useRef<any>(null);
    const lastPosRef = useRef<[number, number, number] | null>(null);

    if (!centroid) return null;

    return (
        <>
            <group position={centroid} ref={groupRef}>
                <mesh visible={false}>
                    <boxGeometry args={[1, 1, 1]} />
                </mesh>
            </group>
            <TransformControls
                object={groupRef.current}
                mode="translate"
                translationSnap={snapToGrid ? 2 : null}
                onMouseDown={() => {
                    if (groupRef.current) {
                        const p = groupRef.current.position;
                        lastPosRef.current = [p.x, p.y, p.z];
                        // Capture snapshot for undo
                        startMoveNodes(selectedIds);
                    }
                }}
                onMouseUp={() => {
                    // Commit to history
                    endMoveNodes(selectedIds);
                }}
                onObjectChange={(e: any) => {
                    const newPos = e.target.object.position;
                    if (lastPosRef.current) {
                        const delta = [
                            newPos.x - lastPosRef.current[0],
                            newPos.y - lastPosRef.current[1],
                            newPos.z - lastPosRef.current[2]
                        ] as [number, number, number];
                        
                        moveNodes(selectedIds, delta);
                        lastPosRef.current = [newPos.x, newPos.y, newPos.z];
                    }
                }}
            />
        </>
    )
}

function NodeObject({ id, label, position, color, type, snapToGrid }: any) {
    const selectedIds = useNetwork3DStore(s => s.selectedNodeIds)
    const selectNode = useNetwork3DStore(s => s.selectNode)
    const updatePos = useNetwork3DStore(s => s.updateNodePosition)
    const connectFromId = useNetwork3DStore(s => s.connectFromId)
    const addEdge = useNetwork3DStore(s => s.addEdge)
    
    const [hovered, setHovered] = useState(false)
    const isSelected = selectedIds.includes(id)
    
    const groupRef = useRef<any>(null)

    return (
        <>
            <group position={position} ref={groupRef}>
                <group
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
                    onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (connectFromId && connectFromId !== id) {
                            addEdge(connectFromId, id);
                        } else {
                            if (e.shiftKey) {
                                const newSelection = isSelected 
                                    ? selectedIds.filter(sid => sid !== id)
                                    : [...selectedIds, id];
                                selectNode(newSelection);
                            } else {
                                selectNode(id);
                            }
                        }
                    }}
                >
                    <NodeMesh id={id} type={type} isSelected={isSelected} color={color} hovered={hovered} />
                </group>
                {(isSelected || hovered) && (
                    <Html distanceFactor={15} position={[0, 0.5, 0]}>
                        <div className="px-2 py-1 text-[10px] rounded bg-slate-900/90 border border-slate-700 text-white font-mono whitespace-nowrap pointer-events-none select-none shadow-xl z-10">
                            {label.length > 15 ? label.slice(0, 15) + '...' : label}
                        </div>
                    </Html>
                )}
            </group>
            {isSelected && selectedIds.length === 1 && groupRef.current && (
                <TransformControls 
                    object={groupRef.current} 
                    mode="translate"
                    translationSnap={snapToGrid ? 2 : null}
                    onObjectChange={(e: any) => {
                        const { x, y, z } = e.target.object.position;
                        updatePos(id, [x, y, z]);
                    }}
                />
            )}
        </>
    )
}

function Nodes({ filterTags, searchQuery, snapToGrid }: { filterTags: string[], searchQuery: string, snapToGrid: boolean }) {
  const nodes = useNetwork3DStore(s => s.nodes)
  const selectNode = useNetwork3DStore(s => s.selectNode)
  
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
        const matchesTag = filterTags.length === 0 || filterTags.every(t => (n.tags || []).includes(t));
        const matchesSearch = searchQuery === '' || n.label.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTag && matchesSearch;
    })
  }, [nodes, filterTags, searchQuery])

  return (
    <Select 
        box 
        multiple 
        onChange={(selected) => {
            const ids = selected
                .map((obj: any) => obj.userData?.id)
                .filter((id): id is string => !!id);
            const uniqueIds = [...new Set(ids)];
            if (uniqueIds.length > 0 || selected.length === 0) {
                 selectNode(uniqueIds);
            }
        }}
        filter={(items) => items} 
    >
        <group>
        {filteredNodes.map(n => (
            <NodeObject key={n.id} {...n} snapToGrid={snapToGrid} />
        ))}
        {nodes.filter(n => !filteredNodes.includes(n)).map(n => (
            <mesh key={n.id} position={n.position}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial color="#334155" transparent opacity={0.2} />
            </mesh>
        ))}
        </group>
    </Select>
  )
}

function InteractiveEdges() {
    const nodes = useNetwork3DStore(s => s.nodes)
    const edges = useNetwork3DStore(s => s.edges)
    const splitEdge = useNetwork3DStore(s => s.splitEdge)
    
    return (
        <group>
            {edges.map(edge => {
                const start = nodes.find(n => n.id === edge.a)
                const end = nodes.find(n => n.id === edge.b)
                if (!start || !end) return null
                
                const startVec = new THREE.Vector3(...start.position)
                const endVec = new THREE.Vector3(...end.position)
                const mid = startVec.clone().add(endVec).multiplyScalar(0.5)
                
                return (
                    <group key={edge.id}>
                        <lineSegments>
                            <bufferGeometry>
                                <float32BufferAttribute attach="attributes-position" args={[new Float32Array([...start.position, ...end.position]), 3]} />
                            </bufferGeometry>
                            <lineBasicMaterial color="#334155" />
                        </lineSegments>
                        <mesh position={mid} onClick={(e) => {
                            e.stopPropagation()
                            splitEdge(edge.id, [mid.x, mid.y, mid.z])
                        }}
                        onPointerOver={(e) => document.body.style.cursor = 'crosshair'}
                        onPointerOut={(e) => document.body.style.cursor = 'auto'}
                        >
                            <sphereGeometry args={[0.08, 8, 8]} />
                            <meshBasicMaterial color="#334155" transparent opacity={0.0} />
                        </mesh>
                    </group>
                )
            })}
        </group>
    )
}

// Helper for 3D distribution (Fibonacci Sphere)
function getFibonacciSpherePoints(samples: number, radius: number, center: [number, number, number]) {
    const points: [number, number, number][] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    for (let i = 0; i < samples; i++) {
        const y = 1 - (i / (samples - 1 + 0.0001)) * 2; // y goes from 1 to -1
        const radiusAtY = Math.sqrt(1 - y * y); // radius at y
        const theta = phi * i; // golden angle increment
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;
        points.push([
            center[0] + x * radius, 
            center[1] + y * radius, 
            center[2] + z * radius
        ]);
    }
    return points;
}

// Helper to distribute nodes around a point
function distributeNodesPoints(
    nodesToPlace: NetworkNode3D[], 
    center: [number, number, number], 
    radius: number,
    updateNodePosition: (id: string, pos: [number, number, number]) => void
) {
    if (nodesToPlace.length === 0) return;
    if (nodesToPlace.length === 1) {
        // Just place slightly offset if only 1, or on the shell
        updateNodePosition(nodesToPlace[0].id, [center[0] + radius, center[1], center[2]]);
        return;
    }
    
    const points = getFibonacciSpherePoints(nodesToPlace.length, radius, center);
    nodesToPlace.forEach((node, i) => {
        updateNodePosition(node.id, points[i]);
    });
}

// Helper to group nodes by parent
function groupNodesByParent(
    children: NetworkNode3D[], 
    potentialParents: NetworkNode3D[], 
    edges: { a: string, b: string }[],
    matchTags?: boolean,
    capacityLimit?: number
) {
    const groups: { parentPos: [number, number, number], children: NetworkNode3D[] }[] = [];
    const parentMap = new Map<string, NetworkNode3D[]>();
    const orphans: NetworkNode3D[] = [];
    const parentCounts = new Map<string, number>();

    // Initialize maps
    potentialParents.forEach(p => {
        parentMap.set(p.id, []);
        parentCounts.set(p.id, 0);
    });

    // 1. Assign existing connections
    children.forEach(child => {
        const parent = potentialParents.find(p => 
            edges.some(e => (e.a === child.id && e.b === p.id) || (e.b === child.id && e.a === p.id))
        );
        
        if (parent) {
            parentMap.get(parent.id)!.push(child);
            parentCounts.set(parent.id, (parentCounts.get(parent.id) || 0) + 1);
        }
    });

    // 2. Virtual assignment for orphans
    children.forEach(child => {
        const isAlreadyAssigned = potentialParents.some(p => 
            edges.some(e => (e.a === child.id && e.b === p.id) || (e.b === child.id && e.a === p.id))
        );

        if (!isAlreadyAssigned) {
            // Try to find a virtual parent
            let bestParent = null;
            let minDistance = Infinity;

            // Filter candidates
            let candidates = potentialParents;
            
            // Filter by Tags
            if (matchTags && child.tags && child.tags.length > 0) {
                const tagParents = candidates.filter(p => p.tags && p.tags.some(t => child.tags?.includes(t)));
                if (tagParents.length > 0) candidates = tagParents;
                else if (matchTags) candidates = []; // Strict match
            }

            // Filter by Capacity
            if (capacityLimit !== undefined) {
                candidates = candidates.filter(p => (parentCounts.get(p.id) || 0) < capacityLimit);
            }

            // Find nearest
            for (const parent of candidates) {
                const dist = Math.hypot(
                    parent.position[0] - child.position[0],
                    parent.position[1] - child.position[1],
                    parent.position[2] - child.position[2]
                );
                if (dist < minDistance) {
                    minDistance = dist;
                    bestParent = parent;
                }
            }

            if (bestParent) {
                parentMap.get(bestParent.id)!.push(child);
                parentCounts.set(bestParent.id, (parentCounts.get(bestParent.id) || 0) + 1);
            } else {
                orphans.push(child);
            }
        }
    });

    // Add groups for existing parents
    parentMap.forEach((kids, parentId) => {
        const p = potentialParents.find(n => n.id === parentId);
        if (p && kids.length > 0) groups.push({ parentPos: p.position, children: kids });
    });

    // Add orphans (parent is Origin or Main Core)
    // If there are game cores, orphans orbit the first one or origin
    if (orphans.length > 0) {
        // If we have game cores, find the "main" one (first one)
        // If no game cores, orbit 0,0,0
        const mainCore = potentialParents.length > 0 ? potentialParents[0] : null;
        // For orphan group, we use 0,0,0 if no main core found in potential parents (which might be hubs/routers)
        // If potentialParents are routers, mainCore is just a random router. 
        // Better to fallback to actual Game Cores if available globally? 
        // For simplicity, we keep existing behavior: orbit origin.
        groups.push({ parentPos: [0,0,0], children: orphans });
    }

    return groups;
}


export function Network3DCanvas() {
  const user = useAuthStore(s => s.user);
  const workspace = useAuthStore(s => s.workspace);
  const roles = useAuthStore(s => s.roles);
  const canEdit = hasPermission(user, roles, 'edit_network');
  const isVisitor = !canEdit;

  const addNode = useNetwork3DStore(s => s.addNode)
  const selectNode = useNetwork3DStore(s => s.selectNode)
  const removeNodes = useNetwork3DStore(s => s.removeNodes)
  const startConnect = useNetwork3DStore(s => s.startConnect)
  const selectedIds = useNetwork3DStore(s => s.selectedNodeIds)
  const nodes = useNetwork3DStore(s => s.nodes)
  const updateNode = useNetwork3DStore(s => s.updateNode)
  const updateNodePosition = useNetwork3DStore(s => s.updateNodePosition)
  const addTag = useNetwork3DStore(s => s.addTag)
  const removeTag = useNetwork3DStore(s => s.removeTag)
  const undo = useNetwork3DStore(s => s.undo)
  const redo = useNetwork3DStore(s => s.redo)
  const copy = useNetwork3DStore(s => s.copy)
  const paste = useNetwork3DStore(s => s.paste)
  const autoWire = useNetwork3DStore(s => s.autoWire)
  const clearAll = useNetwork3DStore(s => s.clearAll)
  const addCluster = useNetwork3DStore(s => s.addCluster)
  const edges = useNetwork3DStore(s => s.edges)
  
  const resetToken = useNetwork3DStore(s => s.resetCameraToken)
  const triggerReset = useNetwork3DStore(s => s.triggerResetCamera)
  const [cameraKey, setCameraKey] = useState(0)
  const onResetCamera = () => setCameraKey(k => k + 1)
  
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'
  const BOARD_ID = workspace?.id || 'main'
  const socketRef = useRef<any>(null)
  const lastNodeIdRef = useRef<string | null>(null)
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [newTagInput, setNewTagInput] = useState('')
  const [showLayoutConfig, setShowLayoutConfig] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [autoWireMatchTags, setAutoWireMatchTags] = useState(false)
  const [autoWireLimits, setAutoWireLimits] = useState({
      maxNodesPerRouter: 10,
      maxRoutersPerHub: 5,
      maxHubsPerCore: 5
  })
  
  // Layout Configuration State
  const [layoutConfig, setLayoutConfig] = useState({
      hubRadius: 20,
      routerRadius: 30,
      nodeRadius: 40,
      hubClusterSpacing: 8, 
      routerClusterSpacing: 5,
      gameCoreRadius: 60, // Radius around SMBH
  })

  // Derived state for selection
  const selectedNode = selectedIds.length === 1 ? nodes.find(n => n.id === selectedIds[0]) : null

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (isVisitor) return; // Disable shortcuts for visitor
          if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
              copy();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
              paste();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copy, paste, isVisitor]);

  useEffect(() => {
    const s = io(API_URL, { transports: ['websocket'] })
    socketRef.current = s
    s.emit('join_board', { boardId: BOARD_ID })
    s.on('graph3d_update', (graph: { nodes: any[]; edges: any[] }) => {
      useNetwork3DStore.getState().load({ nodes: graph.nodes as any, edges: graph.edges as any })
    })
    return () => { s.disconnect() }
  }, [BOARD_ID]) // Re-run when BOARD_ID changes

  useEffect(() => {
    // Only emit updates if NOT visitor (although server doesn't enforce, client should avoid sending)
    if (isVisitor) return; 

    const handler = setTimeout(() => {
      const s = socketRef.current
      if (s) s.emit('graph3d_update', { boardId: BOARD_ID, nodes, edges })
    }, 50)
    return () => clearTimeout(handler)
  }, [nodes, edges, BOARD_ID, isVisitor])

  function findOpenPosition3D(base: [number, number, number]) {
    const existing = nodes.map(n => n.position)
    const minDist = 1.5
    let radius = 3
    
    // Check points on expanding spheres
    for (let r = radius; r < 100; r += 1.5) {
        const samples = Math.floor(4 * Math.PI * r * r);
        const points = getFibonacciSpherePoints(Math.min(samples, 50), r, base);
        
        for (const p of points) {
            const ok = existing.every(ex => Math.hypot(ex[0] - p[0], ex[1] - p[1], ex[2] - p[2]) >= minDist);
            if (ok) return p;
        }
    }
    return [base[0]+2, base[1], base[2]] as [number, number, number];
  }

  // --- Auto Layout Logic ---
  const performAutoLayout = () => {
      // Fetch latest nodes from store to ensure we have the most recent added node
      const currentNodes = useNetwork3DStore.getState().nodes;
      const gameCores = currentNodes.filter(n => n.type === 'game');
      const hubs = currentNodes.filter(n => n.type === 'hub');
      const routers = currentNodes.filter(n => n.type === 'router');
      const regularNodes = currentNodes.filter(n => !['game', 'hub', 'router'].includes(n.type || ''));
      const currentEdges = useNetwork3DStore.getState().edges;

      // 1. Place Game Cores around Supermassive Black Hole (0,0,0)
      if (gameCores.length > 0) {
        distributeNodesPoints(gameCores, [0,0,0], layoutConfig.gameCoreRadius, updateNodePosition);
      }

      // 2. Place Hubs around Game Cores
      const hubsGroups = groupNodesByParent(hubs, gameCores, currentEdges, autoWireMatchTags, autoWireLimits.maxHubsPerCore);
      hubsGroups.forEach(group => {
          // If orphan (parent is SMBH), use larger radius or same as game core
          const isOrphan = group.parentPos[0] === 0 && group.parentPos[1] === 0 && group.parentPos[2] === 0;
          const r = isOrphan ? layoutConfig.gameCoreRadius + 20 : layoutConfig.hubRadius;
          distributeNodesPoints(group.children, group.parentPos, r, updateNodePosition);
      });

      // 3. Place Routers around Hubs
      const routersGroups = groupNodesByParent(routers, hubs, currentEdges, autoWireMatchTags, autoWireLimits.maxRoutersPerHub);
      routersGroups.forEach(group => {
          const isOrphan = !hubs.some(h => 
              Math.abs(h.position[0]-group.parentPos[0]) < 0.1 && 
              Math.abs(h.position[1]-group.parentPos[1]) < 0.1 && 
              Math.abs(h.position[2]-group.parentPos[2]) < 0.1
          );
          const r = isOrphan ? layoutConfig.routerRadius : layoutConfig.hubClusterSpacing;
          distributeNodesPoints(group.children, group.parentPos, r, updateNodePosition);
      });

      // 4. Place Nodes around Routers
      const nodesGroups = groupNodesByParent(regularNodes, routers, currentEdges, autoWireMatchTags, autoWireLimits.maxNodesPerRouter);
      nodesGroups.forEach(group => {
          const isOrphan = !routers.some(r => 
              Math.abs(r.position[0]-group.parentPos[0]) < 0.1 && 
              Math.abs(r.position[1]-group.parentPos[1]) < 0.1 && 
              Math.abs(r.position[2]-group.parentPos[2]) < 0.1
          );
          const r = isOrphan ? layoutConfig.nodeRadius : layoutConfig.routerClusterSpacing;
          distributeNodesPoints(group.children, group.parentPos, r, updateNodePosition);
      });
  }

  const allTags = useMemo(() => {
      const tags = new Set<string>();
      nodes.forEach(n => n.tags?.forEach(t => tags.add(t)));
      return Array.from(tags);
  }, [nodes]);
  
  return (
    <div className="relative w-full h-full flex bg-slate-950">
      
      {/* Top Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2 pointer-events-auto">
             <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 p-1.5 rounded-lg shadow-xl">
                <div className="relative">
                    <Search className="absolute left-2 top-1.5 w-4 h-4 text-slate-500" />
                    <input 
                        className="pl-8 pr-3 py-1 bg-slate-800 border-none rounded text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-cyan-500 w-48"
                        placeholder="Search nodes..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                {allTags.length > 0 && (
                    <div className="h-4 w-px bg-slate-700 mx-1" />
                )}
                {allTags.map(tag => (
                    <button 
                        key={tag}
                        onClick={() => setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={cn(
                            "px-2 py-0.5 text-xs rounded-full border transition-colors",
                            filterTags.includes(tag) 
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50" 
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                        )}
                    >
                        #{tag}
                    </button>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 p-1.5 rounded-lg shadow-xl pointer-events-auto">
              <button 
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className={cn("p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors", snapToGrid && "bg-slate-800 text-cyan-400")}
                  title={snapToGrid ? "Disable Grid Snap" : "Enable Grid Snap"}
              >
                  <Grid3X3 className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-700 mx-1" />
              <button 
                onClick={() => setShowLayoutConfig(!showLayoutConfig)} 
                className={cn("p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors", showLayoutConfig && "bg-slate-800 text-cyan-400")} 
                title="Layout Settings"
              >
                  <Sliders className="w-4 h-4" />
              </button>
              {!isVisitor && (
                <>
                    <button onClick={() => autoWire(autoWireMatchTags, autoWireLimits)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded text-purple-400 font-bold text-xs uppercase tracking-wider" title="Auto Wire">
                        <Wand2 className="w-4 h-4" />
                        Auto Wire
                    </button>
                    <button onClick={() => performAutoLayout()} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded text-cyan-400 font-bold text-xs uppercase tracking-wider" title="Auto Layout">
                        <LayoutTemplate className="w-4 h-4" />
                        Auto Layout
                    </button>
                    <div className="h-4 w-px bg-slate-700 mx-1" />
                    <button onClick={() => undo()} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Undo">
                        <Undo className="w-4 h-4" />
                    </button>
                    <button onClick={() => redo()} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Redo">
                        <Redo className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-slate-700 mx-1" />
                    <button 
                        onClick={() => setShowDeleteConfirm(true)} 
                        className="p-2 hover:bg-red-900/50 rounded text-red-400 hover:text-red-200" 
                        title="Delete All"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-slate-700 mx-1" />
                </>
              )}
              <button onClick={() => { triggerReset(); onResetCamera() }} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white" title="Reset Camera">
                  <Maximize2 className="w-4 h-4" />
              </button>
          </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 w-80 max-w-full mx-4">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-500" />
                      Delete Everything?
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">
                      This will permanently remove all nodes and connections from the scene. This action cannot be easily undone.
                  </p>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={() => {
                              clearAll();
                              setShowDeleteConfirm(false);
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors"
                      >
                          Delete All
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Layout Config Panel */}
      {showLayoutConfig && (
        <div className="absolute top-16 right-4 z-50 w-64 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl p-4 animate-in slide-in-from-top-5 duration-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-3 h-3" />
                    Layout Settings
                </h3>
                <button onClick={() => setShowLayoutConfig(false)} className="text-slate-500 hover:text-white">
                    <X className="w-3 h-3" />
                </button>
            </div>
            
            <div className="space-y-4">
                {/* Auto Wire Settings */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Wand2 className="w-3 h-3" /> Auto Wire Logic
                    </h4>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={autoWireMatchTags}
                            onChange={(e) => setAutoWireMatchTags(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                        />
                        Match Tags Only
                    </label>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                        If checked, nodes will only connect to parents that share at least one tag.
                    </p>

                    <div className="space-y-2 mt-3">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Max Nodes / Router</span>
                                <span className="text-purple-400">{autoWireLimits.maxNodesPerRouter}</span>
                            </div>
                            <input 
                                type="range" min="1" max="50" step="1" 
                                value={autoWireLimits.maxNodesPerRouter}
                                onChange={e => setAutoWireLimits(p => ({...p, maxNodesPerRouter: Number(e.target.value)}))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Max Routers / Hub</span>
                                <span className="text-purple-400">{autoWireLimits.maxRoutersPerHub}</span>
                            </div>
                            <input 
                                type="range" min="1" max="20" step="1" 
                                value={autoWireLimits.maxRoutersPerHub}
                                onChange={e => setAutoWireLimits(p => ({...p, maxRoutersPerHub: Number(e.target.value)}))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Max Hubs / Core</span>
                                <span className="text-purple-400">{autoWireLimits.maxHubsPerCore}</span>
                            </div>
                            <input 
                                type="range" min="1" max="20" step="1" 
                                value={autoWireLimits.maxHubsPerCore}
                                onChange={e => setAutoWireLimits(p => ({...p, maxHubsPerCore: Number(e.target.value)}))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={() => autoWire(autoWireMatchTags, autoWireLimits)}
                        className="w-full py-1.5 mt-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold uppercase rounded border border-purple-500/30 transition-colors"
                    >
                        Run Auto Wire
                    </button>
                </div>

                <div className="h-px bg-slate-800 my-2" />

                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Game Core Radius (from SMBH)</span>
                        <span className="text-cyan-400">{layoutConfig.gameCoreRadius}</span>
                    </div>
                    <input 
                        type="range" min="30" max="150" step="5" 
                        value={layoutConfig.gameCoreRadius}
                        onChange={e => setLayoutConfig(p => ({...p, gameCoreRadius: Number(e.target.value)}))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Hub Radius (from Game Core)</span>
                        <span className="text-cyan-400">{layoutConfig.hubRadius}</span>
                    </div>
                    <input 
                        type="range" min="5" max="50" step="1" 
                        value={layoutConfig.hubRadius}
                        onChange={e => setLayoutConfig(p => ({...p, hubRadius: Number(e.target.value)}))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Router Radius</span>
                        <span className="text-cyan-400">{layoutConfig.routerRadius}</span>
                    </div>
                    <input 
                        type="range" min="5" max="80" step="1" 
                        value={layoutConfig.routerRadius}
                        onChange={e => setLayoutConfig(p => ({...p, routerRadius: Number(e.target.value)}))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Node Radius</span>
                        <span className="text-cyan-400">{layoutConfig.nodeRadius}</span>
                    </div>
                    <input 
                        type="range" min="5" max="100" step="1" 
                        value={layoutConfig.nodeRadius}
                        onChange={e => setLayoutConfig(p => ({...p, nodeRadius: Number(e.target.value)}))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>
                <div className="h-px bg-slate-800 my-2" />
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Hub Cluster Spacing</span>
                        <span className="text-cyan-400">{layoutConfig.hubClusterSpacing}</span>
                    </div>
                    <input 
                        type="range" min="2" max="15" step="0.5" 
                        value={layoutConfig.hubClusterSpacing}
                        onChange={e => setLayoutConfig(p => ({...p, hubClusterSpacing: Number(e.target.value)}))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Router Cluster Spacing</span>
                        <span className="text-cyan-400">{layoutConfig.routerClusterSpacing}</span>
                    </div>
                    <input 
                        type="range" min="1" max="10" step="0.5" 
                        value={layoutConfig.routerClusterSpacing}
                        onChange={e => setLayoutConfig(p => ({...p, routerClusterSpacing: Number(e.target.value)}))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>
                
                <button 
                    onClick={() => performAutoLayout()}
                    className="w-full py-2 mt-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold uppercase rounded border border-slate-700 transition-colors"
                >
                    Apply Layout
                </button>
            </div>
        </div>
      )}

      {/* Main Actions (Bottom Center) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 pointer-events-auto">
          {!isVisitor && (
            <div className="relative">
              <button 
                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-full shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
                onClick={() => setShowAddMenu(!showAddMenu)}
              >
                  <Plus className="w-5 h-5" />
                  Add Node
              </button>
              
              {showAddMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col">
                      {[
                          { label: 'Add Node', type: 'node', color: '#22d3ee' },
                          { label: 'Add Router', type: 'router', color: '#f472b6' },
                          { label: 'Add Hub', type: 'hub', color: '#a3e635' },
                          { label: 'Add Game Core', type: 'game', color: '#000000' },
                      ].map(item => (
                          <button
                              key={item.type}
                              className="px-4 py-3 text-left hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-2"
                              onClick={() => {
                                  const base: [number, number, number] = lastNodeIdRef.current ? (nodes.find(n=>n.id===lastNodeIdRef.current)?.position as any) || [0,0,0] : [0,0,0]
                                  const pos = findOpenPosition3D(base)
                                  const newId = addNode(item.label, pos, item.type as any, item.color)
                                  if (lastNodeIdRef.current) {
                                      useNetwork3DStore.getState().addEdge(lastNodeIdRef.current, newId)
                                  }
                                  lastNodeIdRef.current = newId
                                  setShowAddMenu(false)
                                  requestAnimationFrame(() => performAutoLayout());
                              }}
                          >
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              {item.label}
                          </button>
                      ))}
                      <div className="h-px bg-slate-700 my-1" />
                      <button
                          className="px-4 py-3 text-left hover:bg-slate-800 text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-2"
                          onClick={() => {
                              const base: [number, number, number] = lastNodeIdRef.current ? (nodes.find(n=>n.id===lastNodeIdRef.current)?.position as any) || [0,0,0] : [0,0,0]
                              const pos = findOpenPosition3D(base)
                              addCluster(pos, 'hub')
                              setShowAddMenu(false)
                              requestAnimationFrame(() => performAutoLayout());
                          }}
                      >
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                          Add Hub Cluster
                      </button>
                      <button
                          className="px-4 py-3 text-left hover:bg-slate-800 text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-2"
                          onClick={() => {
                              const base: [number, number, number] = lastNodeIdRef.current ? (nodes.find(n=>n.id===lastNodeIdRef.current)?.position as any) || [0,0,0] : [0,0,0]
                              const pos = findOpenPosition3D(base)
                              addCluster(pos, 'game')
                              setShowAddMenu(false)
                              requestAnimationFrame(() => performAutoLayout());
                          }}
                      >
                          <div className="w-3 h-3 rounded-full bg-black border border-purple-500" />
                          Add Galaxy
                      </button>
                  </div>
              )}
            </div>
          )}
          
          {selectedIds.length > 0 && !isVisitor && (
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 p-1.5 rounded-full shadow-xl">
                   {selectedIds.length === 1 && (
                       <button 
                        onClick={() => startConnect(selectedIds[0])}
                        className="p-3 rounded-full hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                        title="Connect"
                       >
                           <Link className="w-5 h-5" />
                       </button>
                   )}
                   <button 
                    onClick={() => { if (selectedIds.length) { removeNodes(selectedIds); selectNode([]); } }}
                    className="p-3 rounded-full hover:bg-slate-800 text-slate-300 hover:text-red-400 transition-colors"
                    title="Delete"
                   >
                       <Trash2 className="w-5 h-5" />
                   </button>
              </div>
          )}
      </div>

      {/* Properties Sidebar (Right) - Only show if ONE node selected */}
      {selectedIds.length === 1 && selectedNode && (
          <div className="absolute top-20 right-4 bottom-20 z-40 w-80 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-200">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                  <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-cyan-500" />
                      <span className="font-bold text-slate-200">Properties</span>
                  </div>
                  <button onClick={() => selectNode([])} className="text-slate-500 hover:text-white">
                      <X className="w-4 h-4" />
                  </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Label</label>
                          <input 
                              className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all" 
                              value={selectedNode.label} 
                              onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })} 
                              placeholder="Node Name"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Type</label>
                              <select 
                                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded focus:ring-1 focus:ring-cyan-500 outline-none"
                                  value={selectedNode.type || 'node'}
                                  onChange={(e) => updateNode(selectedNode.id, { type: e.target.value as any })}
                              >
                                  <option value="node">Node</option>
                                  <option value="router">Router</option>
                                  <option value="hub">Hub</option>
                                  <option value="game">Game Core</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Color</label>
                              <div className="flex items-center gap-2 h-[38px]">
                                  {['#22d3ee', '#f472b6', '#a3e635', '#facc15', '#ef4444'].map(c => (
                                      <button 
                                          key={c}
                                          className={cn(
                                              "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                                              selectedNode.color === c ? "border-white scale-110" : "border-transparent"
                                          )}
                                          style={{ backgroundColor: c }}
                                          onClick={() => updateNode(selectedNode.id, { color: c })}
                                      />
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Description */}
                  <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Description</label>
                      <textarea 
                          className="w-full bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded h-24 resize-none focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
                          placeholder="Add details about this node..."
                          value={selectedNode.description || ''}
                          onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                      />
                  </div>

                  {/* Tags */}
                  <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Tags</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                          {(selectedNode.tags || []).map(tag => (
                              <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300">
                                  #{tag}
                                  <button onClick={() => removeTag(selectedNode.id, tag)} className="hover:text-red-400">
                                      <X className="w-3 h-3" />
                                  </button>
                              </span>
                          ))}
                      </div>
                      <div className="flex gap-2">
                          <input 
                              className="flex-1 bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                              placeholder="Add tag..."
                              value={newTagInput}
                              onChange={(e) => setNewTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newTagInput.trim()) {
                                      addTag(selectedNode.id, newTagInput.trim())
                                      setNewTagInput('')
                                  }
                              }}
                          />
                          <button 
                              disabled={!newTagInput.trim()}
                              onClick={() => {
                                  if (newTagInput.trim()) {
                                      addTag(selectedNode.id, newTagInput.trim())
                                      setNewTagInput('')
                                  }
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 disabled:opacity-50"
                          >
                              <Plus className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              </div>
              
              <div className="p-3 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
                  ID: {selectedNode.id}
              </div>
          </div>
      )}

      <Canvas key={cameraKey} camera={{ position: [50, 50, 50], fov: 50 }} className="w-full h-full">
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -5]} intensity={0.4} />
        <Grid 
            infiniteGrid 
            fadeDistance={2000} 
            sectionSize={10} 
            sectionThickness={1} 
            cellThickness={0.5} 
            sectionColor="#1e293b" 
            cellColor="#0f172a" 
        />
        <SupermassiveBlackHole />
        <MultiSelectionControls selectedIds={selectedIds} snapToGrid={snapToGrid} />
        <Nodes filterTags={filterTags} searchQuery={searchQuery} snapToGrid={snapToGrid} />
        <InteractiveEdges />
        <OrbitControls enablePan enableZoom enableRotate makeDefault />
      </Canvas>
    </div>
  )
}
