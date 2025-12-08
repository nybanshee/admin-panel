import { create } from 'zustand'

export type Vec3 = [number, number, number]

export interface NetworkNode3D { id: string; label: string; position: Vec3; color?: string; type?: 'node' | 'router' | 'hub' | 'game'; tags?: string[]; description?: string; }
export interface NetworkEdge3D { id: string; a: string; b: string; color?: string }

type Operation = 
  | { type: 'addNode'; payload: { id: string, node?: NetworkNode3D } } 
  | { type: 'removeNode'; payload: { id: string, node?: NetworkNode3D, edges?: NetworkEdge3D[] } }
  | { type: 'moveNode'; payload: { id: string, position: Vec3, prevPosition: Vec3 } }
  | { type: 'moveNodes'; payload: { ids: string[], positions: Vec3[], prevPositions: Vec3[] } }
  | { type: 'updateNode'; payload: { id: string, updates: Partial<NetworkNode3D>, prevUpdates: Partial<NetworkNode3D> } }
  | { type: 'addEdge'; payload: { id: string, a: string, b: string, edge?: NetworkEdge3D } }
  | { type: 'removeEdge'; payload: { id: string, edge?: NetworkEdge3D } }
  | { type: 'splitEdge'; payload: { edgeId: string, newNodeId: string, oldEdge?: NetworkEdge3D, newEdges?: NetworkEdge3D[], newNode?: NetworkNode3D } };

interface Network3DState {
  nodes: NetworkNode3D[]
  edges: NetworkEdge3D[]
  selectedNodeIds: string[]
  connectFromId?: string
  interactionStartSnapshot: Map<string, Vec3>
  addNode: (label?: string, position?: Vec3, type?: 'node' | 'router' | 'hub' | 'game', color?: string) => string
  removeNode: (id: string) => void
  removeNodes: (ids: string[]) => void
  updateNodePosition: (id: string, position: Vec3) => void
  updateNode: (id: string, updates: Partial<NetworkNode3D>) => void
  addTag: (id: string, tag: string) => void
  removeTag: (id: string, tag: string) => void
  selectNode: (id?: string | string[]) => void
  startConnect: (id?: string) => void
  addEdge: (a: string, b: string) => void
  removeEdge: (id: string) => void
  splitEdge: (edgeId: string, newNodePos: Vec3) => void
  resetCameraToken: number
  triggerResetCamera: () => void
  load: (data: { nodes: NetworkNode3D[]; edges: NetworkEdge3D[] }) => void
  historyPast: Operation[]
  historyFuture: Operation[]
  undo: () => void
  redo: () => void
  clipboard: NetworkNode3D[]
  copy: () => void
  paste: () => void
  moveNodes: (ids: string[], delta: Vec3) => void
  startMoveNodes: (ids: string[]) => void
  endMoveNodes: (ids: string[]) => void
  autoWire: (matchTags: boolean, limits: { maxNodesPerRouter: number, maxRoutersPerHub: number, maxHubsPerCore: number }) => void
  clearAll: () => void
  addCluster: (position: Vec3, type: 'hub' | 'game') => void
}

const loadInitial = () => {
  try {
    const raw = localStorage.getItem('network3d_graph')
    if (!raw) return { nodes: [], edges: [] }
    return JSON.parse(raw)
  } catch {
    return { nodes: [], edges: [] }
  }
}

export const useNetwork3DStore = create<Network3DState>((set, get) => ({
  ...loadInitial(),
  selectedNodeIds: [],
  connectFromId: undefined,
  resetCameraToken: 0,
  historyPast: [],
  historyFuture: [],
  clipboard: [] as NetworkNode3D[],
  interactionStartSnapshot: new Map(),
  copy: () => {
      const state = get();
      const selected = state.nodes.filter(n => state.selectedNodeIds.includes(n.id));
      set({ clipboard: selected });
  },
  paste: () => {
      const state = get();
      if (state.clipboard.length === 0) return;
      
      const newNodes: NetworkNode3D[] = [];
      const newIds: string[] = [];
      
      state.clipboard.forEach(node => {
          const newId = `n_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          newNodes.push({
              ...node,
              id: newId,
              position: [node.position[0] + 2, node.position[1], node.position[2] + 2], // Offset
              label: `${node.label} (Copy)`
          });
          newIds.push(newId);
      });
      
      set(state => ({
          nodes: [...state.nodes, ...newNodes],
          selectedNodeIds: newIds, // Select the pasted nodes
          historyPast: [...state.historyPast, ...newNodes.map(n => ({ type: 'addNode', payload: { id: n.id, node: n } } as Operation))],
          historyFuture: []
      }));
  },
  startMoveNodes: (ids) => {
      const state = get();
      const snapshot = new Map<string, Vec3>();
      ids.forEach(id => {
          const node = state.nodes.find(n => n.id === id);
          if (node) snapshot.set(id, [...node.position]);
      });
      set({ interactionStartSnapshot: snapshot });
  },
  endMoveNodes: (ids) => {
      const state = get();
      const snapshot = state.interactionStartSnapshot;
      if (snapshot.size === 0) return;
      
      const prevPositions: Vec3[] = [];
      const currentPositions: Vec3[] = [];
      const validIds: string[] = [];

      ids.forEach(id => {
          const prev = snapshot.get(id);
          const current = state.nodes.find(n => n.id === id)?.position;
          if (prev && current) {
              // Check if actually moved
              if (prev[0] !== current[0] || prev[1] !== current[1] || prev[2] !== current[2]) {
                  validIds.push(id);
                  prevPositions.push(prev);
                  currentPositions.push([...current]);
              }
          }
      });

      if (validIds.length > 0) {
          set({
              historyPast: [...state.historyPast, { 
                  type: 'moveNodes', 
                  payload: { ids: validIds, positions: currentPositions, prevPositions } 
              } as Operation],
              historyFuture: [],
              interactionStartSnapshot: new Map() // clear
          });
      } else {
          set({ interactionStartSnapshot: new Map() });
      }
  },
  moveNodes: (ids, delta) => set(state => {
      const movedNodes = state.nodes.map(n => {
          if (ids.includes(n.id)) {
              return {
                  ...n,
                  position: [
                      n.position[0] + delta[0],
                      n.position[1] + delta[1],
                      n.position[2] + delta[2]
                  ] as Vec3
              };
          }
          return n;
      });
      return { nodes: movedNodes };
  }),
  autoWire: (matchTags: boolean, limits: { maxNodesPerRouter: number, maxRoutersPerHub: number, maxHubsPerCore: number }) => {
      set(state => {
          const newEdges: NetworkEdge3D[] = [];
          const existingEdges = state.edges;
          const nodes = state.nodes;
          
          // Helper to determine parent/child relationship and count connections
          const getTypeScore = (type?: string) => {
              if (type === 'game') return 4;
              if (type === 'hub') return 3;
              if (type === 'router') return 2;
              return 1; // node
          };

          const connectionCounts = new Map<string, number>();

          // Count existing connections
          existingEdges.forEach(e => {
              const nodeA = nodes.find(n => n.id === e.a);
              const nodeB = nodes.find(n => n.id === e.b);
              if (!nodeA || !nodeB) return;

              const scoreA = getTypeScore(nodeA.type);
              const scoreB = getTypeScore(nodeB.type);

              if (scoreA > scoreB) {
                  connectionCounts.set(nodeA.id, (connectionCounts.get(nodeA.id) || 0) + 1);
              } else if (scoreB > scoreA) {
                  connectionCounts.set(nodeB.id, (connectionCounts.get(nodeB.id) || 0) + 1);
              }
          });
          
          const hasEdge = (a: string, b: string) => {
              return existingEdges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a)) ||
                     newEdges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
          };

          const gameCores = nodes.filter(n => n.type === 'game');
          const hubs = nodes.filter(n => n.type === 'hub');
          const routers = nodes.filter(n => n.type === 'router');
          const regularNodes = nodes.filter(n => !['game', 'hub', 'router'].includes(n.type || ''));

          // Helper to get limit for a parent
          const getLimit = (parent: NetworkNode3D) => {
              if (parent.type === 'game') return limits.maxHubsPerCore;
              if (parent.type === 'hub') return limits.maxRoutersPerHub;
              if (parent.type === 'router') return limits.maxNodesPerRouter;
              return Infinity;
          };

          // Helper to try connecting a child to one of the parent groups (in order of preference)
          const tryConnect = (child: NetworkNode3D, parentGroups: NetworkNode3D[][]) => {
              for (const parents of parentGroups) {
                  if (parents.length === 0) continue;

                  let bestParent = null;
                  let minDistance = Infinity;

                  let validParents = parents;
                  if (matchTags && child.tags && child.tags.length > 0) {
                      const tagParents = parents.filter(p => p.tags && p.tags.some(t => child.tags?.includes(t)));
                      if (tagParents.length > 0) validParents = tagParents;
                      else if (matchTags) continue; // Strict mode: no tag match = no connection
                  }
                  
                  // Filter by capacity
                  validParents = validParents.filter(p => {
                      const currentCount = connectionCounts.get(p.id) || 0;
                      return currentCount < getLimit(p);
                  });

                  for (const parent of validParents) {
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
                      if (!hasEdge(child.id, bestParent.id)) {
                          newEdges.push({
                              id: `e_auto_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
                              a: child.id,
                              b: bestParent.id,
                              color: '#64748b'
                          });
                          // Increment count for this batch
                          connectionCounts.set(bestParent.id, (connectionCounts.get(bestParent.id) || 0) + 1);
                      }
                      return; // Connected to the best parent in this tier, stop looking at fallback tiers
                  }
              }
          };

          // 1. Hubs -> [Game Cores]
          hubs.forEach(h => tryConnect(h, [gameCores]));

          // 2. Routers -> [Hubs, Game Cores]
          routers.forEach(r => tryConnect(r, [hubs, gameCores]));

          // 3. Nodes -> [Routers, Hubs, Game Cores]
          regularNodes.forEach(n => tryConnect(n, [routers, hubs, gameCores]));
          
          if (newEdges.length === 0) return {};
          
          return {
              edges: [...state.edges, ...newEdges],
              historyPast: [...state.historyPast, ...newEdges.map(e => ({ type: 'addEdge', payload: { id: e.id, a: e.a, b: e.b, edge: e } } as Operation))],
              historyFuture: []
          };
      });
  },
  clearAll: () => set(state => ({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      historyPast: [...state.historyPast, { type: 'removeNode', payload: { id: 'ALL' } } as Operation], // Simplified history for clear all
      historyFuture: []
  })),
  addCluster: (position: Vec3, type: 'hub' | 'game') => set(state => {
      const newNodes: NetworkNode3D[] = [];
      const newEdges: NetworkEdge3D[] = [];
      const timestamp = Date.now();
      
      const createNode = (label: string, pos: Vec3, type: 'node'|'router'|'hub'|'game', color: string): NetworkNode3D => ({
          id: `n_${timestamp}_${Math.random().toString(36).substr(2,5)}`,
          label,
          position: pos,
          type,
          color
      });

      const createEdge = (a: string, b: string): NetworkEdge3D => ({
          id: `e_${timestamp}_${Math.random().toString(36).substr(2,5)}`,
          a, b, color: '#64748b'
      });

      // --- Generators ---
      // These generate positions relative to the center, we will rely on AutoLayout to fix them nicely later
      // But we give them initial offsets so they aren't all at 0,0,0
      
      if (type === 'hub') {
          // Create 1 Hub, 3 Routers, 5 Nodes per Router (15 Nodes)
          const hub = createNode('New Hub', position, 'hub', '#a3e635');
          newNodes.push(hub);

          for (let i = 0; i < 3; i++) {
              const rPos: Vec3 = [position[0] + (Math.random()-0.5)*10, position[1] + (Math.random()-0.5)*10, position[2] + (Math.random()-0.5)*10];
              const router = createNode(`Router ${i+1}`, rPos, 'router', '#f472b6');
              newNodes.push(router);
              newEdges.push(createEdge(router.id, hub.id));

              for (let j = 0; j < 5; j++) {
                  const nPos: Vec3 = [rPos[0] + (Math.random()-0.5)*5, rPos[1] + (Math.random()-0.5)*5, rPos[2] + (Math.random()-0.5)*5];
                  const node = createNode(`Node ${i+1}-${j+1}`, nPos, 'node', '#22d3ee');
                  newNodes.push(node);
                  newEdges.push(createEdge(node.id, router.id));
              }
          }
      } else if (type === 'game') {
          // Create 1 Game Core, 3 Hubs, 2 Routers per Hub, 3 Nodes per Router
          const core = createNode('New Galaxy', position, 'game', '#000000');
          newNodes.push(core);

          for (let h = 0; h < 3; h++) {
              const hPos: Vec3 = [position[0] + (Math.random()-0.5)*20, position[1] + (Math.random()-0.5)*20, position[2] + (Math.random()-0.5)*20];
              const hub = createNode(`Hub ${h+1}`, hPos, 'hub', '#a3e635');
              newNodes.push(hub);
              newEdges.push(createEdge(hub.id, core.id));

              for (let r = 0; r < 2; r++) {
                  const rPos: Vec3 = [hPos[0] + (Math.random()-0.5)*10, hPos[1] + (Math.random()-0.5)*10, hPos[2] + (Math.random()-0.5)*10];
                  const router = createNode(`Router ${h+1}-${r+1}`, rPos, 'router', '#f472b6');
                  newNodes.push(router);
                  newEdges.push(createEdge(router.id, hub.id));

                  for (let n = 0; n < 3; n++) {
                      const nPos: Vec3 = [rPos[0] + (Math.random()-0.5)*5, rPos[1] + (Math.random()-0.5)*5, rPos[2] + (Math.random()-0.5)*5];
                      const node = createNode(`Node ${h+1}-${r+1}-${n+1}`, nPos, 'node', '#22d3ee');
                      newNodes.push(node);
                      newEdges.push(createEdge(node.id, router.id));
                  }
              }
          }
      }

      // Combine operations for history: nodes first, then edges
      const nodeOps: Operation[] = newNodes.map(n => ({ type: 'addNode', payload: { id: n.id, node: n } }));
      const edgeOps: Operation[] = newEdges.map(e => ({ type: 'addEdge', payload: { id: e.id, a: e.a, b: e.b, edge: e } }));

      return {
          nodes: [...state.nodes, ...newNodes],
          edges: [...state.edges, ...newEdges],
          historyPast: [...state.historyPast, ...nodeOps, ...edgeOps],
          historyFuture: []
      };
  }),
  addNode: (label = 'Node', position = [0, 0, 0], type = 'node', color = '#22d3ee') => {
    const id = `n_${Date.now()}`
    const node: NetworkNode3D = { id, label, position, color, type };
    set(state => ({ 
      nodes: [...state.nodes, node],
      historyPast: [...state.historyPast, { type: 'addNode', payload: { id, node } }],
      historyFuture: []
    }))
    return id
  },
  removeNode: id =>
    set(state => {
      const node = state.nodes.find(n => n.id === id);
      const connectedEdges = state.edges.filter(e => e.a === id || e.b === id);
      return { 
        nodes: state.nodes.filter(n => n.id !== id), 
        edges: state.edges.filter(e => e.a !== id && e.b !== id),
        historyPast: [...state.historyPast, { type: 'removeNode', payload: { id, node, edges: connectedEdges } }],
        historyFuture: []
      }
    }),
  removeNodes: ids =>
    set(state => {
      const nodesToRemove = state.nodes.filter(n => ids.includes(n.id));
      const edgesToRemove = state.edges.filter(e => ids.includes(e.a) || ids.includes(e.b));
      
      // We can batch these into a single "composite" operation or just push multiple operations.
      // For simplicity, pushing multiple operations (LIFO for undo means last removed is first restored).
      // However, if we remove 100 nodes, 100 undo steps is annoying.
      // Better to have a 'removeNodes' operation type, but sticking to existing pattern for now, 
      // let's just do individual removeNode operations.
      const ops: Operation[] = ids.map(id => {
          const node = state.nodes.find(n => n.id === id);
          const connectedEdges = state.edges.filter(e => e.a === id || e.b === id);
          return { type: 'removeNode', payload: { id, node, edges: connectedEdges } };
      });
      
      return {
        nodes: state.nodes.filter(n => !ids.includes(n.id)),
        edges: state.edges.filter(e => !ids.includes(e.a) && !ids.includes(e.b)),
        historyPast: [...state.historyPast, ...ops],
        historyFuture: []
      }
    }),
  updateNodePosition: (id, position) =>
    set(state => ({ 
      nodes: state.nodes.map(n => (n.id === id ? { ...n, position } : n)),
      historyPast: [...state.historyPast, { type: 'moveNode', payload: { id, position, prevPosition: state.nodes.find(n => n.id === id)?.position || [0,0,0] } }],
      historyFuture: []
    })),
  updateNode: (id, updates) =>
    set(state => ({ 
      nodes: state.nodes.map(n => (n.id === id ? { ...n, ...updates } : n)),
      historyPast: [...state.historyPast, { type: 'updateNode', payload: { id, updates, prevUpdates: state.nodes.find(n=>n.id===id) } }],
      historyFuture: []
    })),
  addTag: (id, tag) => 
    set(state => ({
      nodes: state.nodes.map(n => n.id === id ? { ...n, tags: [...(n.tags || []), tag] } : n),
      historyPast: [...state.historyPast, { type: 'updateNode', payload: { id, updates: { tags: [...(state.nodes.find(n=>n.id===id)?.tags || []), tag] }, prevUpdates: { tags: state.nodes.find(n=>n.id===id)?.tags } } }],
      historyFuture: []
    })),
  removeTag: (id, tag) =>
    set(state => ({
      nodes: state.nodes.map(n => n.id === id ? { ...n, tags: (n.tags || []).filter(t => t !== tag) } : n),
      historyPast: [...state.historyPast, { type: 'updateNode', payload: { id, updates: { tags: (state.nodes.find(n=>n.id===id)?.tags || []).filter(t => t !== tag) }, prevUpdates: { tags: state.nodes.find(n=>n.id===id)?.tags } } }],
      historyFuture: []
    })),
  selectNode: id => set({ selectedNodeIds: !id ? [] : Array.isArray(id) ? id : [id] }),
  startConnect: id => set({ connectFromId: id }),
  addEdge: (a, b) => set(state => {
    const id = `e_${Date.now()}`;
    const edge: NetworkEdge3D = { id, a, b, color: '#64748b' };
    return { 
      edges: [...state.edges, edge], 
      connectFromId: undefined,
      historyPast: [...state.historyPast, { type: 'addEdge', payload: { id, a, b, edge } }],
      historyFuture: []
    }
  }),
  removeEdge: id => set(state => {
    const edge = state.edges.find(e => e.id === id);
    return { 
      edges: state.edges.filter(e => e.id !== id),
      historyPast: [...state.historyPast, { type: 'removeEdge', payload: { id, edge } }],
      historyFuture: []
    }
  }),
  splitEdge: (edgeId, newNodePos) => set(state => {
      const edge = state.edges.find(e => e.id === edgeId);
      if (!edge) return {};
      const newNodeId = `n_${Date.now()}`;
      const newNode: NetworkNode3D = { id: newNodeId, label: 'Split Node', position: newNodePos, color: '#22d3ee', type: 'node' };
      const newEdge1 = { id: `e_${Date.now()}_1`, a: edge.a, b: newNodeId, color: edge.color };
      const newEdge2 = { id: `e_${Date.now()}_2`, a: newNodeId, b: edge.b, color: edge.color };
      const nodes = state.nodes.map(n => {
        if (n.id === edge.a) {
          const p = n.position
          return { ...n, position: [p[0] - 0.05, p[1], p[2]] as Vec3 }
        }
        if (n.id === edge.b) {
          const p = n.position
          return { ...n, position: [p[0] + 0.05, p[1], p[2]] as Vec3 }
        }
        return n
      })
      return {
          nodes: [...nodes, newNode],
          edges: [...state.edges.filter(e => e.id !== edgeId), newEdge1, newEdge2],
          historyPast: [...state.historyPast, { type: 'splitEdge', payload: { edgeId, newNodeId, oldEdge: edge, newEdges: [newEdge1, newEdge2], newNode } }],
          historyFuture: []
      };
  }),
  triggerResetCamera: () => set(state => ({ resetCameraToken: state.resetCameraToken + 1 })),
  load: data => set({ nodes: data.nodes || [], edges: data.edges || [] }),
  undo: () => {
    const state = get()
    const past = state.historyPast.slice()
    if (past.length === 0) return
    const op = past.pop() as Operation
    let nodes = state.nodes.slice()
    let edges = state.edges.slice()
    
    if (op.type === 'addNode') {
      nodes = nodes.filter(n => n.id !== op.payload.id)
      // Also remove any edges that might have been connected to this node 
      // (though usually addNode doesn't add edges immediately, but if it did)
      edges = edges.filter(e => e.a !== op.payload.id && e.b !== op.payload.id);
    } else if (op.type === 'removeNode') {
      if (op.payload.node) {
          nodes = [...nodes, op.payload.node];
      }
      if (op.payload.edges) {
          // Restore edges that don't exist
          op.payload.edges.forEach(e => {
              if (!edges.some(ex => ex.id === e.id)) {
                  edges.push(e);
              }
          });
      }
    } else if (op.type === 'moveNode') {
      nodes = nodes.map(n => n.id === op.payload.id ? { ...n, position: op.payload.prevPosition } : n)
    } else if (op.type === 'moveNodes') {
      const { ids, prevPositions } = op.payload;
      nodes = nodes.map(n => {
          const idx = ids.indexOf(n.id);
          if (idx !== -1) {
              return { ...n, position: prevPositions[idx] };
          }
          return n;
      });
    } else if (op.type === 'updateNode') {
      nodes = nodes.map(n => n.id === op.payload.id ? { ...n, ...(op.payload.prevUpdates || {}) } : n)
    } else if (op.type === 'addEdge') {
      edges = edges.filter(e => e.id !== op.payload.id)
    } else if (op.type === 'removeEdge') {
      if (op.payload.edge) {
          edges = [...edges, op.payload.edge];
      }
    } else if (op.type === 'splitEdge') {
      // Undo split: remove new node, remove new edges, restore old edge
      const id = op.payload.newNodeId
      nodes = nodes.filter(n => n.id !== id)
      edges = edges.filter(e => e.a !== id && e.b !== id)
      if (op.payload.oldEdge) {
          edges.push(op.payload.oldEdge);
      }
    }
    set({ nodes, edges, historyPast: past, historyFuture: [...state.historyFuture, op] })
  },
  redo: () => {
    const state = get()
    const future = state.historyFuture.slice()
    if (future.length === 0) return
    const op = future.pop() as Operation
    let nodes = state.nodes.slice()
    let edges = state.edges.slice()
    
    if (op.type === 'addNode') {
      if (op.payload.node) {
          nodes = [...nodes, op.payload.node];
      }
    } else if (op.type === 'removeNode') {
      nodes = nodes.filter(n => n.id !== op.payload.id)
      edges = edges.filter(e => e.a !== op.payload.id && e.b !== op.payload.id);
    } else if (op.type === 'moveNode') {
      nodes = nodes.map(n => n.id === op.payload.id ? { ...n, position: op.payload.position } : n)
    } else if (op.type === 'moveNodes') {
      const { ids, positions } = op.payload;
      nodes = nodes.map(n => {
          const idx = ids.indexOf(n.id);
          if (idx !== -1) {
              return { ...n, position: positions[idx] };
          }
          return n;
      });
    } else if (op.type === 'updateNode') {
      nodes = nodes.map(n => n.id === op.payload.id ? { ...n, ...op.payload.updates } : n)
    } else if (op.type === 'addEdge') {
      if (op.payload.edge) {
          edges = [...edges, op.payload.edge];
      }
    } else if (op.type === 'removeEdge') {
      edges = edges.filter(e => e.id !== op.payload.id)
    } else if (op.type === 'splitEdge') {
      // Redo split
      if (op.payload.newNode && op.payload.newEdges) {
          nodes = [...nodes, op.payload.newNode];
          // Remove old edge
          edges = edges.filter(e => e.id !== op.payload.edgeId);
          // Add new edges
          edges = [...edges, ...op.payload.newEdges];
      }
    }
    set({ nodes, edges, historyPast: [...state.historyPast, op], historyFuture: future })
  }
}))

useNetwork3DStore.subscribe(state => {
  const payload = { nodes: state.nodes, edges: state.edges }
  try {
    localStorage.setItem('network3d_graph', JSON.stringify(payload))
  } catch {}
})
