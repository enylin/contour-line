import { CameraControls } from '@react-three/drei'
import { useEffect, useRef, type ComponentRef } from 'react'

export type CameraCommand = {
  id: number
  mode: 'threeD' | 'top'
}

type CameraRigProps = {
  command: CameraCommand
  onTransitionComplete: (mode: CameraCommand['mode']) => void
}

export function CameraRig({ command, onTransitionComplete }: CameraRigProps) {
  const controlsRef = useRef<ComponentRef<typeof CameraControls>>(null)
  const initialized = useRef(false)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const move = async () => {
      if (command.mode === 'top') {
        await controls.setLookAt(0.001, 12, 0.01, 0, 0.7, 0, true)
      } else {
        await controls.setLookAt(8, 7, 8, 0, 1.65, 0, initialized.current)
      }
      initialized.current = true
      onTransitionComplete(command.mode)
    }

    void move()
  }, [command.id, command.mode, onTransitionComplete])

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minPolarAngle={0.015}
      maxPolarAngle={Math.PI / 2 - 0.035}
      minZoom={34}
      maxZoom={105}
      smoothTime={0.55}
      draggingSmoothTime={0.08}
    />
  )
}
