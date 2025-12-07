# Design Documentation: Animated Admin Panel

## 1. Visual Style (Anime Dark Theme)
- **Palette**:
  - Background: `bg-slate-950` or darker (almost black).
  - Surface: `bg-slate-900` with slight transparency or gradients.
  - Accent: `text-cyan-400` or `text-blue-500` (Electric Blue).
  - Borders: Sharp, angular, maybe using `clip-path` for cut corners.
- **Typography**: Sans-serif, clean, maybe uppercase headers with wide spacing.

## 2. Layout Structure
- **Sidebar**:
  - Angular styling for active items.
  - Glow effects on hover.
- **Main Content**:
  - Dark background.
  - Cards with cut corners or tech-inspired borders.

## 3. Pages Design

### 3.1 Overview
- Updated to match new theme.

### 3.2 Logs
- Console style remains, but fits into the new "Tech" frame.

### 3.3 Economy
- Stats cards for currency, transactions, etc.
- List of recent transactions.

### 3.4 Game Settings
- **Switches**: Custom styled toggles (neon/glow effect).
- **Categories**:
  - "Systems" (GunSystem, MagicSystem, etc.)
  - "Guns" (AK-47, M4, Pistol, etc.)

### 3.5 Graphs
- **Progression Graph**: Line chart showing user level/xp over time.
- **Unlocks Graph**: Bar chart or Area chart showing unlocks at different levels.
- Library: `Recharts` with custom tooltips and dark theme colors.

## 4. Components
- `TechCard`: A wrapper component with the "cool shape" styling.
- `NeonSwitch`: A toggle switch with a glow effect.
- `TechButton`: Angular button with hover animations.
