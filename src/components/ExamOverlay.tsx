import { ContourMapPreview } from './ContourMapPreview'
import { TerrainPreview } from './TerrainPreview'
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
        <p>{percentage >= 80 ? '很棒！你已經很會在 3D 地形和等高線之間互相判讀了。' : '再玩幾次 3D 地形，再回來挑戰一次吧。'}</p>
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
  const contourToTerrain = question.type === 'contour-to-terrain'
  const prompt = contourToTerrain
    ? '上方的等高線圖，對應哪一個 3D 地形？'
    : '轉動上方的 3D 地形，找出正確的等高線圖。'
  const revealHint = contourToTerrain
    ? '現在把真正的地形立起來，比較你剛才看到的等高線。'
    : '現在切到正上方，看看正確的等高線怎麼包住這個地形。'

  return (
    <section className={`exam-card visual-exam ${answered ? 'answered' : ''}`} aria-live="polite">
      <div className="exam-heading">
        <div>
          <span className="exam-kicker">
            {scopeLabel[scope]} · 第 {questionIndex + 1} / {totalQuestions} 題 · {contourToTerrain ? '等高線 → 3D' : '3D → 等高線'}
          </span>
          <strong>{answered ? (correct ? '答對了！' : `正確答案是「${correctPreset.label}」`) : prompt}</strong>
        </div>
        <span className="exam-live-score">{score} 分</span>
      </div>

      {!answered && !contourToTerrain && (
        <p className="exam-interaction-hint">↔ 可以拖曳旋轉上方地形，也可以滾輪或雙指縮放。</p>
      )}

      <div className="exam-options visual" role="group" aria-label="答案選項">
        {question.options.map((optionId, optionIndex) => {
          const option = getTerrainPreset(optionId)
          const isCorrect = optionId === question.answer
          const isSelected = optionId === selectedAnswer
          const letter = String.fromCharCode(65 + optionIndex)
          const classNames = [
            'exam-option',
            'visual',
            answered && isCorrect ? 'correct' : '',
            answered && isSelected && !isCorrect ? 'wrong' : '',
          ].filter(Boolean).join(' ')

          return (
            <button
              type="button"
              key={optionId}
              className={classNames}
              disabled={answered}
              aria-label={answered ? `選項 ${letter}，${option.label}` : `選項 ${letter}`}
              onClick={() => onAnswer(optionId)}
            >
              <span className="exam-option-letter">{letter}</span>
              <div className="exam-option-preview">
                {contourToTerrain
                  ? <TerrainPreview preset={optionId} />
                  : <ContourMapPreview preset={optionId} />}
              </div>
              <span className="exam-option-name">{answered ? option.label : `選項 ${letter}`}</span>
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="exam-feedback">
          <span>{correct ? `✓ ${revealHint}` : revealHint}</span>
          <button type="button" className="primary-action" onClick={onNext}>
            {questionIndex + 1 >= totalQuestions ? '看成績' : '下一題'}
          </button>
        </div>
      )}
    </section>
  )
}
