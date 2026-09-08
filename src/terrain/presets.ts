import type {
  TerrainCategory,
  TerrainPresetDefinition,
  TerrainPresetId,
} from './types'

export const TERRAIN_BOUNDS = {
  minX: -5,
  maxX: 5,
  minZ: -5,
  maxZ: 5,
} as const

export const TERRAIN_RESOLUTION = 121
export const WORLD_HEIGHT_DIVISOR = 60

const clampHeight = (height: number) => {
  if (!Number.isFinite(height)) return 0
  return Math.max(0, Math.min(300, height))
}

const gaussian = (
  x: number,
  z: number,
  centerX: number,
  centerZ: number,
  xSpread: number,
  zSpread = xSpread,
) => {
  const dx = x - centerX
  const dz = z - centerZ
  return Math.exp(-(dx * dx * xSpread + dz * dz * zSpread))
}

const normalizedSingleHill = (x: number, z: number, spread: number) =>
  300 * gaussian(x, z, 0, 0, spread)

const asymmetricHill = (x: number, z: number) => {
  const centerX = -0.45
  const dx = x - centerX
  const xSpread = dx < 0 ? 0.5 : 0.075
  return 300 * Math.exp(-(dx * dx * xSpread + z * z * 0.18))
}

const elongatedHill = (x: number, z: number) =>
  300 * gaussian(x, z, 0, 0, 0.08, 0.3)

const coneHill = (x: number, z: number) =>
  300 * Math.max(0, 1 - Math.hypot(x, z) / 4.6)

const doubleHill = (x: number, z: number) => {
  const left = gaussian(x, z, -1.8, 0, 0.35)
  const right = gaussian(x, z, 1.8, 0, 0.35)
  const raw = left + right
  const peakAtCenter = 1 + Math.exp(-((3.6 * 3.6) * 0.35))
  return (300 * raw) / peakAtCenter
}

const tripleHill = (x: number, z: number) =>
  270 * (
    gaussian(x, z, -2, 0.6, 0.34) +
    0.9 * gaussian(x, z, 1.8, 0.9, 0.32) +
    0.82 * gaussian(x, z, 0.25, -1.9, 0.36)
  )

const plateau = (x: number, z: number) => {
  const radius = Math.hypot(x, z)
  const raw = 300 / (1 + Math.exp((radius - 2.8) * 2.2))
  const center = 300 / (1 + Math.exp(-2.8 * 2.2))
  return (raw / center) * 300
}

const ridge = (x: number, z: number) =>
  290 * gaussian(x, z, 0, 0, 0.075, 0.72)

const saddle = (x: number, z: number) =>
  245 * (
    gaussian(x, z, -1.65, 0, 0.3, 0.28) +
    gaussian(x, z, 1.65, 0, 0.3, 0.28)
  ) + 28 * gaussian(x, z, 0, 0, 0.08, 0.2)

export const riverChannelX = (z: number) =>
  0.46 * Math.sin(z * 0.62) + 0.1 * Math.sin(z * 1.28)

export const meanderChannelX = (z: number) =>
  1.05 * Math.sin(z * 0.68) + 0.28 * Math.sin(z * 1.42)

const slopingValley = (
  x: number,
  z: number,
  channelX: number,
  wallHeight: number,
  wallSpread: number,
) => {
  const channelElevation = 32 + (z + 5) * 11.4
  const distance = Math.abs(x - channelX)
  const valleyWall = wallHeight * (1 - Math.exp(-wallSpread * Math.pow(distance, 1.5)))
  return channelElevation + valleyWall
}

const riverValley = (x: number, z: number) =>
  slopingValley(x, z, riverChannelX(z), 165, 0.42)

const dryValley = (x: number, z: number) =>
  slopingValley(x, z, 0.18 * Math.sin(z * 0.45), 178, 0.34)

const spur = (x: number, z: number) =>
  230 * gaussian(x, z, 0, 1.25, 0.17) +
  120 * gaussian(x, z, 0, -1.45, 0.55, 0.07)

const crater = (x: number, z: number) => {
  const radius = Math.hypot(x, z)
  return 280 * Math.exp(-Math.pow(radius - 2.05, 2) * 1.18) +
    34 * gaussian(x, z, 0, 0, 0.12)
}

const basin = (x: number, z: number) => {
  const broadUpland = 220 * gaussian(x, z, 0, 0, 0.055)
  const depression = 165 * gaussian(x, z, 0, 0, 0.55)
  const shoulder = 48 * gaussian(x, z, 1.7, 0.2, 0.28)
  return 20 + broadUpland - depression + shoulder
}

const terracedHill = (x: number, z: number) => {
  const radius = Math.hypot(x, z)
  const base = 286 * gaussian(x, z, 0, 0, 0.15)
  const terraces = 18 * Math.sin(radius * 3.35) * Math.exp(-radius * 0.36)
  return base + terraces
}

const cliffHill = (x: number, z: number) => {
  const centerX = 0.25
  const dx = x - centerX
  const xSpread = dx < 0 ? 0.95 : 0.065
  return 300 * Math.exp(-(dx * dx * xSpread + z * z * 0.16))
}

const mesa = (x: number, z: number) => {
  const superRadius = Math.pow(Math.pow(Math.abs(x), 4) + Math.pow(Math.abs(z), 4), 0.25)
  return 292 / (1 + Math.exp((superRadius - 2.65) * 2.6))
}

const peakCluster = (x: number, z: number) =>
  205 * gaussian(x, z, -1.9, 1.3, 0.42) +
  185 * gaussian(x, z, 1.55, 1.55, 0.36) +
  170 * gaussian(x, z, -0.2, -1.8, 0.4) +
  120 * gaussian(x, z, 2.15, -1.4, 0.48)

const unevenDouble = (x: number, z: number) =>
  285 * gaussian(x, z, -1.45, 0.2, 0.32) +
  190 * gaussian(x, z, 1.75, -0.45, 0.48)

const crescent = (x: number, z: number) => {
  const radius = Math.hypot(x, z)
  const ring = 275 * Math.exp(-Math.pow(radius - 2.1, 2) * 1.28)
  const rightSideOpening = 0.32 + 0.68 / (1 + Math.exp((x - 0.25) * 2.25))
  return ring * rightSideOpening
}

const wavyRidge = (x: number, z: number) => {
  const centerZ = 0.68 * Math.sin(x * 0.78)
  return 275 * Math.exp(-(Math.pow(z - centerZ, 2) * 0.82 + x * x * 0.06))
}

const meanderValley = (x: number, z: number) =>
  slopingValley(x, z, meanderChannelX(z), 172, 0.36)

const lopsidedPlateau = (x: number, z: number) => {
  const dx = x + 0.65
  const dz = z - 0.25
  const superRadius = Math.pow(Math.pow(Math.abs(dx), 4) + Math.pow(Math.abs(dz), 4), 0.25)
  const base = 285 / (1 + Math.exp((superRadius - 2.55) * 2.35))
  return base * (0.78 + 0.22 / (1 + Math.exp(x * 1.1)))
}

const brokenRidge = (x: number, z: number) => {
  const left = 275 * gaussian(x, z, -2, 0.55, 0.12, 0.78)
  const right = 255 * gaussian(x, z, 2, -0.55, 0.12, 0.78)
  return Math.max(left, right) + 42 * gaussian(x, z, 0, 0, 0.35, 0.35)
}

const mixedRelief = (x: number, z: number) => {
  const broad = 180 * gaussian(x, z, 0, 0, 0.07)
  const peak = 135 * gaussian(x, z, -1.75, 1.25, 0.48)
  const secondPeak = 92 * gaussian(x, z, 1.8, -1.1, 0.42)
  const valleyCut = 88 * gaussian(x, z, 0.35, 0, 0.85, 0.07)
  return 20 + broad + peak + secondPeak - valleyCut
}

const horseshoe = (x: number, z: number) => {
  const radius = Math.hypot(x, z + 0.35)
  const ring = 280 * Math.exp(-Math.pow(radius - 2.15, 2) * 1.34)
  const northHeavy = 0.2 + 0.8 / (1 + Math.exp(-(z + 0.25) * 2.1))
  return ring * northHeavy
}

const rugged = (x: number, z: number) => {
  const envelope = Math.exp(-(x * x + z * z) * 0.055)
  const waves =
    165 +
    52 * Math.sin(x * 1.18) +
    43 * Math.cos(z * 1.34) +
    34 * Math.sin(x * 0.74 + z * 1.08) +
    24 * Math.cos(x * 1.72 - z * 0.62)
  return envelope * waves
}

export const terrainHeightMeters = (preset: TerrainPresetId, x: number, z: number) => {
  let height: number

  switch (preset) {
    case 'gentle': height = normalizedSingleHill(x, z, 0.095); break
    case 'steep': height = normalizedSingleHill(x, z, 0.34); break
    case 'asymmetric': height = asymmetricHill(x, z); break
    case 'elongated': height = elongatedHill(x, z); break
    case 'cone': height = coneHill(x, z); break
    case 'plateau': height = plateau(x, z); break
    case 'double': height = doubleHill(x, z); break
    case 'triple': height = tripleHill(x, z); break
    case 'offset-peak': height = 300 * gaussian(x, z, 1.3, -0.9, 0.18); break
    case 'ridge': height = ridge(x, z); break
    case 'saddle': height = saddle(x, z); break
    case 'river': height = riverValley(x, z); break
    case 'dry-valley': height = dryValley(x, z); break
    case 'spur': height = spur(x, z); break
    case 'crater': height = crater(x, z); break
    case 'basin': height = basin(x, z); break
    case 'terraced': height = terracedHill(x, z); break
    case 'cliff': height = cliffHill(x, z); break
    case 'mesa': height = mesa(x, z); break
    case 'peak-cluster': height = peakCluster(x, z); break
    case 'uneven-double': height = unevenDouble(x, z); break
    case 'crescent': height = crescent(x, z); break
    case 'wavy-ridge': height = wavyRidge(x, z); break
    case 'meander-valley': height = meanderValley(x, z); break
    case 'lopsided-plateau': height = lopsidedPlateau(x, z); break
    case 'broken-ridge': height = brokenRidge(x, z); break
    case 'mixed-relief': height = mixedRelief(x, z); break
    case 'horseshoe': height = horseshoe(x, z); break
    case 'rugged': height = rugged(x, z); break
    case 'standard':
    default: height = normalizedSingleHill(x, z, 0.18); break
  }

  return clampHeight(height)
}

export const TERRAIN_CATEGORIES: Array<{
  id: TerrainCategory
  label: string
  description: string
}> = [
  { id: 'basic', label: '基本地形', description: '先看懂坡度、峰頂與多峰的基本規律' },
  { id: 'advanced', label: '進階地形', description: '辨認山脊、河谷、鞍部、凹地與特殊坡面' },
  { id: 'irregular', label: '不規則地形', description: '把多個特徵組合起來，練習真正判讀地形' },
]

export const TERRAIN_PRESETS: TerrainPresetDefinition[] = [
  { id: 'standard', category: 'basic', label: '標準山丘', icon: '⛰️', description: '典型的同心等高線' },
  { id: 'gentle', category: 'basic', label: '緩坡', icon: '🌄', description: '等高線彼此比較遠' },
  { id: 'steep', category: 'basic', label: '陡坡', icon: '🏔️', description: '等高線擠得很密' },
  { id: 'asymmetric', category: 'basic', label: '偏斜山', icon: '⛰️', description: '一邊陡、一邊緩' },
  { id: 'elongated', category: 'basic', label: '長橢圓山', icon: '🥚', description: '等高線被拉成長橢圓' },
  { id: 'cone', category: 'basic', label: '圓錐山', icon: '🔺', description: '坡度近乎固定，線距較平均' },
  { id: 'plateau', category: 'basic', label: '平頂山', icon: '🗻', description: '山頂較平、邊緣較陡' },
  { id: 'double', category: 'basic', label: '雙峰', icon: '⛰️⛰️', description: '高處兩圈，低處合成一圈' },
  { id: 'triple', category: 'basic', label: '三峰', icon: '🏔️🏔️', description: '三個峰頂形成多組閉合線' },
  { id: 'offset-peak', category: 'basic', label: '偏心山頂', icon: '🎯', description: '最高點不在地形中央' },

  { id: 'ridge', category: 'advanced', label: '狹長山脊', icon: '〰️', description: '狹長高地形成細長等高線' },
  { id: 'saddle', category: 'advanced', label: '鞍部', icon: '🐎', description: '兩峰之間有較低的通道' },
  { id: 'river', category: 'advanced', label: '河谷與河流', icon: '🏞️', description: '等高線在河谷形成 V 字', examGroup: 'valley' },
  { id: 'dry-valley', category: 'advanced', label: 'V 型山谷', icon: '∨', description: '沒有河流提示，只看 V 字判讀', examGroup: 'valley' },
  { id: 'spur', category: 'advanced', label: '支稜', icon: '↘️', description: '山脊向低處伸出一個舌狀高地' },
  { id: 'crater', category: 'advanced', label: '火山口', icon: '🌋', description: '環狀高地包住中央低地', examGroup: 'depression' },
  { id: 'basin', category: 'advanced', label: '封閉凹地', icon: '🕳️', description: '中央低、四周高的封閉地形', examGroup: 'depression' },
  { id: 'terraced', category: 'advanced', label: '階梯坡', icon: '🪜', description: '陡緩交替，線距呈帶狀變化' },
  { id: 'cliff', category: 'advanced', label: '單側峭壁', icon: '🧗', description: '一側等高線幾乎貼在一起' },
  { id: 'mesa', category: 'advanced', label: '方形桌狀山', icon: '▰', description: '近方形平頂與陡峭邊坡' },

  { id: 'peak-cluster', category: 'irregular', label: '群峰', icon: '🏔️', description: '多個不同大小的山峰聚在一起' },
  { id: 'uneven-double', category: 'irregular', label: '高低雙峰', icon: '⛰️', description: '兩個峰的高度與坡度都不同' },
  { id: 'crescent', category: 'irregular', label: '新月形高地', icon: '🌙', description: '環狀高地被削掉一側' },
  { id: 'wavy-ridge', category: 'irregular', label: '彎曲山脊', icon: '〰️', description: '山脊像波浪一樣彎曲' },
  { id: 'meander-valley', category: 'irregular', label: '蜿蜒山谷', icon: '🐍', description: '谷線左右大幅擺動' },
  { id: 'lopsided-plateau', category: 'irregular', label: '歪斜高原', icon: '🗻', description: '平頂地形同時帶有方向性坡度' },
  { id: 'broken-ridge', category: 'irregular', label: '斷續山脊', icon: '⛰️', description: '兩段山脊錯開，中間只有低連結' },
  { id: 'mixed-relief', category: 'irregular', label: '混合丘陵', icon: '🌄', description: '山峰、低谷和緩坡混在一起' },
  { id: 'horseshoe', category: 'irregular', label: '馬蹄形山地', icon: '🧲', description: '高地包圍三面，向一側開口' },
  { id: 'rugged', category: 'irregular', label: '崎嶇地形', icon: '🪨', description: '多尺度起伏形成不規則等高線' },
]

export const getTerrainPreset = (id: TerrainPresetId) => {
  const preset = TERRAIN_PRESETS.find((item) => item.id === id)
  if (!preset) throw new Error(`Unknown terrain preset: ${id}`)
  return preset
}
