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
  const centerX = -0.65
  const dx = x - centerX
  const xSpread = dx < 0 ? 0.95 : 0.05
  return 300 * Math.exp(-(dx * dx * xSpread + z * z * 0.16))
}

const elongatedHill = (x: number, z: number) =>
  300 * gaussian(x, z, 0, 0, 0.045, 0.42)

const coneHill = (x: number, z: number) =>
  300 * Math.max(0, 1 - Math.hypot(x, z) / 4.2)

const plateau = (x: number, z: number) => {
  const radius = Math.hypot(x, z)
  const raw = 300 / (1 + Math.exp((radius - 2.55) * 3.1))
  const center = 300 / (1 + Math.exp(-2.55 * 3.1))
  return (raw / center) * 300
}

const doubleHill = (x: number, z: number) => {
  const left = gaussian(x, z, -1.9, 0, 0.42)
  const right = gaussian(x, z, 1.9, 0, 0.42)
  const raw = left + right
  const peakAtCenter = 1 + Math.exp(-((3.8 * 3.8) * 0.42))
  return (300 * raw) / peakAtCenter
}

const tripleHill = (x: number, z: number) =>
  250 * (
    gaussian(x, z, -2.05, 0.9, 0.46) +
    0.93 * gaussian(x, z, 2.0, 0.75, 0.44) +
    0.86 * gaussian(x, z, 0.1, -2.05, 0.48)
  )

const tallSmallPair = (x: number, z: number) =>
  292 * gaussian(x, z, -1.75, -0.1, 0.5) +
  82 * gaussian(x, z, 2.25, 0.75, 0.26)

const fourHills = (x: number, z: number) =>
  225 * (
    gaussian(x, z, -1.8, -1.8, 0.52) +
    gaussian(x, z, 1.8, -1.8, 0.52) +
    gaussian(x, z, -1.8, 1.8, 0.52) +
    gaussian(x, z, 1.8, 1.8, 0.52)
  )

const ridge = (x: number, z: number) =>
  292 * gaussian(x, z, 0, 0, 0.045, 0.92)

const saddle = (x: number, z: number) =>
  238 * (
    gaussian(x, z, -1.75, 0, 0.34, 0.3) +
    gaussian(x, z, 1.75, 0, 0.34, 0.3)
  ) + 22 * gaussian(x, z, 0, 0, 0.07, 0.16)

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
  slopingValley(x, z, riverChannelX(z), 170, 0.46)

const dryValley = (x: number, z: number) =>
  slopingValley(x, z, 0.16 * Math.sin(z * 0.45), 182, 0.3)

const canyon = (x: number, z: number) => {
  const centerX = 0.2 * Math.sin(z * 0.52)
  const floor = 18 + (z + 5) * 7.8
  const distance = Math.abs(x - centerX)
  const walls = 205 * (1 - Math.exp(-1.9 * Math.pow(distance, 1.7)))
  return floor + walls
}

const uValley = (x: number, z: number) => {
  const centerX = 0.18 * Math.sin(z * 0.36)
  const floor = 30 + (z + 5) * 8.6
  const distance = Math.abs(x - centerX)
  const outsideFloor = Math.max(0, distance - 0.9)
  const walls = 188 * (1 - Math.exp(-0.62 * outsideFloor * outsideFloor))
  return floor + walls
}

const spur = (x: number, z: number) =>
  240 * gaussian(x, z, 0, 1.35, 0.18) +
  125 * gaussian(x, z, 0, -1.55, 0.62, 0.06)

const crater = (x: number, z: number) => {
  const radius = Math.hypot(x, z)
  return 282 * Math.exp(-Math.pow(radius - 2.05, 2) * 1.35) +
    28 * gaussian(x, z, 0, 0, 0.12)
}

const basin = (x: number, z: number) => {
  const broadUpland = 230 * gaussian(x, z, 0, 0, 0.05)
  const depression = 182 * gaussian(x, z, 0, 0, 0.62)
  const shoulder = 42 * gaussian(x, z, 1.8, 0.15, 0.3)
  return 18 + broadUpland - depression + shoulder
}

const terracedHill = (x: number, z: number) => {
  const radius = Math.hypot(x, z)
  const base = 286 * gaussian(x, z, 0, 0, 0.15)
  const terraces = 26 * Math.sin(radius * 3.5) * Math.exp(-radius * 0.34)
  return base + terraces
}

const mesa = (x: number, z: number) => {
  const superRadius = Math.pow(Math.pow(Math.abs(x), 5) + Math.pow(Math.abs(z), 5), 0.2)
  return 295 / (1 + Math.exp((superRadius - 2.55) * 3.1))
}

const peakCluster = (x: number, z: number) =>
  210 * gaussian(x, z, -2.0, 1.45, 0.48) +
  185 * gaussian(x, z, 1.6, 1.6, 0.4) +
  165 * gaussian(x, z, -0.3, -1.85, 0.46) +
  118 * gaussian(x, z, 2.2, -1.35, 0.55)

const unevenDouble = (x: number, z: number) =>
  282 * gaussian(x, z, -1.5, 0.15, 0.36) +
  172 * gaussian(x, z, 1.8, -0.55, 0.52)

const fiveHills = (x: number, z: number) =>
  238 * gaussian(x, z, 0, 0, 0.72) +
  220 * gaussian(x, z, -2.8, 0, 0.68) +
  210 * gaussian(x, z, 2.8, 0, 0.68) +
  225 * gaussian(x, z, 0, 2.8, 0.68) +
  205 * gaussian(x, z, 0, -2.8, 0.68)

const forkedValley = (x: number, z: number) => {
  const separation = Math.max(0, z) * 0.34
  const distance = separation === 0
    ? Math.abs(x)
    : Math.min(Math.abs(x - separation), Math.abs(x + separation))
  const floor = 26 + (z + 5) * 8.3
  const walls = 188 * (1 - Math.exp(-0.62 * Math.pow(distance, 1.55)))
  return floor + walls
}

const crescent = (x: number, z: number) => {
  const radius = Math.hypot(x, z)
  const ring = 278 * Math.exp(-Math.pow(radius - 2.1, 2) * 1.35)
  const rightSideOpening = 0.28 + 0.72 / (1 + Math.exp((x - 0.18) * 2.5))
  return ring * rightSideOpening
}

const wavyRidge = (x: number, z: number) => {
  const centerZ = 0.82 * Math.sin(x * 0.82)
  return 278 * Math.exp(-(Math.pow(z - centerZ, 2) * 0.98 + x * x * 0.055))
}

const meanderValley = (x: number, z: number) =>
  slopingValley(x, z, meanderChannelX(z), 178, 0.38)

const lopsidedPlateau = (x: number, z: number) => {
  const dx = x + 0.7
  const dz = z - 0.3
  const superRadius = Math.pow(Math.pow(Math.abs(dx), 4) + Math.pow(Math.abs(dz), 4), 0.25)
  const base = 288 / (1 + Math.exp((superRadius - 2.5) * 2.55))
  return base * (0.72 + 0.28 / (1 + Math.exp(x * 1.2)))
}

const brokenRidge = (x: number, z: number) => {
  const left = 278 * gaussian(x, z, -2.0, 0.65, 0.12, 0.9)
  const right = 258 * gaussian(x, z, 2.0, -0.65, 0.12, 0.9)
  return Math.max(left, right) + 35 * gaussian(x, z, 0, 0, 0.4, 0.4)
}

const mixedRelief = (x: number, z: number) => {
  const broad = 178 * gaussian(x, z, 0, 0, 0.065)
  const peak = 142 * gaussian(x, z, -1.8, 1.35, 0.52)
  const secondPeak = 96 * gaussian(x, z, 1.9, -1.15, 0.46)
  const valleyCut = 102 * gaussian(x, z, 0.35, 0, 0.92, 0.065)
  return 20 + broad + peak + secondPeak - valleyCut
}

const horseshoe = (x: number, z: number) => {
  const radius = Math.hypot(x, z + 0.35)
  const ring = 282 * Math.exp(-Math.pow(radius - 2.15, 2) * 1.45)
  const northHeavy = 0.16 + 0.84 / (1 + Math.exp(-(z + 0.25) * 2.3))
  return ring * northHeavy
}

const rugged = (x: number, z: number) => {
  const envelope = Math.exp(-(x * x + z * z) * 0.052)
  const waves =
    165 +
    58 * Math.sin(x * 1.18) +
    46 * Math.cos(z * 1.34) +
    38 * Math.sin(x * 0.74 + z * 1.08) +
    27 * Math.cos(x * 1.72 - z * 0.62)
  return envelope * waves
}

export const terrainHeightMeters = (preset: TerrainPresetId, x: number, z: number) => {
  let height: number

  switch (preset) {
    case 'gentle': height = normalizedSingleHill(x, z, 0.055); break
    case 'steep': height = normalizedSingleHill(x, z, 0.72); break
    case 'asymmetric': height = asymmetricHill(x, z); break
    case 'elongated': height = elongatedHill(x, z); break
    case 'cone': height = coneHill(x, z); break
    case 'plateau': height = plateau(x, z); break
    case 'double': height = doubleHill(x, z); break
    case 'triple': height = tripleHill(x, z); break
    case 'offset-peak': height = 300 * gaussian(x, z, 1.55, -1.15, 0.22); break
    case 'tall-small-pair': height = tallSmallPair(x, z); break
    case 'four-hills': height = fourHills(x, z); break
    case 'ridge': height = ridge(x, z); break
    case 'saddle': height = saddle(x, z); break
    case 'river': height = riverValley(x, z); break
    case 'dry-valley': height = dryValley(x, z); break
    case 'canyon': height = canyon(x, z); break
    case 'u-valley': height = uValley(x, z); break
    case 'spur': height = spur(x, z); break
    case 'crater': height = crater(x, z); break
    case 'basin': height = basin(x, z); break
    case 'terraced': height = terracedHill(x, z); break
    case 'mesa': height = mesa(x, z); break
    case 'peak-cluster': height = peakCluster(x, z); break
    case 'uneven-double': height = unevenDouble(x, z); break
    case 'five-hills': height = fiveHills(x, z); break
    case 'forked-valley': height = forkedValley(x, z); break
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
  { id: 'basic', label: '基本地形', description: '先看懂坡度、峰頂、偏斜與多丘陵的基本規律' },
  { id: 'advanced', label: '進階地形', description: '辨認山脊、河谷、峽谷、鞍部、凹地與特殊坡面' },
  { id: 'irregular', label: '不規則地形', description: '把多峰、分岔谷地與不規則起伏組合起來判讀' },
]

export const TERRAIN_PRESETS: TerrainPresetDefinition[] = [
  { id: 'standard', category: 'basic', label: '標準山丘', icon: '⛰️', description: '典型的同心等高線' },
  { id: 'gentle', category: 'basic', label: '超緩坡', icon: '🌄', description: '山體非常寬，等高線明顯拉得很開', examEligible: false },
  { id: 'steep', category: 'basic', label: '超陡坡', icon: '🏔️', description: '山體非常尖陡，等高線明顯擠在一起', examEligible: false },
  { id: 'asymmetric', category: 'basic', label: '偏斜山', icon: '⛰️', description: '一側很陡、一側很緩，線距差異明顯' },
  { id: 'elongated', category: 'basic', label: '長橢圓山', icon: '🥚', description: '地形被明顯拉長，等高線呈細長橢圓' },
  { id: 'cone', category: 'basic', label: '等坡圓錐', icon: '🔺', description: '坡度近乎固定，等高線間距接近一致', examEligible: false },
  { id: 'plateau', category: 'basic', label: '圓形平頂山', icon: '🗻', description: '山頂大片平坦，外圈突然變陡', examGroup: 'flat-top' },
  { id: 'double', category: 'basic', label: '雙峰', icon: '⛰️⛰️', description: '高處兩圈，低處合成一圈', examGroup: 'multi-peak' },
  { id: 'triple', category: 'basic', label: '三峰', icon: '🏔️🏔️', description: '三個分離峰頂形成三組高處閉合線', examGroup: 'multi-peak' },
  { id: 'offset-peak', category: 'basic', label: '偏心山頂', icon: '🎯', description: '整座山仍近似圓形，但最高點偏到一角', examGroup: 'off-center-single' },
  { id: 'tall-small-pair', category: 'basic', label: '高山＋矮丘', icon: '⛰️·', description: '一座接近 300m 的高山配一個很低的小丘', examGroup: 'uneven-pair' },
  { id: 'four-hills', category: 'basic', label: '四丘陵', icon: '⛰️⛰️', description: '四座大小接近的丘陵排成四角，高處會出現四圈', examGroup: 'multi-peak' },

  { id: 'ridge', category: 'advanced', label: '狹長山脊', icon: '〰️', description: '狹長高地形成非常細長的等高線', examGroup: 'ridge' },
  { id: 'saddle', category: 'advanced', label: '鞍部', icon: '🐎', description: '兩峰之間有明顯較低的通道' },
  { id: 'river', category: 'advanced', label: '河谷與河流', icon: '🏞️', description: '等高線跨過河谷時形成 V 字', examGroup: 'valley' },
  { id: 'dry-valley', category: 'advanced', label: 'V 型山谷', icon: '∨', description: '沒有河流提示，只靠尖 V 字辨認谷地', examGroup: 'valley' },
  { id: 'canyon', category: 'advanced', label: '狹窄峽谷', icon: '🧗', description: '谷底很窄、兩側陡峭，等高線密集貼近峽谷', examGroup: 'valley' },
  { id: 'u-valley', category: 'advanced', label: '寬 U 型谷', icon: '∪', description: '谷底寬而較平，兩側再快速升高', examGroup: 'valley' },
  { id: 'spur', category: 'advanced', label: '支稜', icon: '↘️', description: '山脊向低處伸出一個舌狀高地' },
  { id: 'crater', category: 'advanced', label: '火山口', icon: '🌋', description: '環狀高地包住中央低地', examGroup: 'depression' },
  { id: 'basin', category: 'advanced', label: '封閉凹地', icon: '🕳️', description: '中央低、四周高的封閉地形', examGroup: 'depression' },
  { id: 'terraced', category: 'advanced', label: '階梯坡', icon: '🪜', description: '陡緩交替，等高線疏密形成明顯帶狀變化' },
  { id: 'mesa', category: 'advanced', label: '方形桌狀山', icon: '▰', description: '近方形平頂與非常陡峭的邊坡', examGroup: 'flat-top' },

  { id: 'peak-cluster', category: 'irregular', label: '不規則群峰', icon: '🏔️', description: '四個高度、大小與位置都不同的峰聚在一起', examGroup: 'multi-peak' },
  { id: 'uneven-double', category: 'irregular', label: '高低雙峰', icon: '⛰️', description: '兩個峰高度與坡度不同，但差距沒有高山＋矮丘那麼極端', examGroup: 'uneven-pair' },
  { id: 'five-hills', category: 'irregular', label: '五丘陵', icon: '⛰️⛰️', description: '中央一丘加四周四丘，共五個高點', examGroup: 'multi-peak' },
  { id: 'forked-valley', category: 'irregular', label: 'Y 型分岔山谷', icon: 'Y', description: '一條谷地往上游分成兩支，等高線形成分岔 V 字', examGroup: 'valley' },
  { id: 'crescent', category: 'irregular', label: '新月形高地', icon: '🌙', description: '環狀高地被削掉一側' },
  { id: 'wavy-ridge', category: 'irregular', label: '彎曲山脊', icon: '〰️', description: '細長山脊像波浪一樣明顯彎曲', examGroup: 'ridge' },
  { id: 'meander-valley', category: 'irregular', label: '蜿蜒山谷', icon: '🐍', description: '谷線左右大幅擺動，V 字方向連續改變', examGroup: 'valley' },
  { id: 'lopsided-plateau', category: 'irregular', label: '歪斜高原', icon: '🗻', description: '平頂地形同時帶有方向性坡度', examGroup: 'flat-top' },
  { id: 'broken-ridge', category: 'irregular', label: '斷續山脊', icon: '⛰️', description: '兩段山脊錯開，中間只有很低的連結', examGroup: 'ridge' },
  { id: 'mixed-relief', category: 'irregular', label: '混合丘陵', icon: '🌄', description: '山峰、低谷和緩坡同時出現在一塊地形' },
  { id: 'horseshoe', category: 'irregular', label: '馬蹄形山地', icon: '🧲', description: '高地包圍三面，向一側明顯開口' },
  { id: 'rugged', category: 'irregular', label: '崎嶇地形', icon: '🪨', description: '多尺度起伏形成最不規則的等高線' },
]

export const getTerrainPreset = (id: TerrainPresetId) => {
  const preset = TERRAIN_PRESETS.find((item) => item.id === id)
  if (!preset) throw new Error(`Unknown terrain preset: ${id}`)
  return preset
}
