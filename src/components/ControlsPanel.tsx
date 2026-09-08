import { useState } from 'react'
import { TERRAIN_CATEGORIES, TERRAIN_PRESETS } from '../terrain/presets'
import type { ExamScope } from '../terrain/exam'
import type { TerrainCategory, TerrainPresetId } from '../terrain/types'

type ControlsPanelProps = {
  open: boolean
  preset: TerrainPresetId
  onPresetChange: (preset: TerrainPresetId) => void
  interval: number
  onIntervalChange: (interval: number) => void
  contourLevels: number[]
  selectedLevel: number | null
  onSelectedLevelChange: (level: number | null) => void
  contoursOnly: boolean
  onContoursOnlyChange: (value: boolean) => void
  onViewChange: (mode: 'threeD' | 'top') => void
  examMode: boolean
  examProgress: number
  examTotal: number
  examScore: number
  onStartExam: (scope: ExamScope) => void
  onExitExam: () => void
}

const examScopes: Array<{ id: ExamScope; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'basic', label: '基本' },
  { id: 'advanced', label: '進階' },
  { id: 'irregular', label: '不規則' },
]

const initialExpandedCategories: Record<TerrainCategory, boolean> = {
  basic: true,
  advanced: false,
  irregular: false,
}

export function ControlsPanel({
  open,
  preset,
  onPresetChange,
  interval,
  onIntervalChange,
  contourLevels,
  selectedLevel,
  onSelectedLevelChange,
  contoursOnly,
  onContoursOnlyChange,
  onViewChange,
  examMode,
  examProgress,
  examTotal,
  examScore,
  onStartExam,
  onExitExam,
}: ControlsPanelProps) {
  const [examScope, setExamScope] = useState<ExamScope>('all')
  const [expandedCategories, setExpandedCategories] = useState(initialExpandedCategories)

  const setCategoryExpanded = (category: TerrainCategory, expanded: boolean) => {
    setExpandedCategories((current) => {
      if (current[category] === expanded) return current
      return { ...current, [category]: expanded }
    })
  }

  return (
    <aside
      className={`controls-sidebar ${open ? 'open' : ''}`}
      aria-label="地形設定側邊欄"
      aria-hidden={!open}
      inert={!open}
    >
      <div className="controls" id="terrain-controls">
        <div className="sidebar-title">
          <strong>{examMode ? '考試模式' : '設定'}</strong>
          <small>{examMode ? '兩種題型交錯，練習 3D 與等高線互相判讀' : '探索 30 種地形與等高線'}</small>
        </div>

        {examMode ? (
          <div className="exam-sidebar-card">
            <span className="control-label">目前進度</span>
            <strong>{Math.min(examProgress + 1, examTotal)} / {examTotal} 題</strong>
            <small>目前答對 {examScore} 題</small>
            <button type="button" className="danger-action" onClick={onExitExam}>結束考試</button>
          </div>
        ) : (
          <>
            <div className="exam-launch-card">
              <div>
                <span className="control-label">考試模式</span>
                <strong>兩種看圖四選一</strong>
                <small>10 題會交錯出現「等高線 → 3D」與「可旋轉 3D → 等高線」。</small>
              </div>
              <div className="exam-type-summary" aria-label="考試題型說明">
                <span><b>①</b> 看等高線，選正確的斜上方 3D 地形</span>
                <span><b>②</b> 自由轉動 3D 地形，選正確的等高線圖</span>
              </div>
              <div className="exam-scope-options" role="group" aria-label="考試範圍">
                {examScopes.map((scope) => (
                  <button
                    type="button"
                    key={scope.id}
                    className={examScope === scope.id ? 'active' : ''}
                    aria-pressed={examScope === scope.id}
                    onClick={() => setExamScope(scope.id)}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
              <button type="button" className="primary-action wide" onClick={() => onStartExam(examScope)}>
                開始考試
              </button>
            </div>

            <div className="control-group terrain-control">
              <span className="control-label">地形</span>
              <div className="terrain-groups">
                {TERRAIN_CATEGORIES.map((category) => {
                  const items = TERRAIN_PRESETS.filter((item) => item.category === category.id)
                  return (
                    <details
                      key={category.id}
                      className="terrain-group"
                      open={expandedCategories[category.id]}
                      onToggle={(event) => setCategoryExpanded(category.id, event.currentTarget.open)}
                    >
                      <summary>
                        <span>
                          <strong>{category.label}</strong>
                          <small>{category.description}</small>
                        </span>
                        <span className="terrain-count">{items.length}</span>
                      </summary>
                      <div className="terrain-options" role="group" aria-label={category.label}>
                        {items.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            className={`terrain-option ${preset === item.id ? 'active' : ''}`}
                            aria-pressed={preset === item.id}
                            onClick={() => onPresetChange(item.id)}
                          >
                            <span className="terrain-icon" aria-hidden="true">{item.icon}</span>
                            <span className="terrain-copy">
                              <strong>{item.label}</strong>
                              <small>{item.description}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    </details>
                  )
                })}
              </div>
            </div>

            <div className="control-group view-control">
              <span className="control-label">視角</span>
              <div className="button-row">
                <button type="button" className="view-button" onClick={() => onViewChange('threeD')}>
                  <span aria-hidden="true">🏔️</span> 3D 看山
                </button>
                <button type="button" className="view-button accent" onClick={() => onViewChange('top')}>
                  <span aria-hidden="true">🛰️</span> 從天空看
                </button>
              </div>
            </div>

            <label className="toggle-control">
              <span>
                <strong>只看等高線</strong>
                <small>讓山體變透明，更像地形圖</small>
              </span>
              <input
                type="checkbox"
                checked={contoursOnly}
                onChange={(event) => onContoursOnlyChange(event.target.checked)}
              />
              <span className="switch" aria-hidden="true" />
            </label>

            <div className="interval-control">
              <div className="interval-heading">
                <label htmlFor="contour-interval">等高距</label>
                <output htmlFor="contour-interval">{interval} m</output>
              </div>
              <input
                id="contour-interval"
                type="range"
                min="25"
                max="100"
                step="25"
                value={interval}
                onChange={(event) => onIntervalChange(Number(event.target.value))}
              />
              <div className="range-labels" aria-hidden="true">
                <span>25m</span><span>50m</span><span>75m</span><span>100m</span>
              </div>
            </div>

            <div className="level-control">
              <span className="control-label">選一條線看看</span>
              <div className="level-chips" role="group" aria-label="選擇等高線高度">
                {contourLevels.map((level) => (
                  <button
                    type="button"
                    key={level}
                    className={selectedLevel === level ? 'selected' : ''}
                    aria-pressed={selectedLevel === level}
                    onClick={() => onSelectedLevelChange(selectedLevel === level ? null : level)}
                  >
                    {level}m
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
