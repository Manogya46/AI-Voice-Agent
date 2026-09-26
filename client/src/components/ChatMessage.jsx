function ChatMessage({ role, content }) {
  return <div className={`chat-message ${role}`}>{content}</div>;
}

export { ChatMessage };
