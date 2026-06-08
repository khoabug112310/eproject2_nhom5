import React, { useState, useEffect, useRef } from 'react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Xin chào! Tôi là Trợ lý ảo của Phòng khám Hợp Sơn Tài. Tôi có thể giúp gì cho bạn hôm nay?',
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
    { text: '🗓️ Đặt lịch khám', query: 'dat_lich' },
    { text: '🕒 Giờ làm việc', query: 'gio_lam_viec' },
    { text: '📍 Địa chỉ & Hotline', query: 'dia_chi' },
    { text: '🩺 Các chuyên khoa', query: 'chuyen_khoa' }
  ];

  const getBotResponse = (query, userText) => {
    const textLower = userText.toLowerCase();
    
    if (query === 'dat_lich' || textLower.includes('đặt') || textLower.includes('lịch') || textLower.includes('hẹn') || textLower.includes('booking')) {
      return {
        text: 'Bạn có thể gửi yêu cầu đặt lịch khám nhanh ngay lập tức bằng cách click vào nút dưới đây để điền thông tin:',
        cta: {
          label: '🗓️ Đặt Lịch Khám Ngay',
          action: 'open_booking'
        }
      };
    }
    
    if (query === 'gio_lam_viec' || textLower.includes('giờ') || textLower.includes('mấy giờ') || textLower.includes('lịch làm') || textLower.includes('mở cửa')) {
      return {
        text: 'Phòng khám Hợp Sơn Tài làm việc liên tục tất cả các ngày trong tuần (từ Thứ 2 đến Chủ Nhật, kể cả các ngày lễ):\n\n🕒 **Giờ mở cửa:** 07:00 – 20:00 hàng ngày\n🏥 Chúng tôi có hỗ trợ khám ngoài giờ hành chính và có bác sĩ trực tư vấn 24/7.'
      };
    }
    
    if (query === 'dia_chi' || textLower.includes('địa chỉ') || textLower.includes('ở đâu') || textLower.includes('đường') || textLower.includes('hotline') || textLower.includes('sđt') || textLower.includes('liên hệ') || textLower.includes('điện thoại')) {
      return {
        text: 'Thông tin liên hệ chính thức của phòng khám Hợp Sơn Tài:\n\n📍 **Địa chỉ:** 123 Đường Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh\n📞 **Hotline hỗ trợ & Đặt lịch:** 091-444-4444\n✉️ **Email:** contact@hopsontai.vn'
      };
    }
    
    if (query === 'chuyen_khoa' || textLower.includes('chuyên khoa') || textLower.includes('khoa') || textLower.includes('khám gì') || textLower.includes('chữa gì')) {
      return {
        text: 'Phòng khám chúng tôi sở hữu các chuyên khoa thế mạnh với trang thiết bị hiện đại:\n\n1. **Châm cứu & Y học cổ truyền** (Thế mạnh đặc biệt)\n2. **Cơ xương khớp** (Trị liệu đau nhức, cột sống)\n3. **Nhi khoa** (Khám bệnh trẻ em thân thiện)\n4. **Sản phụ khoa** (Theo dõi thai kỳ, khám phụ khoa)\n5. **Da liễu & Thẩm mỹ da**\n6. **Khám tổng quát & Xét nghiệm**'
      };
    }

    return {
      text: 'Cảm ơn bạn đã gửi câu hỏi. Hiện tại Trợ lý ảo chưa hiểu ý của bạn. Để được hỗ trợ tốt nhất, bạn có thể:\n\n📞 Gọi trực tiếp Hotline: **091-444-4444**\n🗓️ Hoặc sử dụng tính năng **Đặt lịch nhanh** trên trang web.'
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
        aria-label="Trợ lý ảo tư vấn"
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
              <h4>Trợ Lý Hợp Sơn Tài</h4>
              <div className="chatbot-status">
                <span className="status-dot"></span>
                <span>Trực tuyến</span>
              </div>
            </div>
          </div>
          <button type="button" className="chatbot-close-btn" onClick={toggleChat} aria-label="Đóng">
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
            placeholder="Nhập tin nhắn..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
          />
          <button type="submit" disabled={!inputValue.trim() || isTyping} aria-label="Gửi">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
