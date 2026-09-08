import { getHeightAtGrid } from './sampleHeightField'
import type { ContourPolyline, HeightField, Point2D } from './types'

type Segment = [Point2D, Point2D]
type EdgeName = 'top' | 'right' | 'bottom' | 'left'

const EPSILON = 1e-7
const KEY_PRECISION = 10_000

const interpolate = (
  a: Point2D,
  b: Point2D,
  ha: number,
  hb: number,
  level: number,
): Point2D => {
  const denominator = hb - ha
  const rawT = Math.abs(denominator) < EPSILON ? 0.5 : (level - ha) / denominator
  const t = Math.max(0, Math.min(1, rawT))
  return {
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
  }
}

const pointKey = (point: Point2D) =>
  `${Math.round(point.x * KEY_PRECISION)},${Math.round(point.z * KEY_PRECISION)}`

const distanceSquared = (a: Point2D, b: Point2D) => {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return dx * dx + dz * dz
}

const addSegment = (segments: Segment[], a?: Point2D, b?: Point2D) => {
  if (!a || !b) return
  if (!Number.isFinite(a.x) || !Number.isFinite(a.z) || !Number.isFinite(b.x) || !Number.isFinite(b.z)) {
    return
  }
  if (distanceSquared(a, b) < EPSILON * EPSILON) return
  segments.push([a, b])
}

const stitchSegments = (segments: Segment[]): Array<{ points: Point2D[]; closed: boolean }> => {
  if (segments.length === 0) return []

  const adjacency = new Map<string, Array<{ segmentIndex: number; endpoint: 0 | 1 }>>()

  segments.forEach((segment, segmentIndex) => {
    segment.forEach((point, endpoint) => {
      const key = pointKey(point)
      const list = adjacency.get(key) ?? []
      list.push({ segmentIndex, endpoint: endpoint as 0 | 1 })
      adjacency.set(key, list)
    })
  })

  const used = new Uint8Array(segments.length)
  const results: Array<{ points: Point2D[]; closed: boolean }> = []

  const extend = (points: Point2D[], append: boolean) => {
    while (true) {
      const current = append ? points[points.length - 1] : points[0]
      const matches = adjacency.get(pointKey(current)) ?? []
      const next = matches.find((candidate) => !used[candidate.segmentIndex])
      if (!next) break

      used[next.segmentIndex] = 1
      const segment = segments[next.segmentIndex]
      const other = segment[next.endpoint === 0 ? 1 : 0]
      if (append) points.push(other)
      else points.unshift(other)
    }
  }

  for (let i = 0; i < segments.length; i += 1) {
    if (used[i]) continue
    used[i] = 1

    const points = [segments[i][0], segments[i][1]]
    extend(points, true)
    extend(points, false)

    const isClosed = points.length >= 4 && pointKey(points[0]) === pointKey(points[points.length - 1])
    if (isClosed) points[points.length - 1] = points[0]

    if (points.length >= 2) {
      results.push({ points, closed: isClosed })
    }
  }

  return results
}

export const marchingSquares = (field: HeightField, level: number): ContourPolyline[] => {
  if (!Number.isFinite(level)) return []

  const { size, minX, maxX, minZ, maxZ } = field
  const dx = (maxX - minX) / (size - 1)
  const dz = (maxZ - minZ) / (size - 1)
  const segments: Segment[] = []

  for (let row = 0; row < size - 1; row += 1) {
    const z0 = minZ + row * dz
    const z1 = z0 + dz

    for (let col = 0; col < size - 1; col += 1) {
      const x0 = minX + col * dx
      const x1 = x0 + dx

      const tl = getHeightAtGrid(field, row, col)
      const tr = getHeightAtGrid(field, row, col + 1)
      const br = getHeightAtGrid(field, row + 1, col + 1)
      const bl = getHeightAtGrid(field, row + 1, col)

      const pTL = { x: x0, z: z0 }
      const pTR = { x: x1, z: z0 }
      const pBR = { x: x1, z: z1 }
      const pBL = { x: x0, z: z1 }

      const crossings = new Map<EdgeName, Point2D>()
      const crosses = (a: number, b: number) => (a < level && b >= level) || (a >= level && b < level)

      if (crosses(tl, tr)) crossings.set('top', interpolate(pTL, pTR, tl, tr, level))
      if (crosses(tr, br)) crossings.set('right', interpolate(pTR, pBR, tr, br, level))
      if (crosses(bl, br)) crossings.set('bottom', interpolate(pBL, pBR, bl, br, level))
      if (crosses(tl, bl)) crossings.set('left', interpolate(pTL, pBL, tl, bl, level))

      const edges = [...crossings.keys()]
      if (edges.length === 2) {
        addSegment(segments, crossings.get(edges[0]), crossings.get(edges[1]))
      } else if (edges.length === 4) {
        const center = (tl + tr + br + bl) / 4
        const top = crossings.get('top')
        const right = crossings.get('right')
        const bottom = crossings.get('bottom')
        const left = crossings.get('left')

        const tlHigh = tl >= level
        if ((center >= level) === tlHigh) {
          addSegment(segments, top, right)
          addSegment(segments, bottom, left)
        } else {
          addSegment(segments, top, left)
          addSegment(segments, right, bottom)
        }
      }
    }
  }

  return stitchSegments(segments).map((polyline) => ({
    level,
    points: polyline.points,
    closed: polyline.closed,
  }))
}
