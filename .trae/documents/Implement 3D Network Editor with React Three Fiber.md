## Overview
- Add a 3D Network tab that renders an interactive node/edge graph in 3D
- Use `three`, `@react-three/fiber`, and `@react-three/drei` for rendering and controls
- Support adding nodes, connecting edges, selecting, dragging, labeling, and persistence

## Dependencies
- Add: `three`, `@react-three/fiber`, `@react-three/drei`
- Keep Vite + React + TypeScript setup; no other changes required

## Data Model
- `NetworkNode3D { id: string; label: string; position: [number, number, number]; color?: string }`
- `NetworkEdge3D { id: string; a: string; b: string; color?: string }`
- Store in `zustand` with persistence to `localStorage` key `network3d_graph`

## Components
- `Network3DCanvas` (scene root): `Canvas` + lights + `OrbitControls`
- `NodesLayer`: renders nodes as spheres (instanced if > 200)
- `EdgesLayer`: renders edges as lines (simple `bufferGeometry` or `Line2`)
- `InteractionLayer`:
  - Raycasting for node selection
  - Dragging nodes with pointer events or `TransformControls`
  - HUD/Toolbar (add node, connect mode, delete, center view)
- `Labels`: use `Html` from `drei` for labels over nodes

## UI/UX
- Toolbar actions:
  - Add Node: random position near origin; prompt for label
  - Connect Mode: click node A, then node B to create edge
  - Delete Selected: remove node/edge
  - Center/Reset Camera: orbit controls reset
- Selection visuals: highlight node/edge; show label and mini inspector (id, position)
- Dragging: click-drag in scene to reposition selected node

## Persistence
- Save/load graph to `localStorage` automatically on change
- Import/Export JSON buttons for sharing
- Optional migration: import 2D network nodes as 3D with z=0

## Integration
- Replace current "Network" tab content in `PlanningCenter` with `Network3DCanvas`
- Keep existing Trello and Road Map tabs unchanged

## Performance
- Use instanced meshes for large node counts
- Frustum culling enabled by default
- Debounce saves to `localStorage`

## Validation
- Node add/drag/connect works
- Graph persists across reloads
- Labels readable; camera controls smooth

## Next Steps
- After approval, install dependencies and implement components, wire persistence in `zustand`, and integrate into Planning Center
