function MessageInput({
  value,
  onChange,
  placeholder = 'Type your message...',
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label="Message input"
    />
  );
}

export { MessageInput };
