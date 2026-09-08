import { CameraControls, CameraControlsImpl, OrthographicCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useCallback, useEffect, useRef, type ComponentRef } from 'react'

export type CameraCommand = {
  id: number
  mode: 'threeD' | 'top'
}

type CameraRigProps = {
  command: CameraCommand
  onViewSettled: (mode: CameraCommand['mode']) => void
  interactionEnabled?: boolean
}

const MIN_HALF_HEIGHT = 8.15
const MIN_HALF_WIDTH = 9.1
const TOP_VIEW_THRESHOLD = 0.03
const ACTION = CameraControlsImpl.ACTION

const MOUSE_BUTTONS = {
  left: ACTION.ROTATE,
  middle: ACTION.ZOOM,
  right: ACTION.NONE,
  wheel: ACTION.ZOOM,
}

const TOUCHES = {
  one: ACTION.TOUCH_ROTATE,
  two: ACTION.TOUCH_ZOOM,
  three: ACTION.NONE,
}

export function CameraRig({
  command,
  onViewSettled,
  interactionEnabled = true,
}: CameraRigProps) {
  const controlsRef = useRef<ComponentRef<typeof CameraControls>>(null)
  const initialized = useRef(false)
  const size = useThree((state) => state.size)
  const aspect = size.height > 0 ? size.width / size.height : 1
  const halfHeight = Math.max(MIN_HALF_HEIGHT, MIN_HALF_WIDTH / aspect)
  const halfWidth = halfHeight * aspect

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const animated = initialized.current
    initialized.current = true

    if (command.mode === 'top') {
      void controls.setLookAt(0, 13, 0.01, 0, 1.55, 0, animated)
    } else {
      void controls.setLookAt(9, 7.8, 9, 0, 1.55, 0, animated)
    }
  }, [command.id, command.mode])

  const handleRest = useCallback(() => {
    const controls = controlsRef.current
    if (!controls) return
    onViewSettled(controls.polarAngle <= TOP_VIEW_THRESHOLD ? 'top' : 'threeD')
  }, [onViewSettled])

  return (
    <>
      <OrthographicCamera
        makeDefault
        manual
        position={[9, 7.8, 9]}
        left={-halfWidth}
        right={halfWidth}
        top={halfHeight}
        bottom={-halfHeight}
        zoom={1}
        near={0.1}
        far={100}
      />
      <CameraControls
        ref={controlsRef}
        makeDefault
        enabled={interactionEnabled}
        onRest={handleRest}
        minPolarAngle={0.0005}
        maxPolarAngle={Math.PI / 2 - 0.035}
        minZoom={0.72}
        maxZoom={3}
        smoothTime={0.55}
        draggingSmoothTime={0.08}
        mouseButtons={MOUSE_BUTTONS}
        touches={TOUCHES}
      />
    </>
  )
}
