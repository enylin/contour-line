import { describe, expect, it } from 'vitest'
import { buildTerrainGeometry } from './buildTerrainGeometry'
import { buildContours, getContourLevels } from './contourUtils'
import { marchingSquares } from './marchingSquares'
import {
  TERRAIN_PRESETS,
  meanderChannelX,
  riverChannelX,
  terrainHeightMeters,
} from './presets'
import { sampleHeightField } from './sampleHeightField'

const isFinitePoint = (point: { x: number; z: number }) =>
  Number.isFinite(point.x) && Number.isFinite(point.z)

const segmentLengthSquared = (a: { x: number; z: number }, b: { x: number; z: number }) => {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return dx * dx + dz * dz
}

describe('terrain presets', () => {
  it('contains 35 unique terrains with the expanded learning groups', () => {
    expect(TERRAIN_PRESETS).toHaveLength(35)
    expect(TERRAIN_PRESETS.filter((preset) => preset.category === 'basic')).toHaveLength(12)
    expect(TERRAIN_PRESETS.filter((preset) => preset.category === 'advanced')).toHaveLength(11)
    expect(TERRAIN_PRESETS.filter((preset) => preset.category === 'irregular')).toHaveLength(12)
    expect(new Set(TERRAIN_PRESETS.map((preset) => preset.id)).size).toBe(35)
    expect(new Set(TERRAIN_PRESETS.map((preset) => preset.label)).size).toBe(35)
    expect(TERRAIN_PRESETS.some((preset) => preset.id === ('cliff' as never))).toBe(false)
  })

  it('produces finite non-negative heights across representative inputs for every terrain', () => {
    for (const preset of TERRAIN_PRESETS) {
      for (let x = -5; x <= 5; x += 1) {
        for (let z = -5; z <= 5; z += 1) {
          const height = terrainHeightMeters(preset.id, x, z)
          expect(Number.isFinite(height), preset.id).toBe(true)
          expect(height, preset.id).toBeGreaterThanOrEqual(0)
          expect(height, preset.id).toBeLessThanOrEqual(300)
        }
      }
    }
  })

  it('gives every terrain enough vertical relief to be visually meaningful', () => {
    for (const preset of TERRAIN_PRESETS) {
      const field = sampleHeightField(preset.id, 61)
      expect(field.maxHeight - field.minHeight, preset.id).toBeGreaterThan(45)
    }
  })

  it('has a higher center than edge for the standard hill', () => {
    expect(terrainHeightMeters('standard', 0, 0)).toBeGreaterThan(
      terrainHeightMeters('standard', 5, 5),
    )
  })

  it('makes gentle and steep slopes deliberately exaggerated and easy to distinguish', () => {
    const gentleAtTwo = terrainHeightMeters('gentle', 2, 0)
    const standardAtTwo = terrainHeightMeters('standard', 2, 0)
    const steepAtTwo = terrainHeightMeters('steep', 2, 0)

    expect(gentleAtTwo).toBeGreaterThan(220)
    expect(standardAtTwo).toBeGreaterThan(steepAtTwo * 4)
    expect(steepAtTwo).toBeLessThan(25)
  })

  it('makes one side of the asymmetric hill dramatically gentler than the other', () => {
    const centerX = -0.65
    const steepSide = terrainHeightMeters('asymmetric', centerX - 2, 0)
    const gentleSide = terrainHeightMeters('asymmetric', centerX + 2, 0)
    expect(gentleSide).toBeGreaterThan(steepSide * 20)
  })

  it('creates an unmistakable tall mountain plus low hill pair', () => {
    const tall = terrainHeightMeters('tall-small-pair', -1.75, -0.1)
    const small = terrainHeightMeters('tall-small-pair', 2.25, 0.75)
    expect(tall).toBeGreaterThan(270)
    expect(small).toBeGreaterThan(65)
    expect(small).toBeLessThan(115)
    expect(tall).toBeGreaterThan(small * 2.5)
  })

  it('carves the river channel below its valley walls and slopes it upstream', () => {
    const z = 0
    const channelX = riverChannelX(z)
    const channel = terrainHeightMeters('river', channelX, z)
    const valleyWall = terrainHeightMeters('river', channelX + 2.5, z)
    const downstream = terrainHeightMeters('river', riverChannelX(-4), -4)
    const upstream = terrainHeightMeters('river', riverChannelX(4), 4)

    expect(valleyWall).toBeGreaterThan(channel + 70)
    expect(upstream).toBeGreaterThan(downstream + 70)
  })

  it('makes the canyon much narrower and steeper than its floor', () => {
    const center = terrainHeightMeters('canyon', 0, 0)
    const nearWall = terrainHeightMeters('canyon', 1, 0)
    const farWall = terrainHeightMeters('canyon', 2, 0)
    expect(nearWall).toBeGreaterThan(center + 140)
    expect(farWall).toBeGreaterThan(nearWall + 20)
  })

  it('gives the U-shaped valley a broad low floor before the walls rise', () => {
    const center = terrainHeightMeters('u-valley', 0, 0)
    const floorEdge = terrainHeightMeters('u-valley', 0.7, 0)
    const wall = terrainHeightMeters('u-valley', 2.5, 0)
    expect(Math.abs(center - floorEdge)).toBeLessThan(10)
    expect(wall).toBeGreaterThan(center + 100)
  })

  it('makes the irregular meandering valley move farther side to side than the river valley', () => {
    const sampleZ = [-4, -2, 0, 2, 4]
    const riverRange = Math.max(...sampleZ.map(riverChannelX)) - Math.min(...sampleZ.map(riverChannelX))
    const meanderRange = Math.max(...sampleZ.map(meanderChannelX)) - Math.min(...sampleZ.map(meanderChannelX))
    expect(meanderRange).toBeGreaterThan(riverRange * 1.5)
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

  it('shows four distinct high contours for the four-hill terrain', () => {
    const field = sampleHeightField('four-hills', 121)
    const contours = marchingSquares(field, 150)
    const closedLoops = contours.filter((contour) => contour.closed)
    expect(closedLoops.length).toBeGreaterThanOrEqual(4)
  })

  it('shows five distinct high contours for the five-hill terrain', () => {
    const field = sampleHeightField('five-hills', 121)
    const contours = marchingSquares(field, 150)
    const closedLoops = contours.filter((contour) => contour.closed)
    expect(closedLoops.length).toBeGreaterThanOrEqual(5)
  })

  it('creates open map contours for river, canyon, U valley, and forked valley terrains', () => {
    for (const preset of ['river', 'canyon', 'u-valley', 'forked-valley'] as const) {
      const field = sampleHeightField(preset, 121)
      const contours = buildContours(field, 25)
      expect(contours.length, preset).toBeGreaterThan(0)
      expect(contours.some((contour) => !contour.closed), preset).toBe(true)
    }
  })

  it('only emits finite contour coordinates for every terrain preset', () => {
    for (const preset of TERRAIN_PRESETS) {
      const field = sampleHeightField(preset.id, 81)
      const contours = buildContours(field, 25)
      expect(contours.length, preset.id).toBeGreaterThan(0)
      for (const contour of contours) {
        expect(contour.points.every(isFinitePoint), preset.id).toBe(true)
      }
    }
  })

  it('supports the expanded 10m to 150m contour interval range', () => {
    expect(getContourLevels(300, 10)).toHaveLength(29)
    expect(getContourLevels(300, 25)).toHaveLength(11)
    expect(getContourLevels(300, 50)).toEqual([50, 100, 150, 200, 250])
    expect(getContourLevels(300, 100)).toEqual([100, 200])
    expect(getContourLevels(300, 150)).toEqual([150])
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
      for (let index = 1; index < contour.points.length; index += 1) {
        totalSegmentCount += 1
        if (segmentLengthSquared(contour.points[index - 1], contour.points[index]) < 1e-12) {
          tinySegmentCount += 1
        }
      }
    }

    expect(totalSegmentCount).toBeGreaterThan(0)
    expect(tinySegmentCount).toBe(0)
  })
})
