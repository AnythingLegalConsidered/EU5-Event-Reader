type TimelineControlsProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  orientation: 'horizontal' | 'vertical';
  onOrientationToggle: () => void;
  dateRange: { min?: number; max?: number };
  onResetZoom: () => void;
};

export const TimelineControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  orientation,
  onOrientationToggle,
  dateRange,
  onResetZoom
}: TimelineControlsProps) => {
  return (
    <div className="timeline-controls">
      <div className="timeline-zoom">
        <button className="timeline-zoom-btn" type="button" onClick={onZoomOut} aria-label="Zoom out">
          −
        </button>
        <span className="timeline-zoom-value">{zoom.toFixed(1)}x</span>
        <button className="timeline-zoom-btn" type="button" onClick={onZoomIn} aria-label="Zoom in">
          +
        </button>
        <button className="timeline-zoom-btn" type="button" onClick={onResetZoom} aria-label="Reset zoom">
          Reset
        </button>
      </div>
      <div className="timeline-meta">
        <button className="timeline-zoom-btn" type="button" onClick={onOrientationToggle} aria-label="Toggle orientation">
          {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
        </button>
        <span className="timeline-date-range">
          {dateRange.min ?? '–'} — {dateRange.max ?? '–'}
        </span>
      </div>
    </div>
  );
};

export default TimelineControls;
