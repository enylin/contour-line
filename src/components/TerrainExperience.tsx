import { Canvas } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { CameraRig, type CameraCommand } from './CameraRig'
import { ContourLines } from './ContourLines'
import { ControlsPanel } from './ControlsPanel'
import { ExamOverlay } from './ExamOverlay'
import { TerrainFeatures } from './TerrainFeatures'
import { TerrainMesh } from './TerrainMesh'
import './experienceEnhancements.css'
import { buildContours } from '../terrain/contourUtils'
import { createExamQuestions, type ExamQuestion, type ExamScope } from '../terrain/exam'
import { sampleHeightField } from '../terrain/sampleHeightField'
import type { TerrainPresetId } from '../terrain/types'

export function TerrainExperience() {
  const [preset, setPreset] = useState<TerrainPresetId>('standard')
  const [interval, setInterval] = useState(50)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [contoursOnly, setContoursOnly] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ id: 0, mode: 'threeD' })

  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([])
  const [examIndex, setExamIndex] = useState(0)
  const [examSelectedAnswer, setExamSelectedAnswer] = useState<TerrainPresetId | null>(null)
  const [examScore, setExamScore] = useState(0)
  const [examScope, setExamScope] = useState<ExamScope>('all')

  const examMode = examQuestions.length > 0
  const examFinished = examMode && examIndex >= examQuestions.length
  const currentQuestion = examFinished ? null : examQuestions[examIndex] ?? null
  const examRevealed = examSelectedAnswer !== null

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

  const presentExamQuestion = useCallback((question: ExamQuestion) => {
    setSelectedLevel(null)
    setPreset(question.answer)

    if (question.type === 'contour-to-terrain') {
      setContoursOnly(true)
      requestView('top')
    } else {
      setContoursOnly(false)
      requestView('threeD')
    }
  }, [requestView])

  const startExam = useCallback((scope: ExamScope) => {
    const questions = createExamQuestions(scope)
    if (questions.length === 0) return

    setExamScope(scope)
    setExamQuestions(questions)
    setExamIndex(0)
    setExamScore(0)
    setExamSelectedAnswer(null)
    setInterval(50)
    setSidebarOpen(false)
    presentExamQuestion(questions[0])
  }, [presentExamQuestion])

  const exitExam = useCallback(() => {
    setExamQuestions([])
    setExamIndex(0)
    setExamScore(0)
    setExamSelectedAnswer(null)
    setContoursOnly(false)
    setSelectedLevel(null)
    setSidebarOpen(false)
    requestView('threeD')
  }, [requestView])

  const answerExamQuestion = useCallback((answer: TerrainPresetId) => {
    if (!currentQuestion || examSelectedAnswer !== null) return

    setExamSelectedAnswer(answer)
    if (answer === currentQuestion.answer) {
      setExamScore((score) => score + 1)
    }

    if (currentQuestion.type === 'contour-to-terrain') {
      setContoursOnly(false)
      requestView('threeD')
    } else {
      setContoursOnly(true)
      requestView('top')
    }
  }, [currentQuestion, examSelectedAnswer, requestView])

  const nextExamQuestion = useCallback(() => {
    if (!currentQuestion || examSelectedAnswer === null) return

    const nextIndex = examIndex + 1
    if (nextIndex >= examQuestions.length) {
      setExamIndex(nextIndex)
      setExamSelectedAnswer(null)
      setContoursOnly(false)
      return
    }

    const nextQuestion = examQuestions[nextIndex]
    setExamIndex(nextIndex)
    setExamSelectedAnswer(null)
    presentExamQuestion(nextQuestion)
  }, [currentQuestion, examIndex, examQuestions, examSelectedAnswer, presentExamQuestion])

  const unansweredExamQuestion = examMode && !examFinished && !examRevealed
  const hideTerrainForQuestion =
    unansweredExamQuestion && currentQuestion?.type === 'contour-to-terrain'
  const hideContoursForQuestion =
    unansweredExamQuestion && currentQuestion?.type === 'terrain-to-contour'
  const allowCameraInteraction =
    !examMode || examFinished || examRevealed || currentQuestion?.type === 'terrain-to-contour'

  return (
    <main
      className={`fullscreen-experience ${sidebarOpen ? 'sidebar-open' : ''} ${examMode ? 'exam-mode' : ''}`}
      aria-label="互動式三維等高線地形"
    >
      <div className="canvas-wrap">
        <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true }}>
          <color attach="background" args={['#eef2e9']} />
          <fog attach="fog" args={['#eef2e9', 18, 34]} />
          <CameraRig
            command={cameraCommand}
            onViewSettled={handleViewSettled}
            interactionEnabled={allowCameraInteraction}
          />

          <hemisphereLight intensity={1.55} color="#fff8e9" groundColor="#61745c" />
          <directionalLight
            castShadow
            position={[7, 12, 6]}
            intensity={2.1}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-9}
            shadow-camera-right={9}
            shadow-camera-top={9}
            shadow-camera-bottom={-9}
          />

          <Suspense fallback={null}>
            <TerrainMesh
              field={field}
              contoursOnly={contoursOnly}
              hidden={hideTerrainForQuestion}
            />
            {!hideContoursForQuestion && (
              <ContourLines contours={contours} selectedLevel={activeSelectedLevel} />
            )}
            <TerrainFeatures
              preset={preset}
              contoursOnly={contoursOnly}
              hidden={hideTerrainForQuestion}
            />
          </Suspense>

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]} receiveShadow>
            <planeGeometry args={[16, 16]} />
            <meshStandardMaterial color="#d9dfd2" roughness={1} />
          </mesh>
        </Canvas>
      </div>

      {examMode && (
        <ExamOverlay
          question={currentQuestion}
          questionIndex={examIndex}
          totalQuestions={examQuestions.length}
          score={examScore}
          selectedAnswer={examSelectedAnswer}
          finished={examFinished}
          scope={examScope}
          onAnswer={answerExamQuestion}
          onNext={nextExamQuestion}
          onRestart={() => startExam(examScope)}
          onExit={exitExam}
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
        examMode={examMode}
        examProgress={examIndex}
        examTotal={examQuestions.length}
        examScore={examScore}
        onStartExam={startExam}
        onExitExam={exitExam}
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
