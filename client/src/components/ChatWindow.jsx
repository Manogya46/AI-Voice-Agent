import { ChatMessage } from './ChatMessage.jsx';

function ChatWindow({ messages = [] }) {
  return (
    <div className="chat-window">
      {messages.length === 0 ? (
        <p className="muted">
          No messages yet. Tell us what issue you are experiencing.
        </p>
      ) : (
        messages.map((message, index) => (
          <ChatMessage
            key={`${message.role}-${index}`}
            role={message.role}
            content={message.content}
          />
        ))
      )}
    </div>
  );
}

export { ChatWindow };
