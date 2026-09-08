import { TERRAIN_PRESETS } from './presets'
import type { TerrainCategory, TerrainPresetId } from './types'

export type ExamScope = TerrainCategory | 'all'

export type ExamQuestion = {
  answer: TerrainPresetId
  options: TerrainPresetId[]
}

export const EXAM_LENGTH = 10

const shuffle = <T,>(items: T[], random: () => number) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = current
  }
  return result
}

export const createExamQuestions = (
  scope: ExamScope = 'all',
  count = EXAM_LENGTH,
  random: () => number = Math.random,
): ExamQuestion[] => {
  const eligible = TERRAIN_PRESETS.filter(
    (preset) => preset.examEligible !== false && (scope === 'all' || preset.category === scope),
  )

  if (eligible.length < 4) {
    throw new Error('Exam requires at least four eligible terrain presets')
  }

  const answers = shuffle(eligible, random).slice(0, Math.min(count, eligible.length))

  return answers.map((answer) => {
    const isUsefulDistractor = (candidate: typeof answer) =>
      candidate.id !== answer.id &&
      (!answer.examGroup || !candidate.examGroup || candidate.examGroup !== answer.examGroup)

    const sameCategory = eligible.filter(
      (candidate) => isUsefulDistractor(candidate) && candidate.category === answer.category,
    )
    const otherCategories = eligible.filter(
      (candidate) => isUsefulDistractor(candidate) && candidate.category !== answer.category,
    )
    const distractorPool = [...shuffle(sameCategory, random), ...shuffle(otherCategories, random)]
    const distractors = distractorPool.slice(0, 3).map((preset) => preset.id)

    return {
      answer: answer.id,
      options: shuffle([answer.id, ...distractors], random),
    }
  })
}
