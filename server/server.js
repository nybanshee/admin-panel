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
  if (!boards.has(id)) boards.set(id, { id, nodes: [] })
  return boards.get(id)
}

app.get('/boards/:id', (req, res) => {
  const b = getBoard(req.params.id)
  res.json(b)
})

app.put('/boards/:id', (req, res) => {
  const b = getBoard(req.params.id)
  b.nodes = Array.isArray(req.body?.nodes) ? req.body.nodes : b.nodes
  io.to(req.params.id).emit('nodes_update', { nodes: b.nodes })
  res.json(b)
})

io.on('connection', socket => {
  socket.on('join_board', ({ boardId }) => {
    socket.join(boardId)
    const b = getBoard(boardId)
    socket.emit('nodes_update', { nodes: b.nodes })
  })
  socket.on('nodes_update', ({ boardId, nodes }) => {
    const b = getBoard(boardId)
    b.nodes = Array.isArray(nodes) ? nodes : b.nodes
    socket.to(boardId).emit('nodes_update', { nodes: b.nodes })
  })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`Realtime server running on http://localhost:${PORT}`)
})
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})
