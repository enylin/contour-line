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
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 0, mode: 'threeD' })
  const [cameraMode, setCameraMode] = useState<CameraCommand['mode']>('threeD')

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

  const requestView = useCallback((mode: CameraCommand['mode']) => {
    setCameraCommand((current) => ({ id: current.id + 1, mode }))
  }, [])

  const handleViewSettled = useCallback((mode: CameraCommand['mode']) => {
    setCameraMode(mode)
  }, [])

  const educationText = activeSelectedLevel !== null
    ? `這條線上的每一個地方都是 ${activeSelectedLevel} 公尺高`
    : cameraMode === 'top' && preset === 'river'
      ? '河流穿過的地方會把等高線彎成 V 字，V 尖通常朝向較高的上游'
      : cameraMode === 'top' && preset === 'asymmetric'
        ? '比較左右兩側：等高線越密的那一側，山坡越陡'
        : cameraMode === 'top'
          ? '從正上方看，山上的線就變成等高線地圖了！'
          : preset === 'river'
            ? '沿著藍色河流看看，山谷如何被切出一條凹下去的通道'
            : preset === 'asymmetric'
              ? '這座山一邊陡、一邊緩，轉到天空視角會更明顯'
              : '每一條線都連接相同高度的地方'

  return (
    <main className="app-shell">
      <header className="hero-copy">
        <p className="eyebrow">互動地理小教室</p>
        <h1>等高線小實驗室</h1>
        <p>轉動山丘，看看地圖上的一圈圈線是怎麼來的</p>
      </header>

      <section className="experience-card" aria-label="互動式三維地形">
        <div className="experience-stage">
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

            <div className="canvas-hint" aria-hidden="true">
              <span>↔</span> 拖曳旋轉 · 滾輪或雙指縮放
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
            selectedLevel={activeSelectedLevel}
            onSelectedLevelChange={setSelectedLevel}
            contoursOnly={contoursOnly}
            onContoursOnlyChange={setContoursOnly}
            onViewChange={requestView}
          />
        </div>

        <div className="lesson-message" role="status" aria-live="polite">
          <span className="lesson-icon" aria-hidden="true">◎</span>
          <div>
            <strong>{cameraMode === 'top' ? '你正在從天空往下看' : '轉轉看這個地形 👆'}</strong>
            <p>{educationText}</p>
          </div>
        </div>
      </section>
    </main>
  )
}
