import { useMemo } from 'react'
import { buildContours } from '../terrain/contourUtils'
import { sampleHeightField } from '../terrain/sampleHeightField'
import type { TerrainPresetId } from '../terrain/types'

const toSvgPoint = (x: number, z: number) => {
  const svgX = 10 + ((x + 5) / 10) * 80
  const svgY = 90 - ((z + 5) / 10) * 80
  return `${svgX.toFixed(2)},${svgY.toFixed(2)}`
}

export function ContourMapPreview({ preset }: { preset: TerrainPresetId }) {
  const contours = useMemo(() => {
    const field = sampleHeightField(preset, 71)
    return buildContours(field, 25)
  }, [preset])

  return (
    <div className="contour-preview" aria-hidden="true">
      <svg viewBox="0 0 100 100" role="presentation" preserveAspectRatio="xMidYMid meet">
        <rect x="5" y="5" width="90" height="90" rx="8" className="contour-preview-bg" />
        {contours.map((contour, index) => (
          <polyline
            key={`${contour.level}-${index}`}
            points={contour.points.map((point) => toSvgPoint(point.x, point.z)).join(' ')}
            className="contour-preview-line"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  )
}
