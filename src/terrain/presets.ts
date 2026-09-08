import type { TerrainPresetId } from './types'

export const TERRAIN_BOUNDS = {
  minX: -5,
  maxX: 5,
  minZ: -5,
  maxZ: 5,
} as const

export const TERRAIN_RESOLUTION = 121
export const WORLD_HEIGHT_DIVISOR = 60

const gaussian = (x: number, z: number, centerX: number, centerZ: number, spread: number) => {
  const dx = x - centerX
  const dz = z - centerZ
  return Math.exp(-(dx * dx + dz * dz) * spread)
}

const normalizedSingleHill = (x: number, z: number, spread: number) =>
  300 * gaussian(x, z, 0, 0, spread)

const doubleHill = (x: number, z: number) => {
  const left = gaussian(x, z, -1.8, 0, 0.35)
  const right = gaussian(x, z, 1.8, 0, 0.35)
  const raw = left + right
  const peakAtCenter = 1 + Math.exp(-((3.6 * 3.6) * 0.35))
  return (300 * raw) / peakAtCenter
}

export const terrainHeightMeters = (preset: TerrainPresetId, x: number, z: number) => {
  let height: number

  switch (preset) {
    case 'gentle':
      height = normalizedSingleHill(x, z, 0.105)
      break
    case 'steep':
      height = normalizedSingleHill(x, z, 0.31)
      break
    case 'double':
      height = doubleHill(x, z)
      break
    case 'standard':
    default:
      height = normalizedSingleHill(x, z, 0.18)
      break
  }

  if (!Number.isFinite(height)) return 0
  return Math.max(0, Math.min(300, height))
}

export const TERRAIN_PRESETS: Array<{ id: TerrainPresetId; label: string }> = [
  { id: 'standard', label: '標準山丘' },
  { id: 'gentle', label: '緩坡' },
  { id: 'steep', label: '陡坡' },
  { id: 'double', label: '雙峰' },
]
