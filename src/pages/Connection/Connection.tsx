import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { axiosInstance } from '../../services/axiosInstance';

interface Message {
  from: string;
  msg: string;
}

const Connection: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement | null>(null);

  // Fetch messages on mount

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    try {
       await axiosInstance.post(
    "connection", { msg: trimmed });
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div>
      <div
        ref={chatRef}
        style={{
          height: '300px',
          overflowY: 'scroll',
          border: '1px solid #ccc',
          padding: '10px',
          marginBottom: '10px',
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`msg ${msg.from.toLowerCase()}`}>
            <strong>{msg.from}:</strong> {msg.msg}
          </div>
        ))}
      </div>
      <input
        type="msg"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Connection;
