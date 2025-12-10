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

// --- Game Config Store (Default Values) ---
const defaultWeaponConfig = {
    stats: {
        weight: 3.5,
        gravity: 1,
        gripStrength: 1,
        damage: 30,
        fireRate: 600,
        burstAmount: 1,
        accuracy: 95,
        spread: 0.02,
        recoilPattern: 'Vertical',
        magSize: 30,
        reloadTime: 2.5,
    },
    unlockLevel: 0,
    visuals: {
        skin: 'Default',
        rarity: 'Common',
        fireSound: 'Gunshot_Default',
        tracerColor: 'Green',
    },
    offsets: {
        view: { x: 0, y: 0, z: 0 },
        aim: { x: 0, y: 0, z: 0 },
        muzzle: { x: 0, y: 0, z: -1 },
    },
    springs: {
        recoil: { stiffness: 100, damping: 0.5 },
        sway: { stiffness: 8, damping: 0.6 },
        adsZoom: { stiffness: 50, damping: 0.9 },
        ads: { stiffness: 50, damping: 0.8 },
        movement: { stiffness: 20, damping: 0.6 },
        reload: { stiffness: 40, damping: 0.7 },
        fire: { stiffness: 80, damping: 0.5 },
    },
};

let gameConfig = {
    guns: {
        ak47: {
            ...defaultWeaponConfig,
            id: 'ak47', name: 'AK-47', category: 'ar',
            enabled: true, dualWield: false, magSequence: ['std', 'std', 'trc'],
            stats: { ...defaultWeaponConfig.stats, damage: 35, fireRate: 600, recoilPattern: 'Vertical' },
            attachmentSlots: {
                optic: { allowed: ['red_dot', 'acog'] },
                muzzle: { allowed: ['suppressor'] },
                grip: { allowed: ['vert_grip'] },
                mag: { allowed: ['ext_mag'] },
                barrel: { allowed: [] },
                stock: { allowed: [] },
            }
        },
        m4a1: {
            ...defaultWeaponConfig,
            id: 'm4a1', name: 'M4A1 Carbine', category: 'ar',
            enabled: true, dualWield: false, magSequence: ['std'],
            stats: { ...defaultWeaponConfig.stats, damage: 28, fireRate: 800, weight: 3.2 },
            attachmentSlots: {
                optic: { allowed: ['red_dot', 'acog'] },
                muzzle: { allowed: ['suppressor'] },
                grip: { allowed: ['vert_grip'] },
                mag: { allowed: ['ext_mag'] },
                barrel: { allowed: [] },
                stock: { allowed: [] },
            }
        },
        deagle: {
            ...defaultWeaponConfig,
            id: 'deagle', name: 'Desert Eagle', category: 'pistol',
            enabled: true, dualWield: true, magSequence: ['hp'],
            stats: { ...defaultWeaponConfig.stats, damage: 50, fireRate: 300, magSize: 7, weight: 1.8 },
            attachmentSlots: {
                optic: { allowed: ['red_dot'] },
                muzzle: { allowed: ['suppressor'] },
                grip: { allowed: [] },
                mag: { allowed: [] },
                barrel: { allowed: [] },
                stock: { allowed: [] },
            }
        },
        mp5: {
            ...defaultWeaponConfig,
            id: 'mp5', name: 'MP5 Submachine Gun', category: 'smg',
            enabled: true, dualWield: false, magSequence: ['std'],
            stats: { ...defaultWeaponConfig.stats, fireRate: 900, damage: 22 },
            attachmentSlots: {
                optic: { allowed: ['red_dot', 'acog'] },
                muzzle: { allowed: ['suppressor'] },
                grip: { allowed: ['vert_grip'] },
                mag: { allowed: ['ext_mag'] },
                barrel: { allowed: [] },
                stock: { allowed: [] },
            }
        }
    },
    bullets: [
        { id: 'std', label: 'Standard FMJ', color: 'bg-slate-400', damageMult: 1.0, penetration: 20, velocity: 1.0, gravity: 1.0, spread: 5, recoilMult: 1.0, isExplosive: false, grain: 55, recoilSpring: { stiffness: 100, damping: 0.5 }, recoilForce: { x: 0, y: 0.5, z: -1.0 }, recoilRotation: { pitch: -1.0, yaw: 0.2, roll: 0 }, recoilRandomness: { forceJitter: 0.1, rotationJitter: 0.1 } },
        { id: 'ap', label: 'Armor Piercing', color: 'bg-cyan-500', damageMult: 0.9, penetration: 80, velocity: 1.2, gravity: 0.9, spread: 3, recoilMult: 1.2, isExplosive: false, grain: 62, recoilSpring: { stiffness: 120, damping: 0.6 }, recoilForce: { x: 0, y: 0.6, z: -1.2 }, recoilRotation: { pitch: -1.2, yaw: 0.1, roll: 0 }, recoilRandomness: { forceJitter: 0.12, rotationJitter: 0.1 } },
        { id: 'hp', label: 'Hollow Point', color: 'bg-red-500', damageMult: 1.3, penetration: 5, velocity: 0.9, gravity: 1.0, spread: 8, recoilMult: 1.0, isExplosive: false, grain: 50, recoilSpring: { stiffness: 90, damping: 0.5 }, recoilForce: { x: 0, y: 0.45, z: -0.9 }, recoilRotation: { pitch: -0.9, yaw: 0.25, roll: 0 }, recoilRandomness: { forceJitter: 0.15, rotationJitter: 0.12 } },
        { id: 'inc', label: 'Incendiary', color: 'bg-orange-500', damageMult: 1.1, penetration: 10, velocity: 1.0, gravity: 1.0, spread: 6, recoilMult: 1.0, isExplosive: false, grain: 58, recoilSpring: { stiffness: 105, damping: 0.55 }, recoilForce: { x: 0, y: 0.5, z: -1.0 }, recoilRotation: { pitch: -1.0, yaw: 0.2, roll: 0 }, recoilRandomness: { forceJitter: 0.1, rotationJitter: 0.1 } },
        { id: 'exp', label: 'Explosive', color: 'bg-yellow-400', damageMult: 0.8, penetration: 10, velocity: 0.8, gravity: 1.5, spread: 12, recoilMult: 1.5, isExplosive: true, grain: 80, recoilSpring: { stiffness: 140, damping: 0.7 }, recoilForce: { x: 0, y: 0.8, z: -1.4 }, recoilRotation: { pitch: -1.6, yaw: 0.3, roll: 0.1 }, recoilRandomness: { forceJitter: 0.2, rotationJitter: 0.15 } },
        { id: 'trc', label: 'Tracer', color: 'bg-green-400', damageMult: 1.0, penetration: 20, velocity: 1.0, gravity: 1.0, spread: 4, recoilMult: 1.0, isExplosive: false, grain: 55, recoilSpring: { stiffness: 100, damping: 0.5 }, recoilForce: { x: 0, y: 0.5, z: -1.0 }, recoilRotation: { pitch: -1.0, yaw: 0.2, roll: 0 }, recoilRandomness: { forceJitter: 0.1, rotationJitter: 0.1 } },
    ],
    attachments: [
        { id: 'red_dot', name: 'Red Dot Sight', type: 'optic', weight: 0.2, unlockLevel: 0, pros: ['Precision', 'Acquisition'], cons: [] },
        { id: 'acog', name: 'ACOG 4x', type: 'optic', weight: 0.4, unlockLevel: 5, pros: ['Zoom', 'Range'], cons: ['ADS Speed'] },
        { id: 'suppressor', name: 'Tac Suppressor', type: 'muzzle', weight: 0.3, unlockLevel: 10, pros: ['Sound', 'Flash'], cons: ['Range', 'ADS Speed'] },
        { id: 'vert_grip', name: 'Vertical Grip', type: 'grip', weight: 0.2, unlockLevel: 3, pros: ['Recoil Control'], cons: ['Move Speed'] },
        { id: 'ext_mag', name: 'Extended Mag', type: 'mag', weight: 0.5, unlockLevel: 7, pros: ['Ammo Capacity'], cons: ['Reload Speed', 'ADS Speed'] },
    ],
    maps: [
        { id: 'arena', name: 'Cyber Arena', tags: ['small', 'symmetrical'], enabled: true },
        { id: 'docks', name: 'Neon Docks', tags: ['mid', 'lanes'], enabled: true },
        { id: 'spire', name: 'Crystal Spire', tags: ['large', 'vertical'], enabled: true }
    ],
    gamemodes: [
        {
            id: 'tdm', name: 'Team Deathmatch', enabled: true, mapBanningEnabled: false, bansPerTeam: 1, candidateCount: 3, rotation: [
                { mapId: 'arena', weight: 50 }, { mapId: 'docks', weight: 30 }, { mapId: 'spire', weight: 20 }
            ]
        },
        {
            id: 'ctf', name: 'Capture The Flag', enabled: true, mapBanningEnabled: true, bansPerTeam: 2, candidateCount: 5, rotation: [
                { mapId: 'docks', weight: 60 }, { mapId: 'spire', weight: 40 }
            ]
        }
    ],
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
