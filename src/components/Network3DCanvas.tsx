import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, TransformControls } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import { Mesh, BufferGeometry, Float32BufferAttribute } from 'three'
import { useNetwork3DStore } from '../store/network3d'

function Edges() {
  const nodes = useNetwork3DStore(s => s.nodes)
  const edges = useNetwork3DStore(s => s.edges)
  const geom = useMemo(() => {
    const g = new BufferGeometry()
    const positions: number[] = []
    for (const e of edges) {
      const a = nodes.find(n => n.id === e.a)
      const b = nodes.find(n => n.id === e.b)
      if (!a || !b) continue
      positions.push(...a.position, ...b.position)
    }
    g.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return g
  }, [nodes, edges])
  return <lineSegments geometry={geom}><lineBasicMaterial color={'#334155'} /></lineSegments>
}

function NodeSphere({ id, label, position, color }: { id: string; label: string; position: [number, number, number]; color?: string }) {
  const meshRef = useRef<Mesh>(null)
  const selectedId = useNetwork3DStore(s => s.selectedNodeId)
  const selectNode = useNetwork3DStore(s => s.selectNode)
  const updatePos = useNetwork3DStore(s => s.updateNodePosition)
  const connectFromId = useNetwork3DStore(s => s.connectFromId)
  const startConnect = useNetwork3DStore(s => s.startConnect)
  const addEdge = useNetwork3DStore(s => s.addEdge)
  const [hovered, setHovered] = useState(false)
  const isSelected = selectedId === id
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.001
  })
  return (
    <group position={position}>
      <mesh ref={meshRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={() => {
        if (connectFromId && connectFromId !== id) addEdge(connectFromId, id)
        else selectNode(id)
      }}>
        <sphereGeometry args={[isSelected ? 0.18 : 0.14, 24, 24]} />
        <meshStandardMaterial color={hovered || isSelected ? '#22d3ee' : color || '#64748b'} />
      </mesh>
      <Html distanceFactor={20} position={[0, 0.35, 0]}>
        <div className="px-2 py-1 text-[10px] rounded bg-slate-900/80 border border-slate-700 text-white font-mono">
          {label}
        </div>
      </Html>
      {isSelected && (
        <TransformControls object={meshRef as any} mode="translate" onChange={() => {
          const m = meshRef.current
          if (!m) return
          const p = m.parent?.position
          if (!p) return
          updatePos(id, [p.x, p.y, p.z])
        }} />
      )}
    </group>
  )
}

function Nodes() {
  const nodes = useNetwork3DStore(s => s.nodes)
  return (
    <group>
      {nodes.map(n => (
        <NodeSphere key={n.id} id={n.id} label={n.label} position={n.position} color={n.color} />
      ))}
    </group>
  )
}

export function Network3DCanvas() {
  const addNode = useNetwork3DStore(s => s.addNode)
  const selectNode = useNetwork3DStore(s => s.selectNode)
  const removeNode = useNetwork3DStore(s => s.removeNode)
  const startConnect = useNetwork3DStore(s => s.startConnect)
  const selectedId = useNetwork3DStore(s => s.selectedNodeId)
  const resetToken = useNetwork3DStore(s => s.resetCameraToken)
  const triggerReset = useNetwork3DStore(s => s.triggerResetCamera)
  const [cameraKey, setCameraKey] = useState(0)
  const onResetCamera = () => setCameraKey(k => k + 1)
  if (resetToken) {}
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full">
        <button className="px-3 py-2 bg-cyan-500 text-slate-900 font-bold" onClick={() => addNode('Node', [Math.random() * 4 - 2, Math.random() * 2, Math.random() * 4 - 2])}>Add Node</button>
        <button className="px-3 py-2 bg-slate-800 text-slate-300 border border-slate-700" onClick={() => startConnect(selectedId)}>Connect Mode</button>
        <button className="px-3 py-2 bg-slate-800 text-red-400 border border-slate-700" onClick={() => { if (selectedId) { removeNode(selectedId); selectNode(undefined) } }}>Delete Selected</button>
        <button className="px-3 py-2 bg-slate-800 text-slate-300 border border-slate-700" onClick={() => { triggerReset(); onResetCamera() }}>Reset Camera</button>
      </div>
      <Canvas key={cameraKey} camera={{ position: [6, 6, 6], fov: 60 }} className="w-full h-full">
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.6} />
        <gridHelper args={[20, 20, '#1e293b', '#1e293b']} />
        <Nodes />
        <Edges />
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>
    </div>
  )
}

