import { Line } from '@react-three/drei'
import { useMemo } from 'react'
import { riverChannelX, terrainHeightMeters, WORLD_HEIGHT_DIVISOR } from '../terrain/presets'
import type { TerrainPresetId } from '../terrain/types'

type TerrainFeaturesProps = {
  preset: TerrainPresetId
  contoursOnly: boolean
}

export function TerrainFeatures({ preset, contoursOnly }: TerrainFeaturesProps) {
  const riverPoints = useMemo(() => {
    if (preset !== 'river') return []

    return Array.from({ length: 101 }, (_, index) => {
      const z = -4.9 + (index / 100) * 9.8
      const x = riverChannelX(z)
      const y = terrainHeightMeters('river', x, z) / WORLD_HEIGHT_DIVISOR + 0.035
      return [x, y, z] as [number, number, number]
    })
  }, [preset])

  if (preset !== 'river') return null

  return (
    <group renderOrder={4}>
      <Line
        points={riverPoints}
        color="#d9f2f7"
        lineWidth={8}
        opacity={contoursOnly ? 0.46 : 0.82}
        transparent
        depthTest={false}
      />
      <Line
        points={riverPoints}
        color="#438ca0"
        lineWidth={4.25}
        opacity={contoursOnly ? 0.72 : 0.98}
        transparent
        depthTest={false}
      />
    </group>
  )
}
