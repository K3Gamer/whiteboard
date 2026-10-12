import { Point, Size, Transform } from '../types'

export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y)
}

export function midpoint(p1: Point, p2: Point): Point {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
}

export function rotatePoint(point: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = point.x - center.x
  const dy = point.y - center.y
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

export function getBounds(points: Point[]): { min: Point; max: Point } | null {
  if (points.length === 0) return null
  let minX = points[0].x
  let minY = points[0].y
  let maxX = points[0].x
  let maxY = points[0].y
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } }
}

export function pointInRect(point: Point, rect: { x: number; y: number; width: number; height: number }): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

export function rectsIntersect(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    r1.x + r1.width < r2.x ||
    r2.x + r2.width < r1.x ||
    r1.y + r1.height < r2.y ||
    r2.y + r2.height < r1.y
  )
}

export function applyTransform(point: Point, transform: Transform): Point {
  return {
    x: point.x * transform.scale + transform.x,
    y: point.y * transform.scale + transform.y,
  }
}

export function invertTransform(point: Point, transform: Transform): Point {
  return {
    x: (point.x - transform.x) / transform.scale,
    y: (point.y - transform.y) / transform.scale,
  }
}

export function getTransformedBounds(
  bounds: { min: Point; max: Point },
  transform: Transform
): { min: Point; max: Point } {
  return {
    min: applyTransform(bounds.min, transform),
    max: applyTransform(bounds.max, transform),
  }
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

export function snapPoint(point: Point, gridSize: number): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  }
}

export function constrainTransform(
  transform: Transform,
  canvasSize: Size,
  contentBounds: { min: Point; max: Point } | null,
  minScale: number = 0.1,
  maxScale: number = 10
): Transform {
  let { x, y, scale } = transform
  scale = Math.max(minScale, Math.min(maxScale, scale))

  if (contentBounds) {
    const maxX = canvasSize.width / 2 - contentBounds.min.x * scale
    const minX = canvasSize.width / 2 - contentBounds.max.x * scale
    const maxY = canvasSize.height / 2 - contentBounds.min.y * scale
    const minY = canvasSize.height / 2 - contentBounds.max.y * scale

    x = Math.max(minX, Math.min(maxX, x))
    y = Math.max(minY, Math.min(maxY, y))
  }

  return { x, y, scale }
}

export function getElementCenter(element: { x: number; y: number; width: number; height: number }): Point {
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
  }
}

export function getElementBounds(element: { x: number; y: number; width: number; height: number }): { min: Point; max: Point } {
  return {
    min: { x: element.x, y: element.y },
    max: { x: element.x + element.width, y: element.y + element.height },
  }
}