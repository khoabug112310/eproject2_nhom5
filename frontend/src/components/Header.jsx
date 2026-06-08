import React from 'react';

export default function Header(){
  return (
    <header className="site-header compact">
      <nav className="nav">
        <a href="/">TRANG CHỦ</a>
        <a href="/about">GIỚI THIỆU</a>
        <a href="/departments">KHOA</a>
        <a href="/specialists">BÁC SĨ</a>
        <a href="/news">TIN TỨC</a>
        <a href="/contact">LIÊN HỆ</a>
      </nav>
    </header>
  );
}
