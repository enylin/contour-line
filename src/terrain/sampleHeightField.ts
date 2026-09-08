import { TERRAIN_BOUNDS, TERRAIN_RESOLUTION, terrainHeightMeters } from './presets'
import type { HeightField, TerrainPresetId } from './types'

export const sampleHeightField = (
  preset: TerrainPresetId,
  size = TERRAIN_RESOLUTION,
): HeightField => {
  if (!Number.isInteger(size) || size < 2) {
    throw new Error('Height field size must be an integer >= 2')
  }

  const { minX, maxX, minZ, maxZ } = TERRAIN_BOUNDS
  const heights = new Float32Array(size * size)
  let minHeight = Number.POSITIVE_INFINITY
  let maxHeight = Number.NEGATIVE_INFINITY

  for (let row = 0; row < size; row += 1) {
    const z = minZ + (row / (size - 1)) * (maxZ - minZ)

    for (let col = 0; col < size; col += 1) {
      const x = minX + (col / (size - 1)) * (maxX - minX)
      const height = terrainHeightMeters(preset, x, z)
      heights[row * size + col] = height
      minHeight = Math.min(minHeight, height)
      maxHeight = Math.max(maxHeight, height)
    }
  }

  return {
    size,
    minX,
    maxX,
    minZ,
    maxZ,
    heights,
    minHeight,
    maxHeight,
  }
}

export const getHeightAtGrid = (field: HeightField, row: number, col: number) =>
  field.heights[row * field.size + col]
