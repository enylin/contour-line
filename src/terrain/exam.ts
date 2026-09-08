import { TERRAIN_PRESETS } from './presets'
import type { TerrainCategory, TerrainPresetId } from './types'

export type ExamScope = TerrainCategory | 'all'
export type ExamQuestionType = 'contour-to-terrain' | 'terrain-to-contour'

export type ExamQuestion = {
  type: ExamQuestionType
  answer: TerrainPresetId
  options: TerrainPresetId[]
}

export const EXAM_LENGTH = 10

const BASIC_EXAM_ANSWER_IDS = new Set<TerrainPresetId>([
  'standard',
  'asymmetric',
  'elongated',
  'plateau',
  'double',
  'triple',
  'offset-peak',
  'tall-small-pair',
  'four-hills',
])

const VISUAL_FAMILY: Partial<Record<TerrainPresetId, string>> = {
  standard: 'round-single',
  gentle: 'round-single',
  steep: 'round-single',
  cone: 'round-single',
  asymmetric: 'off-center-single',
  'offset-peak': 'off-center-single',
  ridge: 'ridge',
  'wavy-ridge': 'ridge',
  'broken-ridge': 'ridge',
  river: 'valley',
  'dry-valley': 'valley',
  canyon: 'valley',
  'u-valley': 'valley',
  'forked-valley': 'valley',
  'meander-valley': 'valley',
  crater: 'depression',
  basin: 'depression',
  plateau: 'flat-top',
  mesa: 'flat-top',
  'lopsided-plateau': 'flat-top',
  double: 'multi-peak',
  triple: 'multi-peak',
  'four-hills': 'multi-peak',
  'five-hills': 'multi-peak',
  'peak-cluster': 'multi-peak',
  'tall-small-pair': 'uneven-pair',
  'uneven-double': 'uneven-pair',
}

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

const createQuestionTypes = (count: number, random: () => number): ExamQuestionType[] => {
  const contourToTerrainCount = Math.ceil(count / 2)
  const types = Array.from({ length: count }, (_, index): ExamQuestionType =>
    index < contourToTerrainCount ? 'contour-to-terrain' : 'terrain-to-contour',
  )
  return shuffle(types, random)
}

const fillAnswers = <T,>(pool: T[], count: number, random: () => number): T[] => {
  const answers: T[] = []
  while (answers.length < count) {
    const cycle = shuffle(pool, random)
    for (const item of cycle) {
      answers.push(item)
      if (answers.length >= count) break
    }
  }
  return answers
}

export const getExamVisualFamily = (id: TerrainPresetId) => {
  const preset = TERRAIN_PRESETS.find((item) => item.id === id)
  return preset?.examGroup ?? VISUAL_FAMILY[id] ?? id
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

  const answerPool = eligible.filter(
    (preset) => preset.category !== 'basic' || BASIC_EXAM_ANSWER_IDS.has(preset.id),
  )

  if (answerPool.length < 4) {
    throw new Error('Exam answer pool requires at least four terrain presets')
  }

  const answers = fillAnswers(answerPool, count, random)
  const questionTypes = createQuestionTypes(answers.length, random)

  return answers.map((answer, questionIndex) => {
    const answerFamily = getExamVisualFamily(answer.id)
    const sameCategory = shuffle(
      eligible.filter((candidate) => candidate.id !== answer.id && candidate.category === answer.category),
      random,
    )
    const otherCategories = shuffle(
      eligible.filter((candidate) => candidate.id !== answer.id && candidate.category !== answer.category),
      random,
    )
    const distractorPool = [...sameCategory, ...otherCategories]
    const usedFamilies = new Set([answerFamily])
    const distractors: TerrainPresetId[] = []

    for (const candidate of distractorPool) {
      const candidateFamily = getExamVisualFamily(candidate.id)
      if (usedFamilies.has(candidateFamily)) continue
      usedFamilies.add(candidateFamily)
      distractors.push(candidate.id)
      if (distractors.length === 3) break
    }

    if (distractors.length < 3) {
      throw new Error(`Not enough visually distinct distractors for ${answer.id}`)
    }

    return {
      type: questionTypes[questionIndex],
      answer: answer.id,
      options: shuffle([answer.id, ...distractors], random),
    }
  })
}
