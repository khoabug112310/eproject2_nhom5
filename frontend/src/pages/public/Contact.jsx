import React, { useState } from 'react';

export default function Contact() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    console.log('Contact message', { name, phone, message });
    alert('Cảm ơn, chúng tôi đã nhận thông tin liên hệ của bạn.');
    setName(''); setPhone(''); setMessage('');
  }

  return (
    <div className="contact-page">
      <h2>Liên hệ</h2>
      <p>Hotline: 1900-1234 | Tax: 0123456789</p>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h4>Thông tin</h4>
          <p>Địa chỉ: Số 1, Đường A, Quận B, Thành phố</p>
          <div style={{ width: '100%', height: 200, background: '#eee' }}>Google Map placeholder</div>
        </div>
        <form style={{ flex: 1 }} onSubmit={handleSubmit}>
          <h4>Gửi liên hệ / đánh giá</h4>
          <label>Họ tên<input value={name} onChange={e=>setName(e.target.value)} required /></label>
          <label>SĐT<input value={phone} onChange={e=>setPhone(e.target.value)} required /></label>
          <label>Nội dung<textarea value={message} onChange={e=>setMessage(e.target.value)} required/></label>
          <button type="submit">Gửi</button>
        </form>
      </div>
    </div>
  );
}
