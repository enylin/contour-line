import { Line } from '@react-three/drei'
import { WORLD_HEIGHT_DIVISOR } from '../terrain/presets'
import type { ContourPolyline } from '../terrain/types'

type ContourLinesProps = {
  contours: ContourPolyline[]
  selectedLevel: number | null
}

export function ContourLines({ contours, selectedLevel }: ContourLinesProps) {
  return (
    <group renderOrder={3}>
      {contours.map((contour, index) => {
        const selected = selectedLevel === contour.level
        const muted = selectedLevel !== null && !selected
        const points = contour.points.map((point) => [
          point.x,
          contour.level / WORLD_HEIGHT_DIVISOR + 0.024,
          point.z,
        ] as [number, number, number])

        if (points.length < 2) return null

        return (
          <Line
            key={`${contour.level}-${index}`}
            points={points}
            color={selected ? '#e06a3b' : '#244b3b'}
            lineWidth={selected ? 4.6 : 2.25}
            opacity={muted ? 0.24 : 0.96}
            transparent
            depthTest
          />
        )
      })}
    </group>
  )
}
