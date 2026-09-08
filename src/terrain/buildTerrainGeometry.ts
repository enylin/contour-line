import * as THREE from 'three'
import { WORLD_HEIGHT_DIVISOR } from './presets'
import type { HeightField } from './types'

export const buildTerrainGeometry = (field: HeightField) => {
  const { size, minX, maxX, minZ, maxZ, heights } = field
  const positions = new Float32Array(size * size * 3)
  const indices: number[] = []

  for (let row = 0; row < size; row += 1) {
    const z = minZ + (row / (size - 1)) * (maxZ - minZ)

    for (let col = 0; col < size; col += 1) {
      const x = minX + (col / (size - 1)) * (maxX - minX)
      const index = row * size + col
      const positionIndex = index * 3

      positions[positionIndex] = x
      positions[positionIndex + 1] = heights[index] / WORLD_HEIGHT_DIVISOR
      positions[positionIndex + 2] = z
    }
  }

  for (let row = 0; row < size - 1; row += 1) {
    for (let col = 0; col < size - 1; col += 1) {
      const topLeft = row * size + col
      const topRight = topLeft + 1
      const bottomLeft = (row + 1) * size + col
      const bottomRight = bottomLeft + 1

      indices.push(topLeft, bottomLeft, topRight)
      indices.push(topRight, bottomLeft, bottomRight)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()

  return geometry
}
