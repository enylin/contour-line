import { marchingSquares } from './marchingSquares'
import type { ContourPolyline, HeightField } from './types'

export const getContourLevels = (maxHeight: number, interval: number) => {
  if (!Number.isFinite(maxHeight) || !Number.isFinite(interval) || interval <= 0) return []

  const levels: number[] = []
  for (let level = interval; level <= maxHeight + 0.001; level += interval) {
    levels.push(level)
  }
  return levels
}

export const buildContours = (field: HeightField, interval: number): ContourPolyline[] =>
  getContourLevels(field.maxHeight, interval).flatMap((level) => marchingSquares(field, level))
