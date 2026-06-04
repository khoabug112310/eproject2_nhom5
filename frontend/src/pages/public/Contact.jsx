import React, { useState } from 'react';
import { cmsAPI } from '../../services/api';

export default function Contact() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);

  const faqItems = [
    {
      q: 'Phòng khám Hợp Sơn Tài có làm việc cuối tuần không?',
      a: 'Có. Chúng tôi làm việc liên tục từ Thứ Hai đến Chủ Nhật, thời gian từ 7:00 đến 20:00 hàng ngày (kể cả ngày lễ).'
    },
    {
      q: 'Làm thế nào để đăng ký khám bệnh trực tuyến?',
      a: 'Bạn có thể sử dụng khung đặt lịch nhanh ở Trang chủ hoặc trang Bác sĩ, nhập thông tin liên hệ và chuyên khoa mong muốn. Nhân viên CSKH sẽ gọi điện xác nhận trong vòng 15-30 phút.'
    },
    {
      q: 'Phòng khám có áp dụng thanh toán Bảo Hiểm Y Tế (BHYT) không?',
      a: 'Phòng khám có hỗ trợ xuất hóa đơn tài chính đầy đủ để khách hàng thanh toán với các đơn vị bảo hiểm tư nhân (Bảo Việt, Prudential, PVI...). Đối với BHYT nhà nước, chúng tôi hỗ trợ thanh toán đúng tuyến theo quy định của Sở Y Tế.'
    },
    {
      q: 'Nếu cần cấp cứu khẩn cấp ngoài giờ hành chính thì sao?',
      a: 'Phòng khám có hotline trực cấp cứu 24/7 phục vụ tư vấn sơ cứu ban đầu và hỗ trợ điều phối xe cứu thương tại khu vực TP.HCM qua số điện thoại 091-444-4444.'
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    // Simple Vietnamese phone number validation
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
    if (!phoneRegex.test(phone)) {
      setErrorMsg('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (ví dụ: 0912345678)');
      setLoading(false);
      return;
    }

    try {
      // ĐÃ SỬA: Map chính xác key từ các state Front-end sang đúng tên trường của Mongoose Schema
      const payload = { 
        senderName: name, 
        senderPhone: phone, 
        message: message 
      };
      
      await cmsAPI.submitContactInquiry(payload);
      setSuccessMsg('Gửi phản hồi thành công! Cảm ơn ý kiến đóng góp của bạn.');
      setName('');
      setPhone('');
      setMessage('');
    } catch (err) {
      console.error('Contact submission error', err);
      // Fallback for mock responses or successful message states
      if (err?.response?.status === 200 || err?.response?.data?.message) {
        setSuccessMsg('Gửi phản hồi thành công! Cảm ơn ý kiến đóng góp của bạn.');
        setName('');
        setPhone('');
        setMessage('');
      } else {
        setErrorMsg('Không thể gửi phản hồi lúc này. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      {/* Page Header Banner */}
      <div className="page-banner">
        <h2>Liên Hệ & Đóng Góp Ý Kiến</h2>
        <p>Phòng khám đa khoa Hợp Sơn Tài luôn sẵn sàng lắng nghe ý kiến phản hồi và giải đáp mọi thắc mắc của quý bệnh nhân để cải thiện chất lượng phục vụ ngày một tốt hơn.</p>
      </div>

      <div className="contact-container">
        
        {/* Left Column: Contact info & FAQs */}
        <div className="contact-card-gradient">
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Thông Tin Liên Hệ</h3>
          
          <div className="contact-info-list">
            <div className="contact-item-row">
              <div className="contact-item-icon">📍</div>
              <div className="contact-item-details">
                <h5>Địa chỉ phòng khám</h5>
                <p>123 Đường Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh</p>
              </div>
            </div>
            
            <div className="contact-item-row">
              <div className="contact-item-icon">📞</div>
              <div className="contact-item-details">
                <h5>Hotline đặt lịch & Cấp cứu</h5>
                <p>091-444-4444 | 1900-1234</p>
              </div>
            </div>

            <div className="contact-item-row">
              <div className="contact-item-icon">✉️</div>
              <div className="contact-item-details">
                <h5>Thư hỗ trợ điện tử</h5>
                <p>contact@hopsontai.vn | support@hopsontai.vn</p>
              </div>
            </div>

            <div className="contact-item-row">
              <div className="contact-item-icon">⏰</div>
              <div className="contact-item-details">
                <h5>Thời gian mở cửa</h5>
                <p>Thứ 2 - Chủ Nhật: 07:00 - 20:00 (kể cả ngày Lễ, Tết)</p>
              </div>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <h3 style={{ fontSize: '16px', fontWeight: '800', borderTop: '1px solid var(--color-border)', paddingTop: '20px', marginTop: '20px' }}>
            Câu Hỏi Thường Gặp (FAQs)
          </h3>
          
          <div className="faq-accordion">
            {faqItems.map((item, idx) => (
              <div key={idx} className={`faq-item ${activeFaq === idx ? 'active' : ''}`}>
                <button className="faq-trigger" onClick={() => toggleFaq(idx)} type="button">
                  <span className="faq-question">{item.q}</span>
                  <svg className="faq-icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="faq-content">
                  <div className="faq-answer">{item.a}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Google Map iframe */}
          <div className="map-wrapper">
            <iframe 
              title="Vị trí phòng khám Hợp Sơn Tài" 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.954005118552!2d106.67784631533383!3d10.738345762839462!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f62a90e5dbd%3A0x8dd009c95eb3bf20!2zMTIzIMSQxrDhu51uZyBOZ3V54buFbiBUcsOjaSwgUXXhuq1uIDUsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaA!5e0!3m2!1svi!2svn!4v1622274948000!5m2!1svi!2svn" 
              width="100%" 
              height="280" 
              style={{ border: 0, display: 'block' }} 
              allowFullScreen="" 
              loading="lazy"
            ></iframe>
          </div>
        </div>

        {/* Right Column: Contact form */}
        <div className="contact-form-card">
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Gửi Phản Hồi / Đóng Góp</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
            Vui lòng điền thông tin của bạn. Chúng tôi cam kết phản hồi trong vòng 24 giờ làm việc.
          </p>

          {successMsg && (
            <div className="inline-alert success">
              <span>✓</span> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="inline-alert">
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group-outline">
              <label htmlFor="contact-name">Họ và tên bệnh nhân / khách hàng</label>
              <input 
                id="contact-name"
                type="text" 
                placeholder="Nhập họ và tên của bạn" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group-outline">
              <label htmlFor="contact-phone">Số điện thoại liên hệ</label>
              <input 
                id="contact-phone"
                type="tel" 
                placeholder="Nhập số điện thoại di động" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group-outline">
              <label htmlFor="contact-msg">Nội dung phản hồi / yêu cầu</label>
              <textarea 
                id="contact-msg"
                rows="6" 
                placeholder="Nhập ý kiến đóng góp, thắc mắc hoặc phản hồi của bạn..." 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                required
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', marginTop: '12px' }}
              disabled={loading}
            >
              {loading ? '⏳ Đang gửi thông tin...' : 'Gửi phản hồi của bạn'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}