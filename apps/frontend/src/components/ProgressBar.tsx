type ProgressBarProps = {
  current: number;
  total: number;
  label?: string;
};

const ProgressBar = ({ current, total, label }: ProgressBarProps) => {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className="progress-wrapper" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default ProgressBar;
