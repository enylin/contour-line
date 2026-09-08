export type TerrainCategory = 'basic' | 'advanced' | 'irregular'

export type TerrainPresetId =
  | 'standard'
  | 'gentle'
  | 'steep'
  | 'asymmetric'
  | 'elongated'
  | 'cone'
  | 'plateau'
  | 'double'
  | 'triple'
  | 'offset-peak'
  | 'tall-small-pair'
  | 'four-hills'
  | 'ridge'
  | 'saddle'
  | 'river'
  | 'dry-valley'
  | 'canyon'
  | 'u-valley'
  | 'spur'
  | 'crater'
  | 'basin'
  | 'terraced'
  | 'mesa'
  | 'peak-cluster'
  | 'uneven-double'
  | 'five-hills'
  | 'forked-valley'
  | 'crescent'
  | 'wavy-ridge'
  | 'meander-valley'
  | 'lopsided-plateau'
  | 'broken-ridge'
  | 'mixed-relief'
  | 'horseshoe'
  | 'rugged'

export type TerrainPresetDefinition = {
  id: TerrainPresetId
  category: TerrainCategory
  label: string
  icon: string
  description: string
  examEligible?: boolean
  examGroup?: string
}

export type Point2D = {
  x: number
  z: number
}

export type HeightField = {
  size: number
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  heights: Float32Array
  minHeight: number
  maxHeight: number
}

export type ContourPolyline = {
  level: number
  points: Point2D[]
  closed: boolean
}
