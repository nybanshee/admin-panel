## Scope
- Add Gamemodes and Maps management to Settings
- Map rotation weights, banning rules, candidate pool size per gamemode
- Recoil Lab: fix stretching, name and persist patterns, assign to guns
- Expand springs per gun and attachment slot rules
- Add more analytics graphs and lifetime stats
- Upgrade Planning Center to multi-tab: Trello board, Road Map, and 3D node network editor

## Data Model Updates (TypeScript)
- `src/types/game.ts`:
  - Add `MapConfig { id, name, tags: string[], enabled }`
  - Add `GameModeConfig { id, name, enabled, mapBanningEnabled, bansPerTeam, candidateCount, rotation: Array<{mapId, weight}> }`
  - Extend `WeaponSprings` with `ads`, `movement`, `reload`, `fire`, `sway` sub-springs `{ stiffness, damping }`
  - Add `AttachmentSlot` model per gun: `attachmentSlots: Record<'optic'|'muzzle'|'grip'|'mag'|'barrel'|'stock', { allowed: string[], equipped?: string }>`
  - Add `RecoilPattern { id, name, points: {x,y,time}[], createdAt }`

## State & Persistence
- Use `zustand` store `useConfigStore` for:
  - `maps: MapConfig[]`, `gamemodes: GameModeConfig[]`
  - `recoilPatterns: RecoilPattern[]` (persisted to `localStorage`)
  - `guns: Record<string, WeaponConfig>` with pattern assignment `stats.recoilPatternId?: string`

## Settings UI Additions
- `src/pages/GameSettings.tsx`:
  - Add tabs: `Gamemodes`, `Maps`, keep `Weapons`, `Ammunition`, `Attachments`, `Recoil Lab`
- Gamemodes tab:
  - List gamemodes with `NeonSwitch` enable, inputs for `bansPerTeam`, `candidateCount`
  - Map Rotation Editor: table of maps with weight sliders (0–100), add/remove maps to rotation; total weight validation
  - Toggle `mapBanningEnabled`
- Maps tab:
  - CRUD for maps (name, tags, enabled) using `TechCard` + inputs

## Recoil Lab Enhancements
- Canvas aspect ratio fix:
  - Wrap canvas in `aspect-[4/3] w-full` and set canvas `width=800`, `height=600`, `className="w-full h-auto"`
- Add name input and Save:
  - Save `RecoilPattern { id, name, points }` to store/localStorage
  - Pattern list with preview thumbnail (small canvas render) and delete
- Assign patterns to guns:
  - In Weapons -> Core Stats, replace current `Recoil Pattern` select with options from `recoilPatterns` (by name)

## Springs & Attachments Expansion
- Springs:
  - UI sections for `ads`, `movement`, `reload`, `fire`, `sway` with stiffness/damping sliders
- Attachments per gun:
  - Per-slot Allowed list (checkboxes from `attachments` by type)
  - Equipped select per slot (validates against allowed)

## Graphs & Stats Expansion
- `src/pages/Graphs.tsx`:
  - Add panels:
    - Weapon Usage (BarChart): picks per weapon
    - Accuracy Over Time (Line/Area)
    - K/D Ratio (Line)
    - Damage Distribution (Histogram-like Bar)
    - Recoil Deviation vs Target (Scatter)
    - Progression Fairness (XP vs Unlock count)
  - Add Lifetime Totals: counters (shots fired, hits, kills, attachments used)
  - Ensure all charts use `ResponsiveContainer height` and fixed parent heights

## Planning Center Upgrade
- Convert Planning Center to a multi-tab control:
  - Tabs: `Trello Board`, `Road Map`, `3D Network`
- Trello Board:
  - Columns (Backlog/In Progress/Done) with draggable cards (Framer Motion drag or `dnd-kit` if approved)
  - LocalStorage persistence
- Road Map:
  - Move existing `RoadMap` page into Planning Center tab; keep improved scrolling
- 3D Network Editor:
  - Option A (no new libs): 2D canvas with pan/zoom and node linking
  - Option B (preferred): Add `three` + `@react-three/fiber` for 3D nodes/edges, orbit controls, add/remove/connect nodes; stored in state
  - Confirmation needed before adding new dependencies

## Validation
- Unit test not required; manual validation:
  - Recoil saving/loading works across reloads
  - Gamemode rotation weights sum check and banning rules visible
  - Attachments slot constraints enforced
  - Charts render without size errors

## Deliverables
- Updated types, new UI panels/components, Zustand store with persistence, enhanced Recoil Lab, and expanded Graphs/Stats

## Dependencies (Optional)
- For 3D: `three`, `@react-three/fiber`, `@react-three/drei` (only if approved)

## Notes
- No backend yet; all data persisted in `localStorage`
- Styling follows existing Tailwind + Tech components and dark anime theme

Please confirm the plan, and whether to proceed with Option B for the 3D Network (add `three` + React Three Fiber).