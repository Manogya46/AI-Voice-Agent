function LoadingIndicator({ message = 'Loading...' }) {
  return (
    <div className="loading-bar" style={{ marginTop: '14px' }}>
      <span className="spinner" aria-label="loading indicator" />
      <span>{message}</span>
    </div>
  );
}

export { LoadingIndicator };
