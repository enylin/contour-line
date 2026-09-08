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
  return (
    <section className="controls" aria-label="地形控制">
      <div className="control-group terrain-control">
        <span className="control-label">地形</span>
        <div className="segmented" role="group" aria-label="選擇地形">
          {TERRAIN_PRESETS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={preset === item.id ? 'active' : ''}
              aria-pressed={preset === item.id}
              onClick={() => onPresetChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-row">
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
            <small>讓山體變透明</small>
          </span>
          <input
            type="checkbox"
            checked={contoursOnly}
            onChange={(event) => onContoursOnlyChange(event.target.checked)}
          />
          <span className="switch" aria-hidden="true" />
        </label>
      </div>

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
          onChange={(event) => onIntervalChange(Number(event.target.value))
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
    </section>
  )
}
