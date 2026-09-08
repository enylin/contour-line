import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { buildTerrainGeometry } from '../terrain/buildTerrainGeometry'
import { sampleHeightField } from '../terrain/sampleHeightField'
import type { TerrainPresetId } from '../terrain/types'

function PreviewCamera() {
  const camera = useThree((state) => state.camera)

  useLayoutEffect(() => {
    camera.lookAt(0, 1.5, 0)
    camera.updateProjectionMatrix()
  }, [camera])

  return null
}

function PreviewTerrain({ preset }: { preset: TerrainPresetId }) {
  const field = useMemo(() => sampleHeightField(preset, 61), [preset])
  const geometry = useMemo(() => buildTerrainGeometry(field), [field])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#7ea66c"
          roughness={0.94}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[13, 13]} />
        <meshStandardMaterial color="#d9dfd2" roughness={1} />
      </mesh>
    </>
  )
}

export function TerrainPreview({ preset }: { preset: TerrainPresetId }) {
  return (
    <div className="terrain-preview" aria-hidden="true">
      <Canvas
        orthographic
        frameloop="demand"
        dpr={[1, 1.25]}
        camera={{ position: [8.5, 7.4, 8.5], zoom: 8, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        style={{ pointerEvents: 'none' }}
      >
        <color attach="background" args={['#eef2e9']} />
        <PreviewCamera />
        <hemisphereLight intensity={1.5} color="#fff8e9" groundColor="#61745c" />
        <directionalLight position={[6, 10, 5]} intensity={1.9} />
        <PreviewTerrain preset={preset} />
      </Canvas>
    </div>
  )
}
