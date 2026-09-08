export type TerrainPresetId =
  | 'standard'
  | 'gentle'
  | 'steep'
  | 'asymmetric'
  | 'double'
  | 'ridge'
  | 'river'
  | 'plateau'

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
