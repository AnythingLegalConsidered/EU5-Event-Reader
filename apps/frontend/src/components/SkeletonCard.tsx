type SkeletonCardProps = {
  count?: number;
};

const SkeletonCard = ({ count = 1 }: SkeletonCardProps) => {
  return (
    <div className="skeleton-stack" aria-label="Loading skeletons">
      {Array.from({ length: count }).map((_, idx) => (
        <div className="skeleton-card" key={idx}>
          <div className="skeleton-line w-30" />
          <div className="skeleton-line w-70" />
          <div className="skeleton-line w-50" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonCard;
