## Goal
Turn the Planning Center’s Trello board into a real-time, multi-user app that other apps can read/write. Provide a REST API and WebSocket channels for collaboration.

## Architecture
- Backend service: Node.js + Express + Socket.IO (or NestJS) for REST + realtime
- Persistence: SQLite (dev) → Postgres (prod) with Prisma ORM
- Auth: lightweight JWT (email/name) or API keys for service-to-service access
- Client: current React app connects via WebSocket and REST API

## Data Model
- Board { id, name, createdAt, updatedAt }
- Column { id, boardId, name, index }
- Card { id, columnId, title, description, tags[], assignee, index }
- Activity { id, boardId, actor, type, payload, timestamp }
- Presence { boardId, userId, status }

## REST API
- Boards
  - GET /boards → list
  - POST /boards → create
  - GET /boards/:id → detail
  - PATCH /boards/:id → rename
- Columns
  - POST /boards/:id/columns → create
  - PATCH /columns/:id → rename/reorder
  - DELETE /columns/:id
- Cards
  - POST /columns/:id/cards → create
  - PATCH /cards/:id → edit/move
  - DELETE /cards/:id
- Activity
  - GET /boards/:id/activity → recent events
- Auth
  - POST /auth/login → issue JWT; API key support for server-to-server

## Realtime (Socket.IO)
- Namespaces per board: /boards/:id
- Events
  - join_board { boardId }
  - column_created/updated/deleted
  - card_created/updated/deleted
  - reorder_columns/cards
  - presence_update { userId, status }
  - activity_event { type, payload }
- Conflict handling: last-write-wins + optimistic UI, index-based ordering with stable IDs

## Client Changes
- Replace localStorage Trello data with server-backed store
- Zustand store augmented with:
  - loadBoard(boardId) via REST
  - subscribeBoard(boardId) via WS
  - optimistic actions dispatch local update and emit WS; reconcile on ACK
- Presence UI: show online collaborators and cursors/avatars (minimal at first)
- Share flow: copy board link with boardId; anyone with access sees live updates

## Interop (other apps)
- Provide API keys and REST/WS docs so any app (mobile, CLI, another web app) can:
  - Read board/columns/cards
  - Push create/update/delete
  - Subscribe to WS events for live sync

## Security
- Auth middleware: verify JWT/API key; per-board ACLs
- Rate limiting: basic IP-based throttling
- CORS: allow your domain and the LocalTunnel/Vercel domain
- Input validation with Zod

## Deployment
- Backend: Render/Railway/Fly.io container; Postgres on same platform
- Frontend: Vercel/Netlify; configure env vars for API base URL and WS URL

## Migration Plan
1) Scaffold backend with Express + Prisma; create DB schema and REST endpoints
2) Add Socket.IO channels and event handlers
3) Update client Planning Center Trello tab to use REST/WS
4) Implement presence indicators
5) Write a short API doc (OpenAPI) for other apps

## Acceptance Tests
- Two browsers load the same board and see live card changes
- New columns/cards propagate instantly
- External app can POST a card and both clients see it via WS

Shall I proceed to implement the backend service and wire up the client connection?