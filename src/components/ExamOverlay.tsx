import { getTerrainPreset } from '../terrain/presets'
import type { ExamQuestion, ExamScope } from '../terrain/exam'
import type { TerrainPresetId } from '../terrain/types'

type ExamOverlayProps = {
  question: ExamQuestion | null
  questionIndex: number
  totalQuestions: number
  score: number
  selectedAnswer: TerrainPresetId | null
  finished: boolean
  scope: ExamScope
  onAnswer: (answer: TerrainPresetId) => void
  onNext: () => void
  onRestart: () => void
  onExit: () => void
}

const scopeLabel: Record<ExamScope, string> = {
  all: '全部地形',
  basic: '基本地形',
  advanced: '進階地形',
  irregular: '不規則地形',
}

export function ExamOverlay({
  question,
  questionIndex,
  totalQuestions,
  score,
  selectedAnswer,
  finished,
  scope,
  onAnswer,
  onNext,
  onRestart,
  onExit,
}: ExamOverlayProps) {
  if (finished) {
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
    return (
      <section className="exam-result-card" aria-live="polite">
        <span className="exam-kicker">考試完成</span>
        <strong className="exam-score">{score} / {totalQuestions}</strong>
        <p>{percentage >= 80 ? '很棒！你已經很會從等高線判讀地形了。' : '再玩幾次 3D 地形，再回來挑戰一次吧。'}</p>
        <div className="exam-result-actions">
          <button type="button" className="primary-action" onClick={onRestart}>再考一次</button>
          <button type="button" className="secondary-action" onClick={onExit}>回探索模式</button>
        </div>
      </section>
    )
  }

  if (!question) return null

  const answered = selectedAnswer !== null
  const correct = selectedAnswer === question.answer
  const correctPreset = getTerrainPreset(question.answer)

  return (
    <section className={`exam-card ${answered ? 'answered' : ''}`} aria-live="polite">
      <div className="exam-heading">
        <div>
          <span className="exam-kicker">{scopeLabel[scope]} · 第 {questionIndex + 1} / {totalQuestions} 題</span>
          <strong>{answered ? (correct ? '答對了！' : `答案是「${correctPreset.label}」`) : '這張等高線圖是哪一種地形？'}</strong>
        </div>
        <span className="exam-live-score">{score} 分</span>
      </div>

      <div className="exam-options" role="group" aria-label="答案選項">
        {question.options.map((optionId, optionIndex) => {
          const option = getTerrainPreset(optionId)
          const isCorrect = optionId === question.answer
          const isSelected = optionId === selectedAnswer
          const classNames = [
            'exam-option',
            answered && isCorrect ? 'correct' : '',
            answered && isSelected && !isCorrect ? 'wrong' : '',
          ].filter(Boolean).join(' ')

          return (
            <button
              type="button"
              key={optionId}
              className={classNames}
              disabled={answered}
              onClick={() => onAnswer(optionId)}
            >
              <span className="exam-option-letter">{String.fromCharCode(65 + optionIndex)}</span>
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="exam-feedback">
          <span>{correct ? '✓ 現在把地形立起來看看。' : '仔細比較等高線的形狀和疏密，再看 3D 解答。'}</span>
          <button type="button" className="primary-action" onClick={onNext}>
            {questionIndex + 1 >= totalQuestions ? '看成績' : '下一題'}
          </button>
        </div>
      )}
    </section>
  )
}
