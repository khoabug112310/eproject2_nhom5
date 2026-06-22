import React, { useState, useEffect, useRef } from 'react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am the virtual assistant of Hopsontai Clinic. How can I help you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const quickReplies = [
    { text: '🗓️ Book an appointment', query: 'dat_lich' },
    { text: '🕒 Working hours', query: 'gio_lam_viec' },
    { text: '📍 Address & Hotline', query: 'dia_chi' },
    { text: '🩺 Our specialties', query: 'chuyen_khoa' }
  ];

  const getBotResponse = (query, userText) => {
    const textLower = userText.toLowerCase();

    if (query === 'dat_lich' || textLower.includes('book') || textLower.includes('appointment') || textLower.includes('schedule')) {
      return {
        text: 'You can submit a quick booking request right away by clicking the button below to fill in your details:',
        cta: {
          label: '🗓️ Book an Appointment Now',
          action: 'open_booking'
        }
      };
    }

    if (query === 'gio_lam_viec' || textLower.includes('hour') || textLower.includes('time') || textLower.includes('open')) {
      return {
        text: 'Hopsontai Clinic is open every day of the week (Monday to Sunday, including public holidays):\n\n🕒 **Opening hours:** 07:00 – 20:00 daily\n🏥 We also support after-hours visits and have doctors on call for consultation 24/7.'
      };
    }

    if (query === 'dia_chi' || textLower.includes('address') || textLower.includes('where') || textLower.includes('hotline') || textLower.includes('phone') || textLower.includes('contact')) {
      return {
        text: 'Official contact information for Hopsontai Clinic:\n\n📍 **Address:** 123 Nguyen Trai Street, District 5, Ho Chi Minh City\n📞 **Support & booking hotline:** 091-444-4444\n✉️ **Email:** contact@hopsontai.vn'
      };
    }

    if (query === 'chuyen_khoa' || textLower.includes('specialt') || textLower.includes('department') || textLower.includes('treat')) {
      return {
        text: 'Our clinic offers leading specialties with modern equipment:\n\n1. **Acupuncture & Traditional Medicine** (Our specialty)\n2. **Musculoskeletal** (Pain and spine therapy)\n3. **Pediatrics** (Child-friendly care)\n4. **Obstetrics & Gynecology** (Prenatal and gynecological care)\n5. **Dermatology & Skin Aesthetics**\n6. **General Check-up & Laboratory Tests**'
      };
    }

    return {
      text: 'Thank you for your question. The virtual assistant did not quite understand. For the best support, you can:\n\n📞 Call our hotline directly: **091-444-4444**\n🗓️ Or use the **Quick Booking** feature on the website.'
    };
  };

  const handleSend = (text, query = null) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot thinking
    setTimeout(() => {
      const response = getBotResponse(query, text);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.text,
        cta: response.cta,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
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
                <span className="status-dot"></span>
                <span>Online</span>
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
              onClick={() => handleSend(reply.text.substring(3), reply.query)}
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
