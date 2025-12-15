type ErrorMessageProps = {
  message: string;
  onRetry?: () => void;
};

const ErrorMessage = ({ message, onRetry }: ErrorMessageProps) => (
  <div className="error-card" role="alert">
    <div>
      <strong>Error:</strong> {message}
    </div>
    {onRetry && (
      <button className="btn" type="button" onClick={onRetry}>
        Retry
      </button>
    )}
  </div>
);

export default ErrorMessage;
