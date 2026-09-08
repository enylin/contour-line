import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { CameraRig, type CameraCommand } from './CameraRig'
import { ContourLines } from './ContourLines'
import { ControlsPanel } from './ControlsPanel'
import { TerrainFeatures } from './TerrainFeatures'
import { TerrainMesh } from './TerrainMesh'
import { buildContours } from '../terrain/contourUtils'
import { sampleHeightField } from '../terrain/sampleHeightField'
import type { TerrainPresetId } from '../terrain/types'

export function TerrainExperience() {
  const [preset, setPreset] = useState<TerrainPresetId>('standard')
  const [interval, setInterval] = useState(50)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [contoursOnly, setContoursOnly] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 0, mode: 'threeD' })

  const field = useMemo(() => sampleHeightField(preset), [preset])
  const contours = useMemo(() => buildContours(field, interval), [field, interval])
  const contourLevels = useMemo(
    () => [...new Set(contours.map((contour) => contour.level))].sort((a, b) => a - b),
    [contours],
  )
  const activeSelectedLevel =
    selectedLevel !== null && contourLevels.includes(selectedLevel) ? selectedLevel : null

  useEffect(() => {
    if (selectedLevel !== null && !contourLevels.includes(selectedLevel)) {
      setSelectedLevel(null)
    }
  }, [contourLevels, selectedLevel])

  useEffect(() => {
    if (!sidebarOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  const requestView = useCallback((mode: CameraCommand['mode']) => {
    setCameraCommand((current) => ({ id: current.id + 1, mode }))
  }, [])

  const handleViewSettled = useCallback((_mode: CameraCommand['mode']) => {}, [])

  return (
    <main className="fullscreen-experience" aria-label="互動式三維等高線地形">
      <div className="canvas-wrap">
        <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true }}>
          <color attach="background" args={['#eef2e9']} />
          <fog attach="fog" args={['#eef2e9', 16, 30]} />
          <CameraRig command={cameraCommand} onViewSettled={handleViewSettled} />

          <hemisphereLight intensity={1.55} color="#fff8e9" groundColor="#61745c" />
          <directionalLight
            castShadow
            position={[7, 12, 6]}
            intensity={2.1}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
          />

          <Suspense fallback={null}>
            <TerrainMesh field={field} contoursOnly={contoursOnly} />
            <ContourLines contours={contours} selectedLevel={activeSelectedLevel} />
            <TerrainFeatures preset={preset} contoursOnly={contoursOnly} />
          </Suspense>

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]} receiveShadow>
            <planeGeometry args={[14, 14]} />
            <meshStandardMaterial color="#d9dfd2" roughness={1} />
          </mesh>
        </Canvas>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="關閉設定"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <ControlsPanel
        open={sidebarOpen}
        preset={preset}
        onPresetChange={(nextPreset) => {
          setPreset(nextPreset)
          setSelectedLevel(null)
        }}
        interval={interval}
        onIntervalChange={setInterval}
        contourLevels={contourLevels}
        selectedLevel={activeSelectedLevel}
        onSelectedLevelChange={setSelectedLevel}
        contoursOnly={contoursOnly}
        onContoursOnlyChange={setContoursOnly}
        onViewChange={requestView}
      />

      <button
        type="button"
        className={`menu-button ${sidebarOpen ? 'open' : ''}`}
        aria-label={sidebarOpen ? '關閉設定' : '開啟設定'}
        aria-expanded={sidebarOpen}
        aria-controls="terrain-controls"
        onClick={() => setSidebarOpen((current) => !current)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
    </main>
  )
}
