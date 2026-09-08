import { Canvas } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { CameraRig, type CameraCommand } from './CameraRig'
import { ContourLines } from './ContourLines'
import { ControlsPanel } from './ControlsPanel'
import { TerrainMesh } from './TerrainMesh'
import { buildContours, getContourLevels } from '../terrain/contourUtils'
import { sampleHeightField } from '../terrain/sampleHeightField'
import type { TerrainPresetId } from '../terrain/types'

export function TerrainExperience() {
  const [preset, setPreset] = useState<TerrainPresetId>('standard')
  const [interval, setInterval] = useState(50)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [contoursOnly, setContoursOnly] = useState(false)
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 0, mode: 'threeD' })
  const [cameraMode, setCameraMode] = useState<CameraCommand['mode']>('threeD')

  const field = useMemo(() => sampleHeightField(preset), [preset])
  const contourLevels = useMemo(() => getContourLevels(field.maxHeight, interval), [field.maxHeight, interval])
  const contours = useMemo(() => buildContours(field, interval), [field, interval])

  useEffect(() => {
    if (selectedLevel !== null && !contourLevels.includes(selectedLevel)) {
      setSelectedLevel(null)
    }
  }, [contourLevels, selectedLevel])

  const requestView = useCallback((mode: CameraCommand['mode']) => {
    setCameraCommand((current) => ({ id: current.id + 1, mode }))
  }, [])

  const handleCameraComplete = useCallback((mode: CameraCommand['mode']) => {
    setCameraMode(mode)
  }, [])

  const educationText = selectedLevel !== null
    ? `這條線上的每一個地方都是 ${selectedLevel} 公尺高`
    : cameraMode === 'top'
      ? '從正上方看，山上的線就變成等高線地圖了！'
      : '每一條線都連接相同高度的地方'

  return (
    <main className="app-shell">
      <header className="hero-copy">
        <p className="eyebrow">互動地理小教室</p>
        <h1>等高線小實驗室</h1>
        <p>轉動山丘，看看地圖上的一圈圈線是怎麼來的</p>
      </header>

      <section className="experience-card" aria-label="互動式三維地形">
        <div className="canvas-wrap">
          <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true }}>
            <color attach="background" args={['#eef2e9']} />
            <fog attach="fog" args={['#eef2e9', 16, 30]} />
            <OrthographicCamera makeDefault position={[8, 7, 8]} zoom={52} near={0.1} far={100} />
            <CameraRig command={cameraCommand} onTransitionComplete={handleCameraComplete} />

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
              <ContourLines contours={contours} selectedLevel={selectedLevel} />
            </Suspense>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]} receiveShadow>
              <planeGeometry args={[14, 14]} />
              <meshStandardMaterial color="#d9dfd2" roughness={1} />
            </mesh>
          </Canvas>

          <div className="canvas-hint" aria-hidden="true">
            <span>↔</span> 拖曳旋轉 · 滾輪或雙指縮放
          </div>
          <div className="compass" aria-hidden="true">N</div>
        </div>

        <div className="lesson-message" role="status" aria-live="polite">
          <span className="lesson-icon" aria-hidden="true">◎</span>
          <div>
            <strong>{cameraMode === 'top' ? '你正在從天空往下看' : '轉轉看這座山 👆'}</strong>
            <p>{educationText}</p>
          </div>
        </div>

        <ControlsPanel
          preset={preset}
          onPresetChange={(nextPreset) => {
            setPreset(nextPreset)
            setSelectedLevel(null)
          }}
          interval={interval}
          onIntervalChange={setInterval}
          contourLevels={contourLevels}
          selectedLevel={selectedLevel}
          onSelectedLevelChange={setSelectedLevel}
          contoursOnly={contoursOnly}
          onContoursOnlyChange={setContoursOnly}
          onViewChange={requestView}
        />
      </section>
    </main>
  )
}
