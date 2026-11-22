import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../../services/api.service';
import { useAuth } from '../../context/AuthContext';
import './Chatbot.css';

const Chatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: `Hi ${user?.name || 'there'}! I'm your AttendEase AI Assistant. You can ask me about your timetable, enrolled classes, or study materials!`, isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setIsLoading(true);

    try {
      const res = await chatService.sendMessage(userMessage);
      setMessages(prev => [...prev, { text: res.data.response || 'I am currently speechless. Please try again.', isBot: true }]);
    } catch (error) {
      console.error('Chat error:', error);
      const backendMsg = error.response?.data?.message;
      const statusText = error.response?.statusText;
      const errorMsg = backendMsg || (statusText ? `Server Error: ${statusText}` : 'Connection failed. Is the backend running?');
      setMessages(prev => [...prev, { text: errorMsg, isBot: true, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-wrapper fade-in-up delay-2">
      {!isOpen && (
        <button 
          className="chatbot-toggle hover-lift float-anim" 
          onClick={() => setIsOpen(true)}
        >
          <span className="sparkle-icon">✨</span> Ask AttendEase AI
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window glass-panel-dark fade-in">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <div className="bot-status-dot"></div>
              <div>
                <h4>AttendEase AI</h4>
                <p>Always Online</p>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-bubble-container ${msg.isBot ? 'bot' : 'user'}`}>
                {msg.isBot && <div className="chat-avatar bot-avatar">AI</div>}
                <div className={`chat-bubble ${msg.isBot ? 'bot-bubble' : 'user-bubble'} ${msg.isError ? 'error-bubble' : ''}`}>
                  {msg.text}
                  {msg.isError && (
                    <div className="error-hint">
                      Please check the server configuration or API key.
                    </div>
                  )}
                </div>
                {!msg.isBot && <div className="chat-avatar user-avatar">{user?.name?.charAt(0) || 'U'}</div>}
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble-container bot">
                <div className="chat-avatar bot-avatar">AI</div>
                <div className="chat-bubble bot-bubble typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-form" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Ask me anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
