import { create } from 'zustand'

export type Vec3 = [number, number, number]

export interface NetworkNode3D { id: string; label: string; position: Vec3; color?: string }
export interface NetworkEdge3D { id: string; a: string; b: string; color?: string }

interface Network3DState {
  nodes: NetworkNode3D[]
  edges: NetworkEdge3D[]
  selectedNodeId?: string
  connectFromId?: string
  addNode: (label?: string, position?: Vec3) => void
  removeNode: (id: string) => void
  updateNodePosition: (id: string, position: Vec3) => void
  selectNode: (id?: string) => void
  startConnect: (id?: string) => void
  addEdge: (a: string, b: string) => void
  removeEdge: (id: string) => void
  resetCameraToken: number
  triggerResetCamera: () => void
  load: (data: { nodes: NetworkNode3D[]; edges: NetworkEdge3D[] }) => void
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
  selectedNodeId: undefined,
  connectFromId: undefined,
  resetCameraToken: 0,
  addNode: (label = 'Node', position = [0, 0, 0]) =>
    set(state => ({ nodes: [...state.nodes, { id: `n_${Date.now()}`, label, position, color: '#22d3ee' }] })),
  removeNode: id =>
    set(state => ({ nodes: state.nodes.filter(n => n.id !== id), edges: state.edges.filter(e => e.a !== id && e.b !== id) })),
  updateNodePosition: (id, position) =>
    set(state => ({ nodes: state.nodes.map(n => (n.id === id ? { ...n, position } : n)) })),
  selectNode: id => set({ selectedNodeId: id }),
  startConnect: id => set({ connectFromId: id }),
  addEdge: (a, b) => set(state => ({ edges: [...state.edges, { id: `e_${Date.now()}`, a, b, color: '#64748b' }], connectFromId: undefined })),
  removeEdge: id => set(state => ({ edges: state.edges.filter(e => e.id !== id) })),
  triggerResetCamera: () => set(state => ({ resetCameraToken: state.resetCameraToken + 1 })),
  load: data => set({ nodes: data.nodes, edges: data.edges })
}))

useNetwork3DStore.subscribe(state => {
  const payload = { nodes: state.nodes, edges: state.edges }
  try {
    localStorage.setItem('network3d_graph', JSON.stringify(payload))
  } catch {}
})

