import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildTerrainGeometry } from '../terrain/buildTerrainGeometry'
import type { HeightField } from '../terrain/types'

type TerrainMeshProps = {
  field: HeightField
  contoursOnly: boolean
  hidden?: boolean
}

export function TerrainMesh({ field, contoursOnly, hidden = false }: TerrainMeshProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const geometry = useMemo(() => buildTerrainGeometry(field), [field])

  useEffect(() => () => geometry.dispose(), [geometry])

  useEffect(() => {
    if (hidden && materialRef.current) materialRef.current.opacity = 0
  }, [hidden])

  useFrame((_, delta) => {
    if (!materialRef.current) return
    const target = hidden ? 0 : contoursOnly ? 0.1 : 1
    const alpha = 1 - Math.exp(-delta * 7)
    materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, target, alpha)
  })

  return (
    <mesh geometry={geometry} castShadow={!contoursOnly && !hidden} receiveShadow>
      <meshStandardMaterial
        ref={materialRef}
        color="#7ea66c"
        roughness={0.92}
        metalness={0}
        transparent
        opacity={hidden ? 0 : 1}
        depthWrite={!contoursOnly && !hidden}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
