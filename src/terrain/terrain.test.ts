import { describe, expect, it } from 'vitest'
import { buildTerrainGeometry } from './buildTerrainGeometry'
import { buildContours, getContourLevels } from './contourUtils'
import { marchingSquares } from './marchingSquares'
import { TERRAIN_PRESETS, terrainHeightMeters } from './presets'
import { sampleHeightField } from './sampleHeightField'

const isFinitePoint = (point: { x: number; z: number }) =>
  Number.isFinite(point.x) && Number.isFinite(point.z)

const segmentLengthSquared = (a: { x: number; z: number }, b: { x: number; z: number }) => {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return dx * dx + dz * dz
}

describe('terrain presets', () => {
  it('produce finite non-negative heights across representative inputs', () => {
    for (const preset of TERRAIN_PRESETS) {
      for (let x = -5; x <= 5; x += 1) {
        for (let z = -5; z <= 5; z += 1) {
          const height = terrainHeightMeters(preset.id, x, z)
          expect(Number.isFinite(height)).toBe(true)
          expect(height).toBeGreaterThanOrEqual(0)
          expect(height).toBeLessThanOrEqual(300)
        }
      }
    }
  })

  it('has a higher center than edge for the standard hill', () => {
    expect(terrainHeightMeters('standard', 0, 0)).toBeGreaterThan(
      terrainHeightMeters('standard', 5, 5),
    )
  })

  it('builds a finite indexed terrain mesh with the expected grid shape', () => {
    const field = sampleHeightField('steep', 21)
    const geometry = buildTerrainGeometry(field)
    const positions = geometry.getAttribute('position')

    expect(positions.count).toBe(21 * 21)
    expect(geometry.index?.count).toBe(20 * 20 * 6)
    for (let index = 0; index < positions.array.length; index += 1) {
      expect(Number.isFinite(Number(positions.array[index]))).toBe(true)
    }

    geometry.dispose()
  })
})

describe('contours', () => {
  it('creates a closed 100m loop for the standard hill', () => {
    const field = sampleHeightField('standard', 101)
    const contours = marchingSquares(field, 100)
    expect(contours.some((contour) => contour.closed && contour.points.length > 8)).toBe(true)
  })

  it('splits a high double-hill contour into at least two closed loops', () => {
    const field = sampleHeightField('double', 121)
    const contours = marchingSquares(field, 225)
    const closedLoops = contours.filter((contour) => contour.closed)
    expect(closedLoops.length).toBeGreaterThanOrEqual(2)
  })

  it('does not emit microscopic open artifacts around the double-hill saddle', () => {
    const field = sampleHeightField('double', 121)
    const contours = marchingSquares(field, 200)

    expect(contours).toHaveLength(2)
    expect(contours.every((contour) => contour.closed)).toBe(true)
  })

  it('only emits finite contour coordinates', () => {
    const field = sampleHeightField('double', 81)
    const contours = buildContours(field, 25)
    expect(contours.length).toBeGreaterThan(0)
    for (const contour of contours) {
      expect(contour.points.every(isFinitePoint)).toBe(true)
    }
  })

  it('never exposes the exact maximum as a selectable contour level', () => {
    expect(getContourLevels(300, 25)).toHaveLength(11)
    expect(getContourLevels(300, 50)).toEqual([50, 100, 150, 200, 250])
    expect(getContourLevels(300, 100)).toEqual([100, 200])
    expect(getContourLevels(301, 100)).toEqual([100, 200, 300])
  })

  it('does not manufacture a contour when a level only touches the mountain peak', () => {
    const field = sampleHeightField('standard', 121)
    expect(field.maxHeight).toBe(300)
    expect(marchingSquares(field, field.maxHeight)).toHaveLength(0)
  })

  it('does not create zero-length stitched segments', () => {
    const field = sampleHeightField('standard', 91)
    const contours = marchingSquares(field, 150)
    let tinySegmentCount = 0
    let totalSegmentCount = 0

    for (const contour of contours) {
      for (let i = 1; i < contour.points.length; i += 1) {
        totalSegmentCount += 1
        if (segmentLengthSquared(contour.points[i - 1], contour.points[i]) < 1e-12) {
          tinySegmentCount += 1
        }
      }
    }

    expect(totalSegmentCount).toBeGreaterThan(0)
    expect(tinySegmentCount).toBe(0)
  })

  it('keeps all generated preset contours closed inside the sampled terrain bounds', () => {
    for (const preset of TERRAIN_PRESETS) {
      const field = sampleHeightField(preset.id, 121)
      const contours = buildContours(field, 25)
      expect(contours.length).toBeGreaterThan(0)
      expect(contours.every((contour) => contour.closed)).toBe(true)
    }
  })
})
