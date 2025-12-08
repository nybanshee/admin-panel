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

function getBoard(id) {
  if (!boards.has(id)) boards.set(id, { id, nodes: [], edges: [], graph3d: { nodes: [], edges: [] } })
  return boards.get(id)
}

app.get('/boards/:id', (req, res) => {
  const b = getBoard(req.params.id)
  res.json(b)
})

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
