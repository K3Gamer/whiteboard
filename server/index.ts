import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { extname, join, normalize } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { generateId, generateRoomId } from '../src/utils/id'
import type { 
  User, 
  Room, 
  RoomSettings, 
  WhiteboardElement, 
  WSMessage, 
  WSEvents, 
  WSMessageType,
  UserRole,
} from '../src/types'

const PORT = Number(process.env.PORT) || 3001
const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, '..', 'dist')

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

interface Client {
  ws: WebSocket
  user: User
  roomId: string | null
}

const clients = new Map<string, Client>()
const userClients = new Map<string, Client>()
const rooms = new Map<string, Room>()
const elementStore = new Map<string, WhiteboardElement[]>()

const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  allowStudentDraw: true,
  allowStudentChat: true,
  readOnly: false,
  gridEnabled: true,
  snapToGrid: false,
}

const USER_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#eab308',
]

function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

function broadcast(roomId: string, message: WSMessage, excludeUserId?: string) {
  const room = rooms.get(roomId)
  if (!room) return

  const data = JSON.stringify(message)
  for (const userId of [...room.students, room.teacherId]) {
    if (userId !== excludeUserId) {
      const client = userClients.get(userId)
      if (client?.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data)
      }
    }
  }
}

function send(ws: WebSocket, message: WSMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}

function createUser(name: string, role: UserRole): User {
  return {
    id: generateId(),
    name,
    role,
    color: getRandomColor(),
    lastActive: Date.now(),
    isOnline: true,
  }
}

function createRoom(teacherId: string, name: string, roomId?: string): Room {
  const id = roomId || generateRoomId()
  const room: Room = {
    id,
    name,
    teacherId,
    students: [],
    createdAt: Date.now(),
    settings: { ...DEFAULT_ROOM_SETTINGS },
  }
  rooms.set(id, room)
  elementStore.set(id, [])
  return room
}

function handleJoinRoom(client: Client, payload: WSEvents['join-room']) {
  const { roomId, user } = payload
  let room = rooms.get(roomId)

  if (!room) {
    if (user.role === 'teacher') {
      room = createRoom(user.id, 'Lớp học', roomId)
    } else {
      send(client.ws, {
        type: 'error',
        payload: { message: 'Phòng không tồn tại', code: 'ROOM_NOT_FOUND' },
        userId: 'system',
        roomId,
        timestamp: Date.now(),
      })
      return
    }
  }

  if (room.teacherId === user.id) {
    client.user = { ...user, role: 'teacher', isOnline: true }
  } else if (!room.students.includes(user.id)) {
    room.students.push(user.id)
    client.user = { ...user, role: 'student', isOnline: true }
  } else {
    client.user = { ...user, isOnline: true }
  }

  client.roomId = roomId
  userClients.set(client.user.id, client)

  const elements = elementStore.get(roomId) || []

  send(client.ws, {
    type: 'elements-sync',
    payload: { elements, settings: room.settings },
    userId: 'system',
    roomId,
    timestamp: Date.now(),
  })

  broadcast(roomId, {
    type: 'user-joined',
    payload: { user: client.user },
    userId: client.user.id,
    roomId,
    timestamp: Date.now(),
  }, client.user.id)

  for (const otherUserId of [...room.students, room.teacherId]) {
    if (otherUserId !== client.user.id) {
      const otherClient = userClients.get(otherUserId)
      if (otherClient) {
        send(client.ws, {
          type: 'user-joined',
          payload: { user: otherClient.user },
          userId: otherClient.user.id,
          roomId,
          timestamp: Date.now(),
        })
      }
    }
  }
}

function handleLeaveRoom(client: Client) {
  if (!client.roomId) return

  const room = rooms.get(client.roomId)
  if (!room) return

  if (room.teacherId === client.user.id) {
    broadcast(client.roomId, {
      type: 'user-left',
      payload: { userId: client.user.id },
      userId: client.user.id,
      roomId: client.roomId,
      timestamp: Date.now(),
    })
    rooms.delete(client.roomId)
    elementStore.delete(client.roomId)
  } else {
    room.students = room.students.filter(id => id !== client.user.id)
    broadcast(client.roomId, {
      type: 'user-left',
      payload: { userId: client.user.id },
      userId: client.user.id,
      roomId: client.roomId,
      timestamp: Date.now(),
    })
  }

  client.roomId = null
}

function handleElementCreate(client: Client, payload: WSEvents['element-create']) {
  if (!client.roomId) return
  const room = rooms.get(client.roomId)
  if (!room) return

  if (client.user.role === 'student' && !room.settings.allowStudentDraw) {
    send(client.ws, {
      type: 'error',
      payload: { message: 'Bạn không có quyền vẽ', code: 'PERMISSION_DENIED' },
      userId: 'system',
      roomId: client.roomId,
      timestamp: Date.now(),
    })
    return
  }

  const elements = elementStore.get(client.roomId) || []
  elements.push(payload.element)
  elementStore.set(client.roomId, elements)

  broadcast(client.roomId, {
    type: 'element-create',
    payload: { element: payload.element },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  }, client.user.id)
}

function handleElementUpdate(client: Client, payload: WSEvents['element-update']) {
  if (!client.roomId) return
  const room = rooms.get(client.roomId)
  if (!room) return

  if (client.user.role === 'student' && !room.settings.allowStudentDraw) {
    return
  }

  const elements = elementStore.get(client.roomId) || []
  const index = elements.findIndex(e => e.id === payload.element.id)
  if (index !== -1) {
    elements[index] = { ...payload.element, updatedAt: Date.now() }
    elementStore.set(client.roomId, elements)
  }

  broadcast(client.roomId, {
    type: 'element-update',
    payload: { element: payload.element },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  }, client.user.id)
}

function handleElementDelete(client: Client, payload: WSEvents['element-delete']) {
  if (!client.roomId) return
  const room = rooms.get(client.roomId)
  if (!room) return

  if (client.user.role === 'student' && !room.settings.allowStudentDraw) {
    return
  }

  const elements = elementStore.get(client.roomId) || []
  const filtered = elements.filter(e => e.id !== payload.elementId)
  elementStore.set(client.roomId, filtered)

  broadcast(client.roomId, {
    type: 'element-delete',
    payload: { elementId: payload.elementId },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  }, client.user.id)
}

function handleCursorMove(client: Client, payload: WSEvents['cursor-move']) {
  if (!client.roomId) return
  client.user.cursor = payload.cursor
  client.user.lastActive = Date.now()

  broadcast(client.roomId, {
    type: 'cursor-move',
    payload: { 
      userId: client.user.id, 
      cursor: payload.cursor, 
      name: client.user.name, 
      color: client.user.color 
    },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  }, client.user.id)
}

function handleSelectionChange(client: Client, payload: WSEvents['selection-change']) {
  if (!client.roomId) return
  broadcast(client.roomId, {
    type: 'selection-change',
    payload: { userId: client.user.id, selectedIds: payload.selectedIds },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  }, client.user.id)
}

function handleCanvasTransform(client: Client, payload: WSEvents['canvas-transform']) {
  if (!client.roomId) return
  broadcast(client.roomId, {
    type: 'canvas-transform',
    payload: { userId: client.user.id, transform: payload.transform },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  }, client.user.id)
}

function handleToolChange(client: Client, payload: WSEvents['tool-change']) {
  if (!client.roomId) return
  broadcast(client.roomId, {
    type: 'tool-change',
    payload: { userId: client.user.id, tool: payload.tool, settings: payload.settings },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  }, client.user.id)
}

function handleClearCanvas(client: Client) {
  if (!client.roomId) return
  const room = rooms.get(client.roomId)
  if (!room) return

  if (client.user.role === 'student' && !room.settings.allowStudentDraw) {
    return
  }

  elementStore.set(client.roomId, [])
  broadcast(client.roomId, {
    type: 'clear-canvas',
    payload: { userId: client.user.id },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  }, client.user.id)
}

function handleChatMessage(client: Client, payload: WSEvents['chat-message']) {
  if (!client.roomId) return
  const room = rooms.get(client.roomId)
  if (!room) return

  if (client.user.role === 'student' && !room.settings.allowStudentChat) {
    return
  }

  broadcast(client.roomId, {
    type: 'chat-message',
    payload: { 
      userId: client.user.id, 
      userName: client.user.name, 
      message: payload.message, 
      timestamp: Date.now() 
    },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  })
}

function handleRoomSettingsUpdate(client: Client, payload: WSEvents['room-settings-update']) {
  if (!client.roomId) return
  const room = rooms.get(client.roomId)
  if (!room || room.teacherId !== client.user.id) return

  room.settings = { ...room.settings, ...payload.settings }
  broadcast(client.roomId, {
    type: 'room-settings-update',
    payload: { settings: room.settings },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  })
}

function handleKickUser(client: Client, payload: WSEvents['kick-user']) {
  if (!client.roomId) return
  const room = rooms.get(client.roomId)
  if (!room || room.teacherId !== client.user.id) return

  const targetClient = userClients.get(payload.targetId)
  if (targetClient) {
    send(targetClient.ws, {
      type: 'error',
      payload: { message: 'Bạn đã bị giáo viên loại khỏi phòng', code: 'KICKED' },
      userId: 'system',
      roomId: client.roomId,
      timestamp: Date.now(),
    })
    targetClient.ws.close()
  }
}

function handleGrantPermission(client: Client, payload: WSEvents['grant-permission']) {
  if (!client.roomId) return
  const room = rooms.get(client.roomId)
  if (!room || room.teacherId !== client.user.id) return

  if (payload.permission === 'draw') {
    room.settings.allowStudentDraw = true
  } else if (payload.permission === 'chat') {
    room.settings.allowStudentChat = true
  }
  broadcast(client.roomId, {
    type: 'room-settings-update',
    payload: { settings: room.settings },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  })
}

function handleRevokePermission(client: Client, payload: WSEvents['revoke-permission']) {
  if (!client.roomId) return
  const room = rooms.get(client.roomId)
  if (!room || room.teacherId !== client.user.id) return

  if (payload.permission === 'draw') {
    room.settings.allowStudentDraw = false
  } else if (payload.permission === 'chat') {
    room.settings.allowStudentChat = false
  }
  broadcast(client.roomId, {
    type: 'room-settings-update',
    payload: { settings: room.settings },
    userId: client.user.id,
    roomId: client.roomId,
    timestamp: Date.now(),
  })
}

const handlers: Record<WSMessageType, (client: Client, payload: any) => void> = {
  'join-room': handleJoinRoom,
  'leave-room': handleLeaveRoom,
  'user-joined': () => {},
  'user-left': () => {},
  'cursor-move': handleCursorMove,
  'element-create': handleElementCreate,
  'element-update': handleElementUpdate,
  'element-delete': handleElementDelete,
  'elements-sync': () => {},
  'selection-change': handleSelectionChange,
  'canvas-transform': handleCanvasTransform,
  'tool-change': handleToolChange,
  'clear-canvas': handleClearCanvas,
  'undo': () => {},
  'redo': () => {},
  'chat-message': handleChatMessage,
  'room-settings-update': handleRoomSettingsUpdate,
  'kick-user': handleKickUser,
  'grant-permission': handleGrantPermission,
  'revoke-permission': handleRevokePermission,
  'error': () => {},
}

const server = createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', rooms: rooms.size, clients: clients.size }))
    return
  }

  if (!existsSync(DIST_DIR)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>WhiteBoard Server</title></head>
      <body style="font-family: system-ui; padding: 40px; max-width: 640px; margin: auto;">
      <h1>🖊️ WhiteBoard Server đang chạy</h1>
      <p>WebSocket server hoạt động tại <code>ws://localhost:${PORT}</code></p>
      <p>Chạy <code>npm run build</code> để phục vụ giao diện web, hoặc dùng <code>npm run dev</code> khi phát triển.</p>
      </body></html>`)
    return
  }

  let pathname = decodeURIComponent((req.url || '/').split('?')[0])
  if (pathname === '/') pathname = '/index.html'

  const filePath = normalize(join(DIST_DIR, pathname))
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) throw new Error('not a file')
    const content = await readFile(filePath)
    const ext = extname(filePath).toLowerCase()
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
    res.end(content)
  } catch {
    try {
      const content = await readFile(join(DIST_DIR, 'index.html'))
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(content)
    } catch {
      res.writeHead(404)
      res.end('Not Found')
    }
  }
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  const clientId = generateId()
  const client: Client = {
    ws,
    user: createUser(`User ${clientId.slice(-4)}`, 'student'),
    roomId: null,
  }
  clients.set(clientId, client)

  console.log(`Client connected: ${clientId}`)

  ws.on('message', (data) => {
    try {
      const message: WSMessage = JSON.parse(data.toString())
      const handler = handlers[message.type as WSMessageType]
      if (handler) {
        handler(client, message.payload)
      }
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  })

  ws.on('close', () => {
    handleLeaveRoom(client)
    clients.delete(clientId)
    userClients.delete(client.user.id)
    console.log(`Client disconnected: ${clientId}`)
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`)
  console.log(`HTTP server running on http://localhost:${PORT}`)
})

process.on('SIGINT', () => {
  console.log('Shutting down server...')
  wss.close()
  server.close()
  process.exit(0)
})