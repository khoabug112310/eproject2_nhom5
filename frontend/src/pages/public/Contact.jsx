import React, { useState } from 'react';
import { cmsAPI } from '../../services/api';

export default function Contact() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);

  const faqItems = [
    { q: 'Phòng khám Hợp Sơn Tài có làm việc cuối tuần không?', a: 'Có. Chúng tôi làm việc liên tục từ Thứ Hai đến Chủ Nhật, thời gian từ 7:00 đến 20:00 hàng ngày (kể cả ngày lễ).' },
    { q: 'Làm thế nào để đăng ký khám bệnh trực tuyến?', a: 'Bạn có thể sử dụng khung đặt lịch nhanh ở Trang chủ hoặc trang Bác sĩ, nhập thông tin liên hệ và chuyên khoa. Nhân viên CSKH sẽ gọi điện xác nhận trong vòng 15-30 phút.' },
    { q: 'Phòng khám có áp dụng thanh toán Bảo Hiểm Y Tế (BHYT) không?', a: 'Phòng khám hỗ trợ xuất hóa đơn tài chính đầy đủ cho các bảo hiểm tư nhân (Bảo Việt, Prudential, PVI...). Đối với BHYT nhà nước, chúng tôi hỗ trợ đúng tuyến theo quy định Sở Y Tế.' },
    { q: 'Nếu cần cấp cứu ngoài giờ hành chính thì sao?', a: 'Phòng khám có hotline trực 24/7 tư vấn sơ cứu và điều phối xe cứu thương tại TP.HCM qua số 091-444-4444.' },
  ];

  const toggleFaq = (i) => setActiveFaq(activeFaq === i ? null : i);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setLoading(true);
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
    if (!phoneRegex.test(phone)) {
      setErrorMsg('Số điện thoại không hợp lệ. Vui lòng nhập số Việt Nam (vd: 0912345678)');
      setLoading(false); return;
    }
    try {
      // ĐÃ SỬA: Map chính xác key từ các state Front-end sang đúng tên trường của Mongoose Schema
      const payload = { 
        senderName: name.trim(), 
        senderPhone: phone.trim(), 
        message: message.trim() 
      };
      
      await cmsAPI.submitContactInquiry(payload);
      setSuccessMsg('Gửi phản hồi thành công! Cảm ơn ý kiến đóng góp của bạn.');
      setName('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Không thể gửi lúc này. Vui lòng thử lại sau.');
    } finally { setLoading(false); }
  }

  const quickInfo = [
    { cls: 'cq-blue',   label: 'Địa chỉ',        value: '123 Nguyễn Trãi, Q.5, TP.HCM' },
    { cls: 'cq-green',  label: 'Hotline',         value: '091-444-4444 | 1900-1234' },
    { cls: 'cq-purple', label: 'Email hỗ trợ',    value: 'contact@hopsontai.vn' },
    { cls: 'cq-orange', label: 'Giờ làm việc',    value: 'T2–CN: 07:00–20:00' },
  ];

return (
  <div style={{ width: '100%', boxSizing: 'border-box' }}>
    {/* Hero Banner */}
    <section style={{
      textAlign: 'center',
      padding: '80px 20px',
      background: 'linear-gradient(135deg, var(--color-primary-dark, #1e3a8a) 0%, var(--color-secondary-dark, #0f766e) 100%)',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle background overlay circles */}
      <div style={{
        position: 'absolute',
        top: '-30%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.03)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.02)',
        pointerEvents: 'none'
      }} />
      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }} className="fade-in">
        <span style={{
          fontSize: '13px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          background: 'rgba(255,255,255,0.18)',
          padding: '6px 16px',
          borderRadius: '50px',
          display: 'inline-block',
          marginBottom: '20px'
        }}>Hỗ trợ 24/7</span>
        <h1 style={{ fontSize: '40px', fontWeight: '700', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
          Liên Hệ &amp; Đóng Góp Ý Kiến
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', maxWidth: '650px', margin: '0 auto' }}>
          Phòng khám đa khoa Hợp Sơn Tài luôn lắng nghe và sẵn sàng giải đáp mọi thắc mắc để mang lại dịch vụ y tế tốt nhất.
        </p>
      </div>
    </section>

    <div className="contact-page-body">
      {/* Quick Info Strip */}
      <div className="contact-quick-strip">
        {quickInfo.map((item, i) => (
          <div key={i} className={`contact-quick-card ${item.cls}`}>
            <div className="cq-text">
              <span className="cq-label">{item.label}</span>
              <span className="cq-value">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-col */}
      <div className="contact-two-col">
        {/* Left: FAQ + Map */}
        <div className="contact-left">
          {/* FAQ */}
          <div className="contact-card-new">
            <div className="contact-card-hd">
  
              <h2 className="contact-card-hd-title">Câu Hỏi Thường Gặp</h2>
            </div>
            <div className="cn-faq-list">
              {faqItems.map((item, idx) => (
                <div key={idx} className={`cn-faq-item${activeFaq === idx ? ' open' : ''}`}>
                  <button className="cn-faq-btn" onClick={() => toggleFaq(idx)} type="button">
                    <span>{item.q}</span>
                    <svg className="cn-faq-chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="cn-faq-body"><p>{item.a}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="contact-card-new">
            <div className="contact-card-hd">

              <h2 className="contact-card-hd-title">Vị Trí Phòng Khám</h2>
            </div>
            <div className="cn-map">
              <iframe
                title="Vị trí phòng khám Hợp Sơn Tài"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.954005118552!2d106.67784631533383!3d10.738345762839462!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f62a90e5dbd%3A0x8dd009c95eb3bf20!2zMTIzIMSQxrDhu51uZyBOZ3V54buFbiBUcsOjaSwgUXXhuq1uIDUsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaA!5e0!3m2!1svi!2svn!4v1622274948000!5m2!1svi!2svn"
                width="100%" height="280" style={{ border: 0, display: 'block' }}
                allowFullScreen="" loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          border: '1px solid var(--color-border, #e2e8f0)',
          boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
          overflow: 'hidden',
        }}>
          {/* Form header gradient bar */}
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary-dark, #1e3a8a) 0%, var(--color-secondary-dark, #0f766e) 100%)',
            padding: '28px 32px',
            color: 'white',
          }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>
              Gửi Phản Hồi
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: '400' }}>
              Chúng tôi cam kết phản hồi trong vòng <strong style={{ color: 'rgba(255,255,255,1)' }}>24 giờ</strong> làm việc.
            </p>
          </div>

          {/* Form body */}
          <div style={{ padding: '28px 32px' }}>
            {successMsg && (
              <div style={{
                background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                border: '1px solid #6ee7b7',
                borderLeft: '4px solid #10b981',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '20px',
                color: '#065f46',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="18" height="18" style={{ color: '#10b981', flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                border: '1px solid #fca5a5',
                borderLeft: '4px solid #ef4444',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '20px',
                color: '#991b1b',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="18" height="18" style={{ color: '#ef4444', flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Name field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="cn-name" style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'var(--color-text-dark, #1e293b)',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}>
                  Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="cn-name"
                  type="text"
                  placeholder="Nhập họ và tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: 'var(--color-text-dark, #1e293b)',
                    background: '#f8fafc',
                    border: '1.5px solid var(--color-border, #e2e8f0)',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-primary, #3b82f6)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border, #e2e8f0)'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Phone field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="cn-phone" style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'var(--color-text-dark, #1e293b)',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}>
                  Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="cn-phone"
                  type="tel"
                  placeholder="Nhập số điện thoại di động (vd: 0912345678)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: 'var(--color-text-dark, #1e293b)',
                    background: '#f8fafc',
                    border: '1.5px solid var(--color-border, #e2e8f0)',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-primary, #3b82f6)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border, #e2e8f0)'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Message field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label htmlFor="cn-msg" style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'var(--color-text-dark, #1e293b)',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}>
                  Nội dung phản hồi <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="cn-msg"
                  rows="6"
                  placeholder="Nhập ý kiến đóng góp, thắc mắc của bạn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: 'var(--color-text-dark, #1e293b)',
                    background: '#f8fafc',
                    border: '1.5px solid var(--color-border, #e2e8f0)',
                    borderRadius: '10px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    lineHeight: '1.6',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-primary, #3b82f6)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border, #e2e8f0)'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: 'white',
                  background: loading
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-primary-dark, #1d4ed8) 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(59,130,246,0.3)',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  fontFamily: 'inherit',
                  letterSpacing: '0.02em',
                  marginTop: '4px',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(59,130,246,0.4)'; e.currentTarget.style.filter = 'brightness(1.06)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.3)'; e.currentTarget.style.filter = 'none'; }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: '18px', height: '18px',
                      border: '2.5px solid rgba(255,255,255,0.35)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l9-7 9 7v11a1 1 0 01-1 1H4a1 1 0 01-1-1V10z" />
                    </svg>
                    Gửi phản hồi
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
