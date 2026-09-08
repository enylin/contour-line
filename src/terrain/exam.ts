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
])

const VISUAL_FAMILY: Partial<Record<TerrainPresetId, string>> = {
  standard: 'round-single',
  gentle: 'round-single',
  steep: 'round-single',
  cone: 'round-single',
  plateau: 'round-single',
  asymmetric: 'off-center-single',
  'offset-peak': 'off-center-single',
  double: 'multi-peak',
  triple: 'multi-peak',
  ridge: 'elongated-highland',
  'wavy-ridge': 'elongated-highland',
  'broken-ridge': 'elongated-highland',
  river: 'valley',
  'dry-valley': 'valley',
  'meander-valley': 'valley',
  crater: 'depression',
  basin: 'depression',
  mesa: 'flat-top',
  'lopsided-plateau': 'flat-top',
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

export const getExamVisualFamily = (id: TerrainPresetId) => VISUAL_FAMILY[id] ?? id

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

  const answerPool = scope === 'basic'
    ? eligible.filter((preset) => BASIC_EXAM_ANSWER_IDS.has(preset.id))
    : eligible

  if (answerPool.length < 4) {
    throw new Error('Exam answer pool requires at least four terrain presets')
  }

  const answers = fillAnswers(answerPool, count, random)
  const questionTypes = createQuestionTypes(answers.length, random)

  return answers.map((answer, questionIndex) => {
    const answerFamily = answer.examGroup ?? getExamVisualFamily(answer.id)
    const isUsefulDistractor = (candidate: typeof answer) => {
      if (candidate.id === answer.id) return false
      const candidateFamily = candidate.examGroup ?? getExamVisualFamily(candidate.id)
      return candidateFamily !== answerFamily
    }

    const sameCategory = eligible.filter(
      (candidate) => isUsefulDistractor(candidate) && candidate.category === answer.category,
    )
    const otherCategories = eligible.filter(
      (candidate) => isUsefulDistractor(candidate) && candidate.category !== answer.category,
    )
    const distractorPool = [...shuffle(sameCategory, random), ...shuffle(otherCategories, random)]
    const distractors = distractorPool.slice(0, 3).map((preset) => preset.id)

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
