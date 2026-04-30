import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../../apiBase';
import './GitChat.css';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const GitChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'model', text: 'Hello! I am ✨ GitChat, your AI assistant. Ask me anything!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // We are using window.location.pathname as a fallback in case useLocation fails if not in Router,
  // but it should be in Router based on main.jsx
  const location = useLocation();

  const getUserId = () => localStorage.getItem("userId");
  const getRepoId = () => {
    const path = location.pathname;
    if (path.startsWith("/repo/")) {
      const parts = path.split("/");
      return parts[2]; // /repo/:id/...
    }
    return null;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const userId = getUserId();
      if (!userId) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/ai/chat/history/${userId}`);
        const data = await response.json();
        if (data.success && data.history && data.history.length > 0) {
          setMessages(data.history);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
    };

    fetchHistory();
  }, []); // Run once on mount

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userId = getUserId();
    if (!userId) {
      setMessages(prev => [...prev, { sender: 'model', text: 'Please log in to use GitChat.' }]);
      return;
    }

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const repoId = getRepoId();

      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.text, 
          userId,
          repoId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { sender: 'model', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { sender: 'model', text: 'Sorry, I encountered an error.' }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'model', text: 'Network error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gitchat-container">
      {!isOpen && (
        <button className="gitchat-toggle-btn" onClick={toggleChat}>
          ✨ GitChat
        </button>
      )}

      {isOpen && (
        <div className={`gitchat-window ${isFullScreen ? 'fullscreen' : ''}`}>
          <div className="gitchat-header">
            <h3>✨ GitChat AI</h3>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button className="gitchat-close-btn" onClick={() => setIsFullScreen(!isFullScreen)} title="Toggle Fullscreen" style={{ fontSize: "14px" }}>
                {isFullScreen ? "🗗" : "🗖"}
              </button>
              <button className="gitchat-close-btn" onClick={toggleChat} title="Close">✖</button>
            </div>
          </div>
          
          <div className="gitchat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`gitchat-msg-wrapper ${msg.sender}`}>
                <div className="gitchat-msg-bubble">
                  {msg.sender === 'model' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="gitchat-msg-wrapper model">
                <div className="gitchat-msg-bubble loading">...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="gitchat-input-area">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitChat;
