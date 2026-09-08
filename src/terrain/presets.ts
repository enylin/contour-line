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

const asymmetricHill = (x: number, z: number) => {
  const centerX = -0.45
  const dx = x - centerX
  const xSpread = dx < 0 ? 0.5 : 0.075
  return 300 * Math.exp(-(dx * dx * xSpread + z * z * 0.18))
}

const doubleHill = (x: number, z: number) => {
  const left = gaussian(x, z, -1.8, 0, 0.35)
  const right = gaussian(x, z, 1.8, 0, 0.35)
  const raw = left + right
  const peakAtCenter = 1 + Math.exp(-((3.6 * 3.6) * 0.35))
  return (300 * raw) / peakAtCenter
}

const ridge = (x: number, z: number) =>
  300 * Math.exp(-(x * x * 0.1 + z * z * 0.42))

export const riverChannelX = (z: number) =>
  0.46 * Math.sin(z * 0.62) + 0.1 * Math.sin(z * 1.28)

const riverValley = (x: number, z: number) => {
  const channelX = riverChannelX(z)
  const channelElevation = 35 + (z + 5) * 11.5
  const distanceFromRiver = Math.abs(x - channelX)
  const valleyWall = 165 * (1 - Math.exp(-0.42 * Math.pow(distanceFromRiver, 1.55)))
  return channelElevation + valleyWall
}

const plateau = (x: number, z: number) => {
  const radius = Math.sqrt(x * x + z * z)
  const raw = 300 / (1 + Math.exp((radius - 2.8) * 2.2))
  const center = 300 / (1 + Math.exp(-2.8 * 2.2))
  return (raw / center) * 300
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
    case 'asymmetric':
      height = asymmetricHill(x, z)
      break
    case 'double':
      height = doubleHill(x, z)
      break
    case 'ridge':
      height = ridge(x, z)
      break
    case 'river':
      height = riverValley(x, z)
      break
    case 'plateau':
      height = plateau(x, z)
      break
    case 'standard':
    default:
      height = normalizedSingleHill(x, z, 0.18)
      break
  }

  if (!Number.isFinite(height)) return 0
  return Math.max(0, Math.min(300, height))
}

export const TERRAIN_PRESETS: Array<{
  id: TerrainPresetId
  label: string
  icon: string
  description: string
}> = [
  { id: 'standard', label: '標準山丘', icon: '⛰️', description: '先從最典型的同心等高線開始' },
  { id: 'gentle', label: '緩坡', icon: '🌄', description: '坡度平緩，等高線彼此比較遠' },
  { id: 'steep', label: '陡坡', icon: '🏔️', description: '坡度很陡，等高線會擠得更密' },
  { id: 'asymmetric', label: '偏斜山', icon: '⛰️', description: '一邊陡、一邊緩，左右疏密不同' },
  { id: 'double', label: '雙峰', icon: '⛰️⛰️', description: '高處分成兩圈，低處合成一圈' },
  { id: 'ridge', label: '山脊', icon: '〰️', description: '長條狀高地，等高線被拉成橢圓' },
  { id: 'river', label: '河谷與河流', icon: '🏞️', description: '河流切過山谷，等高線形成 V 字' },
  { id: 'plateau', label: '平頂山', icon: '🗻', description: '山頂較平，陡峭邊緣的線更集中' },
]
