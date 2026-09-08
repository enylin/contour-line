import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildTerrainGeometry } from '../terrain/buildTerrainGeometry'
import type { HeightField } from '../terrain/types'

type TerrainMeshProps = {
  field: HeightField
  contoursOnly: boolean
}

export function TerrainMesh({ field, contoursOnly }: TerrainMeshProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const geometry = useMemo(() => buildTerrainGeometry(field), [field])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    if (!materialRef.current) return
    const target = contoursOnly ? 0.1 : 1
    const alpha = 1 - Math.exp(-delta * 7)
    materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, target, alpha)
  })

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        ref={materialRef}
        color="#7ea66c"
        roughness={0.92}
        metalness={0}
        transparent
        opacity={1}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
