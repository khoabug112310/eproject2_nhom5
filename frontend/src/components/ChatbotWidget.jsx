import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../store/authContext';
import { cmsAPI } from '../services/api';

export default function ChatbotWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'greeting',
      sender: 'bot',
      text: 'Hello! I am the virtual assistant of Hopsontai Clinic. How can I help you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isStaffOnline, setIsStaffOnline] = useState(false);
  
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(isOpen);

  // Sync isOpen to isOpenRef to prevent stale closure in socket listener without re-triggering connection
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Socket.io initialization
  useEffect(() => {
    // Generate a fresh session ID on every refresh/load so chat starts fresh from the beginning
    const guestSessionId = 'guest_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('guestSessionId', guestSessionId);

    // Reset messages list on load or user change
    setMessages([
      {
        id: 'greeting',
        sender: 'bot',
        text: 'Hello! I am the virtual assistant of Hopsontai Clinic. How can I help you today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    const socketUrl = 'http://localhost:4000';
    const socketConn = io(socketUrl, {
      withCredentials: true
    });

    socketConn.on('connect', () => {
      socketConn.emit('join_room', {
        userId: user && user.role !== 'staff' && user.role !== 'admin' ? user.id : null,
        sessionId: guestSessionId
      });
    });

    socketConn.on('staff_status', ({ online }) => {
      setIsStaffOnline(online);
    });

    socketConn.on('new_message', (msg) => {
      // Clear typing indicator if message from bot/ai/staff is received
      if (msg.senderType === 'ai' || msg.senderType === 'staff') {
        setIsTyping(false);
      }

      setMessages(prev => {
        if (prev.some(m => m.id === msg._id)) return prev;

        const textLower = msg.messageText.toLowerCase();
        let cta = null;
        if (msg.senderType === 'ai' && (textLower.includes('book') || textLower.includes('appointment') || textLower.includes('schedule') || textLower.includes('đặt lịch'))) {
          cta = {
            label: '🗓️ Book an Appointment Now',
            action: 'open_booking'
          };
        }

        if (!isOpenRef.current) {
          setHasNewMessage(true);
        }

        return [...prev, {
          id: msg._id,
          sender: (msg.senderType === 'patient' || msg.senderType === 'guest') ? 'user' : 'bot',
          text: msg.messageText,
          cta,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      });
    });

    socketConn.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    socketConn.on('conversation_cleared', () => {
      setMessages([
        {
          id: 'greeting',
          sender: 'bot',
          text: 'Hello! I am the virtual assistant of Hopsontai Clinic. How can I help you today?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    });

    setSocket(socketConn);

    return () => {
      socketConn.disconnect();
    };
  }, [user]);

  const quickReplies = [
    { text: '🗓️ Book an appointment', query: 'book_appointment' },
    { text: '🕒 Working hours', query: 'working_hours' },
    { text: '📍 Address & Hotline', query: 'address_hotline' },
    { text: '🩺 Our specialties', query: 'specialties' }
  ];

  const handleSend = (text) => {
    if (!text.trim() || !socket) return;

    const guestSessionId = localStorage.getItem('guestSessionId');
    
    // Emit message to socket
    setIsTyping(true);
    socket.emit('send_message', {
      text: text.trim(),
      userId: user && user.role !== 'staff' && user.role !== 'admin' ? user.id : null,
      sessionId: guestSessionId,
      senderName: user ? (user.displayName || user.username) : 'Guest'
    });

    setInputValue('');
  };

  const handleCtaAction = (action) => {
    if (action === 'open_booking') {
      window.dispatchEvent(new CustomEvent('open-booking-modal'));
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  return (
    <div className="chatbot-widget-container">
      {/* Floating Trigger Button */}
      <button 
        type="button" 
        className={`chatbot-trigger ${hasNewMessage && !isOpen ? 'has-notification' : ''}`}
        onClick={toggleChat}
        aria-label="Virtual assistant"
      >
        {isOpen ? (
          <svg className="chatbot-trigger-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="chatbot-trigger-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {hasNewMessage && !isOpen && <span className="chatbot-badge">1</span>}
      </button>

      {/* Chat Window Panel */}
      <div className={`chatbot-window ${isOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-avatar-group">
            <div className="chatbot-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '22px', height: '22px', color: 'white' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="chatbot-header-text">
              <h4>Hopsontai Assistant</h4>
              <div className="chatbot-status">
                <span className={`status-dot ${isStaffOnline ? 'online' : 'offline'}`}></span>
                <span>{isStaffOnline ? 'Support Staff Online' : 'AI Assistant (Staff Offline)'}</span>
              </div>
            </div>
          </div>
          <button type="button" className="chatbot-close-btn" onClick={toggleChat} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Messages list */}
        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chatbot-msg-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}>
              {msg.sender === 'bot' && (
                <div className="chatbot-msg-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px', color: 'var(--color-primary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="chatbot-msg-bubble">
                <div className="chatbot-msg-text">
                  {msg.text.split('\n').map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      {idx < msg.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                
                {msg.cta && (
                  <button 
                    type="button" 
                    className="chatbot-cta-btn"
                    onClick={() => handleCtaAction(msg.cta.action)}
                  >
                    {msg.cta.label}
                  </button>
                )}
                
                <span className="chatbot-msg-time">{msg.time}</span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="chatbot-msg-row bot-row">
              <div className="chatbot-msg-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px', color: 'var(--color-primary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="chatbot-msg-bubble typing-bubble">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions strip */}
        <div className="chatbot-quick-replies">
          {quickReplies.map((reply, i) => (
            <button 
              key={i} 
              type="button" 
              className="chatbot-reply-chip"
              onClick={() => handleSend(reply.text.substring(3))}
            >
              {reply.text}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form 
          className="chatbot-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputValue);
          }}
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
          />
          <button type="submit" disabled={!inputValue.trim() || isTyping} aria-label="Send">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
