import { describe, expect, it } from 'vitest'
import { createExamQuestions, EXAM_LENGTH } from './exam'
import { TERRAIN_PRESETS } from './presets'

describe('exam question generator', () => {
  it('creates ten four-choice questions with unique options and the answer included', () => {
    let state = 0x12345678
    const random = () => {
      state = (1664525 * state + 1013904223) >>> 0
      return state / 0x100000000
    }

    const questions = createExamQuestions('all', EXAM_LENGTH, random)
    expect(questions).toHaveLength(10)

    for (const question of questions) {
      expect(question.options).toHaveLength(4)
      expect(new Set(question.options).size).toBe(4)
      expect(question.options).toContain(question.answer)
    }
  })

  it('mixes contour-to-terrain and terrain-to-contour questions evenly', () => {
    let state = 0x2468ace0
    const random = () => {
      state = (1664525 * state + 1013904223) >>> 0
      return state / 0x100000000
    }

    const questions = createExamQuestions('all', EXAM_LENGTH, random)
    const contourToTerrain = questions.filter((question) => question.type === 'contour-to-terrain')
    const terrainToContour = questions.filter((question) => question.type === 'terrain-to-contour')

    expect(contourToTerrain.length).toBeGreaterThan(0)
    expect(terrainToContour.length).toBeGreaterThan(0)
    expect(Math.abs(contourToTerrain.length - terrainToContour.length)).toBeLessThanOrEqual(1)
  })

  it('keeps category-specific exams inside the requested category', () => {
    const basicIds = new Set(
      TERRAIN_PRESETS.filter((preset) => preset.category === 'basic').map((preset) => preset.id),
    )
    const questions = createExamQuestions('basic', 8, () => 0.41)

    expect(questions).toHaveLength(8)
    for (const question of questions) {
      expect(basicIds.has(question.answer)).toBe(true)
      expect(question.options.every((option) => basicIds.has(option))).toBe(true)
    }
  })

  it('avoids putting visually ambiguous sibling terrains in the same question', () => {
    let state = 0xabcdef01
    const random = () => {
      state = (1103515245 * state + 12345) >>> 0
      return state / 0x100000000
    }
    const questions = createExamQuestions('advanced', 10, random)
    const presetById = new Map(TERRAIN_PRESETS.map((preset) => [preset.id, preset]))

    expect(questions).toHaveLength(10)
    for (const question of questions) {
      const answer = presetById.get(question.answer)
      if (!answer?.examGroup) continue
      const siblings = question.options
        .map((option) => presetById.get(option))
        .filter((option) => option?.id !== answer.id && option?.examGroup === answer.examGroup)
      expect(siblings).toHaveLength(0)
    }
  })
})
