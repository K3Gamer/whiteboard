import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { 
  WhiteboardElement, 
  ToolType, 
  ToolSettings, 
  Transform, 
  Point, 
  PenElement, 
  EraserElement,
  ShapeElement, 
  TextElement, 
  StickyNoteElement,
  ImageElement 
} from '../../types'
import { generateId } from '../../utils/id'
import { hexToRgba } from '../../utils/color'
import { distance, getBounds, invertTransform, snapPoint } from '../../utils/geometry'

export interface CanvasHandle {
  addElement: (element: WhiteboardElement) => void
  updateElement: (element: WhiteboardElement) => void
  deleteElement: (id: string) => void
  clear: () => void
  getElements: () => WhiteboardElement[]
  getTransform: () => Transform
  setTransform: (transform: Transform) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  exportPNG: () => string
  exportSVG: () => string
  centerContent: () => void
}

interface RemoteCursor {
  userId: string
  name: string
  color: string
  cursor: Point
}

interface WhiteboardCanvasProps {
  elements: WhiteboardElement[]
  onElementsChange: (elements: WhiteboardElement[]) => void
  tool: ToolType
  settings: ToolSettings
  transform: Transform
  onTransformChange: (transform: Transform) => void
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onElementCreate: (element: WhiteboardElement) => void
  onElementUpdate: (element: WhiteboardElement) => void
  onCursorMove: (cursor: Point) => void
  remoteCursors: RemoteCursor[]
  canDraw: boolean
  showGrid: boolean
  gridSize: number
  snapToGrid: boolean
  backgroundColor: string
  onContextMenu?: (e: React.MouseEvent) => void
}

type InteractionMode = 
  | { type: 'none' }
  | { type: 'drawing'; element: WhiteboardElement }
  | { type: 'moving'; startPoint: Point; originalElements: WhiteboardElement[] }
  | { type: 'resizing'; handle: string; startPoint: Point; originalElement: WhiteboardElement }
  | { type: 'rotating'; startAngle: number; originalElement: WhiteboardElement }
  | { type: 'panning'; startPoint: Point; startTransform: Transform }
  | { type: 'selecting'; startPoint: Point; endPoint: Point }
  | { type: 'laser'; points: Point[] }
  | { type: 'text-editing'; element: TextElement | StickyNoteElement; cursorPosition: number }

const HANDLE_SIZE = 8
const MIN_ELEMENT_SIZE = 5

export const WhiteboardCanvas = forwardRef<CanvasHandle, WhiteboardCanvasProps>(({
  elements,
  onElementsChange,
  tool,
  settings,
  transform,
  onTransformChange,
  selectedIds,
  onSelectionChange,
  onElementCreate,
  onElementUpdate,
  onCursorMove,
  remoteCursors,
  canDraw,
  showGrid,
  gridSize,
  snapToGrid,
  backgroundColor,
  onContextMenu,
}: WhiteboardCanvasProps, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [interaction, setInteraction] = useState<InteractionMode>({ type: 'none' })
  const [editingText, setEditingText] = useState<TextElement | StickyNoteElement | null>(null)
  const [textInput, setTextInput] = useState('')
  const lastCursorSendRef = useRef(0)
  const cursorPosRef = useRef<Point | null>(null)
  const elementsRef = useRef(elements)
  const rafRef = useRef<number>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageClickPosRef = useRef<Point>({ x: 0, y: 0 })

  useEffect(() => {
    elementsRef.current = elements
  }, [elements])

  useImperativeHandle(ref, () => ({
    addElement: (element) => onElementsChange([...elementsRef.current, element]),
    updateElement: (element) => {
      onElementsChange(elementsRef.current.map(e => e.id === element.id ? element : e))
    },
    deleteElement: (id) => onElementsChange(elementsRef.current.filter(e => e.id !== id)),
    clear: () => onElementsChange([]),
    getElements: () => elementsRef.current,
    getTransform: () => transform,
    setTransform: (t) => onTransformChange(t),
    zoomIn: () => onTransformChange({ ...transform, scale: Math.min(10, transform.scale * 1.2) }),
    zoomOut: () => onTransformChange({ ...transform, scale: Math.max(0.1, transform.scale / 1.2) }),
    resetZoom: () => onTransformChange({ x: 0, y: 0, scale: 1 }),
    exportPNG: () => canvasRef.current?.toDataURL('image/png') || '',
    exportSVG: () => exportToSVG(elementsRef.current, transform),
    centerContent: () => centerContent(),
  }))

  const getCanvasPoint = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      const touch = e.touches[0] || (e as TouchEvent).changedTouches[0]
      clientX = touch.clientX
      clientY = touch.clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return invertTransform({ x: clientX - rect.left, y: clientY - rect.top }, transform)
  }, [transform])

  const hitTest = useCallback((point: Point, element: WhiteboardElement): boolean => {
    const pad = 8 / transform.scale
    if (element.type === 'pen' || element.type === 'eraser') {
      const pen = element as PenElement
      const threshold = (pen.strokeWidth / 2 + pad) 
      for (let i = 1; i < pen.points.length; i++) {
        const p1 = pen.points[i - 1]
        const p2 = pen.points[i]
        const d = pointToSegmentDistance(point, p1, p2)
        if (d <= threshold) return true
      }
      return false
    }
    if (element.type === 'line' || element.type === 'arrow') {
      const shape = element as ShapeElement
      const start = shape.startPoint || { x: shape.x, y: shape.y }
      const end = shape.endPoint || { x: shape.x + shape.width, y: shape.y + shape.height }
      return pointToSegmentDistance(point, start, end) <= (shape.strokeWidth / 2 + pad)
    }
    return (
      point.x >= element.x - pad &&
      point.x <= element.x + element.width + pad &&
      point.y >= element.y - pad &&
      point.y <= element.y + element.height + pad
    )
  }, [transform.scale])

  const pointToSegmentDistance = (p: Point, a: Point, b: Point): number => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lengthSq = dx * dx + dy * dy
    if (lengthSq === 0) return distance(p, a)
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq
    t = Math.max(0, Math.min(1, t))
    return distance(p, { x: a.x + t * dx, y: a.y + t * dy })
  }

  const getElementAtPoint = useCallback((point: Point): WhiteboardElement | null => {
    const sorted = [...elements].filter(e => e.visible && !e.locked).sort((a, b) => b.zIndex - a.zIndex)
    for (const element of sorted) {
      if (hitTest(point, element)) return element
    }
    return null
  }, [elements, hitTest])

  const findHandleAtPoint = useCallback((point: Point, element: WhiteboardElement): string | null => {
    const hs = HANDLE_SIZE / transform.scale
    const center = { x: element.x + element.width / 2, y: element.y + element.height / 2 }
    const handles = [
      { name: 'nw', x: element.x, y: element.y },
      { name: 'n', x: center.x, y: element.y },
      { name: 'ne', x: element.x + element.width, y: element.y },
      { name: 'e', x: element.x + element.width, y: center.y },
      { name: 'se', x: element.x + element.width, y: element.y + element.height },
      { name: 's', x: center.x, y: element.y + element.height },
      { name: 'sw', x: element.x, y: element.y + element.height },
      { name: 'w', x: element.x, y: center.y },
    ]
    for (const handle of handles) {
      if (Math.abs(point.x - handle.x) <= hs && Math.abs(point.y - handle.y) <= hs) {
        return handle.name
      }
    }
    return null
  }, [transform.scale])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, rect.width, rect.height)

    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.scale, transform.scale)

    if (showGrid) {
      drawGrid(ctx, rect.width, rect.height, transform, gridSize)
    }

    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)
    for (const element of sorted) {
      if (element.visible) {
        drawElement(ctx, element, selectedIds.includes(element.id), interaction)
      }
    }

    if (interaction.type === 'drawing') {
      drawElement(ctx, interaction.element, false, interaction)
    }

    if (interaction.type === 'selecting') {
      const { startPoint, endPoint } = interaction
      ctx.strokeStyle = hexToRgba('#3b82f6', 0.8)
      ctx.fillStyle = hexToRgba('#3b82f6', 0.1)
      ctx.lineWidth = 1 / transform.scale
      ctx.setLineDash([5 / transform.scale, 5 / transform.scale])
      ctx.beginPath()
      ctx.rect(
        Math.min(startPoint.x, endPoint.x),
        Math.min(startPoint.y, endPoint.y),
        Math.abs(endPoint.x - startPoint.x),
        Math.abs(endPoint.y - startPoint.y)
      )
      ctx.fill()
      ctx.stroke()
      ctx.setLineDash([])
    }

    if (interaction.type === 'laser' && interaction.points.length > 1) {
      drawLaser(ctx, interaction.points)
    }

    ctx.restore()

    for (const cursor of remoteCursors) {
      drawRemoteCursor(ctx, cursor, transform)
    }

    if (cursorPosRef.current && canDraw) {
      drawLocalCursor(ctx, cursorPosRef.current, transform, tool, settings)
    }

    rafRef.current = requestAnimationFrame(render)
  }, [elements, transform, selectedIds, showGrid, gridSize, backgroundColor, remoteCursors, interaction, tool, settings, canDraw])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [render])

  const handlePointerDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey) || tool === 'hand') {
      setInteraction({ type: 'panning', startPoint: { x: e.clientX, y: e.clientY }, startTransform: transform })
      return
    }
    if (e.button !== 0) return

    const point = getCanvasPoint(e)

    if (tool === 'laser-pointer') {
      setInteraction({ type: 'laser', points: [point] })
      return
    }

    if (tool === 'select') {
      const selected = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null
      if (selected) {
        const handle = findHandleAtPoint(point, selected)
        if (handle) {
          const center = { x: selected.x + selected.width / 2, y: selected.y + selected.height / 2 }
          setInteraction({ 
            type: 'rotating', 
            startAngle: Math.atan2(point.y - center.y, point.x - center.x), 
            originalElement: selected 
          })
          return
        }
      }

      const element = getElementAtPoint(point)
      if (element) {
        const newSelectedIds = selectedIds.includes(element.id)
          ? selectedIds
          : [element.id]
        onSelectionChange(newSelectedIds)
        const originalElements = elements.filter(el => newSelectedIds.includes(el.id))
        setInteraction({ type: 'moving', startPoint: point, originalElements })
      } else {
        onSelectionChange([])
        setInteraction({ type: 'selecting', startPoint: point, endPoint: point })
      }
      return
    }

    if (!canDraw) return

    if (tool === 'image') {
      imageClickPosRef.current = point
      fileInputRef.current?.click()
      return
    }

    if (tool === 'text') {
      const now = Date.now()
      const pos = snapToGrid ? snapPoint(point, gridSize) : point
      const element: TextElement = {
        id: generateId(),
        type: 'text',
        x: pos.x,
        y: pos.y,
        width: 200,
        height: settings.fontSize * 1.5,
        rotation: 0,
        zIndex: getNextZIndex(elements),
        visible: true,
        locked: false,
        createdBy: '',
        createdAt: now,
        updatedAt: now,
        content: '',
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        fontWeight: 400,
        color: settings.strokeColor,
        align: 'left',
      }
      setEditingText(element)
      setTextInput('')
      return
    }

    if (tool === 'sticky-note') {
      const now = Date.now()
      const element: StickyNoteElement = {
        id: generateId(),
        type: 'sticky-note',
        x: point.x - 75,
        y: point.y - 75,
        width: 150,
        height: 150,
        rotation: 0,
        zIndex: getNextZIndex(elements),
        visible: true,
        locked: false,
        createdBy: '',
        createdAt: now,
        updatedAt: now,
        content: '',
        color: settings.fillColor === 'transparent' ? '#fef08a' : settings.fillColor,
        fontSize: 16,
      }
      setEditingText(element)
      setTextInput('')
      return
    }

    const now = Date.now()
    if (tool === 'pen' || tool === 'eraser') {
      const element: PenElement | EraserElement = {
        id: generateId(),
        type: tool,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        rotation: 0,
        zIndex: getNextZIndex(elements),
        visible: true,
        locked: false,
        createdBy: '',
        createdAt: now,
        updatedAt: now,
        points: [point],
        strokeColor: tool === 'eraser' ? backgroundColor : settings.strokeColor,
        strokeWidth: tool === 'eraser' ? settings.strokeWidth * 3 : settings.strokeWidth,
        opacity: settings.opacity,
      }
      setInteraction({ type: 'drawing', element })
    } else {
      const element: ShapeElement = {
        id: generateId(),
        type: tool as ShapeElement['type'],
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        rotation: 0,
        zIndex: getNextZIndex(elements),
        visible: true,
        locked: false,
        createdBy: '',
        createdAt: now,
        updatedAt: now,
        strokeColor: settings.strokeColor,
        strokeWidth: settings.strokeWidth,
        fillColor: settings.fillColor,
        opacity: settings.opacity,
        startPoint: point,
        endPoint: point,
      }
      setInteraction({ type: 'drawing', element })
    }
  }, [tool, transform, getCanvasPoint, selectedIds, elements, getElementAtPoint, findHandleAtPoint, onSelectionChange, canDraw, settings, snapToGrid, gridSize, backgroundColor])

  const handlePointerMove = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e)
    cursorPosRef.current = point

    const now = Date.now()
    if (now - lastCursorSendRef.current > 50) {
      lastCursorSendRef.current = now
      onCursorMove(point)
    }

    if (interaction.type === 'none') return

    if (interaction.type === 'panning') {
      const dx = e.clientX - interaction.startPoint.x
      const dy = e.clientY - interaction.startPoint.y
      onTransformChange({
        ...interaction.startTransform,
        x: interaction.startTransform.x + dx,
        y: interaction.startTransform.y + dy,
      })
      return
    }

    if (interaction.type === 'selecting') {
      setInteraction({ ...interaction, endPoint: point })
      return
    }

    if (interaction.type === 'laser') {
      setInteraction({ type: 'laser', points: [...interaction.points, point] })
      return
    }

    if (interaction.type === 'drawing') {
      const el = interaction.element
      if (el.type === 'pen' || el.type === 'eraser') {
        const pen = el as PenElement
        const pts = [...pen.points, point]
        let minX = pts[0].x, minY = pts[0].y, maxX = pts[0].x, maxY = pts[0].y
        for (const p of pts) {
          minX = Math.min(minX, p.x); minY = Math.min(minY, p.y)
          maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y)
        }
        setInteraction({
          type: 'drawing',
          element: { ...pen, points: pts, x: minX, y: minY, width: maxX - minX, height: maxY - minY },
        })
      } else {
        const shape = el as ShapeElement
        const start = shape.startPoint!
        let end = point
        if (shape.type === 'line' || shape.type === 'arrow') {
          if (snapToGrid) end = snapPoint(point, gridSize)
        } else {
          if (e.shiftKey) {
            const size = Math.max(Math.abs(point.x - start.x), Math.abs(point.y - start.y))
            end = {
              x: start.x + Math.sign(point.x - start.x) * size,
              y: start.y + Math.sign(point.y - start.y) * size,
            }
          }
        }
        setInteraction({
          type: 'drawing',
          element: {
            ...shape,
            startPoint: start,
            endPoint: end,
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
          },
        })
      }
      return
    }

    if (interaction.type === 'moving') {
      const dx = point.x - interaction.startPoint.x
      const dy = point.y - interaction.startPoint.y
      const updated = interaction.originalElements.map(orig => {
        let nx = orig.x + dx
        let ny = orig.y + dy
        if (snapToGrid) {
          nx = Math.round(nx / gridSize) * gridSize
          ny = Math.round(ny / gridSize) * gridSize
        }
        return { ...orig, x: nx, y: ny }
      })
      onElementsChange(elements.map(el => {
        const u = updated.find(up => up.id === el.id)
        return u || el
      }))
      return
    }

    if (interaction.type === 'rotating') {
      const orig = interaction.originalElement
      const center = { x: orig.x + orig.width / 2, y: orig.y + orig.height / 2 }
      const currentAngle = Math.atan2(point.y - center.y, point.x - center.x)
      const delta = currentAngle - interaction.startAngle
      let rotation = (orig.rotation + delta) % (Math.PI * 2)
      if (e.shiftKey) rotation = Math.round(rotation / (Math.PI / 12)) * (Math.PI / 12)
      onElementsChange(elements.map(el => el.id === orig.id ? { ...el, rotation } : el))
      return
    }
  }, [interaction, getCanvasPoint, onCursorMove, onTransformChange, elements, onElementsChange, snapToGrid, gridSize])

  const handlePointerUp = useCallback((_e: React.MouseEvent) => {
    if (interaction.type === 'drawing') {
      const el = interaction.element
      if (el.width < MIN_ELEMENT_SIZE && el.height < MIN_ELEMENT_SIZE && el.type !== 'pen' && el.type !== 'eraser') {
        el.width = MIN_ELEMENT_SIZE
        el.height = MIN_ELEMENT_SIZE
      }
      onElementsChange([...elements, el])
      onElementCreate(el)
      onSelectionChange([el.id])
    } else if (interaction.type === 'selecting') {
      const { startPoint, endPoint } = interaction
      const rect = {
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y),
      }
      if (rect.width > 3 || rect.height > 3) {
        const hits = elements.filter(el => {
          if (!el.visible || el.locked) return false
          return (
            el.x < rect.x + rect.width &&
            el.x + el.width > rect.x &&
            el.y < rect.y + rect.height &&
            el.y + el.height > rect.y
          )
        }).map(el => el.id)
        onSelectionChange(hits)
      }
    } else if (interaction.type === 'moving' || interaction.type === 'rotating') {
      const ids = interaction.type === 'moving'
        ? interaction.originalElements.map(el => el.id)
        : [interaction.originalElement.id]
      for (const id of ids) {
        const el = elements.find(x => x.id === id)
        if (el) onElementUpdate(el)
      }
    }
    setInteraction({ type: 'none' })
  }, [interaction, elements, onElementsChange, onElementCreate, onSelectionChange, onElementUpdate])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e)
    const element = getElementAtPoint(point)
    if (element && (element.type === 'text' || element.type === 'sticky-note')) {
      setEditingText(element as TextElement | StickyNoteElement)
      setTextInput(element.type === 'text' ? (element as TextElement).content : (element as StickyNoteElement).content)
    }
  }, [getCanvasPoint, getElementAtPoint])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const delta = -e.deltaY * 0.001
      const newScale = Math.max(0.1, Math.min(10, transform.scale * (1 + delta)))
      const ratio = newScale / transform.scale
      onTransformChange({
        scale: newScale,
        x: mouseX - (mouseX - transform.x) * ratio,
        y: mouseY - (mouseY - transform.y) * ratio,
      })
    } else {
      onTransformChange({
        ...transform,
        x: transform.x - e.deltaX,
        y: transform.y - e.deltaY,
      })
    }
  }, [transform, onTransformChange])

  const handleImageFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      const img = new Image()
      img.onload = () => {
        const maxDim = 400
        let width = img.width
        let height = img.height
        const scale = Math.min(1, maxDim / Math.max(width, height))
        width *= scale
        height *= scale
        const pos = imageClickPosRef.current
        const now = Date.now()
        const element: ImageElement = {
          id: generateId(),
          type: 'image',
          x: pos.x,
          y: pos.y,
          width,
          height,
          rotation: 0,
          zIndex: getNextZIndex(elementsRef.current),
          visible: true,
          locked: false,
          createdBy: '',
          createdAt: now,
          updatedAt: now,
          src,
          alt: file.name,
          originalWidth: img.width,
          originalHeight: img.height,
        }
        onElementsChange([...elementsRef.current, element])
        onElementCreate(element)
        onSelectionChange([element.id])
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }, [onElementsChange, onElementCreate, onSelectionChange])

  const commitText = useCallback(() => {
    if (!editingText) return
    const content = textInput.trim()
    if (content) {
      const updated = { ...editingText, content, updatedAt: Date.now() }
      const exists = elements.find(el => el.id === editingText.id)
      if (exists) {
        onElementsChange(elements.map(el => el.id === editingText.id ? updated : el))
        onElementUpdate(updated)
      } else {
        onElementsChange([...elements, updated])
        onElementCreate(updated)
      }
      onSelectionChange([editingText.id])
    }
    setEditingText(null)
    setTextInput('')
  }, [editingText, textInput, elements, onElementsChange, onElementCreate, onElementUpdate, onSelectionChange])

  const centerContent = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || elements.length === 0) return
    const bounds = getBounds(elements.flatMap(el => [
      { x: el.x, y: el.y },
      { x: el.x + el.width, y: el.y + el.height },
    ]))
    if (!bounds) return
    const rect = canvas.getBoundingClientRect()
    const contentWidth = bounds.max.x - bounds.min.x
    const contentHeight = bounds.max.y - bounds.min.y
    const scale = Math.min(
      (rect.width * 0.8) / Math.max(contentWidth, 1),
      (rect.height * 0.8) / Math.max(contentHeight, 1),
      2
    )
    onTransformChange({
      scale,
      x: rect.width / 2 - (bounds.min.x + contentWidth / 2) * scale,
      y: rect.height / 2 - (bounds.min.y + contentHeight / 2) * scale,
    })
  }, [elements, onTransformChange])

  useEffect(() => {
    if (editingText) {
      setTimeout(() => {
        const input = document.querySelector('.text-editor-input') as HTMLTextAreaElement
        input?.focus()
      }, 50)
    }
  }, [editingText])

  const cursorStyle = tool === 'hand' ? 'grab' : tool === 'select' ? 'default' : tool === 'text' ? 'text' : 'crosshair'

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: backgroundColor }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: cursorStyle }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => { setInteraction({ type: 'none' }); cursorPosRef.current = null }}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onContextMenu={onContextMenu}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />

      {editingText && (
        <TextEditor
          element={editingText}
          value={textInput}
          onChange={setTextInput}
          onCommit={commitText}
          onCancel={() => { setEditingText(null); setTextInput('') }}
          transform={transform}
        />
      )}
    </div>
  )
})

WhiteboardCanvas.displayName = 'WhiteboardCanvas'

function getNextZIndex(elements: WhiteboardElement[]): number {
  return elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) + 1 : 0
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, transform: Transform, gridSize: number) {
  const scale = transform.scale
  const effectiveGrid = gridSize * scale
  if (effectiveGrid < 8) return

  const startX = transform.x % effectiveGrid
  const startY = transform.y % effectiveGrid

  ctx.save()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = startX; x < width; x += effectiveGrid) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  }
  for (let y = startY; y < height; y += effectiveGrid) {
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }
  ctx.stroke()
  ctx.restore()
}

function drawElement(ctx: CanvasRenderingContext2D, element: WhiteboardElement, selected: boolean, interaction: InteractionMode) {
  ctx.save()
  ctx.globalAlpha = 'opacity' in element ? element.opacity : 1

  const center = { x: element.x + element.width / 2, y: element.y + element.height / 2 }
  if (element.rotation !== 0) {
    ctx.translate(center.x, center.y)
    ctx.rotate(element.rotation)
    ctx.translate(-center.x, -center.y)
  }

  switch (element.type) {
    case 'pen':
    case 'eraser': {
      const pen = element as PenElement
      if (pen.points.length < 2) {
        if (pen.points.length === 1) {
          ctx.beginPath()
          ctx.arc(pen.points[0].x, pen.points[0].y, pen.strokeWidth / 2, 0, Math.PI * 2)
          ctx.fillStyle = pen.strokeColor
          ctx.fill()
        }
        break
      }
      ctx.beginPath()
      ctx.moveTo(pen.points[0].x, pen.points[0].y)
      for (let i = 1; i < pen.points.length - 1; i++) {
        const midX = (pen.points[i].x + pen.points[i + 1].x) / 2
        const midY = (pen.points[i].y + pen.points[i + 1].y) / 2
        ctx.quadraticCurveTo(pen.points[i].x, pen.points[i].y, midX, midY)
      }
      ctx.lineTo(pen.points[pen.points.length - 1].x, pen.points[pen.points.length - 1].y)
      ctx.strokeStyle = pen.strokeColor
      ctx.lineWidth = pen.strokeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      break
    }
    case 'line': {
      const shape = element as ShapeElement
      const start = shape.startPoint!
      const end = shape.endPoint!
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.strokeStyle = shape.strokeColor
      ctx.lineWidth = shape.strokeWidth
      ctx.lineCap = 'round'
      ctx.stroke()
      break
    }
    case 'arrow': {
      const shape = element as ShapeElement
      const start = shape.startPoint!
      const end = shape.endPoint!
      const angle = Math.atan2(end.y - start.y, end.x - start.x)
      const headLen = Math.max(12, shape.strokeWidth * 3)
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.strokeStyle = shape.strokeColor
      ctx.lineWidth = shape.strokeWidth
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(end.x, end.y)
      ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 7), end.y - headLen * Math.sin(angle - Math.PI / 7))
      ctx.moveTo(end.x, end.y)
      ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 7), end.y - headLen * Math.sin(angle + Math.PI / 7))
      ctx.stroke()
      break
    }
    case 'rectangle': {
      const shape = element as ShapeElement
      if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fillStyle = shape.fillColor
        ctx.fillRect(element.x, element.y, element.width, element.height)
      }
      ctx.strokeStyle = shape.strokeColor
      ctx.lineWidth = shape.strokeWidth
      ctx.strokeRect(element.x, element.y, element.width, element.height)
      break
    }
    case 'ellipse': {
      const shape = element as ShapeElement
      ctx.beginPath()
      ctx.ellipse(center.x, center.y, element.width / 2, element.height / 2, 0, 0, Math.PI * 2)
      if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fillStyle = shape.fillColor
        ctx.fill()
      }
      ctx.strokeStyle = shape.strokeColor
      ctx.lineWidth = shape.strokeWidth
      ctx.stroke()
      break
    }
    case 'text': {
      const text = element as TextElement
      ctx.fillStyle = text.color
      ctx.font = `${text.fontWeight} ${text.fontSize}px ${text.fontFamily}`
      ctx.textAlign = text.align
      ctx.textBaseline = 'top'
      const lines = wrapText(ctx, text.content, text.width)
      const lineHeight = text.fontSize * 1.3
      lines.forEach((line, i) => {
        ctx.fillText(line, element.x, element.y + i * lineHeight)
      })
      break
    }
    case 'sticky-note': {
      const note = element as StickyNoteElement
      ctx.fillStyle = note.color
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetY = 2
      ctx.fillRect(element.x, element.y, element.width, element.height)
      ctx.shadowColor = 'transparent'
      ctx.fillStyle = '#1f2937'
      ctx.font = `400 ${note.fontSize}px Inter, sans-serif`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const lines = wrapText(ctx, note.content, element.width - 20)
      const lineHeight = note.fontSize * 1.4
      lines.forEach((line, i) => {
        if (element.y + 10 + (i + 1) * lineHeight < element.y + element.height) {
          ctx.fillText(line, element.x + 10, element.y + 10 + i * lineHeight)
        }
      })
      break
    }
    case 'image': {
      const img = element as ImageElement
      const cached = imageCache.get(img.src)
      if (cached) {
        ctx.drawImage(cached, element.x, element.y, element.width, element.height)
      } else {
        loadImage(img.src)
        ctx.fillStyle = 'rgba(148, 163, 184, 0.2)'
        ctx.fillRect(element.x, element.y, element.width, element.height)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
        ctx.strokeRect(element.x, element.y, element.width, element.height)
      }
      break
    }
  }

  if (selected) {
    ctx.save()
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4)
    ctx.setLineDash([])

    if (interaction.type !== 'moving') {
      const handles = getHandlePositions(element)
      for (const h of handles) {
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 1.5
        ctx.fillRect(h.x - 4, h.y - 4, 8, 8)
        ctx.strokeRect(h.x - 4, h.y - 4, 8, 8)
      }
      const center = { x: element.x + element.width / 2, y: element.y + element.height / 2 }
      const rotateHandle = { x: center.x, y: element.y - 24 }
      ctx.beginPath()
      ctx.moveTo(center.x, element.y - 2)
      ctx.lineTo(rotateHandle.x, rotateHandle.y + 4)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(rotateHandle.x, rotateHandle.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#3b82f6'
      ctx.stroke()
    }
    ctx.restore()
  }

  ctx.restore()
}

function getHandlePositions(element: WhiteboardElement): Point[] {
  const center = { x: element.x + element.width / 2, y: element.y + element.height / 2 }
  return [
    { x: element.x, y: element.y },
    { x: center.x, y: element.y },
    { x: element.x + element.width, y: element.y },
    { x: element.x + element.width, y: center.y },
    { x: element.x + element.width, y: element.y + element.height },
    { x: center.x, y: element.y + element.height },
    { x: element.x, y: element.y + element.height },
    { x: element.x, y: center.y },
  ]
}

function drawLaser(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = '#ef4444'
  ctx.shadowBlur = 12
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
  ctx.restore()
}

function drawRemoteCursor(ctx: CanvasRenderingContext2D, cursor: RemoteCursor, transform: Transform) {
  const screenX = cursor.cursor.x * transform.scale + transform.x
  const screenY = cursor.cursor.y * transform.scale + transform.y

  ctx.save()
  ctx.fillStyle = cursor.color
  ctx.beginPath()
  ctx.moveTo(screenX, screenY)
  ctx.lineTo(screenX + 12, screenY + 4)
  ctx.lineTo(screenX + 5, screenY + 6)
  ctx.lineTo(screenX + 8, screenY + 14)
  ctx.lineTo(screenX + 5, screenY + 15)
  ctx.lineTo(screenX + 2, screenY + 7)
  ctx.lineTo(screenX, screenY + 12)
  ctx.closePath()
  ctx.fill()

  ctx.font = '500 12px Inter, sans-serif'
  const textWidth = ctx.measureText(cursor.name).width
  ctx.fillStyle = cursor.color
  ctx.beginPath()
  ctx.roundRect(screenX + 12, screenY + 14, textWidth + 12, 20, 4)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.fillText(cursor.name, screenX + 18, screenY + 24)
  ctx.restore()
}

function drawLocalCursor(ctx: CanvasRenderingContext2D, point: Point, transform: Transform, tool: ToolType, settings: ToolSettings) {
  if (tool === 'pen' || tool === 'eraser') {
    const screenX = point.x * transform.scale + transform.x
    const screenY = point.y * transform.scale + transform.y
    const radius = (tool === 'eraser' ? settings.strokeWidth * 3 : settings.strokeWidth) / 2 * transform.scale
    ctx.save()
    ctx.beginPath()
    ctx.arc(screenX, screenY, Math.max(radius, 3), 0, Math.PI * 2)
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines.length ? lines : ['']
}

const imageCache = new Map<string, HTMLImageElement>()

function loadImage(src: string) {
  if (imageCache.has(src)) return
  const img = new Image()
  img.onload = () => imageCache.set(src, img)
  img.onerror = () => {}
  img.src = src
  imageCache.set(src, img)
}

function exportToSVG(elements: WhiteboardElement[], _transform: Transform): string {
  const svgParts: string[] = ['<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">']
  svgParts.push('<rect width="100%" height="100%" fill="#ffffff"/>')
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)
  for (const el of sorted) {
    if (!el.visible) continue
    if (el.type === 'rectangle') {
      svgParts.push(`<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${(el as ShapeElement).fillColor}" stroke="${(el as ShapeElement).strokeColor}" stroke-width="${(el as ShapeElement).strokeWidth}"/>`)
    } else if (el.type === 'ellipse') {
      svgParts.push(`<ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${(el as ShapeElement).fillColor}" stroke="${(el as ShapeElement).strokeColor}" stroke-width="${(el as ShapeElement).strokeWidth}"/>`)
    } else if (el.type === 'pen') {
      const pts = (el as PenElement).points.map(p => `${p.x},${p.y}`).join(' ')
      svgParts.push(`<polyline points="${pts}" fill="none" stroke="${(el as PenElement).strokeColor}" stroke-width="${(el as PenElement).strokeWidth}"/>`)
    }
  }
  svgParts.push('</svg>')
  return svgParts.join('')
}

interface TextEditorProps {
  element: TextElement | StickyNoteElement
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
  transform: Transform
}

function TextEditor({ element, value, onChange, onCommit, onCancel, transform }: TextEditorProps) {
  const isSticky = element.type === 'sticky-note'
  const screenX = element.x * transform.scale + transform.x
  const screenY = element.y * transform.scale + transform.y
  const width = element.width * transform.scale
  const height = element.height * transform.scale
  const fontSize = (isSticky ? (element as StickyNoteElement).fontSize : (element as TextElement).fontSize) * transform.scale

  return (
    <textarea
      className="text-editor-input absolute border-2 border-[var(--accent)] rounded bg-[var(--wall)]/90 outline-none resize-none p-1"
      style={{
        left: screenX,
        top: screenY,
        width: Math.max(width, 150),
        minHeight: Math.max(height, fontSize * 1.5),
        fontSize,
        color: isSticky ? '#1f2937' : (element as TextElement).color,
        background: isSticky ? (element as StickyNoteElement).color : undefined,
        fontFamily: isSticky ? 'Inter' : (element as TextElement).fontFamily,
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel()
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onCommit()
      }}
      placeholder={isSticky ? 'Nhập ghi chú...' : 'Nhập văn bản...'}
    />
  )
}