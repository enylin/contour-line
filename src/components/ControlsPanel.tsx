import { useState } from 'react'
import { TERRAIN_PRESETS } from '../terrain/presets'
import type { TerrainPresetId } from '../terrain/types'

type ControlsPanelProps = {
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
}

export function ControlsPanel({
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
}: ControlsPanelProps) {
  const [open, setOpen] = useState(true)

  return (
    <aside className={`controls-sidebar ${open ? 'open' : 'collapsed'}`} aria-label="地形設定側邊欄">
      <div className="sidebar-header">
        {open && (
          <div>
            <strong>探索設定</strong>
            <small>換個地形，再從天空看看</small>
          </div>
        )}
        <button
          type="button"
          className="sidebar-toggle"
          aria-expanded={open}
          aria-controls="terrain-controls"
          aria-label={open ? '收合設定側邊欄' : '開啟設定側邊欄'}
          onClick={() => setOpen((current) => !current)}
        >
          <span aria-hidden="true">{open ? '›' : '‹'}</span>
          {!open && <span className="collapsed-label">設定</span>}
        </button>
      </div>

      {open && (
        <div className="controls" id="terrain-controls">
          <div className="control-group terrain-control">
            <span className="control-label">地形</span>
            <div className="terrain-options" role="group" aria-label="選擇地形">
              {TERRAIN_PRESETS.map((item) => (
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
        </div>
      )}
    </aside>
  )
}
