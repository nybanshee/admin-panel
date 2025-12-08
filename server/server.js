import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] }
})

const boards = new Map()
const onlineUsers = new Map() // socketId -> { username, role, location, timestamp }
const adminLogs = []

// --- Game Config Store ---
let gameConfig = {
    guns: {},
    bullets: [],
    attachments: [],
    maps: [],
    gamemodes: [],
    recoilPatterns: []
};
// -------------------------

// --- Log Simulation ---
setInterval(() => {
    // 1. Simulate Backend Log
    if (Math.random() > 0.7) {
        const levels = ['info', 'info', 'info', 'warn', 'debug'];
        const msgs = [
            'Database query took 12ms',
            'Health check passed',
            'Garbage collection started',
            'Cache miss for key: user_meta',
            'API rate limit warning for IP 192.168.1.x'
        ];
        io.emit('log_backend', {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            level: levels[Math.floor(Math.random() * levels.length)],
            message: msgs[Math.floor(Math.random() * msgs.length)]
        });
    }

    // 2. Simulate Game Log
    if (Math.random() > 0.5) {
        const sources = ['Client', 'Server', 'Shared'];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const msgs = [
            'Player spawned at 120, 40, 10',
            'Weapon fired: AK-47',
            'Physics tick processed (16ms)',
            'Inventory synced',
            'Hit registration verified'
        ];
        
        io.emit('log_game', {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            level: 'info',
            message: msgs[Math.floor(Math.random() * msgs.length)],
            source
        });
    }
}, 3000);
// ----------------------

function getBoard(id) {
  if (!boards.has(id)) boards.set(id, { id, nodes: [], edges: [], graph3d: { nodes: [], edges: [] } })
  return boards.get(id)
}

app.get('/admin/logs', (req, res) => {
    res.json(adminLogs)
})

app.get('/admin/users', (req, res) => {
    res.json(Array.from(onlineUsers.values()))
})

app.get('/boards/:id', (req, res) => {
  const b = getBoard(req.params.id)
  res.json(b)
})

// Mock Game Config Endpoint for Sync/Graphs
app.get('/game-config', (req, res) => {
    res.json(gameConfig)
})

app.post('/game-config', (req, res) => {
    // Merge or replace config
    // We expect the body to contain partial or full config
    const { guns, bullets, attachments, maps, gamemodes, recoilPatterns } = req.body;
    
    if (guns) gameConfig.guns = guns;
    if (bullets) gameConfig.bullets = bullets;
    if (attachments) gameConfig.attachments = attachments;
    if (maps) gameConfig.maps = maps;
    if (gamemodes) gameConfig.gamemodes = gamemodes;
    if (recoilPatterns) gameConfig.recoilPatterns = recoilPatterns;
    
    // Notify clients if needed (optional)
    io.emit('config_update', gameConfig);
    
    res.json({ success: true, config: gameConfig });
})

// --- ROBLOX API INTEGRATION ---

const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY || "change_me_in_prod";

// Middleware to check for API Key
const checkRobloxAuth = (req, res, next) => {
    const key = req.headers['roblox-security-key'];
    if (key !== ROBLOX_API_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
};

// 1. Get Config (for Game Server)
app.get('/api/roblox/config', checkRobloxAuth, (req, res) => {
    res.json(gameConfig);
});

// 2. Receive Logs (from Game Server)
app.post('/api/roblox/logs', checkRobloxAuth, (req, res) => {
    const { message, level, source, details } = req.body;
    
    const logEntry = {
        id: Date.now().toString() + Math.random().toString().slice(2, 6),
        timestamp: new Date().toISOString(),
        level: level || 'info',
        message: message || 'No message',
        source: source || 'Roblox',
        details
    };

    // Emit to web frontend immediately
    io.emit('log_game', logEntry);
    
    res.json({ success: true });
});

// 3. Receive Player Stats/Presence (Optional)
app.post('/api/roblox/players', checkRobloxAuth, (req, res) => {
    const { players } = req.body; // Expects array of { userId, username, ... }
    // Could store this in a 'robloxUsers' map if we wanted to show them on the dashboard
    // For now, just log it or emit it
    io.emit('roblox_players_update', players);
    res.json({ success: true });
});

// ------------------------------

app.put('/boards/:id', (req, res) => {
  const b = getBoard(req.params.id)
  if (req.body.nodes) b.nodes = req.body.nodes
  if (req.body.graph3d) b.graph3d = req.body.graph3d
  
  // Trello update
  if (req.body.nodes) io.to(req.params.id).emit('nodes_update', { nodes: b.nodes })
  // 3D Network update
  if (req.body.graph3d) io.to(req.params.id).emit('graph3d_update', b.graph3d)
  
  res.json(b)
})

io.on('connection', socket => {
  socket.on('join_board', ({ boardId }) => {
    socket.join(boardId)
    const b = getBoard(boardId)
    socket.emit('nodes_update', { nodes: b.nodes })
    socket.emit('graph3d_update', b.graph3d)
  })
  
  // Presence
  socket.on('presence_update', (data) => {
      // data: { username, role, location }
      onlineUsers.set(socket.id, { ...data, id: socket.id, timestamp: Date.now() });
      io.emit('online_users_update', Array.from(onlineUsers.values()));
  });

  socket.on('disconnect', () => {
      onlineUsers.delete(socket.id);
      io.emit('online_users_update', Array.from(onlineUsers.values()));
  });

  // Admin Logs
  socket.on('log_action', (log) => {
      // log: { action, details, user }
      const entry = { ...log, timestamp: Date.now(), id: Date.now() + Math.random() };
      adminLogs.unshift(entry);
      if(adminLogs.length > 200) adminLogs.pop();
      io.emit('admin_log_update', entry);
  });
  
  socket.on('nodes_update', ({ boardId, nodes }) => {
    const b = getBoard(boardId)
    b.nodes = nodes
    socket.to(boardId).emit('nodes_update', { nodes: b.nodes })
  })

  socket.on('graph3d_update', ({ boardId, nodes, edges }) => {
    const b = getBoard(boardId)
    b.graph3d = { nodes, edges }
    socket.to(boardId).emit('graph3d_update', b.graph3d)
  })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`Realtime server running on http://localhost:${PORT}`)
})
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})
