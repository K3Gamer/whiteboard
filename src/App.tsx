import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { WhiteboardCanvas, CanvasHandle } from './components/whiteboard/WhiteboardCanvas'
import { Toolbar } from './components/whiteboard/Toolbar'
import { TopBar } from './components/whiteboard/TopBar'
import { BottomBar } from './components/whiteboard/BottomBar'
import { Lobby } from './components/panels/Lobby'
import { RoomModal } from './components/panels/RoomModal'
import { ShareModal } from './components/panels/ShareModal'
import { ParticipantsPanel } from './components/panels/ParticipantsPanel'
import { ChatPanel } from './components/panels/ChatPanel'
import { LayersPanel } from './components/panels/LayersPanel'
import { SettingsPanel } from './components/panels/SettingsPanel'
import { useWebSocket } from './hooks/useWebSocket'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import {
  WhiteboardElement,
  User,
  ToolType,
  ToolSettings,
  Transform,
  Point,
  AppSettings,
  RoomSettings,
  DEFAULT_TOOL_SETTINGS,
  WSMessage,
  PenElement,
} from './types'
import { generateId, generateRoomId, generateUserId } from './utils/id'

const WS_PORT = 3001
const WS_URL = import.meta.env.DEV
  ? `ws://${window.location.hostname}:${WS_PORT}`
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:${window.location.port || WS_PORT}`

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'vi',
  autoSave: true,
  showGrid: true,
  snapToGrid: false,
  gridSize: 20,
  shortcutsEnabled: true,
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userColor: string
  message: string
  timestamp: number
  isOwn: boolean
}

interface AppState {
  roomId: string | null
  roomName: string
  userId: string | null
  user: User | null
  users: User[]
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    roomId: null,
    roomName: '',
    userId: null,
    user: null,
    users: [],
  })

  const [elements, setElements] = useState<WhiteboardElement[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tool, setTool] = useState<ToolType>('pen')
  const [toolSettings, setToolSettings] = useState<ToolSettings>(DEFAULT_TOOL_SETTINGS)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const [history, setHistory] = useState<WhiteboardElement[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({
    allowStudentDraw: true,
    allowStudentChat: true,
    readOnly: false,
    gridEnabled: true,
    snapToGrid: false,
  })
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('whiteboard-settings')
    if (saved) {
      try { return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) } } catch { /* noop */ }
    }
    return DEFAULT_APP_SETTINGS
  })

  const [remoteCursors, setRemoteCursors] = useState<Map<string, { userId: string; name: string; color: string; cursor: Point; lastUpdate: number }>>(new Map())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'join' }>({ open: false, mode: 'create' })
  const [panels, setPanels] = useState({ participants: false, chat: false, layers: false, settings: false, share: false })

  const canvasRef = useRef<CanvasHandle>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const historyLockRef = useRef(false)

  const handleWSMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'user-joined':
        setAppState(prev => {
          const user = (message.payload as { user: User }).user
          if (user.id === prev.userId) return prev
          if (prev.users.find(u => u.id === user.id)) return prev
          return { ...prev, users: [...prev.users, { ...user, isOnline: true }] }
        })
        break
      case 'user-left':
        setAppState(prev => ({
          ...prev,
          users: prev.users.filter(u => u.id !== (message.payload as { userId: string }).userId),
        }))
        setRemoteCursors(prev => {
          const next = new Map(prev)
          next.delete((message.payload as { userId: string }).userId)
          return next
        })
        break
      case 'cursor-move': {
        const payload = message.payload as { userId: string; cursor: Point; name: string; color: string }
        setRemoteCursors(prev => {
          const next = new Map(prev)
          next.set(payload.userId, { ...payload, lastUpdate: Date.now() })
          return next
        })
        break
      }
      case 'elements-sync': {
        const payload = message.payload as unknown as { elements: WhiteboardElement[]; settings: RoomSettings }
        setElements(payload.elements)
        if (payload.settings) setRoomSettings(payload.settings)
        break
      }
      case 'element-create': {
        const element = (message.payload as { element: WhiteboardElement }).element
        setElements(prev => prev.find(e => e.id === element.id) ? prev : [...prev, element])
        break
      }
      case 'element-update': {
        const element = (message.payload as { element: WhiteboardElement }).element
        setElements(prev => prev.map(e => e.id === element.id ? element : e))
        break
      }
      case 'element-delete': {
        const elementId = (message.payload as { elementId: string }).elementId
        setElements(prev => prev.filter(e => e.id !== elementId))
        break
      }
      case 'clear-canvas':
        setElements([])
        break
      case 'chat-message': {
        const payload = message.payload as { userId: string; userName: string; message: string; timestamp: number }
        setMessages(prev => [...prev, {
          id: generateId(),
          userId: payload.userId,
          userName: payload.userName,
          userColor: '#64748b',
          message: payload.message,
          timestamp: payload.timestamp,
          isOwn: false,
        }])
        setUnreadCount(prev => prev + 1)
        break
      }
      case 'room-settings-update': {
        const payload = message.payload as { settings: RoomSettings }
        setRoomSettings(payload.settings)
        break
      }
      case 'error': {
        const payload = message.payload as { message: string; code: string }
        alert(payload.message)
        if (payload.code === 'KICKED') {
          window.location.reload()
        }
        break
      }
    }
  }, [])

  const { connected, send } = useWebSocket({ url: WS_URL, onMessage: handleWSMessage })

  const joinRef = useRef<{ roomId: string; user: User | null }>({ roomId: '', user: null })
  useEffect(() => {
    joinRef.current = { roomId: appState.roomId || '', user: appState.user }
  }, [appState.roomId, appState.user])

  useEffect(() => {
    if (connected && joinRef.current.roomId && joinRef.current.user) {
      const { roomId, user } = joinRef.current
      send('join-room', { roomId, user }, roomId, user.id)
    }
  }, [connected, appState.roomId, send])

  useEffect(() => {
    const interval = setInterval(() => {
      setRemoteCursors(prev => {
        const now = Date.now()
        let changed = false
        const next = new Map(prev)
        prev.forEach((value, key) => {
          if (now - value.lastUpdate > 5000) {
            next.delete(key)
            changed = true
          }
        })
        return changed ? next : prev
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    localStorage.setItem('whiteboard-settings', JSON.stringify(appSettings))
  }, [appSettings])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appSettings.theme)
  }, [appSettings.theme])

  const pushHistory = useCallback((newElements: WhiteboardElement[]) => {
    if (historyLockRef.current) return
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1)
      return [...trimmed, newElements].slice(-50)
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, [historyIndex])

  const canDraw = useMemo(() => {
    if (!appState.user) return false
    if (appState.user.role === 'teacher') return true
    return roomSettings.allowStudentDraw && !roomSettings.readOnly
  }, [appState.user, roomSettings])

  const handleElementsChange = useCallback((newElements: WhiteboardElement[]) => {
    setElements(newElements)
  }, [])

  const handleElementCreate = useCallback((element: WhiteboardElement) => {
    pushHistory([...elements, element])
    if (appState.roomId && appState.userId) {
      send('element-create', { element }, appState.roomId, appState.userId)
    }
  }, [elements, pushHistory, send, appState.roomId, appState.userId])

  const handleElementUpdate = useCallback((element: WhiteboardElement) => {
    if (appState.roomId && appState.userId) {
      send('element-update', { element }, appState.roomId, appState.userId)
    }
  }, [send, appState.roomId, appState.userId])

  const handleElementDelete = useCallback((id: string) => {
    setElements(prev => prev.filter(e => e.id !== id))
    setSelectedIds(prev => prev.filter(sid => sid !== id))
    if (appState.roomId && appState.userId) {
      send('element-delete', { elementId: id }, appState.roomId, appState.userId)
    }
  }, [send, appState.roomId, appState.userId])

  const handleCursorMove = useCallback((cursor: Point) => {
    setCursorPosition(cursor)
    if (appState.roomId && appState.userId) {
      send('cursor-move', { userId: appState.userId, cursor, name: appState.user?.name || '', color: appState.user?.color || '' }, appState.roomId, appState.userId)
    }
  }, [send, appState.roomId, appState.userId, appState.user])

  const handleCreateRoom = useCallback((data: { userName: string; roomName: string }) => {
    const userId = generateUserId()
    const roomId = generateRoomId()
    const user: User = {
      id: userId,
      name: data.userName,
      role: 'teacher',
      color: '#3b82f6',
      isOnline: true,
      lastActive: Date.now(),
    }
    setAppState({ roomId, roomName: data.roomName, userId, user, users: [user] })
    setModal({ open: false, mode: 'create' })
  }, [])

  const handleJoinRoom = useCallback((data: { userName: string; roomId: string }) => {
    const userId = generateUserId()
    const user: User = {
      id: userId,
      name: data.userName,
      role: 'student',
      color: '#22c55e',
      isOnline: true,
      lastActive: Date.now(),
    }
    setAppState({ roomId: data.roomId, roomName: 'Phòng học', userId, user, users: [user] })
    setModal({ open: false, mode: 'join' })
  }, [])

  const handleLeaveRoom = useCallback(() => {
    if (appState.roomId && appState.userId) {
      send('leave-room', { roomId: appState.roomId, userId: appState.userId }, appState.roomId, appState.userId)
    }
    setAppState({ roomId: null, roomName: '', userId: null, user: null, users: [] })
    setElements([])
    setSelectedIds([])
    setMessages([])
    setRemoteCursors(new Map())
  }, [send, appState.roomId, appState.userId])

  const handleClearCanvas = useCallback(() => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ bảng vẽ?')) return
    pushHistory([])
    setElements([])
    if (appState.roomId && appState.userId) {
      send('clear-canvas', { userId: appState.userId }, appState.roomId, appState.userId)
    }
  }, [pushHistory, send, appState.roomId, appState.userId])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      historyLockRef.current = true
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
      setTimeout(() => { historyLockRef.current = false }, 0)
    } else if (historyIndex === 0 && history.length > 0) {
      historyLockRef.current = true
      setHistoryIndex(-1)
      setElements([])
      setTimeout(() => { historyLockRef.current = false }, 0)
    }
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      historyLockRef.current = true
      setHistoryIndex(newIndex)
      setElements(history[newIndex])
      setTimeout(() => { historyLockRef.current = false }, 0)
    }
  }, [history, historyIndex])

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return
    selectedIds.forEach(id => {
      if (appState.roomId && appState.userId) {
        send('element-delete', { elementId: id }, appState.roomId, appState.userId)
      }
    })
    setElements(prev => prev.filter(e => !selectedIds.includes(e.id)))
    setSelectedIds([])
  }, [selectedIds, send, appState.roomId, appState.userId])

  const handleDuplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return
    const newElements = selectedIds.map(id => {
      const el = elements.find(e => e.id === id)
      if (!el) return null
      const clone = { ...el, id: generateId(), x: el.x + 20, y: el.y + 20, zIndex: Math.max(...elements.map(e => e.zIndex)) + 1 }
      if (clone.type === 'pen' || clone.type === 'eraser') {
        (clone as PenElement).points = (el as PenElement).points.map(p => ({ x: p.x + 20, y: p.y + 20 }))
      }
      return clone
    }).filter(Boolean) as WhiteboardElement[]
    setElements(prev => [...prev, ...newElements])
    setSelectedIds(newElements.map(e => e.id))
    newElements.forEach(el => {
      if (appState.roomId && appState.userId) {
        send('element-create', { element: el }, appState.roomId, appState.userId)
      }
    })
  }, [selectedIds, elements, send, appState.roomId, appState.userId])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(elements.filter(e => e.visible && !e.locked).map(e => e.id))
  }, [elements])

  const handleSendMessage = useCallback((message: string) => {
    if (!appState.user || !appState.roomId) return
    const chatMessage: ChatMessage = {
      id: generateId(),
      userId: appState.user.id,
      userName: appState.user.name,
      userColor: appState.user.color,
      message,
      timestamp: Date.now(),
      isOwn: true,
    }
    setMessages(prev => [...prev, chatMessage])
    send('chat-message', { userId: appState.user.id, userName: appState.user.name, message, timestamp: Date.now() }, appState.roomId, appState.user.id)
  }, [appState.user, appState.roomId, send])

  const handleKickUser = useCallback((targetId: string) => {
    if (!appState.user || !appState.roomId) return
    send('kick-user', { userId: appState.user.id, targetId }, appState.roomId, appState.user.id)
  }, [appState.user, appState.roomId, send])

  const handleGrantPermission = useCallback((targetId: string, permission: 'draw' | 'chat') => {
    if (!appState.user || !appState.roomId) return
    send('grant-permission', { userId: appState.user.id, targetId, permission }, appState.roomId, appState.user.id)
  }, [appState.user, appState.roomId, send])

  const handleRevokePermission = useCallback((targetId: string, permission: 'draw' | 'chat') => {
    if (!appState.user || !appState.roomId) return
    send('revoke-permission', { userId: appState.user.id, targetId, permission }, appState.roomId, appState.user.id)
  }, [appState.user, appState.roomId, send])

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      recordedChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `whiteboard-record-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      alert('Không thể bắt đầu ghi hình')
    }
  }, [isRecording])

  const fitToScreen = useCallback(() => {
    canvasRef.current?.centerContent()
  }, [])

  useKeyboardShortcuts({
    onToolChange: setTool,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDelete: handleDeleteSelected,
    onDuplicate: handleDuplicateSelected,
    onToggleGrid: () => setAppSettings(s => ({ ...s, showGrid: !s.showGrid })),
    onToggleSnap: () => setAppSettings(s => ({ ...s, snapToGrid: !s.snapToGrid })),
    onZoomIn: () => canvasRef.current?.zoomIn(),
    onZoomOut: () => canvasRef.current?.zoomOut(),
    onResetZoom: () => canvasRef.current?.resetZoom(),
    onSelectAll: handleSelectAll,
    onEscape: () => { setSelectedIds([]); setTool('select') },
    enabled: appSettings.shortcutsEnabled && !!appState.roomId,
  })

  useEffect(() => {
    if (appState.user && appState.roomId) {
      const userWithRole = { ...appState.user }
      setAppState(prev => ({ ...prev, users: prev.users.map(u => u.id === userWithRole.id ? userWithRole : u) }))
    }
  }, [appState.user?.role, appState.roomId])

  const cursorsArray = useMemo(() => Array.from(remoteCursors.values()), [remoteCursors])

  if (!appState.user) {
    return (
      <>
        <Lobby
          onCreateRoom={() => setModal({ open: true, mode: 'create' })}
          onJoinRoom={() => setModal({ open: true, mode: 'join' })}
        />
        <RoomModal
          open={modal.open}
          mode={modal.mode}
          onClose={() => setModal({ open: false, mode: modal.mode })}
          onCreate={handleCreateRoom}
          onJoin={handleJoinRoom}
        />
      </>
    )
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-[var(--page)]">
      <TopBar
        roomName={appState.roomName}
        userRole={appState.user.role}
        userName={appState.user.name}
        userColor={appState.user.color}
        participantCount={appState.users.length}
        onCreateRoom={() => { handleLeaveRoom(); setModal({ open: true, mode: 'create' }) }}
        onJoinRoom={() => { handleLeaveRoom(); setModal({ open: true, mode: 'join' }) }}
        onLeaveRoom={handleLeaveRoom}
        onShare={() => setPanels(p => ({ ...p, share: true }))}
        onSettings={() => setPanels(p => ({ ...p, settings: true }))}
        onToggleGrid={() => setAppSettings(s => ({ ...s, showGrid: !s.showGrid }))}
        onToggleSnap={() => setAppSettings(s => ({ ...s, snapToGrid: !s.snapToGrid }))}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onClearCanvas={handleClearCanvas}
        isRecording={isRecording}
        onToggleRecord={toggleRecording}
        connected={connected}
      />

      <div className="absolute top-14 left-0 right-0 bottom-0">
        <WhiteboardCanvas
          ref={canvasRef}
          elements={elements}
          onElementsChange={handleElementsChange}
          tool={tool}
          settings={toolSettings}
          transform={transform}
          onTransformChange={setTransform}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onElementCreate={handleElementCreate}
          onElementUpdate={handleElementUpdate}
          onCursorMove={handleCursorMove}
          remoteCursors={cursorsArray}
          canDraw={canDraw}
          showGrid={appSettings.showGrid}
          gridSize={appSettings.gridSize}
          snapToGrid={appSettings.snapToGrid}
          backgroundColor={appSettings.theme === 'dark' ? '#0f1729' : '#ffffff'}
        />
      </div>

      <Toolbar
        tool={tool}
        onToolChange={setTool}
        settings={toolSettings}
        onSettingsChange={(s) => setToolSettings(prev => ({ ...prev, ...s }))}
        canDraw={canDraw}
      />

      <BottomBar
        scale={transform.scale}
        onZoomIn={() => canvasRef.current?.zoomIn()}
        onZoomOut={() => canvasRef.current?.zoomOut()}
        onResetZoom={() => canvasRef.current?.resetZoom()}
        onFitToScreen={fitToScreen}
        elementCount={elements.length}
        selectedCount={selectedIds.length}
        cursorPosition={cursorPosition}
      />

      <div className="fixed top-20 right-4 z-20 flex flex-col gap-2">
        <PanelButton icon={<ParticipantsIcon />} label="Thành viên" onClick={() => setPanels(p => ({ ...p, participants: true }))} badge={appState.users.length} />
        <PanelButton icon={<ChatIcon />} label="Thảo luận" onClick={() => { setPanels(p => ({ ...p, chat: true })); setUnreadCount(0) }} badge={unreadCount} highlight={unreadCount > 0} />
        <PanelButton icon={<LayersIcon />} label="Lớp" onClick={() => setPanels(p => ({ ...p, layers: true }))} badge={elements.length} />
        <PanelButton icon={<SettingsIcon />} label="Cài đặt" onClick={() => setPanels(p => ({ ...p, settings: true }))} />
      </div>

      <ParticipantsPanel
        users={appState.users}
        currentUserId={appState.user.id}
        currentUserRole={appState.user.role}
        onKickUser={handleKickUser}
        onGrantPermission={handleGrantPermission}
        onRevokePermission={handleRevokePermission}
        allowStudentDraw={roomSettings.allowStudentDraw}
        allowStudentChat={roomSettings.allowStudentChat}
        open={panels.participants}
        onClose={() => setPanels(p => ({ ...p, participants: false }))}
      />

      <ChatPanel
        messages={messages}
        currentUser={appState.user}
        allowChat={appState.user.role === 'teacher' || roomSettings.allowStudentChat}
        onSendMessage={handleSendMessage}
        open={panels.chat}
        onClose={() => setPanels(p => ({ ...p, chat: false }))}
        unreadCount={unreadCount}
      />

      <LayersPanel
        elements={elements}
        selectedIds={selectedIds}
        onSelectElement={(id, multi) => setSelectedIds(prev => multi ? [...prev, id] : [id])}
        onDeleteElement={handleElementDelete}
        onDuplicateElement={(id) => {
          setSelectedIds([id])
          setTimeout(handleDuplicateSelected, 0)
        }}
        onMoveUp={(id) => setElements(prev => {
          const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex)
          const idx = sorted.findIndex(e => e.id === id)
          if (idx < sorted.length - 1) {
            const a = sorted[idx], b = sorted[idx + 1]
            return prev.map(e => e.id === a.id ? { ...e, zIndex: b.zIndex } : e.id === b.id ? { ...e, zIndex: a.zIndex } : e)
          }
          return prev
        })}
        onMoveDown={(id) => setElements(prev => {
          const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex)
          const idx = sorted.findIndex(e => e.id === id)
          if (idx > 0) {
            const a = sorted[idx], b = sorted[idx - 1]
            return prev.map(e => e.id === a.id ? { ...e, zIndex: b.zIndex } : e.id === b.id ? { ...e, zIndex: a.zIndex } : e)
          }
          return prev
        })}
        onToggleVisibility={(id) => setElements(prev => prev.map(e => e.id === id ? { ...e, visible: !e.visible } : e))}
        onToggleLock={(id) => setElements(prev => prev.map(e => e.id === id ? { ...e, locked: !e.locked } : e))}
        open={panels.layers}
        onClose={() => setPanels(p => ({ ...p, layers: false }))}
      />

      <SettingsPanel
        settings={appSettings}
        onSettingsChange={(s) => setAppSettings(prev => ({ ...prev, ...s }))}
        open={panels.settings}
        onClose={() => setPanels(p => ({ ...p, settings: false }))}
      />

      {panels.share && (
        <ShareModal
          open={true}
          roomId={appState.roomId || ''}
          roomName={appState.roomName}
          onClose={() => setPanels(p => ({ ...p, share: false }))}
        />
      )}
    </div>
  )
}

function PanelButton({ icon, label, onClick, badge, highlight }: { icon: React.ReactNode; label: string; onClick: () => void; badge?: number; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center justify-center w-10 h-10 bg-[var(--wall)]/90 backdrop-blur border border-[var(--border)] rounded-lg text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-all shadow-lg"
      aria-label={label}
      title={label}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold rounded-full ${highlight ? 'bg-[var(--danger)] text-white' : 'bg-[var(--accent)] text-white'}`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

function ParticipantsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}