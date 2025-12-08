## Overview
Enhance the 3D Networking tab and Planning Center to provide real-time collaboration, infinite boards, advanced node systems, specialized network components, robust interaction tools, undo/redo, and performance optimizations — while preserving the SOLO Builder architecture.

## Architecture
- **Client state**: Zustand stores for Trello (board canvas) and 3D Network (`useConfigStore`, `useNetwork3DStore`).
- **Realtime**: Socket.IO channels per board with deterministic operation streams (IDs + timestamps).
- **Persistence**: REST endpoints (`GET/PUT /boards/:id`) and WebSocket events (`nodes_update`, `graph3d_update`).
- **Consistency**: Last-write-wins with operation queues; optional optimistic UI with server ACK reconciliation.

## Real‑Time Synchronization
- **Server**:
  - Extend board model with `graph3d: { nodes, edges }`.
  - WS events: `graph3d_update`, `nodes_update`; broadcast on PUTs and WS operations.
  - Anti-loop: ignore echoes from origin sender; broadcast to `socket.to(boardId)` only; client dedup by `opId`.
- **Client**:
  - Wrap mutations in ops `{opId, ts, userId, type, payload}`; apply locally and send via WS.
  - On incoming ops, deduplicate by `opId`; reconcile conflicts (stable IDs, edge rewire).

## Interface Improvements (Planning Center)
- **Infinite Board**:
  - Pan/zoom container using CSS transforms; nodes positioned in world coordinates.
  - Wheel: pan; Ctrl/Cmd+wheel: zoom; reset button; grid scales with zoom.
- **Components**:
  - Types: `note`, `text`, `image`, `file`.
  - Node palette to insert component types; image/file nodes render previews and metadata.
- **Auto‑connect last node**:
  - Keep `lastNodeId`; new 3D node auto-creates edge to that node (if exists).

## 3D Node System
- **Octagonal layout**:
  - Octagon ring placement around a parent or origin using angle steps (45°) and radius growth; select nearest free slot.
  - Spacing: minimum distance; escalate radius if collisions.
- **Origin at center**:
  - TransformControls target the group that represents the node; updates store with group's world position.
- **Insert node on edge**:
  - Click midpoint handle to split edge; insert node; optionally relax adjacent nodes (simple spring model) to maintain spacing.
- **Color picker**:
  - Node properties panel with preset swatches + HSV picker; updates store and broadcasts.

## Network Components
- **Router**: box mesh with icon/label; special type with max links and throughput metadata.
- **Hub**: cylinder/octagon mesh; broadcast link semantics; different styling.
- **Inside/outside boundaries**:
  - Optional boundary volume (box); on drag outside, mark node as `external`; style differently.
- **Connection tools**:
  - Modes: Connect, Delete, Rewire; context menu on node/edge; validate rules per type.

## Technical Requirements
- **Three.js / React Three Fiber**: current setup retained; add drei `Html`, `TransformControls` already used.
- **Collision detection**:
  - Spatial hashing grid (bucket size = minDistance) to check neighbors quickly.
  - Fallback quadtree if needed for very dense clusters.
- **Undo/Redo**:
  - Command stack (apply/invert) for operations: add/remove node/edge, move, recolor, type change.
  - Persist recent stack per client; broadcast canonical ops for collaborative consistency.
- **Performance**:
  - InstancedMeshes for large node counts; lazy labels (Html only for selected/hovered); throttle WS updates; debounced persistence.
  - Frustum culling default; memoized geometries/materials.

## Testing
- **Realtime**:
  - Two browsers; add/move/delete nodes/edges; confirm immediate propagation.
- **Insert between connections**:
  - Split edges at various lengths; verify spacing and link rewiring.
- **Component rendering**:
  - Text/image/file nodes; drag/resize; delete; re-open refresh correctness.
- **Routers/Hubs**:
  - Create networks with mixed types; connect/rewire; move inside/outside boundary; verify visual rules.

## Deliverables
- **Functional UI**: 3D Network tab + Infinite Board with advanced components.
- **Docs**: Usage, modes, and APIs (REST + WS). In-code comments and a short MD guide.
- **Tests**: Unit tests for layout, spacing, splitting, and undo/redo (Vitest/Jest).
- **Benchmarks**: Node counts (100/500/2000) with FPS and operation latency.

## Implementation Steps
1. Extend server board schema and WS events for `graph3d_update`.
2. Add client op system with `opId` dedupe for Trello and 3D.
3. Infinite pan/zoom for Trello; add new component types and insertion palette.
4. 3D: Router/Hub visuals; properties panel (label/type/color); auto-connect last node.
5. Octagonal layout + collision grid; implement edge split with spacing relaxation.
6. Undo/Redo stacks and performance tuning (instancing/throttles).
7. Unit tests and usage docs.

## SOLO Builder Compatibility
- Maintain existing component structure and state stores; incremental changes with clear boundaries.
- No breaking changes to current routes or layout.

Please confirm, and I’ll implement these steps end-to-end.