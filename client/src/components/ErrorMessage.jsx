function ErrorMessage({ message }) {
  return (
    <div
      style={{
        marginTop: '12px',
        color: '#b91c1c',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '10px',
        padding: '10px 12px',
      }}
    >
      {message}
    </div>
  );
}

export { ErrorMessage };
